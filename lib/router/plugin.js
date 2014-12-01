var express = require('express');
var _ = require('lodash');
var Plugin = require('../Plugin');

function router(options) {
  options = _.defaults({}, options, {
    mount: null,
    method: 'get',
    route: '/',
    middleware: [],
    extract: function (req) {
      return {};
    },
    respond: function (err, data, req, resp) {
      resp.send(err || data.json);
    }
  });

  var bottle = this;
  var method = options.method.toLowerCase();

  function mount(app) {
    app.use(bottle.router);
  }

  _.extend(bottle, {
    router: express.Router(),
    mount: mount
  });

  if (options.mount) {
    this.mount(options.mount);
  }

  this.router[method](options.route, options.middleware, function (req, resp) {
    var data = {
      router: {
        req: req,
        resp: resp
      }
    };

    _.extend(data, options.extract(req));

    bottle.serve(data, function (err, data) {
      options.respond(err, data, req, resp);
    });
  });
}

module.exports = new Plugin('router', router);
