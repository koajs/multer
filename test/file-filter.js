/* eslint-env mocha */

const assert = require('node:assert');
const FormData = require('form-data');
const multer = require('..');
const util = require('./_util');

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
  it('should skip some files', async () => {
    const form = new FormData();
    const upload = withFilter(skipSpecificFile);
    const parser = upload.fields([
      { name: 'notme', maxCount: 1 },
      { name: 'butme', maxCount: 1 }
    ]);

    form.append('notme', util.file('tiny0.dat'));
    form.append('butme', util.file('tiny1.dat'));

    const req = await util.submitForm(parser, form);
    assert.equal(req.files.notme, undefined);
    assert.equal(req.files.butme[0].fieldname, 'butme');
    assert.equal(req.files.butme[0].originalname, 'tiny1.dat');
    assert.equal(req.files.butme[0].size, 7);
    assert.equal(req.files.butme[0].buffer.length, 7);
  });

  it('should report errors from fileFilter', async () => {
    const form = new FormData();
    const upload = withFilter(reportFakeError);
    const parser = upload.single('test');

    form.append('test', util.file('tiny0.dat'));
    try {
      await util.submitForm(parser, form);
    } catch (err) {
      assert.equal(err.message, 'Fake error');
    }
  });
});
