var util = require('util');
var EventEmitter2 = require('eventemitter2').EventEmitter2;
var Entry = require('./Entry');
var abstractError = new Error('You must use a derived Cache class');

function Cache(options) {
  EventEmitter2.call(this);
}

util.inherits(Cache, EventEmitter2);

Cache.prototype.entry = function (bucket, key) {
  return new Entry({
    cache: this,
    bucket: bucket,
    key: key
  });
};

Cache.prototype.save = function () {
  throw abstractError;
};

Cache.prototype.load = function () {
  throw abstractError;
};

Cache.prototype.erase = function () {
  throw abstractError;
};

Cache.prototype.setExpiration = function () {
  throw abstractError;
};

module.exports = Cache;
