/* eslint-env mocha */

const assert = require('node:assert');
const path = require('node:path');
const temp = require('fix-esm').require('fs-temp').default;
const rimraf = require('rimraf');
const FormData = require('form-data');
const multer = require('..');
const util = require('./_util');

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

    form.append('small0', util.file('small0.dat'), { filename });

    util.submitForm(parser, form, (err, req) => {
      assert.ifError(err);

      assert.equal(path.basename(req.file.path), filename);
      assert.equal(req.file.originalname, filename);

      assert.equal(req.file.fieldname, 'small0');
      assert.equal(req.file.size, 1778);
      assert.equal(util.fileSize(req.file.path), 1778);

      done();
    });
  });
});
