const webpack = require('webpack');
const merge = require('webpack-merge');

module.exports = function (sails) {

  // Validate hook configuration
  if (!sails.config.webpack || !sails.config.webpack.options) {
    sails.log.warn('sails-hook-webpack2: No webpack options have been defined.');
    sails.log.warn('sails-hook-webpack2: Please configure your config/webpack.js file.');
    return {};
  }

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
        stats.compilation.warnings.forEach(warning => sails.log.warn('sails-hook-webpack2:', warning.message));
      }
      if (stats.compilation.errors && stats.compilation.errors.length > 0) {
        stats.compilation.errors.forEach(error => sails.log.error('sails-hook-webpack2:', error.message));
      }
      sails.log.info('sails-hook-webpack2: Build complete. Hash: ' + stats.hash + ', Time: ' + (stats.endTime - stats.startTime) + 'ms');
    }
  };

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

  // Start webpack-dev-server
  if (environment !== 'production' && sails.config.webpack.server) {
    const WebpackDevServer = require('webpack-dev-server');
    // Webpack-dev-server configuration
    let config = {
      hot: true,
      port: 3000
    };
    Object.assign(config, sails.config.webpack.server);

    // Listen on specific port
    hook.server = new WebpackDevServer(hook.compiler, config);
    hook.server.listen(config.port);
    sails.log.info('sails-hook-webpack2: Server listening on http://' + host + ':' + config.port);
  }

  return hook;
};
