/* eslint-env mocha */

const assert = require('node:assert');
const FormData = require('form-data');
const multer = require('..');
const util = require('./_util');

describe('Expected files', () => {
  let upload;

  before(async () => {
    upload = await multer();
  });

  it('should reject single unexpected file', async () => {
    const form = new FormData();
    const parser = upload.single('butme');

    form.append('notme', util.file('small0.dat'));

    try {
      await util.submitForm(parser, form);
    } catch (err) {
      assert.equal(err.code, 'LIMIT_UNEXPECTED_FILE');
      assert.equal(err.field, 'notme');
    }
  });

  it('should reject array of multiple files', async () => {
    const form = new FormData();
    const parser = upload.array('butme', 4);

    form.append('notme', util.file('small0.dat'));
    form.append('notme', util.file('small1.dat'));

    try {
      await util.submitForm(parser, form);
    } catch (err) {
      assert.equal(err.code, 'LIMIT_UNEXPECTED_FILE');
      assert.equal(err.field, 'notme');
    }
  });

  it('should reject overflowing arrays', async () => {
    const form = new FormData();
    const parser = upload.array('butme', 1);

    form.append('butme', util.file('small0.dat'));
    form.append('butme', util.file('small1.dat'));

    try {
      await util.submitForm(parser, form);
    } catch (err) {
      assert.equal(err.code, 'LIMIT_UNEXPECTED_FILE');
      assert.equal(err.field, 'butme');
    }
  });

  it('should accept files with expected fieldname', async () => {
    const form = new FormData();
    const parser = upload.fields([
      { name: 'butme', maxCount: 2 },
      { name: 'andme', maxCount: 2 }
    ]);

    form.append('butme', util.file('small0.dat'));
    form.append('butme', util.file('small1.dat'));
    form.append('andme', util.file('empty.dat'));

    const req = await util.submitForm(parser, form);
    assert.equal(req.files.butme.length, 2);
    assert.equal(req.files.andme.length, 1);
  });

  it('should reject files with unexpected fieldname', async () => {
    const form = new FormData();
    const parser = upload.fields([
      { name: 'butme', maxCount: 2 },
      { name: 'andme', maxCount: 2 }
    ]);

    form.append('butme', util.file('small0.dat'));
    form.append('butme', util.file('small1.dat'));
    form.append('andme', util.file('empty.dat'));
    form.append('notme', util.file('empty.dat'));

    try {
      await util.submitForm(parser, form);
    } catch (err) {
      assert.equal(err.code, 'LIMIT_UNEXPECTED_FILE');
      assert.equal(err.field, 'notme');
    }
  });

  it('should allow any file to come thru', async () => {
    const form = new FormData();
    const parser = upload.any();

    form.append('butme', util.file('small0.dat'));
    form.append('butme', util.file('small1.dat'));
    form.append('andme', util.file('empty.dat'));

    const req = await util.submitForm(parser, form);
    assert.equal(req.files.length, 3);
    assert.equal(req.files[0].fieldname, 'butme');
    assert.equal(req.files[1].fieldname, 'butme');
    assert.equal(req.files[2].fieldname, 'andme');
  });
});
