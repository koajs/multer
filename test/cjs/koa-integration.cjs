/* eslint-env mocha */

const { strictEqual, ifError } = require('assert');

const Koa = require('koa');
const Router = require('@koa/router');
const FormData = require('form-data');
const concat = require('concat-stream');
const onFinished = require('on-finished');

const multer = require('../../dist/index.cjs');
const { file } = require('./_util.cjs');

describe('Koa Integration', () => {
  let app;
  let server;
  let port;

  before((done) => {
    app = new Koa();
    app.silent = true;
    server = app.listen(0, done);
    port = server.address().port;
  });

  after(() => server.close());

  function submitForm(form, path, cb) {
    const req = form.submit(`http://localhost:${port}${path}`);

    req.on('error', cb);
    req.on('response', (res) => {
      res.on('error', cb);
      res.pipe(
        concat({ encoding: 'buffer' }, (body) => {
          onFinished(req, () => {
            cb(null, res, body);
          });
        })
      );
    });
  }

  it('should work with koa error handling', (done) => {
    const limits = { fileSize: 200 };
    const upload = multer({ limits });
    const router = new Router();
    const form = new FormData();

    let routeCalled = 0;
    let errorCalled = 0;

    form.append('avatar', file('large.jpg'));

    router.post('/profile', upload.single('avatar'), (ctx, next) => {
      routeCalled++;
      ctx.status = 200;
      ctx.body = 'SUCCESS';
    });

    router.prefix('/t1');

    app.once('error', (err, ctx) => {
      strictEqual(err.code, 'LIMIT_FILE_SIZE');

      errorCalled++;
    });

    app.use(router.routes());
    app.use(router.allowedMethods());

    submitForm(form, '/t1/profile', (err, res, body) => {
      ifError(err);

      strictEqual(routeCalled, 0);
      strictEqual(errorCalled, 1);
      strictEqual(body.toString(), 'Internal Server Error');
      strictEqual(res.statusCode, 500);

      done();
    });
  });

  it('should work when receiving error from fileFilter', (done) => {
    function fileFilter(req, file, cb) {
      cb(new Error('TEST'));
    }

    const upload = multer({ fileFilter });
    const router = new Router();
    const form = new FormData();

    let routeCalled = 0;
    let errorCalled = 0;

    form.append('avatar', file('large.jpg'));

    router.post('/profile', upload.single('avatar'), (ctx, next) => {
      routeCalled++;
      ctx.status = 200;
      ctx.body = 'SUCCESS';
    });

    router.prefix('/t2');

    app.once('error', (err, ctx) => {
      strictEqual(err.message, 'TEST');

      errorCalled++;
    });

    app.use(router.routes());
    app.use(router.allowedMethods());

    submitForm(form, '/t2/profile', (err, res, body) => {
      ifError(err);

      strictEqual(routeCalled, 0);
      strictEqual(errorCalled, 1);
      strictEqual(body.toString(), 'Internal Server Error');
      strictEqual(res.statusCode, 500);

      done();
    });
  });
});
