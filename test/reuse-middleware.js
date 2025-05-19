/* eslint-env mocha */

const assert = require('node:assert');
const FormData = require('form-data');
const multer = require('..');
const util = require('./_util');

describe('Reuse Middleware', () => {
  let parser;

  before(async () => {
    parser = await multer().array('them-files');
  });

  it('should accept multiple requests', async () => {
    let pending = 8;

    async function submitData(fileCount) {
      const form = new FormData();

      form.append('name', 'Multer');
      form.append('files', String(fileCount));

      for (let i = 0; i < fileCount; i++) {
        form.append('them-files', util.file('small0.dat'));
      }

      const req = await util.submitForm(parser, form);

      assert.equal(req.body.name, 'Multer');
      assert.equal(req.body.files, String(fileCount));
      assert.equal(req.files.length, fileCount);

      for (const file of req.files) {
        assert.equal(file.fieldname, 'them-files');
        assert.equal(file.originalname, 'small0.dat');
        assert.equal(file.size, 1778);
        assert.equal(file.buffer.length, 1778);
      }

      --pending;
    }

    await submitData(9);
    await submitData(1);
    await submitData(5);
    await submitData(7);
    await submitData(2);
    await submitData(8);
    await submitData(3);
    await submitData(4);
  });
});
