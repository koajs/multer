/* eslint-env mocha */

const { strictEqual, deepStrictEqual, deepEqual, ifError } = require('assert');

const FormData = require('form-data');

const multer = require('../../dist/index.cjs');
const { file, fileSize, submitForm } = require('./_util.cjs');

describe('Memory Storage', () => {
  let upload;

  before((done) => {
    upload = multer();
    done();
  });

  it('should process multipart/form-data POST request', (done) => {
    const form = new FormData();
    const parser = upload.single('small0');

    form.append('name', 'Multer');
    form.append('small0', file('small0.dat'));

    submitForm(parser, form, (err, req) => {
      ifError(err);

      strictEqual(req.body.name, 'Multer');

      strictEqual(req.file.fieldname, 'small0');
      strictEqual(req.file.originalname, 'small0.dat');
      strictEqual(req.file.size, fileSize(file('small0.dat').path));
      strictEqual(req.file.buffer.length, fileSize(file('small0.dat').path));

      done();
    });
  });

  it('should process empty fields and an empty file', (done) => {
    const form = new FormData();
    const parser = upload.single('empty');

    form.append('empty', file('empty.dat'));
    form.append('name', 'Multer');
    form.append('version', '');
    form.append('year', '');
    form.append('checkboxfull', 'cb1');
    form.append('checkboxfull', 'cb2');
    form.append('checkboxhalfempty', 'cb1');
    form.append('checkboxhalfempty', '');
    form.append('checkboxempty', '');
    form.append('checkboxempty', '');

    submitForm(parser, form, (err, req) => {
      ifError(err);

      strictEqual(req.body.name, 'Multer');
      strictEqual(req.body.version, '');
      strictEqual(req.body.year, '');

      deepStrictEqual(req.body.checkboxfull, ['cb1', 'cb2']);
      deepStrictEqual(req.body.checkboxhalfempty, ['cb1', '']);
      deepStrictEqual(req.body.checkboxempty, ['', '']);

      strictEqual(req.file.fieldname, 'empty');
      strictEqual(req.file.originalname, 'empty.dat');
      strictEqual(req.file.size, fileSize(file('empty.dat').path));
      strictEqual(req.file.buffer.length, fileSize(file('empty.dat').path));

      done();
    });
  });

  it('should process multiple files', (done) => {
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

    form.append('empty', file('empty.dat'));
    form.append('tiny0', file('tiny0.dat'));
    form.append('tiny1', file('tiny1.dat'));
    form.append('small0', file('small0.dat'));
    form.append('small1', file('small1.dat'));
    form.append('medium', file('medium.dat'));
    form.append('large', file('large.jpg'));

    submitForm(parser, form, (err, req) => {
      ifError(err);

      deepEqual(req.body, {});

      strictEqual(req.files.empty[0].fieldname, 'empty');
      strictEqual(req.files.empty[0].originalname, 'empty.dat');
      strictEqual(req.files.empty[0].size, fileSize(file('empty.dat').path));
      strictEqual(
        req.files.empty[0].buffer.length,
        fileSize(file('empty.dat').path)
      );

      strictEqual(req.files.tiny0[0].fieldname, 'tiny0');
      strictEqual(req.files.tiny0[0].originalname, 'tiny0.dat');
      strictEqual(req.files.tiny0[0].size, fileSize(file('tiny0.dat').path));
      strictEqual(
        req.files.tiny0[0].buffer.length,
        fileSize(file('tiny0.dat').path)
      );

      strictEqual(req.files.tiny1[0].fieldname, 'tiny1');
      strictEqual(req.files.tiny1[0].originalname, 'tiny1.dat');
      strictEqual(req.files.tiny1[0].size, fileSize(file('tiny1.dat').path));
      strictEqual(
        req.files.tiny1[0].buffer.length,
        fileSize(file('tiny1.dat').path)
      );

      strictEqual(req.files.small0[0].fieldname, 'small0');
      strictEqual(req.files.small0[0].originalname, 'small0.dat');
      strictEqual(req.files.small0[0].size, fileSize(file('small0.dat').path));
      strictEqual(
        req.files.small0[0].buffer.length,
        fileSize(file('small0.dat').path)
      );

      strictEqual(req.files.small1[0].fieldname, 'small1');
      strictEqual(req.files.small1[0].originalname, 'small1.dat');
      strictEqual(req.files.small1[0].size, fileSize(file('small1.dat').path));
      strictEqual(
        req.files.small1[0].buffer.length,
        fileSize(file('small1.dat').path)
      );

      strictEqual(req.files.medium[0].fieldname, 'medium');
      strictEqual(req.files.medium[0].originalname, 'medium.dat');
      strictEqual(req.files.medium[0].size, fileSize(file('medium.dat').path));
      strictEqual(
        req.files.medium[0].buffer.length,
        fileSize(file('medium.dat').path)
      );

      strictEqual(req.files.large[0].fieldname, 'large');
      strictEqual(req.files.large[0].originalname, 'large.jpg');
      strictEqual(req.files.large[0].size, fileSize(file('large.jpg').path));
      strictEqual(
        req.files.large[0].buffer.length,
        fileSize(file('large.jpg').path)
      );

      done();
    });
  });
});
