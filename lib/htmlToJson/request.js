var request = require('request');
var parse = require('./parse');

function request(options, structure, data, callback) {
  if (!callback) {
    callback = data;
    data = {};
  }

  request(options, function (err, response) {
    if (err) {
      return callback(err, null);
    }

    parse(response.body, structure, data, callback);
  });
}

module.exports = request;
