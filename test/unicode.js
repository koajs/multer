/* eslint-env mocha */

const assert = require('node:assert');
const path = require('node:path');
const { promisify } = require('node:util');
const temp = require('fix-esm').require('fs-temp').default;
const { rimraf } = require('rimraf');
const FormData = require('form-data');
const multer = require('..');
const util = require('./_util');

const tempMkdirAsync = promisify(temp.mkdir);

describe('Unicode', () => {
  let uploadDir;
  let upload;

  beforeEach(async () => {
    uploadDir = await tempMkdirAsync();

    const storage = multer.diskStorage({
      destination: uploadDir,
      filename(req, file, cb) {
        cb(null, file.originalname);
      }
    });

    upload = multer({ storage });
  });

  afterEach(async () => {
    await rimraf(uploadDir);
  });

  it('should handle unicode filenames', async () => {
    const form = new FormData();
    const parser = upload.single('small0');
    const filename = '\uD83D\uDCA9.dat';

    form.append('small0', util.file('small0.dat'), { filename });

    const req = await util.submitForm(parser, form);
    assert.equal(path.basename(req.file.path), filename);
    assert.equal(req.file.originalname, filename);

    assert.equal(req.file.fieldname, 'small0');
    assert.equal(req.file.size, 1778);
    assert.equal(util.fileSize(req.file.path), 1778);
  });
});
