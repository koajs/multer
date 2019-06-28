# [**@koa/multer**](https://github.com/koa/multer)

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

```sh
npm install --save koa/multer multer
```


## Usage

```js
const Koa = require('koa');
const route = require('koa-route');
const multer = require('@koa/multer');

const app = new Koa();
const upload = multer({ dest: 'uploads/' });

app.use(route.post('/profile', upload.single('avatar')));

app.listen(3000);
```


## Contributors

| Name           | Website                    |
| -------------- | -------------------------- |
| **Nick Baugh** | <http://niftylettuce.com/> |


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
