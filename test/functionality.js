/* eslint-env mocha */

const assert = require('node:assert');
const { promisify } = require('node:util');
const temp = require('fix-esm').require('fs-temp').default;
const { rimraf } = require('rimraf');
const FormData = require('form-data');
const multer = require('..');
const util = require('./_util');

function generateFilename(req, file, cb) {
  cb(null, file.fieldname + file.originalname);
}

function startsWith(str, start) {
  return str.slice(0, start.length) === start;
}

const tempMkdirAsync = promisify(temp.mkdir);

describe('Functionality', () => {
  const cleanup = [];

  async function makeStandardEnv() {
    const uploadDir = await tempMkdirAsync();
    cleanup.push(uploadDir);

    const storage = multer.diskStorage({
      destination: uploadDir,
      filename: generateFilename
    });

    return {
      upload: multer({ storage }),
      uploadDir,
      form: new FormData()
    };
  }

  after(() => {
    while (cleanup.length > 0) rimraf.sync(cleanup.pop());
  });

  it('should upload the file to the `dest` dir', async () => {
    const env = await makeStandardEnv();

    const parser = env.upload.single('small0');
    env.form.append('small0', util.file('small0.dat'));

    const req = await util.submitForm(parser, env.form);
    assert.ok(startsWith(req.file.path, env.uploadDir));
    assert.equal(util.fileSize(req.file.path), 1778);
  });

  it('should rename the uploaded file', async () => {
    const env = await makeStandardEnv();

    const parser = env.upload.single('small0');
    env.form.append('small0', util.file('small0.dat'));

    const req = await util.submitForm(parser, env.form);
    assert.equal(req.file.filename, 'small0small0.dat');
  });

  it('should ensure all req.files values (single-file per field) point to an array', async () => {
    const env = await makeStandardEnv();

    const parser = env.upload.single('tiny0');
    env.form.append('tiny0', util.file('tiny0.dat'));

    const req = await util.submitForm(parser, env.form);
    assert.equal(req.file.filename, 'tiny0tiny0.dat');
  });

  it('should ensure all req.files values (multi-files per field) point to an array', async () => {
    const env = await makeStandardEnv();

    const parser = env.upload.array('themFiles', 2);
    env.form.append('themFiles', util.file('small0.dat'));
    env.form.append('themFiles', util.file('small1.dat'));

    const req = await util.submitForm(parser, env.form);
    assert.equal(req.files.length, 2);
    assert.equal(req.files[0].filename, 'themFilessmall0.dat');
    assert.equal(req.files[1].filename, 'themFilessmall1.dat');
  });

  it('should rename the destination directory to a different directory', async () => {
    const storage = multer.diskStorage({
      destination(req, file, cb) {
        temp.template('testforme-%s').mkdir((err, uploadDir) => {
          if (err) return cb(err);

          cleanup.push(uploadDir);
          cb(null, uploadDir);
        });
      },
      filename: generateFilename
    });

    const form = new FormData();
    const upload = multer({ storage });
    const parser = upload.array('themFiles', 2);

    form.append('themFiles', util.file('small0.dat'));
    form.append('themFiles', util.file('small1.dat'));

    const req = await util.submitForm(parser, form);
    assert.equal(req.files.length, 2);
    assert.ok(req.files[0].path.includes('/testforme-'));
    assert.ok(req.files[1].path.includes('/testforme-'));
  });
});
