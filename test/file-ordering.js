/* eslint-env mocha */

const assert = require('node:assert');
const FormData = require('form-data');
const multer = require('..');
const util = require('./_util');

describe('File ordering', () => {
  it('should present files in same order as they came', async () => {
    const storage = multer.memoryStorage();
    const upload = multer({ storage });
    const parser = upload.array('themFiles', 2);

    let i = 0;
    const calls = [{}, {}];
    let pending = 2;
    const { _handleFile } = storage;
    storage._handleFile = (req, file, cb) => {
      const id = i++;

      _handleFile.call(this, req, file, (err, info) => {
        if (err) return cb(err);

        calls[id].cb = cb;
        calls[id].info = info;

        if (--pending === 0) {
          calls[1].cb(null, calls[1].info);
          calls[0].cb(null, calls[0].info);
        }
      });
    };

    const form = new FormData();

    form.append('themFiles', util.file('small0.dat'));
    form.append('themFiles', util.file('small1.dat'));

    const req = await util.submitForm(parser, form);
    assert.equal(req.files.length, 2);
    assert.equal(req.files[0].originalname, 'small0.dat');
    assert.equal(req.files[1].originalname, 'small1.dat');
  });
});
