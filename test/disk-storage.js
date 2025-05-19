/* eslint-env mocha */

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { promisify } = require('node:util');
const temp = require('fix-esm').require('fs-temp').default;
const { rimraf } = require('rimraf');
const FormData = require('form-data');
const multer = require('..');
const util = require('./_util');

const tempMkdirAsync = promisify(temp.mkdir);

describe('Disk Storage', () => {
  let uploadDir;
  let upload;

  beforeEach(async () => {
    uploadDir = await tempMkdirAsync();
    upload = multer({ dest: uploadDir });
  });

  afterEach(async () => {
    await rimraf(uploadDir);
  });

  it('should process parser/form-data POST request', async () => {
    const form = new FormData();
    const parser = upload.single('small0');

    form.append('name', 'Multer');
    form.append('small0', util.file('small0.dat'));

    const req = await util.submitForm(parser, form);

    assert.equal(req.body.name, 'Multer');

    assert.equal(req.file.fieldname, 'small0');
    assert.equal(req.file.originalname, 'small0.dat');
    assert.equal(req.file.size, 1778);
    assert.equal(util.fileSize(req.file.path), 1778);
  });

  it('should process empty fields and an empty file', async () => {
    const form = new FormData();
    const parser = upload.single('empty');

    form.append('empty', util.file('empty.dat'));
    form.append('name', 'Multer');
    form.append('version', '');
    form.append('year', '');
    form.append('checkboxfull', 'cb1');
    form.append('checkboxfull', 'cb2');
    form.append('checkboxhalfempty', 'cb1');
    form.append('checkboxhalfempty', '');
    form.append('checkboxempty', '');
    form.append('checkboxempty', '');

    const req = await util.submitForm(parser, form);

    assert.equal(req.body.name, 'Multer');
    assert.equal(req.body.version, '');
    assert.equal(req.body.year, '');

    assert.deepEqual(req.body.checkboxfull, ['cb1', 'cb2']);
    assert.deepEqual(req.body.checkboxhalfempty, ['cb1', '']);
    assert.deepEqual(req.body.checkboxempty, ['', '']);

    assert.equal(req.file.fieldname, 'empty');
    assert.equal(req.file.originalname, 'empty.dat');
    assert.equal(req.file.size, 0);
    assert.equal(util.fileSize(req.file.path), 0);
  });

  it('should process multiple files', async () => {
    const form = new FormData();
    const parser = upload.fields([
      { name: 'empty', maxCount: 1 },
      { name: 'tiny0', maxCount: 1 },
      { name: 'tiny1', maxCount: 1 },
      { name: 'small0', maxCount: 1 },
      { name: 'small1', maxCount: 1 },
      { name: 'medium', maxCount: 1 },
      { name: 'large', maxCount: 1 }
    ]);

    form.append('empty', util.file('empty.dat'));
    form.append('tiny0', util.file('tiny0.dat'));
    form.append('tiny1', util.file('tiny1.dat'));
    form.append('small0', util.file('small0.dat'));
    form.append('small1', util.file('small1.dat'));
    form.append('medium', util.file('medium.dat'));
    form.append('large', util.file('large.jpg'));

    const req = await util.submitForm(parser, form);
    assert.deepEqual(req.body, {});

    assert.equal(req.files.empty[0].fieldname, 'empty');
    assert.equal(req.files.empty[0].originalname, 'empty.dat');
    assert.equal(req.files.empty[0].size, 0);
    assert.equal(util.fileSize(req.files.empty[0].path), 0);

    assert.equal(req.files.tiny0[0].fieldname, 'tiny0');
    assert.equal(req.files.tiny0[0].originalname, 'tiny0.dat');
    assert.equal(req.files.tiny0[0].size, 122);
    assert.equal(util.fileSize(req.files.tiny0[0].path), 122);

    assert.equal(req.files.tiny1[0].fieldname, 'tiny1');
    assert.equal(req.files.tiny1[0].originalname, 'tiny1.dat');
    assert.equal(req.files.tiny1[0].size, 7);
    assert.equal(util.fileSize(req.files.tiny1[0].path), 7);

    assert.equal(req.files.small0[0].fieldname, 'small0');
    assert.equal(req.files.small0[0].originalname, 'small0.dat');
    assert.equal(req.files.small0[0].size, 1778);
    assert.equal(util.fileSize(req.files.small0[0].path), 1778);

    assert.equal(req.files.small1[0].fieldname, 'small1');
    assert.equal(req.files.small1[0].originalname, 'small1.dat');
    assert.equal(req.files.small1[0].size, 315);
    assert.equal(util.fileSize(req.files.small1[0].path), 315);

    assert.equal(req.files.medium[0].fieldname, 'medium');
    assert.equal(req.files.medium[0].originalname, 'medium.dat');
    assert.equal(req.files.medium[0].size, 13196);
    assert.equal(util.fileSize(req.files.medium[0].path), 13196);

    assert.equal(req.files.large[0].fieldname, 'large');
    assert.equal(req.files.large[0].originalname, 'large.jpg');
    assert.equal(req.files.large[0].size, 2413677);
    assert.equal(util.fileSize(req.files.large[0].path), 2413677);
  });

  it('should remove uploaded files on error', async () => {
    const form = new FormData();
    const parser = upload.single('tiny0');

    form.append('tiny0', util.file('tiny0.dat'));
    form.append('small0', util.file('small0.dat'));

    try {
      await util.submitForm(parser, form);
    } catch (err) {
      assert.equal(err.code, 'LIMIT_UNEXPECTED_FILE');
      assert.equal(err.field, 'small0');
      assert.deepEqual(err.storageErrors, []);

      const files = fs.readdirSync(uploadDir);
      assert.deepEqual(files, []);
    }
  });

  it("should report error when directory doesn't exist", async () => {
    const directory = path.join(temp.mkdirSync(), 'ghost');
    function dest($0, $1, cb) {
      cb(null, directory);
    }

    const storage = multer.diskStorage({ destination: dest });
    const upload = multer({ storage });
    const parser = upload.single('tiny0');
    const form = new FormData();

    form.append('tiny0', util.file('tiny0.dat'));

    try {
      await util.submitForm(parser, form);
    } catch (err) {
      assert.equal(err.code, 'ENOENT');
      assert.equal(path.dirname(err.path), directory);
    }
  });
});
