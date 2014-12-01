function middleware(options) {
  var cache = options.cache;
  var required = options.required || true;
  var getKey = options.getKey || function (req) {
    return 'default';
  };

  return function (req, resp, next) {
    req.cacheEntry = cache.entry({
      bucket: options.bucket,
      key: getKey(req)
    });

    resp.send = (function (_send) {
      return function (data) {
        _send.call(this, data);
        req.cacheEntry.save(data);
      };
    }(resp.send));

    req.cacheEntry.read(function (err, data) {
      if (err) {
        next(err);
      } else if (data) {
        resp.send(data);
      } else {
        next();
      }
    });
  };
}

module.exports = middleware;
