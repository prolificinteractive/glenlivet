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

Bottle.prototype.method = function () {
  var bottle = this;

  return function (data, callback) {
    return bottle.serve(data, callback);
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

  // Adds middleware step to hierarchy
  this._rootHook.add(step);

  return this;
};

Bottle.prototype.serve = function (data, done) {
  if (!done) {
    if (typeof data === 'function') {
      done = data;
      data = {};
    } else {
      if (typeof data === 'undefined') {
        data = {};
      }

      done = _.noop;
    }
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

  this._rootHook.traverse({
    before: traversalCallback('before'),
    each: traversalCallback(),
    after: traversalCallback('after')
  }).then(function () {
    return Q.all(data._middlewarePromises);
  }).done(deferred.resolve, deferred.reject);

  promise.done(function () {
    done(null, data);
    bottle.emit('serve:success', data);
  }, function (err) {
    done(err, data);
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
