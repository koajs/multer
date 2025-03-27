'use strict';

/*!
 * multer
 * Copyright(c) 2014 Hage Yaapa
 * Copyright(c) 2015 Fangdun Cai
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

let originalMulter = require('multer');

if (originalMulter.default) originalMulter = originalMulter.default;

function multer(options) {
  const m = originalMulter(options);

  makePromise(m, 'any');
  makePromise(m, 'array');
  makePromise(m, 'fields');
  makePromise(m, 'none');
  makePromise(m, 'single');

  return m;
}

function makePromise(multer, name) {
  if (!multer[name]) return;

  const fn = multer[name];

  multer[name] = function () {
    const middleware = Reflect.apply(fn, this, arguments);

    return async (ctx, next) => {
      await new Promise((resolve, reject) => {
        middleware(ctx.req, ctx.res, (err) => {
          if (err) return reject(err);
          if ('request' in ctx) {
            if (ctx.req.body) {
              ctx.request.body = ctx.req.body;
              delete ctx.req.body;
            }

            if (ctx.req.file) {
              ctx.request.file = ctx.req.file;
              ctx.file = ctx.req.file;
              delete ctx.req.file;
            }

            if (ctx.req.files) {
              ctx.request.files = ctx.req.files;
              ctx.files = ctx.req.files;
              delete ctx.req.files;
            }
          }

          resolve(ctx);
        });
      });

      return next();
    };
  };
}

multer.diskStorage = originalMulter.diskStorage;
multer.memoryStorage = originalMulter.memoryStorage;

module.exports = multer;
