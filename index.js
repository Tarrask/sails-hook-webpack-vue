/*

Done: 
 - Reorder hook initialization process. Webpack is created in the configure() function
   but the compilation only occure in the initialize(cb) function, the cb() in the called
   when the first compilation is finished.

Todo: 
 - better display of the compilation stats.
 - maybe delete the "// Merge default options" line 74 and following, options are correct in
   the webpack template.
 - use spinner like webpack template when compiling :) / optionnal
 - use defaults and configKey (logPrefix, timeout, watching, ...)
 - move this todo elsewhere
 - 
 */

const webpack = require('webpack');
const merge = require('webpack-merge');

const historyFallback = require('connect-history-api-fallback');
const webpackDev = require('webpack-dev-middleware');
const webpackHot = require('webpack-hot-middleware');

module.exports = function (sails) {

  // Sails hook specification
  const hook = {
    defaults: {
       __configKey__: {
          _hookTimeout: 20000 // wait 20 seconds before timing out
       }
    },

    // to only call the initialize callback once ... in development when watching
    cbCalled: false,

  /**  emitReady: false, */

    // to uniformize the logging emit by this hook
    logPrefix: 'sails-hook-webpack2:',

  /**  afterBuild(err, stats) {
      if (err) return sails.log.error(logPrefix, 'Build error:\n', err);
      // Emit events
      if (!this.emitReady) {
        sails.emit('hook:sails-hook-webpack2:compiler-ready', {});
        this.emitReady = true;
      }
      sails.emit('hook:sails-hook-webpack2:after-build', stats);
      // Display information, errors and warnings
      if (stats.compilation.warnings && stats.compilation.warnings.length > 0) {
        stats.compilation.warnings.forEach(
          warning => sails.log.warn(logPrefix, 'in', warning.origin ?
            warning.origin.resource :
            'unknown', '\n', warning.message));
      }
      if (stats.compilation.errors && stats.compilation.errors.length > 0) {
        stats.compilation.errors.forEach(
          error => sails.log.error(logPrefix, 'in', error.origin ?
            error.origin.resource :
            'unknown', '\n', error.message));
      }
      sails.log.info(logPrefix, 'Build complete. Hash: ' + stats.hash + ', Time: ' + (stats.endTime - stats.startTime) + 'ms');
    }, */

    configure() {
      // Validate hook configuration
      if (!sails.config.webpack || !sails.config.webpack.options) {
        sails.log.warn(logPrefix, 'No webpack options have been defined.');
        sails.log.warn(logPrefix, 'Please configure your config/webpack.js file.');
        return {};
      }

      const environment = process.env.NODE_ENV || 'development';
      const host = sails.getHost() || 'localhost';
      const port = sails.config.port || 1337;

      // Webpack options
      let options = sails.config.webpack.options;
      // Merge environment-specific options
      if (sails.config.webpack[environment]) {
        options = merge(options, sails.config.webpack[environment]);
      }
      // Merge default options
      options = merge(options, {
        plugins: [
          // User environment variables
          new webpack.DefinePlugin({
            'process.env': {
              'NODE_ENV': JSON.stringify(environment),
              'SAILS_HOST': JSON.stringify(host),
              'SAILS_PORT': JSON.stringify(port)
            }
          }) 
        ],
        performance: {
          hints: false
        },
        stats: 'errors-only'
      });

      // Create webpack compiler
      sails.log.debug(logPrefix, 'Creating webpack compiler ...');
      hook.compiler = webpack(options);
      /* , (err, stats) => {
        if (err) {
          sails.log.error(logPrefix, 'Configuration error:\n', err);
          return {};
        }
        sails.log.info(logPrefix, 'Webpack configured successfully.');
        if (environment === 'production') {
          sails.log.info(logPrefix, 'Building for production...');
          hook.compiler.run(hook.afterBuild.bind(hook));
        }
        else {
          sails.log.info(logPrefix, 'Watching for changes...');
          hook.compiler.watch(sails.config.webpack.watch, hook.afterBuild.bind(hook));
        }
      }); */

      // Registrating dev and hot Middleware for development
      if (environment === 'development') {
        // disabling logging, we already handle logging in compiler callback and displayStats
        let config = {
          hot: merge({
            quiet: true,
            log: (message) => { config.hot.quiet || sails.log(message) }
          }, sails.config.webpack.hotMiddleware),
          dev: merge({
            quiet: true
          }, sails.config.webpack.devMiddleware)
        };

        sails.log.debug(logPrefix, 'Configuring devloppment middlewares ...');
        sails.config.http.middleware.historyFallback = historyFallback();
        sails.config.http.middleware.webpackHot = webpackHot(hook.compiler, config.hot);
        sails.config.http.middleware.webpackDev = webpackDev(hook.compiler, config.dev);

        sails.config.http.middleware.order.unshift('webpackDev');
        sails.config.http.middleware.order.unshift('webpackHot');
        sails.config.http.middleware.order.unshift('historyFallback');
      }
    },
    initialize(cb) {
      sails.log.warn("sails hook initializing, please wait ...");

      if (process.env.NODE_ENV === 'production') {
        sails.log.info(logPrefix, 'Building for production...');
        hook.compiler.run((err, stats) => {
          if(!hook.cbCalled) { hook.cbCalled = true; cb(); }
          hook.displayStats(err, stats);
        });
      }
      else {
        sails.log.info(logPrefix, 'Watching for changes...');
        hook.compiler.watch(sails.config.webpack.watch, (err, stats) => {
          if(!hook.cbCalled) { hook.cbCalled = true; cb(); }
          hook.displayStats(err, stats);
        });
      }
    },
    displayStats(err, stats) {
      if(err) {
        sails.log.error(hook.logPrefix, err);
        return;
      }

      sails.log(stats.toString());
    }
  };

  return hook;
};
