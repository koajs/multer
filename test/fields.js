/* eslint-env mocha */

const assert = require('node:assert');
const stream = require('node:stream');
const FormData = require('form-data');
const testData = require('testdata-w3c-json-form');
const multer = require('..');
const util = require('./_util');

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

    util.submitForm(parser, form, (err, req) => {
      assert.ifError(err);
      assert.deepEqual(req.body, {
        name: 'Multer',
        key: 'value',
        abc: 'xyz'
      });
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

    util.submitForm(parser, form, (err, req) => {
      assert.ifError(err);
      assert.deepEqual(req.body, {
        name: 'Multer',
        key: '',
        abc: '',
        checkboxfull: ['cb1', 'cb2'],
        checkboxhalfempty: ['cb1', ''],
        checkboxempty: ['', '']
      });
      done();
    });
  });

  it('should not process non-multipart POST request', (done) => {
    const req = new stream.PassThrough();

    req.end('name=Multer');
    req.method = 'POST';
    req.headers = {
      'content-type': 'application/x-www-form-urlencoded',
      'content-length': 11
    };

    parser({ req }, () => {
      assert.equal(req.hasOwnProperty('body'), false);
      assert.equal(req.hasOwnProperty('files'), false);
      done();
    }).catch((err) => {
      assert.ifError(err);
      done();
    });
  });

  it('should not process non-multipart GET request', (done) => {
    const req = new stream.PassThrough();

    req.end('name=Multer');
    req.method = 'GET';
    req.headers = {
      'content-type': 'application/x-www-form-urlencoded',
      'content-length': 11
    };

    parser({ req }, () => {
      assert.equal(req.hasOwnProperty('body'), false);
      assert.equal(req.hasOwnProperty('files'), false);
      done();
    }).catch((err) => {
      assert.ifError(err);
      done();
    });
  });

  for (const test of testData) {
    it('should handle ' + test.name, (done) => {
      const form = new FormData();

      for (const field of test.fields) {
        form.append(field.key, field.value);
      }

      util.submitForm(parser, form, (err, req) => {
        assert.ifError(err);
        assert.deepEqual(req.body, test.expected);
        done();
      });
    });
  }

  it('should convert arrays into objects', (done) => {
    const form = new FormData();

    form.append('obj[0]', 'a');
    form.append('obj[2]', 'c');
    form.append('obj[x]', 'yz');

    util.submitForm(parser, form, (err, req) => {
      assert.ifError(err);
      assert.deepEqual(req.body, {
        obj: {
          0: 'a',
          2: 'c',
          x: 'yz'
        }
      });
      done();
    });
  });
});
