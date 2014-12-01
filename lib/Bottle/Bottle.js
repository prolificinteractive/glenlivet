var EventEmitter2 = require('eventemitter2').EventEmitter2;
var util = require('util');
var _ = require('lodash');
var Q = require('q');
var Hook = require('./Hook');
var middlewarePlugin = require('./middlewarePlugin');

function Bottle(config) {
  var bottle = this;

  EventEmitter2.call(this);

  this.config = config || {};
  this.hooks = this._rootHook = new Hook();
  this._middlewareStacks = {};
  this._addDefaultHooks();
  this._addDefaultPlugins();

  this.hooks.on('middleware:run', function (data, middleware) {
    if (middleware.step) {
      bottle.emit('middleware:run', data, middleware);
    }
  });
}

util.inherits(Bottle, EventEmitter2);

Bottle.prototype._addDefaultHooks = function () {
  this.hooks.insertWithin(['preempt', 'setup', 'process', 'filter', 'persist']);
};

Bottle.prototype._addDefaultPlugins = function () {
  this.plugins([middlewarePlugin]);
  return this;
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

  // Creates middleware stack if it doesn't already exist, then adds middleware
  (this._middlewareStacks[step] = this._middlewareStacks[step] || []).push(middleware);

  return this;
};

Bottle.prototype.getMiddlewareStack = function (name) {
  return this._middlewareStacks[name];
};

Bottle.prototype.serve = function (data, _done) {
  var deferred = Q.defer();
  var promise = deferred.promise;
  var bottle = this;

  function done(err) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve(data);
    }

    bottle.emit('serve:done', err, data);
  }

  if (!_done && typeof data === 'function') {
    _done = data || _.noop;
    data = {};
  }

  this.hooks.traverse({
    before: this.HookTraversalStep('before'),
    each: this.HookTraversalStep(),
    after: this.HookTraversalStep('after')
  }, data, done, done);

  promise.done(function (data) {
    _done(null, data);
    bottle.emit('serve:success', data);
  }, function (err) {
    data.error = err;
    _done(err, data);
    bottle.emit('serve:error', err);
  });

  return promise;
};

Bottle.prototype.HookTraversalStep = function (prefix) {
  var bottle = this;

  return function (data, next, done) {
    var hook = this;
    var path = this.getPath();
    var step = prefix ? prefix + ' ' + path : path;
    var stack = bottle.getMiddlewareStack(step);

    bottle.emit('serve:step:' + step, data, stack);
    bottle.emit('serve:step', data, step, stack);
    hook.runMiddlewareStack(stack, data, next, done);
  };
};

module.exports = Bottle;
