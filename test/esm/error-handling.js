/* eslint-env mocha */

import { strictEqual } from 'node:assert';
import { PassThrough } from 'node:stream';

import FormData from 'form-data';

import multer from '../../src/index.js';
import { file, submitForm } from './_util.js';

function withLimits(limits, fields) {
  const storage = multer.memoryStorage();
  return multer({ storage, limits }).fields(fields);
}

describe('Error Handling', () => {
  it('should respect parts limit', (done) => {
    const form = new FormData();
    const parser = withLimits({ parts: 1 }, [{ name: 'small0', maxCount: 1 }]);

    form.append('field0', 'BOOM!');
    form.append('small0', file('small0.dat'));

    submitForm(parser, form, (err, req) => {
      strictEqual(err.code, 'LIMIT_PART_COUNT');
      done();
    });
  });

  it('should respect file size limit', (done) => {
    const form = new FormData();
    const parser = withLimits({ fileSize: 1500 }, [
      { name: 'tiny0', maxCount: 1 },
      { name: 'small0', maxCount: 1 }
    ]);

    form.append('tiny0', file('tiny0.dat'));
    form.append('small0', file('small0.dat'));

    submitForm(parser, form, (err, req) => {
      strictEqual(err.code, 'LIMIT_FILE_SIZE');
      strictEqual(err.field, 'small0');
      done();
    });
  });

  it('should respect file count limit', (done) => {
    const form = new FormData();
    const parser = withLimits({ files: 1 }, [
      { name: 'small0', maxCount: 1 },
      { name: 'small1', maxCount: 1 }
    ]);

    form.append('small0', file('small0.dat'));
    form.append('small1', file('small1.dat'));

    submitForm(parser, form, (err, req) => {
      strictEqual(err.code, 'LIMIT_FILE_COUNT');
      done();
    });
  });

  it('should respect file key limit', (done) => {
    const form = new FormData();
    const parser = withLimits({ fieldNameSize: 4 }, [
      { name: 'small0', maxCount: 1 }
    ]);

    form.append('small0', file('small0.dat'));

    submitForm(parser, form, (err, req) => {
      strictEqual(err.code, 'LIMIT_FIELD_KEY');
      done();
    });
  });

  it('should respect field key limit', (done) => {
    const form = new FormData();
    const parser = withLimits({ fieldNameSize: 4 }, []);

    form.append('ok', 'SMILE');
    form.append('blowup', 'BOOM!');

    submitForm(parser, form, (err, req) => {
      strictEqual(err.code, 'LIMIT_FIELD_KEY');
      done();
    });
  });

  it('should respect field value limit', (done) => {
    const form = new FormData();
    const parser = withLimits({ fieldSize: 16 }, []);

    form.append('field0', 'This is okay');
    form.append('field1', 'This will make the parser explode');

    submitForm(parser, form, (err, req) => {
      strictEqual(err.code, 'LIMIT_FIELD_VALUE');
      strictEqual(err.field, 'field1');
      done();
    });
  });

  it('should respect field count limit', (done) => {
    const form = new FormData();
    const parser = withLimits({ fields: 1 }, []);

    form.append('field0', 'BOOM!');
    form.append('field1', 'BOOM!');

    submitForm(parser, form, (err, req) => {
      strictEqual(err.code, 'LIMIT_FIELD_COUNT');
      done();
    });
  });

  it('should respect fields given', (done) => {
    const form = new FormData();
    const parser = withLimits(undefined, [{ name: 'wrongname', maxCount: 1 }]);

    form.append('small0', file('small0.dat'));

    submitForm(parser, form, (err, req) => {
      strictEqual(err.code, 'LIMIT_UNEXPECTED_FILE');
      strictEqual(err.field, 'small0');
      done();
    });
  });

  it('should report errors from storage engines', (done) => {
    const storage = multer.memoryStorage();

    storage._removeFile = function (req, file, cb) {
      const err = new Error('Test error');
      err.code = 'TEST';
      cb(err);
    };

    const form = new FormData();
    const upload = multer({ storage });
    const parser = upload.single('tiny0');

    form.append('tiny0', file('tiny0.dat'));
    form.append('small0', file('small0.dat'));

    submitForm(parser, form, (err, req) => {
      strictEqual(err.code, 'LIMIT_UNEXPECTED_FILE');
      strictEqual(err.field, 'small0');

      strictEqual(err.storageErrors.length, 1);
      strictEqual(err.storageErrors[0].code, 'TEST');
      strictEqual(err.storageErrors[0].field, 'tiny0');
      strictEqual(err.storageErrors[0].file, req.file);

      done();
    });
  });

  it('should report errors from busboy constructor', (done) => {
    const req = new PassThrough();
    const storage = multer.memoryStorage();
    const upload = multer({ storage }).single('tiny0');
    const body = 'test';

    req.headers = {
      'content-type': 'multipart/form-data',
      'content-length': body.length
    };

    req.end(body);

    upload({ req }, () => {}).catch((err) => {
      strictEqual(err.message, 'Multipart: Boundary not found');
      done();
    });
  });

  it('should report errors from busboy parsing', (done) => {
    const req = new PassThrough();
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

    upload({ req }, () => {}).catch((err) => {
      strictEqual(err.message, 'Unexpected end of multipart data');
      done();
    });
  });
});
