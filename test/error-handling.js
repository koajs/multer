/* eslint-env mocha */

const assert = require('node:assert');
const stream = require('node:stream');
const FormData = require('form-data');
const multer = require('..');
const util = require('./_util');

function withLimits(limits, fields) {
  const storage = multer.memoryStorage();
  return multer({ storage, limits }).fields(fields);
}

describe('Error Handling', () => {
  it('should respect parts limit', async () => {
    const form = new FormData();
    const parser = withLimits({ parts: 1 }, [{ name: 'small0', maxCount: 1 }]);

    form.append('field0', 'BOOM!');
    form.append('small0', util.file('small0.dat'));

    try {
      await util.submitForm(parser, form);
    } catch (err) {
      assert.equal(err.code, 'LIMIT_PART_COUNT');
    }
  });

  it('should respect file size limit', async () => {
    const form = new FormData();
    const parser = withLimits({ fileSize: 1500 }, [
      { name: 'tiny0', maxCount: 1 },
      { name: 'small0', maxCount: 1 }
    ]);

    form.append('tiny0', util.file('tiny0.dat'));
    form.append('small0', util.file('small0.dat'));

    try {
      await util.submitForm(parser, form);
    } catch (err) {
      assert.equal(err.code, 'LIMIT_FILE_SIZE');
      assert.equal(err.field, 'small0');
    }
  });

  it('should respect file count limit', async () => {
    const form = new FormData();
    const parser = withLimits({ files: 1 }, [
      { name: 'small0', maxCount: 1 },
      { name: 'small1', maxCount: 1 }
    ]);

    form.append('small0', util.file('small0.dat'));
    form.append('small1', util.file('small1.dat'));

    try {
      await util.submitForm(parser, form);
    } catch (err) {
      assert.equal(err.code, 'LIMIT_FILE_COUNT');
    }
  });

  it('should respect file key limit', async () => {
    const form = new FormData();
    const parser = withLimits({ fieldNameSize: 4 }, [
      { name: 'small0', maxCount: 1 }
    ]);

    form.append('small0', util.file('small0.dat'));

    try {
      await util.submitForm(parser, form);
    } catch (err) {
      assert.equal(err.code, 'LIMIT_FIELD_KEY');
    }
  });

  it('should respect field key limit', async () => {
    const form = new FormData();
    const parser = withLimits({ fieldNameSize: 4 }, []);

    form.append('ok', 'SMILE');
    form.append('blowup', 'BOOM!');

    try {
      await util.submitForm(parser, form);
    } catch (err) {
      assert.equal(err.code, 'LIMIT_FIELD_KEY');
    }
  });

  it('should respect field value limit', async () => {
    const form = new FormData();
    const parser = withLimits({ fieldSize: 16 }, []);

    form.append('field0', 'This is okay');
    form.append('field1', 'This will make the parser explode');

    try {
      await util.submitForm(parser, form);
    } catch (err) {
      assert.equal(err.code, 'LIMIT_FIELD_VALUE');
      assert.equal(err.field, 'field1');
    }
  });

  it('should respect field count limit', async () => {
    const form = new FormData();
    const parser = withLimits({ fields: 1 }, []);

    form.append('field0', 'BOOM!');
    form.append('field1', 'BOOM!');

    try {
      await util.submitForm(parser, form);
    } catch (err) {
      assert.equal(err.code, 'LIMIT_FIELD_COUNT');
    }
  });

  it('should respect fields given', async () => {
    const form = new FormData();
    const parser = withLimits(undefined, [{ name: 'wrongname', maxCount: 1 }]);

    form.append('small0', util.file('small0.dat'));

    try {
      await util.submitForm(parser, form);
    } catch (err) {
      assert.equal(err.code, 'LIMIT_UNEXPECTED_FILE');
      assert.equal(err.field, 'small0');
    }
  });

  it('should report errors from storage engines', async () => {
    const storage = multer.memoryStorage();

    storage._removeFile = function (req, file, cb) {
      const err = new Error('Test error');
      err.code = 'TEST';
      cb(err);
    };

    const form = new FormData();
    const upload = multer({ storage });
    const parser = upload.single('tiny0');

    form.append('tiny0', util.file('tiny0.dat'));
    form.append('small0', util.file('small0.dat'));

    try {
      await util.submitForm(parser, form);
    } catch (err) {
      assert.equal(err.code, 'LIMIT_UNEXPECTED_FILE');
      assert.equal(err.field, 'small0');

      assert.equal(err.storageErrors.length, 1);
      assert.equal(err.storageErrors[0].code, 'TEST');
      assert.equal(err.storageErrors[0].field, 'tiny0');
    }
  });

  it('should report errors from busboy constructor', async () => {
    const req = new stream.PassThrough();
    const storage = multer.memoryStorage();
    const upload = multer({ storage }).single('tiny0');
    const body = 'test';

    req.headers = {
      'content-type': 'multipart/form-data',
      'content-length': body.length
    };

    req.end(body);

    try {
      await upload({ req }, () => {});
    } catch (err) {
      assert.equal(err.message, 'Multipart: Boundary not found');
    }
  });

  it('should report errors from busboy parsing', async () => {
    const req = new stream.PassThrough();
    const storage = multer.memoryStorage();
    const upload = multer({ storage }).single('tiny0');
    const boundary = 'AaB03x';
    const body = [
      '--' + boundary,
      'Content-Disposition: form-data; name="tiny0"; filename="test.txt"',
      'Content-Type: text/plain',
      '',
      'test without end boundary'
    ].join('\r\n');

    req.headers = {
      'content-type': 'multipart/form-data; boundary=' + boundary,
      'content-length': body.length
    };

    req.end(body);

    try {
      await upload({ req }, () => {});
    } catch (err) {
      assert.equal(err.message, 'Unexpected end of multipart data');
    }
  });
});
