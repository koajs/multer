/* eslint-env mocha */

const { strictEqual, ifError } = require('assert');

const FormData = require('form-data');

const multer = require('../../dist/index.cjs');
const { file, submitForm } = require('./_util.cjs');

function withFilter(fileFilter) {
  return multer({ fileFilter });
}

function skipSpecificFile(req, file, cb) {
  cb(null, file.fieldname !== 'notme');
}

function reportFakeError(req, file, cb) {
  cb(new Error('Fake error'));
}

describe('File Filter', () => {
  it('should skip some files', (done) => {
    const form = new FormData();
    const upload = withFilter(skipSpecificFile);
    const parser = upload.fields([
      { name: 'notme', maxCount: 1 },
      { name: 'butme', maxCount: 1 }
    ]);

    form.append('notme', file('tiny0.dat'));
    form.append('butme', file('tiny1.dat'));

    submitForm(parser, form, (err, req) => {
      ifError(err);
      strictEqual(req.files.notme, undefined);
      strictEqual(req.files.butme[0].fieldname, 'butme');
      strictEqual(req.files.butme[0].originalname, 'tiny1.dat');
      strictEqual(req.files.butme[0].size, 7);
      strictEqual(req.files.butme[0].buffer.length, 7);
      done();
    });
  });

  it('should report errors from fileFilter', (done) => {
    const form = new FormData();
    const upload = withFilter(reportFakeError);
    const parser = upload.single('test');

    form.append('test', file('tiny0.dat'));

    submitForm(parser, form, (err, req) => {
      strictEqual(err.message, 'Fake error');
      done();
    });
  });
});
