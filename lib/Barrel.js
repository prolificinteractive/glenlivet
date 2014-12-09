var util = require('util');
var path = require('path');
var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var Bottle = require('./Bottle');
var dir = __dirname;

function Barrel(options) {
  EventEmitter.call(this);

  var barrel = this;

  options = options || {};

  this.pluginDefaults = options.pluginDefaults || {};
  this.plugins = options.plugins || [];
  this.bottles = {};

  this.eachBottle(function (bottle, name) {
    bottle.on('serve:done', function (err, data) {
      barrel.emit('bottle:serve:done', bottle, name, err, data);
    });

    bottle.on('middleware:run', function (data, middleware) {
      barrel.emit('bottle:middleware:run', bottle, data, middleware);
    });
  });
}

util.inherits(Barrel, EventEmitter);

Barrel.prototype.eachBottle = function (callback) {
  _.each(this.bottles, callback, this);
  this.on('bottle:add', callback);
  return this;
};

Barrel.prototype.bottle = function (name, config) {
  var bottle = this.bottles[name] = new Bottle(config);

  // Add a convenience method to run bottle
  this[name] = bottle.method();

  _.each(config, function (pluginConfig, key) {
    var defaults = this.pluginDefaults[key];

    if (defaults) {
      // If config is an object, mix in defaults
      if (_.isObject(pluginConfig)) {
        _.defaults(pluginConfig, defaults);
      }

      //If config is set to true, directly assign defaults
      else if (pluginConfig === true) {
        config[key] = defaults;
      }
    }
  }, this);

  bottle.plugins(this.plugins);

  this.emit('bottle:add', bottle, name);

  return bottle;
};

module.exports = Barrel;
