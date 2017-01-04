# sails-hook-webpack2
Webpack 2.x asset pipeline hook for Sails.js

## 1. Install
```sh
npm install sails-hook-webpack2 --save
```

## 2. Configure

### a. Disable the sails grunt hook.

```js
// .sailsrc
{
  "hooks": {
    "grunt": false
  }
}
```

> Optionally, you can also create your Sails project using the [--no-frontend](http://sailsjs.com/documentation/reference/command-line-interface/sails-new) flag.

### b. Set your environment variable.

By default, Sails ([and express](http://stackoverflow.com/a/16979503/291180)) sets `NODE_ENV=development`.
With this setting, webpack in development mode will watch for changes in the directories you specify in your `config/webpack.js`. In production mode, webpack will just compile the assets using your webpack configuration.

| `NODE_ENV` | webpack mode | description |
|:---|:---|:---|
| `development` | `webpack.watch()` | Rebuilds on file changes during runtime |
| `staging` or `production` | `webpack.run()` | Build bundle once on load. |

### c. Configure webpack

This hook uses the standard [webpack 2.x configuration](https://webpack.js.org/configuration/).

Below is an example of the webpack configuration file `PROJECT_DIR/config/webpack.js`

```js
// config/webpack.js
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports.webpack = {
  // webpack 2.x configuration, see https://webpack.js.org/configuration/
  config: {
    entry: './app/main.js',
    output: {
      path: path.resolve(__dirname, '../.tmp/public'),
      filename: 'assets/js/[name].js?[hash:4]',
      publicPath: '/'
    },
    module: {
      rules: []
    },
    plugins: [
      // Skip assets emitting on error
      new webpack.NoErrorsPlugin(),
      // Inject assets in index.html
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, '../app/index.html'),
        filename: 'index.html'
      })
    ],
    performance: {
      hints: false
    },
    devtool: 'eval',
    stats: 'errors-only'
  },

  // watch options, see https://webpack.js.org/configuration/watch/#watchoptions
  watch: {
    aggregateTimeout: 300
  },

  development: {
    // webpack configuration overrides that will be merged for development mode
    config: {
      // HMR, see https://webpack.github.io/docs/webpack-dev-server.html#hot-module-replacement-with-node-js-api
      entry: [
        'webpack-dev-server/client?http://localhost:3000/',
        'webpack/hot/dev-server',
        './app/main.js'
      ],
      plugins: [
        // HMR
        new webpack.HotModuleReplacementPlugin()
      ]
    },

    // webpack-dev-server configuration, see https://webpack.js.org/configuration/dev-server/
    server: {
      // HMR
      hot: true,
      port: 3000,
      noInfo: true,
      // Sails backend proxy
      historyApiFallback: true,
      contentBase: path.resolve(__dirname, '../.tmp/public'),
      proxy: {
        '*': {
          target: 'http://localhost:1337'
        }
      }
    }
  }
};
```

## 3. Lift!

```sh
sails lift
```

### Events

This hook provides events that can be listened to by using `sails.on(..event, ..fn)`

- **hook:sails-hook-webpack2:compiler-ready**  - emitted when the compiler is initialised and ready, usually after the first build event.
- **hook:sails-hook-webpack2:after-build** - emitted after each webpack build, the event data includes the webpack build stats.

## License
MIT

## Maintained By
- [Pascal Martineau](https://github.com/lewebsimple)

<img src='http://i.imgur.com/NsAdNdJ.png'>