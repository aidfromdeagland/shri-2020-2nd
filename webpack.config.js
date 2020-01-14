const path = require('path');

module.exports = {
  entry: './src/script.js',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'linter.js'
  }
};