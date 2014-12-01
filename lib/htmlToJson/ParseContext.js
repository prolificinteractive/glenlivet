var util = require('util');
var _ = require('lodash');
var Q = require('Q');
var ObjectMapper = require('../ObjectMapper');

function ParseContext(options) {
  var context = this;

  _.defaults(this, options, {
    $container: null,
    $: null,
    structure: {},
    data: {}
  });

  ObjectMapper.call(this, this.structure, ParseContext.typeHandlers);
}

util.inherits(ParseContext, ObjectMapper);

ParseContext.typeHandlers = {
  'function': function (calc) {
    return calc.call(context, context.$container, context.$, context.data);
  },
  'object': function (calc) {
    var $container = context.$container;
    var $ = context.$;
    var structure = context.structure;
    var data = context.data;

    if (calc.$container) {
      var _$container = $(calc.$container);

      delete calc.$container;

      return new ParseContext({
        $: $,
        $container: _$container,
        structure: calc,
        data: data
      }).parse();
    } else {
      return new ParseContext({
        $: $,
        $container: $container,
        structure: calc,
        data: data
      }).parse();
    }
  },
  'array': function (calc) {
    return context.map(calc[0], calc[1]);
  }
};

ParseContext.prototype.Promise = function (fn) {
  return Q.Promise(fn);
};

ParseContext.prototype.map = function (selector, structure) {
  var deferred = Q.defer();
  var $ = this.$;
  var data = this.data;
  var $els = this.$container.find(selector);
  var arr = [];
  var promises = [];

  $els.each(function (i) {
    var promise = new ParseContext({
      $container: $(this),
      $: $,
      data: data,
      structure: structure
    }).parse();

    promise.then(function (data) {
      arr[i] = data;
    });

    promises.push(promise);
  });

  Q.all(promises).done(function () {
    deferred.resolve(arr);
  }, function (err) {
    deferred.reject(err);
  });

  return deferred.promise;
};

module.exports = ParseContext;
