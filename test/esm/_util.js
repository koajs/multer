import { fileURLToPath } from 'node:url';
import { createReadStream, statSync } from 'node:fs';
import { join } from 'node:path';
import { PassThrough } from 'node:stream';

import onFinished from 'on-finished';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export function file(name) {
  return createReadStream(join(__dirname, '..', 'files', name));
}

export function fileSize(path) {
  return statSync(path).size;
}

export function submitForm(multer, form, cb) {
  form.getLength((err, length) => {
    if (err) return cb(err);

    const req = new PassThrough();

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
    multer(ctx, () => {})
      .then(() => {
        onFinished(req, () => {
          cb(null, req);
        });
      })
      .catch((err_) => {
        onFinished(req, () => {
          cb(err_, req);
        });
      });
  });
}
