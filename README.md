# [**@koa/multer**](https://github.com/koajs/multer)

> Route middleware for Koa that handles `multipart/form-data` using [multer][]

[![NPM version][npm-img]][npm-url]
[![NPM Downloads][downloads-image]][npm-url]
[![Build status][travis-img]][travis-url]
[![Test coverage][coveralls-img]][coveralls-url]
[![Dependency status][david-img]][david-url]
[![License][license-img]][license-url]


## Call for Maintainers

This module is a fork of [koa-multer][], the most widely used multer middleware in the koa community.  Due to lack of maintenance, it was forked to the official Koa organization and is available under `@koa/multer` package name.


## Install

> Note that you must install either `multer@1.x` (Buffer) or `multer@2.x` (Streams):

```sh
npm install --save @koa/multer multer
```


## Usage

```js
const Koa = require('koa');
const Router = require('@koa/router');
const multer = require('@koa/multer');

const app = new Koa();
const router = new Router();
const upload = multer(); // note you can pass `multer` options here

// add a route for uploading multiple files
router.post(
  '/upload-multiple-files',
  upload.fields([
    {
      name: 'avatar',
      maxCount: 1
    },
    {
      name: 'boop',
      maxCount: 2
    }
  ]),
  ctx => {
    console.log('ctx.request.files', ctx.request.files);
    console.log('ctx.files', ctx.files);
    console.log('ctx.request.body', ctx.request.body);
    ctx.body = 'done';
  }
);

// add a route for uploading single files
router.post(
  '/upload-single-file',
  upload.single('avatar'),
  ctx => {
    console.log('ctx.request.file', ctx.request.file);
    console.log('ctx.file', ctx.file);
    console.log('ctx.request.body', ctx.request.body);
    ctx.body = 'done';
  }
);

// add the router to our app
app.use(router.routes());
app.use(router.allowedMethods());

// start the server
app.listen(3000);
```


## Contributors

| Name            | Website                         |
| --------------- | ------------------------------- |
| **Nick Baugh**  | <http://niftylettuce.com/>      |
| **Imed Jaberi** | <https://www.3imed-jaberi.com/> |


## License

[MIT](LICENSE) © Fangdun Cai


## 

[npm-img]: https://img.shields.io/npm/v/@koa/multer.svg?style=flat-square

[npm-url]: https://npmjs.org/package/@koa/multer

[travis-img]: https://img.shields.io/travis/koajs/multer.svg?style=flat-square

[travis-url]: https://travis-ci.org/koajs/multer

[coveralls-img]: https://img.shields.io/coveralls/koajs/multer.svg?style=flat-square

[coveralls-url]: https://coveralls.io/r/koajs/multer?branch=master

[license-img]: https://img.shields.io/badge/license-MIT-green.svg?style=flat-square

[license-url]: LICENSE

[david-img]: https://img.shields.io/david/koajs/multer.svg?style=flat-square

[david-url]: https://david-dm.org/koajs/multer

[downloads-image]: https://img.shields.io/npm/dm/@koa/multer.svg?style=flat-square

[multer]: https://github.com/expressjs/multer

[koa-multer]: https://github.com/koa-modules/multer
