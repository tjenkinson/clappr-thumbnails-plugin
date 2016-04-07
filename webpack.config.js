var path = require('path');
var webpack = require('webpack');
var Clean = require('clean-webpack-plugin');

var plugins = [
  new Clean(['dist'])
];

module.exports = {
  entry: path.resolve(__dirname, 'src/index.js'),
  plugins: plugins,
  externals: {
    clappr: 'Clappr',
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel',
        query: {
            compact: true,
        }
      },
      {
        test: /\.sass$/,
        loaders: ['style', 'css', 'sass?includePaths[]=' + path.resolve(__dirname, "./node_modules/compass-mixins/lib")],
      },
    ],
  },
  resolve: {
    extensions: ['', '.js'],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'clappr-thumbnails-plugin.js',
    library: 'ClapprThumbnailsPlugin',
    libraryTarget: 'umd',
  },
};
