/* eslint-env mocha */

const { strictEqual, ifError } = require('assert');
const path = require('path');

const temp = require('fs-temp');
const rimraf = require('rimraf');
const FormData = require('form-data');

const multer = require('../../dist/index.cjs');
const { file, fileSize, submitForm } = require('./_util.cjs');

describe('Unicode', () => {
  let uploadDir;
  let upload;

  beforeEach((done) => {
    temp.mkdir((err, path) => {
      if (err) return done(err);

      const storage = multer.diskStorage({
        destination: path,
        filename(req, file, cb) {
          cb(null, file.originalname);
        }
      });

      uploadDir = path;
      upload = multer({ storage });
      done();
    });
  });

  afterEach((done) => {
    rimraf(uploadDir, done);
  });

  it('should handle unicode filenames', (done) => {
    const form = new FormData();
    const parser = upload.single('small0');
    const filename = '\uD83D\uDCA9.dat';

    form.append('small0', file('small0.dat'), { filename });

    submitForm(parser, form, (err, req) => {
      ifError(err);

      strictEqual(path.basename(req.file.path), filename);
      strictEqual(req.file.originalname, filename);

      strictEqual(req.file.fieldname, 'small0');
      strictEqual(req.file.size, fileSize(file('small0.dat').path));
      strictEqual(fileSize(req.file.path), fileSize(file('small0.dat').path));

      done();
    });
  });
});
