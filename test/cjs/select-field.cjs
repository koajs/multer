/* eslint-env mocha */

const { strictEqual, ifError } = require('assert');

const FormData = require('form-data');

const multer = require('../../dist/index.cjs');
const { file, submitForm } = require('./_util.cjs');

function generateForm() {
  const form = new FormData();

  form.append('CA$|-|', file('empty.dat'));
  form.append('set-1', file('tiny0.dat'));
  form.append('set-1', file('empty.dat'));
  form.append('set-1', file('tiny1.dat'));
  form.append('set-2', file('tiny1.dat'));
  form.append('set-2', file('tiny0.dat'));
  form.append('set-2', file('empty.dat'));

  return form;
}

function assertSet(files, setName, fileNames) {
  const len = fileNames.length;

  strictEqual(files.length, len);

  for (let i = 0; i < len; i++) {
    strictEqual(files[i].fieldname, setName);
    strictEqual(files[i].originalname, fileNames[i]);
  }
}

describe('Select Field', () => {
  let parser;

  before(() => {
    parser = multer().fields([
      { name: 'CA$|-|', maxCount: 1 },
      { name: 'set-1', maxCount: 3 },
      { name: 'set-2', maxCount: 3 }
    ]);
  });

  it('should select the first file with fieldname', (done) => {
    submitForm(parser, generateForm(), (err, req) => {
      ifError(err);

      let file;

      file = req.files['CA$|-|'][0];
      strictEqual(file.fieldname, 'CA$|-|');
      strictEqual(file.originalname, 'empty.dat');

      file = req.files['set-1'][0];
      strictEqual(file.fieldname, 'set-1');
      strictEqual(file.originalname, 'tiny0.dat');

      file = req.files['set-2'][0];
      strictEqual(file.fieldname, 'set-2');
      strictEqual(file.originalname, 'tiny1.dat');

      done();
    });
  });

  it('should select all files with fieldname', (done) => {
    submitForm(parser, generateForm(), (err, req) => {
      ifError(err);

      assertSet(req.files['CA$|-|'], 'CA$|-|', ['empty.dat']);
      assertSet(req.files['set-1'], 'set-1', [
        'tiny0.dat',
        'empty.dat',
        'tiny1.dat'
      ]);
      assertSet(req.files['set-2'], 'set-2', [
        'tiny1.dat',
        'tiny0.dat',
        'empty.dat'
      ]);

      done();
    });
  });
});
