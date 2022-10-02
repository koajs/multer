/* eslint-env mocha */

const { strictEqual, ok } = require('assert');

const temp = require('fs-temp');
const rimraf = require('rimraf');
const FormData = require('form-data');

const multer = require('../../dist/index.cjs');
const { file, submitForm } = require('./_util.cjs');

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

  after((done) => rimraf(uploadDir, done));

  it('should report limit errors', (done) => {
    const form = new FormData();
    const parser = upload.single('file');

    form.append('file', file('large.jpg'));

    submitForm(parser, form, (err, req) => {
      ok(err, 'an error was given');

      strictEqual(err.code, 'LIMIT_FILE_SIZE');
      strictEqual(err.field, 'file');

      done();
    });
  });
});
