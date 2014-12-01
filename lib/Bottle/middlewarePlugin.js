var Plugin = require('../Plugin');

module.exports = new Plugin('middleware', function (map) {
  this.middleware(map);
});
