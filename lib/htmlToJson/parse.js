var cheerio = require('cheerio');
var ParseContext = require('./ParseContext');

function parse(html, structure, data, callback) {
  var $ = cheerio.load(html);

  if (!callback) {
    callback = data;
    data = {};
  }

  return new ParseContext({
    $: $,
    $container: $.root(),
    structure: structure,
    data: data
  }).parse().done(function (data) {
    callback(null, data);
  }, function (err) {
    callback(err, null);
  });
}

module.exports = parse;
