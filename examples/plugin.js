var glenlivet = require('../lib/glenlivet');
var htmlToJson = require('htmlToJson');

module.exports = glenlivet.createPlugin('htmlToJson', function (config) {
  this.hooks.add(['filter:htmlToJson']);

  this.middleware({
    'filter:htmlToJson': function (data) {
      this.set('json', function () {
        return htmlToJson.parse(data.html);
      });
    }
  });
});
