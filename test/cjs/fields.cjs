/* eslint-env mocha */

const { strictEqual, deepStrictEqual, deepEqual, ifError } = require('assert');
const { PassThrough } = require('stream');

const FormData = require('form-data');
const testData = require('testdata-w3c-json-form');

const multer = require('../../dist/index.cjs');
const { submitForm } = require('./_util.cjs');

describe('Fields', () => {
  let parser;

  before(() => {
    parser = multer().fields([]);
  });

  it('should process multiple fields', (done) => {
    const form = new FormData();

    form.append('name', 'Multer');
    form.append('key', 'value');
    form.append('abc', 'xyz');

    submitForm(parser, form, (err, req) => {
      ifError(err);
      deepStrictEqual(
        { ...req.body },
        {
          name: 'Multer',
          key: 'value',
          abc: 'xyz'
        }
      );
      done();
    });
  });

  it('should process empty fields', (done) => {
    const form = new FormData();

    form.append('name', 'Multer');
    form.append('key', '');
    form.append('abc', '');
    form.append('checkboxfull', 'cb1');
    form.append('checkboxfull', 'cb2');
    form.append('checkboxhalfempty', 'cb1');
    form.append('checkboxhalfempty', '');
    form.append('checkboxempty', '');
    form.append('checkboxempty', '');

    submitForm(parser, form, (err, req) => {
      ifError(err);
      deepStrictEqual(
        { ...req.body },
        {
          name: 'Multer',
          key: '',
          abc: '',
          checkboxfull: ['cb1', 'cb2'],
          checkboxhalfempty: ['cb1', ''],
          checkboxempty: ['', '']
        }
      );
      done();
    });
  });

  it('should not process non-multipart POST request', (done) => {
    const req = new PassThrough();

    req.end('name=Multer');
    req.method = 'POST';
    req.headers = {
      'content-type': 'application/x-www-form-urlencoded',
      'content-length': 11
    };

    parser({ req }, () => {
      strictEqual(req.hasOwnProperty('body'), false);
      strictEqual(req.hasOwnProperty('files'), false);
      done();
    }).catch((err) => {
      ifError(err);
      done();
    });
  });

  it('should not process non-multipart GET request', (done) => {
    const req = new PassThrough();

    req.end('name=Multer');
    req.method = 'GET';
    req.headers = {
      'content-type': 'application/x-www-form-urlencoded',
      'content-length': 11
    };

    parser({ req }, () => {
      strictEqual(req.hasOwnProperty('body'), false);
      strictEqual(req.hasOwnProperty('files'), false);
      done();
    }).catch((err) => {
      ifError(err);
      done();
    });
  });

  testData.forEach((test) => {
    it('should handle ' + test.name, (done) => {
      const form = new FormData();

      test.fields.forEach((field) => {
        form.append(field.key, field.value);
      });

      submitForm(parser, form, (err, req) => {
        ifError(err);
        deepEqual(req.body, test.expected);
        done();
      });
    });
  });

  it('should convert arrays into objects', (done) => {
    const form = new FormData();

    form.append('obj[0]', 'a');
    form.append('obj[2]', 'c');
    form.append('obj[x]', 'yz');

    submitForm(parser, form, (err, req) => {
      ifError(err);
      deepStrictEqual(
        { obj: { ...req.body.obj } },
        {
          obj: {
            0: 'a',
            2: 'c',
            x: 'yz'
          }
        }
      );
      done();
    });
  });
});
