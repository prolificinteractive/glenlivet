var Q = require('q');
var _ = require('lodash');

function ObjectMapper(map, typeHandlers) {
  this.map = map || {};
  this.typeHandlers = _.defaults({}, typeHandlers, ObjectMapper.defaultTypeHandlers);
}

ObjectMapper.defaultTypeHandlers = {
  'string': function (calc, input) {
    return calc;
  },
  'number': function (calc, input) {
    return calc;
  },
  'object': function (calc, input) {
    return calc;
  },
  'array': function (calc, input) {
    return calc;
  },
  'boolean': function (calc, input) {
    return calc;
  },
  'function': function (calc, input) {
    return calc(input);
  },
  'undefined': function () {
    return undefined;
  }
};

ObjectMapper.prototype.parse = function (input, callback) {
  var mapper = this;
  var deferred = Q.defer();
  var typeHandlers = this.typeHandlers;
  var mapType = getType(this.map);
  var output = {};
  var valuePromises = [];

  function getValue(calc) {
    var type = getType(calc);
    var handler = typeHandlers[type];
    var value = handler.call(mapper, calc, input);
    return Q(value);
  }

  function getType(val) {
    return _.isArray(val) ? 'array' : typeof val;
  }

  if (!callback) {
    callback = input;
    input = {};
  }

  if (mapType !== 'object') {
    valuePromises.push(getValue(this.map).then(function (value) {
      output = value;
    }));
  } else {
    _.each(this.map, function (calc, key) {
      var promise = getValue(calc).then(function (value) {
        output[key] = value;
      });

      valuePromises.push(promise);
    });
  }

  if (valuePromises.length === 0) {
    deferred.resolve(output);
  } else {
    Q.all(valuePromises).done(function () {
      deferred.resolve(output);
    }, function (err) {
      deferred.reject(err);
    });
  }

  if (callback) {
    deferred.promise.done(function (output) {
      callback(null, output);
    }, function (err) {
      callback(err, null);
    });
  }

  return deferred.promise;
};

module.exports = ObjectMapper;
