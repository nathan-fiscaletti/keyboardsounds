module.exports = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './src/main.js',
  // Put your normal webpack config below here
  module: {
    rules: require('./webpack.rules'),
  },
  cache: {
      type: 'filesystem', // Cache builds to disk
  },
  devtool: process.env.NODE_ENV === 'development' ? 'cheap-module-source-map' : 'source-map',
};
