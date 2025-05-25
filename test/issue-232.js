/* eslint-env mocha */

const assert = require('node:assert');
const { promisify } = require('node:util');
const temp = require('fix-esm').require('fs-temp').default;
const { rimraf } = require('rimraf');
const FormData = require('form-data');
const multer = require('..');
const util = require('./_util');

const tempMkdirAsync = promisify(temp.mkdir);

describe('Issue #232', () => {
  let uploadDir;
  let upload;

  before(async () => {
    const uploadDir = await tempMkdirAsync();
    upload = multer({ dest: uploadDir, limits: { fileSize: 100 } });
  });

  after(async () => {
    if (uploadDir) await rimraf(uploadDir);
  });

  it('should report limit errors', async () => {
    const form = new FormData();
    const parser = upload.single('file');

    form.append('file', util.file('large.jpg'));

    try {
      await util.submitForm(parser, form);
    } catch (err) {
      assert.ok(err, 'an error was given');
      assert.equal(err.code, 'LIMIT_FILE_SIZE');
      assert.equal(err.field, 'file');
    }
  });
});
