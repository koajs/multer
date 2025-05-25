/* eslint-env mocha */

const assert = require('node:assert');
const Koa = require('koa');
const Router = require('@koa/router');
const FormData = require('form-data');
const concat = require('concat-stream');
const onFinished = require('on-finished');
const multer = require('..');
const util = require('./_util');

const port = 34279;

describe('Koa Integration', () => {
  let app;

  before(async () => {
    app = new Koa();
    app.silent = true;
    await app.listen(port);
  });

  function submitForm(form, path) {
    return new Promise((resolve, reject) => {
      const req = form.submit(`http://localhost:${port}${path}`);

      req.on('error', reject);
      req.on('response', (res) => {
        res.on('error', reject);
        res.pipe(
          concat({ encoding: 'buffer' }, (body) => {
            onFinished(req, () => {
              resolve({ res, body });
            });
          })
        );
      });
    });
  }

  it('should work with koa error handling', async () => {
    const limits = { fileSize: 200 };
    const upload = multer({ limits });
    const router = new Router();
    const form = new FormData();

    let routeCalled = 0;
    let errorCalled = 0;

    form.append('avatar', util.file('large.jpg'));

    router.post('/profile', upload.single('avatar'), (ctx, next) => {
      routeCalled++;
      ctx.status = 200;
      ctx.body = 'SUCCESS';
    });

    router.prefix('/t1');

    app.once('error', (err, ctx) => {
      assert.equal(err.code, 'LIMIT_FILE_SIZE');

      errorCalled++;
    });

    app.use(router.routes());
    app.use(router.allowedMethods());

    const { res, body } = await submitForm(form, '/t1/profile');
    assert.equal(routeCalled, 0);
    assert.equal(errorCalled, 1);
    assert.equal(body.toString(), 'Internal Server Error');
    assert.equal(res.statusCode, 500);
  });

  it('should work when receiving error from fileFilter', async () => {
    function fileFilter(req, file, cb) {
      cb(new Error('TEST'));
    }

    const upload = multer({ fileFilter });
    const router = new Router();
    const form = new FormData();

    let routeCalled = 0;
    let errorCalled = 0;

    form.append('avatar', util.file('large.jpg'));

    router.post('/profile', upload.single('avatar'), (ctx, next) => {
      routeCalled++;
      ctx.status = 200;
      ctx.body = 'SUCCESS';
    });

    router.prefix('/t2');

    app.once('error', (err, ctx) => {
      assert.equal(err.message, 'TEST');

      errorCalled++;
    });

    app.use(router.routes());
    app.use(router.allowedMethods());

    const { res, body } = await submitForm(form, '/t2/profile');
    assert.equal(routeCalled, 0);
    assert.equal(errorCalled, 1);
    assert.equal(body.toString(), 'Internal Server Error');
    assert.equal(res.statusCode, 500);
  });
});
