var util = require('util');
var path = require('path');
var fs = require('fs');
var EventEmitter2 = require('eventemitter2').EventEmitter2;
var _ = require('lodash');
var express = require('express');
var jade = require('jade');
var Bottle = require('../Bottle');
var dir = __dirname;

function Barrel(options) {
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

util.inherits(Barrel, EventEmitter2);

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

Barrel.prototype.bottleRouter = function () {
  var router = express.Router();
  var barrel = this;
  var directoryFile = path.resolve(dir, 'views/bottle-directory.jade');

  this.eachBottle(function (name, bottle) {
    router.get(new RegExp('/' + name + '\\.(.+)'), function (req, resp, next) {
      bottle.serve(req.query, function (err, data) {
        if (err) {
          next(err);
          return;
        }

        var obj = data;
        var parts = req.params[0].split('.');
        var part;

        while (obj && (part = parts.shift())) {
          obj = obj[part];
        }

        resp.send(obj);
      });
    });
  });

  router.get('/', function (req, resp, next) {
    var objects = [];

    _.each(barrel.bottles, function (bottle, name) {
      objects.push({
        name: name,
        bottle: bottle,
        configKeys: _.keys(bottle.config)
      });
    });

    fs.readFile(directoryFile, 'utf8', function (err, raw) {
      if (err) {
        next(err);
        return;
      }

      var html = jade.compile(raw, {
        compileDebug: true,
        filename: directoryFile,
        pretty: true
      })({
        objects: objects
      });

      resp.send(html);
    });
  });

  return router;
};

module.exports = Barrel;
