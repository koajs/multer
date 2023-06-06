/* eslint-env mocha */

const assert = require('node:assert');
const temp = require('fix-esm').require('fs-temp').default;
const rimraf = require('rimraf');
const FormData = require('form-data');
const multer = require('..');
const util = require('./_util');

describe('Issue #232', () => {
  let uploadDir;
  let upload;

  before((done) => {
    temp.mkdir((err, path) => {
      if (err) return done(err);

      uploadDir = path;
      upload = multer({ dest: path, limits: { fileSize: 100 } });
      done();
    });
  });

  after((done) => {
    rimraf(uploadDir, done);
  });

  it('should report limit errors', (done) => {
    const form = new FormData();
    const parser = upload.single('file');

    form.append('file', util.file('large.jpg'));

    util.submitForm(parser, form, (err, req) => {
      assert.ok(err, 'an error was given');

      assert.equal(err.code, 'LIMIT_FILE_SIZE');
      assert.equal(err.field, 'file');

      done();
    });
  });
});
