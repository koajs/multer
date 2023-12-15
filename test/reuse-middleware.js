/* eslint-env mocha */

const assert = require('node:assert');
const FormData = require('form-data');
const multer = require('..');
const util = require('./_util');

describe('Reuse Middleware', () => {
  let parser;

  before((done) => {
    parser = multer().array('them-files');
    done();
  });

  it('should accept multiple requests', (done) => {
    let pending = 8;

    function submitData(fileCount) {
      const form = new FormData();

      form.append('name', 'Multer');
      form.append('files', String(fileCount));

      for (let i = 0; i < fileCount; i++) {
        form.append('them-files', util.file('small0.dat'));
      }

      util.submitForm(parser, form, (err, req) => {
        assert.ifError(err);

        assert.equal(req.body.name, 'Multer');
        assert.equal(req.body.files, String(fileCount));
        assert.equal(req.files.length, fileCount);

        for (const file of req.files) {
          assert.equal(file.fieldname, 'them-files');
          assert.equal(file.originalname, 'small0.dat');
          assert.equal(file.size, 1778);
          assert.equal(file.buffer.length, 1778);
        }

        if (--pending === 0) done();
      });
    }

    submitData(9);
    submitData(1);
    submitData(5);
    submitData(7);
    submitData(2);
    submitData(8);
    submitData(3);
    submitData(4);
  });
});
