var Q = require('q');
var _ = require('lodash');
var request = require('request');
var Plugin = require('../Plugin');

var plugin = new Plugin('request', function (optionMap) {
  this.hooks.add([
    'setup:request',
    'process:request'
  ]);

  this.middleware({
    'setup': function (data) {
      data.request = {
        options: {},
        response: null
      };
    },

    // Calculates the value of each request option.
    // If a given key uses a function, the return value is assumed to be a
    // promise. This allows us to apply asynchronous options.
    'setup:request': function (data, next, done) {
      var options = data.request.options;
      var promises = [];

      if (typeof optionMap === 'string') {
        options.uri = optionMap;
      } else {
        _.each(optionMap, function (calc, key) {
          if (typeof calc === 'function') {
            var promise = Q(calc(data));

            promise.done(function (value) {
              options[key] = value;
            });

            promises.push(promise);
          } else if (_.isObject(calc)) {
            options[key] = _.extend({}, calc);
          } else {
            options[key] = calc;
          }
        });
      }

      //If protocol, host, and path are specified, with no uri, assemble the uri
      if (!options.uri && options.host && options.protocol && options.pathname) {
        options.uri = options.protocol + options.host + options.pathname;
        delete options.protocol;
        delete options.host;
        delete options.path;
      }

      if (promises.length > 0) {
        Q.all(promises).done(next, done);
      } else {
        next();
      }
    },

    'process:request': function (data, next, done) {
      request(data.request.options, function (err, response) {
        if (err) {
          done(err);
          return;
        }

        data.request.response = response;
        next();
      });
    }
  });
});

module.exports = plugin;
