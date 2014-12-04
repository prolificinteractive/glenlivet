var Q = require('q');
var Hook = require('../lib/Hook');

describe('Hook', function () {

  describe('adding subhooks with .add()', function () {
    it('takes a string or array of hook names as an argument', function () {
      var hook = new Hook();
      hook.add('a');
      hook.add(['a:b', 'a:c']);
      hook.children[0].children[1].name.should.equal('c');
    });

    it('inserts the hook at the end of the path', function () {
      var hook = new Hook();
      hook.add(['a', 'a:b', 'a:b:c']);
      hook.children[0].children[0].children[0].name.should.equal('c');
    });

    it('waits for an ancestors to be added if they do not exist yet', function () {
      var hook = new Hook();
      hook.add('a:b');
      hook.add('a');
      hook.children[0].children[0].name.should.equal('b');
    });
  });

  describe('finding hooks with .find()', function () {
    it('takes a path and returns a descendant hook', function () {
      var hook = new Hook();
      hook.add('a');
      hook.add('a:b');
      hook.find('a:b').name.should.equal('b');
    });
  });

  it('returns its path with .getPath()', function () {
    var hook = new Hook();
    hook.add(['a', 'a:b', 'a:b:c']);
    hook.children[0].children[0].children[0].getPath().should.equal('a:b:c');
  });

  describe('adding subhooks with .insertWithin()', function () {
    it('takes a string as an argument', function () {
      var hook = new Hook();
      hook.insertWithin('foo');
      hook.children[0].name.should.equal('foo');
    });

    it('takes an array of hook names as an argument', function () {
      var hook = new Hook();
      hook.insertWithin(['foo', 'bar']);
      hook.children[0].name.should.equal('foo');
      hook.children[1].name.should.equal('bar');
    });

    it('takes an array of hook names as an argument', function () {
      var hook = new Hook();
      hook.insertWithin(['foo', 'bar']);
      hook.children[0].name.should.equal('foo');
      hook.children[1].name.should.equal('bar');
    });

    it('inserts hooks after existing children by default', function () {
      var hook = new Hook();
      hook.insertWithin('foo');
      hook.insertWithin(['bar1', 'bar2']);
      hook.insertWithin('bar3');
      hook.children[0].name.should.equal('foo');
      hook.children[1].name.should.equal('bar1');
      hook.children[2].name.should.equal('bar2');
      hook.children[3].name.should.equal('bar3');
    });

    it('inserts hooks at an index if specified', function () {
      var hook = new Hook();
      hook.insertWithin('foo');
      hook.insertWithin('bar1', 0);
      hook.insertWithin(['bar2', 'bar3'], 0);
      hook.children[0].name.should.equal('bar2');
      hook.children[1].name.should.equal('bar3');
      hook.children[2].name.should.equal('bar1');
      hook.children[3].name.should.equal('foo');
    });

    it('propagates a "subhook" event up the hook hierarchy', function (done) {
      var hook = new Hook();
      var promises = [];

      promises.push(Q.Promise(function (resolve, reject) {
        hook.once('subhook:foo', resolve);
      }));

      hook.insertWithin('foo');

      promises.push(Q.Promise(function (resolve, reject) {
        hook.once('subhook:foo:bar', resolve);
      }));

      promises.push(Q.Promise(function (resolve, reject) {
        hook.children[0].once('subhook:bar', resolve);
      }));

      hook.children[0].insertWithin('bar');

      Q.all(promises).done(function () {
        done();
      });
    });
  });

  describe('running middleware stacks', function () {
    var hook = new Hook();
    hook.insertWithin(['a', 'b']);
    hook.children[0].insertWithin(['c', 'd']);
    hook.children[1].insertWithin('e');
  });

  describe('traversing hook hierarchies', function () {
    var hook = new Hook();
    hook.insertWithin(['a', 'b']);
    hook.children[0].insertWithin(['c', 'd']);
    hook.children[1].insertWithin('e');

    it('recursively traverses into children first, siblings second', function (done) {
      var history = [];

      hook.traverse({
        each: function () {
          history.push(this.name);
        }
      }, null, function () {
        history.join('  ').should.equal('a  c  d  b  e');
        done();
      });
    });

    it('runs "before" middleware', function (done) {
      var history = [];

      hook.traverse({
        before: function () {
          history.push('Bef:' + this.name);
        },
        each: function () {
          history.push(this.name);
        }
      }, null, function () {
        history.join('  ').should.equal('Bef:a  a  Bef:c  c  Bef:d  d  Bef:b  b  Bef:e  e');
        done();
      });
    });

    it('runs "after" middleware after all children have been traversed', function (done) {
      var history = [];

      hook.traverse({
        after: function () {
          history.push('A:' + this.name);
        },
        each: function () {
          history.push(this.name);
        }
      }, null, function () {
        history.join('  ').should.equal('a  c  A:c  d  A:d  A:a  b  e  A:e  A:b');
        done();
      });
    });
  });

  describe('running middleware stacks', function () {
    var hook = new Hook();
    hook.insertWithin('a');
    hook.children[0].insertWithin(['b', 'c']);

    it('runs the stack of functions synchronously against the hook', function (done) {
      var history = [];

      hook.children[0].runMiddlewareStack([
        function (data, next) {
          setTimeout(function () {
            history.push('foo');
            next();
          }, 5);
        },
        function () {
          history.push('bar');
        }
      ], null, function () {
        history.join('').should.equal('foobar');
        done();
      });
    });

    it('aborts the middleware chain if done() is called', function (done) {
      hook.children[0].runMiddlewareStack([
        function (data, next, _done) {
          _done();
        },
        function () {
          throw new Error('this function should not run');
        }
      ], null, done);
    });

    it('sets the hook as the context within the middleware callback', function (done) {
      hook.children[0].runMiddlewareStack([
        function () {
          this.name.should.equal('a');
        }
      ], null, done);
    });
  });
});
