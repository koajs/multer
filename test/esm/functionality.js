/* eslint-env mocha */

import { strictEqual, ok, ifError } from 'node:assert';

import temp from 'fs-temp';
import rimraf from 'rimraf';
import FormData from 'form-data';

import multer from '../../src/index.js';
import { file, fileSize, submitForm } from './_util.js';

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
      if (err) {
        return cb(err);
      }

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
      env.form.append('small0', file('small0.dat'));

      submitForm(parser, env.form, (err, req) => {
        ifError(err);
        ok(startsWith(req.file.path, env.uploadDir));
        strictEqual(fileSize(req.file.path), fileSize(file('small0.dat').path));
        done();
      });
    });
  });

  it('should rename the uploaded file', (done) => {
    makeStandardEnv((err, env) => {
      if (err) return done(err);

      const parser = env.upload.single('small0');
      env.form.append('small0', file('small0.dat'));

      submitForm(parser, env.form, (err, req) => {
        ifError(err);
        strictEqual(req.file.filename, 'small0small0.dat');
        done();
      });
    });
  });

  it('should ensure all req.files values (single-file per field) point to an array', (done) => {
    makeStandardEnv((err, env) => {
      if (err) return done(err);

      const parser = env.upload.single('tiny0');
      env.form.append('tiny0', file('tiny0.dat'));

      submitForm(parser, env.form, (err, req) => {
        ifError(err);
        strictEqual(req.file.filename, 'tiny0tiny0.dat');
        done();
      });
    });
  });

  it('should ensure all req.files values (multi-files per field) point to an array', (done) => {
    makeStandardEnv((err, env) => {
      if (err) return done(err);

      const parser = env.upload.array('themFiles', 2);
      env.form.append('themFiles', file('small0.dat'));
      env.form.append('themFiles', file('small1.dat'));

      submitForm(parser, env.form, (err, req) => {
        ifError(err);
        strictEqual(req.files.length, 2);
        strictEqual(req.files[0].filename, 'themFilessmall0.dat');
        strictEqual(req.files[1].filename, 'themFilessmall1.dat');
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

    form.append('themFiles', file('small0.dat'));
    form.append('themFiles', file('small1.dat'));

    submitForm(parser, form, (err, req) => {
      ifError(err);
      strictEqual(req.files.length, 2);
      ok(req.files[0].path.includes('testforme-'));
      ok(req.files[1].path.includes('testforme-'));
      done();
    });
  });
});
