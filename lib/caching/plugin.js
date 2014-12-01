var _ = require('lodash');
var Plugin = require('../Plugin');
var Entry = require('./Entry');

var caching = new Plugin('caching', function (config) {
  var cache = config.cache;
  var ttl = config.ttl;
  var prefix = config.prefix || null;
  var cachedPath = config.cachedPath || 'json';
  var getKey = config.getKey || _.noop;

  this.hooks.add([
    'preempt:cache',
    'persist:cache'
  ]);

  this.middleware({
    'preempt:cache': function (data, next, done) {
      var entry = cache.entry(config.bucket, getKey(data));

      data.caching = {
        entry: entry
      };

      entry.load(function (err, _data) {
        if (err) {
          done(err);
        } else if (_data) {
          _.extend(data, _data);
          done();
        } else {
          next();
        }
      });
    },

    'persist:cache': function (data) {

    }
  });
});

module.exports = caching;
