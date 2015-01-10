var util = require('util');
var path = require('path');
var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var Bottle = require('./Bottle');
var dir = __dirname;

function Barrel(options) {
  options = options || {};

  EventEmitter.call(this);

  var barrel = this;

  this.pluginDefaults = options.pluginDefaults || {};
  this.plugins = options.plugins || [];
  this.middleware = options.middleware || {};
  this.bottles = {};
  this._privateBottles = [];

  this.eachBottle(function (bottle, name) {
    bottle.middleware(barrel.middleware);

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
  var bottles = _.values(this.bottles).concat(this._privateBottles);

  _.each(bottles, function (bottle) {
    callback(bottle, bottle.name);
  }, this);

  this.on('bottle:add', function (bottle) {
    callback(bottle, bottle.name);
  });

  return this;
};

Barrel.prototype.bottle = function (name, config) {
  if (!config) {
    config = name;
    name = null;
  }

  var bottle = new Bottle(config);

  bottle.name = name;

  if (name) {
    this.bottles[name] = bottle;

    // Add a convenience method to run bottle
    this[name] = bottle.method();
  } else {
    // Add to private bottles so .eachBottle can use it
    this._privateBottles.push(bottle);
  }

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

  this.emit('bottle:add', bottle);

  return bottle;
};

module.exports = Barrel;
