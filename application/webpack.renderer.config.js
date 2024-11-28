const rules = require('./webpack.rules');

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
});

console.log(`process.env.NODE_ENV=${process.env.NODE_ENV}`);

module.exports = {
  cache: {
      type: 'filesystem', // Cache builds to disk
  },
  // Put your normal webpack config below here
  module: {
    rules,
  },
  devtool: process.env.NODE_ENV === 'development' ? 'cheap-module-source-map' : 'source-map',
};
