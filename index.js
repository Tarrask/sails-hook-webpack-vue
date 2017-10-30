/*

Done:
 - Reorder hook initialization process. Webpack is created in the configure() function
   but the compilation only occure in the initialize(cb) function, the cb() in the called
   when the first compilation is finished.
 - use spinner like webpack template when compiling :) / optionnal
 - better display of the compilation stats.

Todo:
 - maybe delete the "// Merge default options" line 74 and following, options are correct in
   the webpack template.
 - use defaults and configKey (this.logPrefix, timeout, watching, ...)
 - move this todo elsewhere
 -
 */

const webpack = require('webpack');
const merge = require('webpack-merge');
const ora = require('ora');

module.exports = function (sails) {

  // Sails hook specification
  const hook = {
    defaults: {
       __configKey__: {
          _hookTimeout: 40000, // wait 40 seconds before timing out
          logPrefix: 'sails-hook-webpack-vue:',
       }
    },

    // to only call the initialize callback once ... in development when watching
    cbCalled: false,

    // to uniformize the logging emit by this hook
    logPrefix: '',


    configure() {
      let webpackConfig = sails.config[this.configKey];
      this.logPrefix = webpackConfig.logPrefix;

      // Validate hook configuration
      if (!webpackConfig || !webpackConfig.options) {
        sails.log.warn(this.logPrefix, 'No webpack options have been defined.');
        sails.log.warn(this.logPrefix, 'Please configure your config/webpack.js file.');
        return {};
      }

      const environment = process.env.NODE_ENV || 'development';
      const host = sails.getHost() || 'localhost';
      const port = sails.config.port || 1337;

      // Webpack options
      let options = webpackConfig.options;
      // Merge environment-specific options
      if (webpackConfig[environment]) {
        options = merge(options, webpackConfig[environment]);
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
      sails.log.debug(this.logPrefix, 'Creating webpack compiler ...');
      hook.compiler = webpack(options);

      // Registrating dev and hot Middleware for development
      if (environment === 'development') {
		const historyFallback = require('connect-history-api-fallback');
		const webpackDev = require('webpack-dev-middleware');
		const webpackHot = require('webpack-hot-middleware');

        // disabling logging, we already handle logging in compiler callback and displayStats
        let config = {
          hot: merge({
            quiet: true,
            log: (message) => { config.hot.quiet || sails.log(message) }
          }, webpackConfig.middlewares ? webpackConfig.middlewares.hot : {}),
          dev: merge({
            quiet: false,
            stats: {
              colors: true,
              children: false,
              cachedAssets: false,
              chunks: true,
              chunkModules: false,
              errorDetails: false,
              assets: false,
              version: false
            },
            log: text => { text.split('\n').forEach(line => sails.log.info(line)) },
            warn: text => { text.split('\n').forEach(line => sails.log.warn(line)) },
            error: text => { text.split('\n').forEach(line => sails.log.error(line)) }
          }, webpackConfig.middlewares ? webpackConfig.middlewares.dev : {})
        };

        sails.log.debug(this.logPrefix, 'Configuring development middlewares ...');
        sails.config.http.middleware.webpackHot = webpackHot(hook.compiler, config.hot);
        sails.config.http.middleware.webpackDev = webpackDev(hook.compiler, config.dev);

        // insert middlewares after the after middleware or sails.router by default
        let afterMiddleware = webpackConfig.middlewares.after || 'router';
        let index = sails.config.http.middleware.order.findIndex(el => el === afterMiddleware ? el : undefined);
        sails.config.http.middleware.order.splice(index+1, 0, 'webpackHot', 'webpackDev');

        if(webpackConfig.middlewares.history) {
          sails.config.http.middleware.historyFallback = historyFallback();
          sails.config.http.middleware.order.splice(index+1, 0, 'historyFallback');
        }
      }
    },
    initialize(cb) {
      if (process.env.NODE_ENV === 'development') {
        const spinner = ora('Building for development...').start();
        process.nextTick(() => {
          if(!hook.cbCalled) {
            spinner.succeed('Compilation done, watching for change...');
            hook.cbCalled = true;
            cb();
          }
        });
      }
      else if(process.env.NODE_ENV === 'testing') {
        sails.log.info(this.logPrefix, 'No need for webpack during server-side tests.');
        process.nextTick(() => {
          if(!hook.cbCalled) {
            hook.cbCalled = true;
            cb();
          }
        });
      }
      else {
        const spinner = ora('Building for production...').start();
        hook.compiler.run((err, stats) => {
          if(!hook.cbCalled) {
            spinner.succeed("Compilation done.");
            hook.cbCalled = true;
            cb();
          }
          hook.displayStats(err, stats);
        });
      }
    },
    displayStats(err, stats) {
      if(err) {
        sails.log.error(hook.logPrefix, err);
        return;
      }

      stats.toString({
        colors: true,
        children: false,
        cachedAssets: false,
        chunks: true,
        chunkModules: false,
        errorDetails: false,
        assets: false,
        version: true
      //  chunkModules: true
      }).split('\n').forEach(line => sails.log.info(line));
    }
  };

  return hook;
};
