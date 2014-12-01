var _ = require('lodash');
var Plugin = require('../Plugin');

function extractor(namesapce, map) {
  return new Plugin(namespace, function () {
    this.middleware('before setup', function (data) {
      var obj = data[namespace] = {};

      _.each(map, function (calc, key) {
        var value;

        if (typeof calc === 'function') {
          value = calc(data.router.req);
        } else if (typeof calc === 'string') {
          value = data.router.req;

          _.each(calc.split('.'), function (part) {
            value = value[part];
          });
        }

        obj[key] = value;
      });
    });
  });
}

module.exports = extractor;
