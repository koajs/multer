const fs = require('node:fs');
const path = require('node:path');
const stream = require('node:stream');
const { promisify } = require('node:util');
const onFinished = require('on-finished');

exports.file = (name) => {
  return fs.createReadStream(path.join(__dirname, 'files', name));
};

exports.fileSize = (path) => {
  return fs.statSync(path).size;
};

exports.submitForm = async (multer, form) => {
  const getFormLength = promisify(form.getLength.bind(form));
  const length = await getFormLength();

  const req = new stream.PassThrough();

  req.complete = false;
  form.once('end', () => {
    req.complete = true;
  });

  form.pipe(req);
  req.headers = {
    'content-type': 'multipart/form-data; boundary=' + form.getBoundary(),
    'content-length': length
  };

  const res = null;
  const ctx = { req, res };
  await multer(ctx, () => {});
  onFinished(req, () => {});

  return req;
};
