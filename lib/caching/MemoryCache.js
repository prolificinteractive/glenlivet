var util = require('util');
var Q = require('q');
var _ = require('lodash');
var Cache = require('./Cache');

function genKey(bucket, id) {
  return bucket + ':' + id;
}

function MemoryCache() {
  Cache.call(this);
  this._store = {};
  this._expirations = {};
}

util.inherits(MemoryCache, Cache);

MemoryCache.prototype.save = function (bucket, id, object, _callback) {
  var cache = this;
  var key = genKey(bucket, id);
  var expiration = this._expirations[key];
  var deferred = Q.defer();

  function callback(object) {
    if (_callback) {
      _callback.call(cache, object);
    }
    deferred.resolve(object);
    cache.emit('save', bucket, id, object);
  }

  this._store[key] = object;

  if (expiration) {
    this.setExpiration(bucket, id, expiration.ttl);
  }

  setImmediate(callback, null, object);

  return deferred.promise;
};

MemoryCache.prototype.load = function (bucket, id, _callback) {
  var cache = this;
  var key = genKey(bucket, id);
  var deferred = Q.defer();

  function callback(err, object) {
    if (_callback) {
      _callback.call(cache, err, object);
    }

    if (object) {
      cache.emit('load:hit', bucket, id, object);
    } else {
      cache.emit('load:miss', bucket, id);
    }

    deferred.resolve(object);
  }

  setImmediate(callback, null, this._store[key] || null);

  return deferred.promise;
};

MemoryCache.prototype.erase = function (bucket, id, _callback) {
  var cache = this;
  var key = genKey(bucket, id);
  var deferred = Q.defer();

  function callback(err) {
    if (_callback) {
      _callback.call(cache, err);
    }

    deferred.resolve();
    cache.emit('erase', bucket, id);
  }

  delete this._store[key];

  setImmediate(callback, null);

  return deferred.promise;
};

MemoryCache.prototype.setExpiration = function (bucket, id, ttl, _callback) {
  var cache = this;
  var key = genKey(bucket, id);
  var expiration = this._expirations[key];
  var deferred = Q.defer();
  var success = !!this._store[key];

  function callback(err) {
    if (_callback) {
      _callback.call(cache, null, success);
    }

    if (success) {
      this.emit('setExpiration', bucket, id, ttl);
    }
  }

  if (expiration) {
    clearTimeout(expiration.timeout);
    delete expiration.timeout;
  }

  if (success) {
    this._expirations[key] = {
      ttl: ttl,
      timeout: setTimeout(function () {
        cache.erase(bucket, id);
      }, ttl)
    };
  }

  return deferred.promise;
};

module.exports = MemoryCache;
