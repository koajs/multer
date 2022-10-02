/* eslint-env mocha */

import { strictEqual, ifError } from 'node:assert';

import FormData from 'form-data';

import multer from '../../src/index.js';
import { file, fileSize, submitForm } from './_util.js';

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
        form.append('them-files', file('small0.dat'));
      }

      submitForm(parser, form, (err, req) => {
        ifError(err);

        strictEqual(req.body.name, 'Multer');
        strictEqual(req.body.files, String(fileCount));
        strictEqual(req.files.length, fileCount);

        req.files.forEach(({ fieldname, originalname, size, buffer }) => {
          strictEqual(fieldname, 'them-files');
          strictEqual(originalname, 'small0.dat');
          strictEqual(size, fileSize(file('small0.dat').path));
          strictEqual(buffer.length, fileSize(file('small0.dat').path));
        });

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
    submitData(22);
    submitData(26);
  });
});
