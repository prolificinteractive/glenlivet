var _ = require('lodash');
var Q = require('q');
var Bottle = require('../lib/Bottle');
var Plugin = require('../lib/Plugin');

describe('Bottle', function () {
  this.timeout(50);

  var hookNames = ['preempt', 'setup', 'process', 'filter', 'persist'];

  it('has default hooks: ' + hookNames.join(', '), function () {
    var bottle = new Bottle();
    _.pluck(bottle._rootHook.children, 'name').join(', ').should.equal(hookNames.join(', '));
  });

  describe('serving', function () {
    it('returns the same data object that was passed in', function (done) {
      new Bottle().serve({ x: 5 }, function (err, data) {
        data.x.should.equal(5);
        done();
      });
    });
  });

  describe('middleware', function () {
    it('runs synchronously against hook paths', function (done) {
      var bottle = new Bottle();
      var history = [];

      bottle.middleware({
        'setup:a': function (data, next) {
          setTimeout(function () {
            history.push('a');
            next();
          }, 10);
        },
        'setup:a:b': function () {
          history.push('b');
        }
      });

      bottle.serve(function () {
        history.join('').should.equal('ab');
        done();
      });
    });

    it('waits for parent hooks to be added if they do not exist yet', function (done) {
      var bottle = new Bottle();

      bottle.middleware('process:a:b', function () {
        done();
      });

      bottle.middleware('process:a', _.noop);

      bottle.serve();
    });

    it('has access to the passed data object', function (done) {
      new Bottle().middleware({
        'process': function (data) {
          data.y = data.x * 10;
        }
      }).serve({ x: 9 }, function (err, data) {
        data.y.should.equal(90);
        done();
      });
    });

    it('respects before and after hook callbacks', function (done) {
      var bottle = new Bottle();
      var history = [];

      bottle.middleware({
        'setup:a': function () {
          history.push('1');
        },
        'after setup:a': function () {
          history.push('2');
        },
        'setup:a:b': function () {
          history.push('3');
        }
      });

      bottle.serve(function () {
        history.join('').should.equal('132');
        done();
      });
    });

    it('can return a promise, which must be resolved for serving to complete', function (done) {
      var bottle = new Bottle();
      var history = [];

      bottle.middleware({
        'setup': function () {
          return Q.delay(5).then(function () {
            history.push('a');
          });
        },
        'process': function () {
          return Q.delay(20).then(function () {
            history.push('b');
          });
        },
        'filter': function () {
          return Q.delay(10).then(function () {
            history.push('c');
          });
        }
      });

      bottle.serve(function (err, data) {
        history.join('').should.equal('acb');
        done();
      });
    });

    it('aborts middleware chain when done is called', function (done) {
      var bottle = new Bottle();
      var history = [];

      bottle.middleware({
        'setup:a': function (data, next, _done) {
          history.push('1');
          _done();
        },
        'after setup:a': function () {
          history.push('2');
        },
        'setup:a:b': function () {
          history.push('3');
        }
      });

      bottle.serve(function () {
        history.join('').should.equal('1');
        done();
      });
    });

    it('returns an error in the callback if passed through done', function (done) {
      var msg = 'Oh no!';

      new Bottle().middleware({
        'preempt': function (data, next, _done) {
          _done(new Error(msg));
        }
      }).serve(function (err, data) {
        err.message.should.equal(msg);
        done();
      });
    });
  });

  describe('creating methods out of bottles', function () {
    describe('.method()', function () {
      it('returns a method that proxies to bottle.serve()', function (done) {
        new Bottle().middleware({
          'preempt': function (data) {
            data.success = true;
          }
        }).method()(function (err, data) {
          if (err) {
            throw err;
          }

          data.success.should.equal(true);
          done();
        });
      });

      it('returns a methods that returns a promise for the passed path', function (done) {
        new Bottle().middleware({
          'preempt': function (data) {
            data.success = true;
          }
        }).method('success')().done(function (success) {
          success.should.equal(true);
          done();
        }, function (err) {
          throw err;
        });
      });
    });
  });
});
