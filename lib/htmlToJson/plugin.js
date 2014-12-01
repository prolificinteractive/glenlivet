var Plugin = require('../Plugin');
var parse = require('./parse');

var plugin = new Plugin('htmlToJson', function (structure) {
  this.hooks.add([
    'filter:htmlToJson'
  ]);

  this.middleware({
    // Work with request plugin
    'after process:request': function (data) {
      data.html = data.html || data.request.response.body;
    },

    'filter:htmlToJson': function (data, next, done) {
      if (!data.html) {
        var err = new Error('HTML data not found');
        err.type = 'HTML_TO_JSON_NO_HTML';
        next(err);
        return;
      }

      parse(data.html, structure, data, function (err, json) {
        if (err) {
          console.log(err);
          done(err);
          return;
        }

        data.json = json;

        next();
      });
    }
  });
});

module.exports = plugin;
