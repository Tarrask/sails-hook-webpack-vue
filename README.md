# sails-hook-webpack2

[![NPM version][npm-image]][npm-url]

Webpack 2.x asset pipeline hook for Sails.js

## Getting started

Install this package via npm:

```sh
npm install --save sails-hook-webpack2
```

Disable the Sails grunt hook (you can also create your Sails project using the [--no-frontend](http://sailsjs.com/documentation/reference/command-line-interface/sails-new) flag):

```js
// .sailsrc
{
  "hooks": {
    "grunt": false
  }
}
```

Configure [webpack options](https://webpack.js.org/configuration/) for your project:

 ```js
 // config/webpack.js

 const path = require('path');

 module.exports.webpack = {

   // webpack options, see https://webpack.js.org/configuration/
   options: {
     entry: './src/main.js',
     output: {
       path: path.resolve(__dirname, '../.tmp/public'),
       filename: '/js/bundle.js',
       publicPath: '/'
     }
   }

 };
 ```

Don't forget to include `/js/bundle.js` near the bottom of your views layout:

```
// views/layout.ejs
// ...
    <script src="/js/bundle.js"></script>
  </body>
</html>
```

Lift your application!

```sh
sails lift
```

### Environment-specific options

Additional options can be configured for specific environments (i.e. `development` or `production`). When initializing webpack, this hook will combine the appropriate options for your particular configuration using [webpack-merge](https://www.npmjs.com/package/webpack-merge).

```js
// config/webpack.js

const webpack = require('webpack');

module.exports.webpack = {

  // Common options
  options: {},

  // Production-specific options
  production: {
    plugins: [
      // Minimize CSS
      new webpack.LoaderOptionsPlugin({
        minimize: true
      }),
    ]
  }

};
```

### Live reloading / HMR

In non-production environments only, [webpack-dev-server](https://webpack.js.org/configuration/dev-server/) can be configured to serve your application and update the browser on file changes.
This requires using a different port than your Sails application and setting up the built-in [proxy](https://webpack.js.org/configuration/dev-server/#devserver-proxy) or configuring a middleware like [connect-history-api-fallback](https://www.npmjs.com/package/connect-history-api-fallback).

```js
// config/webpack.js

module.exports.webpack = {

  options: {},

  // webpack-dev-server configuration, see https://webpack.js.org/configuration/dev-server/
  server: {
    port: 3000
  }

};
```

### Events

This hook provides events that can be listened to by using [`sails.on()`](https://github.com/balderdashy/sails/blob/master/lib/EVENTS.md#usage)

- **hook:sails-hook-webpack2:compiler-ready**  - emitted when the compiler is initialised and ready, usually after the first build event.
- **hook:sails-hook-webpack2:after-build** - emitted after each webpack build, the event data includes the webpack build stats.

## License
MIT

## Maintained By
- [Pascal Martineau](https://github.com/lewebsimple)

## Credits
Based on [sails-hook-webpack](https://www.npmjs.com/package/sails-hook-webpack).

<img src='http://i.imgur.com/NsAdNdJ.png'>

[npm-image]: https://img.shields.io/npm/v/sails-hook-webpack2.svg?style=flat-square
[npm-url]: https://npmjs.org/package/sails-hook-webpack2
