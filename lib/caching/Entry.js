var _ = require('lodash');

function Entry(options) {
  _.defaults(this, options, {
    cache: null,
    bucket: null,
    key: 'default'
  });
}

Entry.prototype.save = function (data, callback) {
  return this.cache.save(this.bucket, this.key, data, callback);
};

Entry.prototype.load = function (callback) {
  return this.cache.load(this.bucket, this.key, callback);
};

Entry.prototype.setExpiration = function (ttl, callback) {
  return this.cache.setExpiration(this.bucket, this.key, ttl, callback);
};

Entry.prototype.erase = function (callback) {
  return this.cache.erase(this.bucket, this.key, callback);
};

module.exports = Entry;
