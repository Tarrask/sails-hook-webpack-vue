const webpack = require('webpack');
const merge = require('webpack-merge');

const historyFallback = require('connect-history-api-fallback');
const webpackDev = require('webpack-dev-middleware');
const webpackHot = require('webpack-hot-middleware');

module.exports = function (sails) {

  // Sails hook specification
  const hook = {
    emitReady: false,
    afterBuild(err, stats) {
      if (err) return sails.log.error('sails-hook-webpack2: Build error:\n', err);
      // Emit events
      if (!this.emitReady) {
        sails.emit('hook:sails-hook-webpack2:compiler-ready', {});
        this.emitReady = true;
      }
      sails.emit('hook:sails-hook-webpack2:after-build', stats);
      // Display information, errors and warnings
      if (stats.compilation.warnings && stats.compilation.warnings.length > 0) {
        stats.compilation.warnings.forEach(warning => sails.log.warn('sails-hook-webpack2: in', warning.origin ? warning.origin.resource : 'unknown', '\n', warning.message));
      }
      if (stats.compilation.errors && stats.compilation.errors.length > 0) {
        stats.compilation.errors.forEach(error => sails.log.error('sails-hook-webpack2: in', error.origin.resource, '\n', error.message));
      }
      sails.log.info('sails-hook-webpack2: Build complete. Hash: ' + stats.hash + ', Time: ' + (stats.endTime - stats.startTime) + 'ms');
    },
    
    configure() {
      // Validate hook configuration
      if (!sails.config.webpack || !sails.config.webpack.options) {
        sails.log.warn('sails-hook-webpack2: No webpack options have been defined.');
        sails.log.warn('sails-hook-webpack2: Please configure your config/webpack.js file.');
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
      hook.compiler = webpack(options, (err, stats) => {
        if (err) {
          sails.log.error('sails-hook-webpack2: Configuration error:\n', err);
          return {};
        }
        sails.log.info('sails-hook-webpack2: Webpack configured successfully.');
        if (environment === 'production') {
          sails.log.info('sails-hook-webpack2: Building for production...');
          hook.compiler.run(hook.afterBuild.bind(hook));
        }
        else {
          sails.log.info('sails-hook-webpack2: Watching for changes...');
          hook.compiler.watch(sails.config.webpack.watch, hook.afterBuild.bind(hook));
        }
      });
        
      // Registrating dev and hot Middleware for development
      if (environment === 'development') {
        // disabling logging, we already handle logging in compiler afterBuild callback
        let config = {
          hot: merge({
            quiet: true,
            log: (message) => { config.hot.quiet || sails.log(message) }
          }, sails.config.webpack.hotMiddleware),
          dev: merge({
            quiet: true
          }, sails.config.webpack.devMiddleware)
        };
    
        sails.config.http.middleware.historyFallback = historyFallback();
        sails.config.http.middleware.webpackHot = webpackHot(hook.compiler, config.hot);
        sails.config.http.middleware.webpackDev = webpackDev(hook.compiler, config.dev);
        
        sails.config.http.middleware.order.unshift('webpackDev');
        sails.config.http.middleware.order.unshift('webpackHot');
        sails.config.http.middleware.order.unshift('historyFallback');
        
        sails.log.info('sails-hook-webpack2: webpack-[hot|dev]-middleware configured successfully.');
      } 
    }
  };

  return hook;
};
