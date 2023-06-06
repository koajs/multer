/* eslint-env mocha */

const assert = require('node:assert');
const temp = require('fix-esm').require('fs-temp').default;
const rimraf = require('rimraf');
const FormData = require('form-data');
const multer = require('..');
const util = require('./_util');

function generateFilename(req, file, cb) {
  cb(null, file.fieldname + file.originalname);
}

function startsWith(str, start) {
  return str.slice(0, start.length) === start;
}

describe('Functionality', () => {
  const cleanup = [];

  function makeStandardEnv(cb) {
    temp.mkdir((err, uploadDir) => {
      if (err) return cb(err);

      cleanup.push(uploadDir);

      const storage = multer.diskStorage({
        destination: uploadDir,
        filename: generateFilename
      });

      cb(null, {
        upload: multer({ storage }),
        uploadDir,
        form: new FormData()
      });
    });
  }

  after(() => {
    while (cleanup.length > 0) rimraf.sync(cleanup.pop());
  });

  it('should upload the file to the `dest` dir', (done) => {
    makeStandardEnv((err, env) => {
      if (err) return done(err);

      const parser = env.upload.single('small0');
      env.form.append('small0', util.file('small0.dat'));

      util.submitForm(parser, env.form, (err, req) => {
        assert.ifError(err);
        assert.ok(startsWith(req.file.path, env.uploadDir));
        assert.equal(util.fileSize(req.file.path), 1778);
        done();
      });
    });
  });

  it('should rename the uploaded file', (done) => {
    makeStandardEnv((err, env) => {
      if (err) return done(err);

      const parser = env.upload.single('small0');
      env.form.append('small0', util.file('small0.dat'));

      util.submitForm(parser, env.form, (err, req) => {
        assert.ifError(err);
        assert.equal(req.file.filename, 'small0small0.dat');
        done();
      });
    });
  });

  it('should ensure all req.files values (single-file per field) point to an array', (done) => {
    makeStandardEnv((err, env) => {
      if (err) return done(err);

      const parser = env.upload.single('tiny0');
      env.form.append('tiny0', util.file('tiny0.dat'));

      util.submitForm(parser, env.form, (err, req) => {
        assert.ifError(err);
        assert.equal(req.file.filename, 'tiny0tiny0.dat');
        done();
      });
    });
  });

  it('should ensure all req.files values (multi-files per field) point to an array', (done) => {
    makeStandardEnv((err, env) => {
      if (err) return done(err);

      const parser = env.upload.array('themFiles', 2);
      env.form.append('themFiles', util.file('small0.dat'));
      env.form.append('themFiles', util.file('small1.dat'));

      util.submitForm(parser, env.form, (err, req) => {
        assert.ifError(err);
        assert.equal(req.files.length, 2);
        assert.equal(req.files[0].filename, 'themFilessmall0.dat');
        assert.equal(req.files[1].filename, 'themFilessmall1.dat');
        done();
      });
    });
  });

  it('should rename the destination directory to a different directory', (done) => {
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

    util.submitForm(parser, form, (err, req) => {
      assert.ifError(err);
      assert.equal(req.files.length, 2);
      assert.ok(req.files[0].path.includes('/testforme-'));
      assert.ok(req.files[1].path.includes('/testforme-'));
      done();
    });
  });
});
