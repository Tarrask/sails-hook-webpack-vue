const webpack = require('webpack');
const merge = require('webpack-merge');

module.exports = function (sails) {

  // Validate hook configuration
  if (!sails.config.webpack || !sails.config.webpack.config) {
    sails.log.warn('sails-hook-webpack2: No webpack options have been defined.');
    sails.log.warn('sails-hook-webpack2: Please configure your config/webpack.js file.');
    return {};
  }
  const hookOptions = sails.config.webpack;

  // Actual Sails hook
  const hook = {
    emitReady: false,
    configure() {},
    initialize(next) {
      next();
    },
    afterBuild(err, rawStats) {
      if (err) {
        return sails.log.error('sails-hook-webpack2: Build error: \n\n', err);
      }
      // Emit events
      if (!this.emitReady) {
        sails.emit('hook:sails-hook-webpack2:compiler-ready', {});
        this.emitReady = true;
      }
      sails.emit('hook:sails-hook-webpack2:after-build', rawStats);
      // Display information, errors and warnings
      const stats = rawStats.toJson();
      sails.log.info('sails-hook-webpack2: Build complete.')
      sails.log.silly(`sails-hook-webpack2: ${rawStats.toString({colors: true, chunks: false})}`);
      if (stats.errors.length > 0) {
        sails.log.error('sails-hook-webpack2: ', stats.errors);
      }
      if (stats.warnings.length > 0) {
        sails.log.warn('sails-hook-webpack2: ', stats.warnings);
      }
      return null;
    }
  };

  // Webpack configuration
  var config = hookOptions.config;
  if (hookOptions[process.env.NODE_ENV] && hookOptions[process.env.NODE_ENV].config) {
    config = merge(config, hookOptions[process.env.NODE_ENV].config);
  }
  config = merge(config, {
    plugins: [
      new webpack.DefinePlugin({
        'process.env': {
          'NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
          'HOST': JSON.stringify(sails.getHost() || 'localhost'),
          'PORT': JSON.stringify(sails.config.port || 1137)
        }
      })
    ]
  });

  // Create webpack compiler
  hook.compiler = webpack(config, (err, stats) => {
    if (err) throw err;
    sails.log.info('sails-hook-webpack2: Webpack configured successfully.');
    sails.log.silly('sails-hook-webpack2: ', stats.toString());
    if (process.env.NODE_ENV === 'production') {
      sails.log.info('sails-hook-webpack2: Running production build...');
      hook.compiler.run(hook.afterBuild.bind(hook));
    }
    else {
      sails.log.info('sails-hook-webpack2: Watching for changes...');
      hook.compiler.watch(hookOptions.watch, hook.afterBuild.bind(hook));
    }
  });

  // Start webpack-dev-server
  if (process.env.NODE_ENV !== 'production') {
    const WebpackDevServer = require('webpack-dev-server');
    var serverConfig = {
      hot: true,
      port: 3000
    };
    Object.assign(serverConfig, hookOptions.development.server || {});

    // Listen on specified port
    hook.server = new WebpackDevServer(hook.compiler, serverConfig);
    hook.server.listen(serverConfig.port);
    sails.log.info('sails-hook-webpack2: Server listening on http://' + (sails.getHost() || 'localhost') + ':' + serverConfig.port);
  }

  return hook;
}
