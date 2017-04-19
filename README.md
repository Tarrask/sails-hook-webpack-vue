# sails-hook-webpack2

[![NPM version][npm-image]][npm-url]

Webpack 2.x asset pipeline hook for Sails.js specially tailored for the [vuejs-templates/webpack](https://github.com/vuejs-templates/webpack)

## Getting started

This package is best used with the [sails-generate-new-webpack-vue](https://www.npmjs.com/package/sails-generate-new-webpack-vue) which will generate a new sails project using webpack2 instead of grunt and vue.js as a front-end framework and will install this package as a dependency.

For usage or more informations, please read the [sails-generate-new-webpack-vue readme](https://www.npmjs.com/package/sails-generate-new-webpack-vue).


## Usage

This package is a sails.js hook that will be triggered when sails.js lifts. It use the build config located in ./webpack/build and ./webpack/config. Please see the vuejs-templates/webpack [documentation](http://vuejs-templates.github.io/webpack/) for more informations.

In a development environment, it will inject the webpack-dev-middleware, the webpack-hot-middleware and the connect-history-api-fallback middlewares.

In a production envrionment, it will compile the webpack project before the server get lifted.


## License
MIT

## Maintained By
[Damien Plumettaz](https://github.com/tarrask)

## Credits
Based on [sails-hook-webpack2](https://github.com/lewebsimple/sails-hook-webpack2)

<img src='http://i.imgur.com/NsAdNdJ.png'>

[npm-image]: https://img.shields.io/npm/v/sails-hook-webpack2.svg?style=flat-square
[npm-url]: https://npmjs.org/package/sails-hook-webpack-vue
