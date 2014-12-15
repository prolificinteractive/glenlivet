var EventEmitter = require('events').EventEmitter;
var util = require('util');
var _ = require('lodash');
var Q = require('q');
var Hook = require('./Hook');

function Bottle(config) {
  var bottle = this;

  EventEmitter.call(this);

  this.config = config || {};
  this._rootHook = new Hook();
  this._middlewareStacks = {};
  this._addDefaultHooks();

  this._rootHook.on('middleware:run', function (data, middleware) {
    if (middleware.step) {
      bottle.emit('middleware:run', data, middleware);
    }
  });
}

util.inherits(Bottle, EventEmitter);

Bottle.prototype._addDefaultHooks = function () {
  this._rootHook.insertWithin(['preempt', 'setup', 'process', 'filter', 'persist']);
};

Bottle.prototype.plugins = function (plugins) {
  if (!_.isArray(plugins)) {
    plugins = [plugins];
  }

  _.each(plugins, function (plugin) {
    var pluginConfig = this.config[plugin.namespace];
    plugin.call(this, pluginConfig);
  }, this);

  return this;
};

Bottle.prototype.method = function (returnPath) {
  var bottle = this;

  return function (data, done) {
    if (!done) {
      if (_.isFunction(data)) {
        done = data;
        data = {};
      } else {
        done = _.noop;
      }
    }

    if (!data) {
      data = {};
    }

    var promise = bottle.serve(data);

    if (returnPath) {
      _.each(returnPath.split('.'), function (part) {
        promise = promise.then(function (_data) {
          return _data[part];
        });
      });
    }

    promise.done(function (_data) {
      done(null, _data);
    }, function (err) {
      done(err, null);
    });

    return promise;
  };
};

Bottle.prototype.middleware = function (step, middleware) {
  // Normalize string and object argument
  if (typeof step === 'object') {
    _.each(step, function (_middleware, _step) {
      this.middleware(_step, _middleware);
    }, this);

    return this;
  }

  // Add step name for debugging
  middleware.step = step;

  // Creates middleware stack if it doesn't already exist and adds middleware
  (this._middlewareStacks[step] = this._middlewareStacks[step] || []).push(middleware);

  // Adds middleware step to hierarchy if it's not a "before" or "after" middleware step
  if (/^(before|after) /.test(step) === false) {
    this._rootHook.add(step);
  }

  return this;
};

Bottle.prototype.serve = function (data, done) {
  if (!done) {
    if (_.isFunction(data)) {
      done = data;
      data = {};
    } else {
      done = _.noop;
    }
  }

  if (!data) {
    data = {};
  }

  var bottle = this;
  var deferred = Q.defer();
  var promise = deferred.promise;

  data._middlewarePromises = [];

  function traversalCallback (prefix) {
    return function (hook) {
      var path = hook.getPath();
      var step = prefix? prefix + ' ' + path: path;
      var stack = bottle._middlewareStacks[step];

      bottle.emit('serve:middleware:' + step, data, stack);
      bottle.emit('serve:middleware', data, step, stack);

      if (stack) {
        return bottle._runMiddlewareStack(stack, data, abort);
      }
    };
  }

  function abort (err) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve(data);
    }
  }

  this._rootHook
    .traverse({
      before: traversalCallback('before'),
      each: traversalCallback(),
      after: traversalCallback('after')
    })
    .then(function () {
      return Q.all(data._middlewarePromises);
    })
    .then(function (arr) {
      return data;
    })
    .then(deferred.resolve)
    .catch(deferred.reject);

  promise
    .done(function () {
      done(null, data);
      bottle.emit('serve:success', data);
    }, function (err) {
      done(err, null);
      bottle.emit('serve:error', err);
    });

  return promise;
};

Bottle.prototype._runMiddlewareStack = function (stack, data, abort) {
  var deferred = Q.defer();
  var i = 0;

  function next () {
    var middleware = stack[i];

    i += 1;

    if (middleware) {
      var returnValue;

      if (middleware.length > 1) {
        returnValue = middleware.call(data, data, next, abort);
      } else {
        returnValue = middleware.call(data, data);
        process.nextTick(next);
      }

      if (returnValue) {
        data._middlewarePromises.push(returnValue);
      }
    } else {
      deferred.resolve(data);
    }
  }

  next();

  return deferred.promise;
};

module.exports = Bottle;
