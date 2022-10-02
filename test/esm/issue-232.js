/* eslint-env mocha */

import { strictEqual, ok } from 'node:assert';

import temp from 'fs-temp';
import rimraf from 'rimraf';
import FormData from 'form-data';

import multer from '../../src/index.js';
import { file, submitForm } from './_util.js';

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
