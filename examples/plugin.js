var htmlToJson = require('htmlToJson');
var glenlivet = reuqire('glenlivet');

module.exports = glenlivet.createPlugin('htmlToJson', function (filter) {
  this.middleware('filter:htmlToJson', function (data, next, done) {
    htmlToJson
    .parse(data.html, filter)
    .done(function (json) {
      data.json = json;
      next();
    }, done);
  });
});
