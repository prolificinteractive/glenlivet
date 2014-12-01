var Q = require('q');
var controller = require('./controller');

describe('glenlivet controller', function () {
  it('takes a function, that takes a request object and returns a promise, and returns express middleware that sends the result of the promise', function (done) {
    var mockRequest = {
      query: {
        foo: 'bar'
      }
    };

    var mockResponse = {
      send: function (data) {
        data.foo.should.equal('bar');
        done();
      }
    };

    var testController = controller(function (req) {
      return Q({
        foo: req.query.foo
      });
    });

    testController(mockRequest, mockResponse);
  });

  it('calls next within the middleware when there is an error', function (done) {
    var ERROR_MESSAGE = 'Error!';

    var testController = controller(function (req) {
      return Q.Promise(function (resolve, reject) {
        reject(new Error(ERROR_MESSAGE));
      });
    });

    testController({}, {}, function (err) {
      err.message.should.equal(ERROR_MESSAGE);
      done();
    });
  });
});
