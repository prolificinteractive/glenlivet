var Barrel = require('../lib/Barrel');
var Plugin = require('../lib/Plugin');

describe('Barrel', function () {
  it('attaches bottles using the .bottle() method', function () {
    var barrel = new Barrel();
    barrel.bottle('search', {
      foo: 'bar'
    });
    barrel.bottles.search.config.foo.should.equal('bar');
  });

  it('automatically adds plugins to bottles', function (done) {
    var plugin = new Plugin('test', function () {
      done();
    });

    new Barrel({
      plugins: [plugin]
    }).bottle('search', {
      test: true
    });
  });

  it('mixes in default plugin configuration', function (done) {
    var plugin = new Plugin('test', function (config) {
      config.x.should.equal(15);
      config.y.should.equal(10);
      done();
    });

    new Barrel({
      plugins: [plugin],
      pluginDefaults: {
        test: {
          x: 5,
          y: 10
        }
      }
    }).bottle('search', {
      test: {
        x: 15
      }
    });
  });

  it('replaces "true" plugin configuration value with defaults', function (done) {
    var plugin = new Plugin('test', function (config) {
      config.x.should.equal(5);
      done();
    });

    new Barrel({
      plugins: [plugin],
      pluginDefaults: {
        test: {
          x: 5
        }
      }
    }).bottle('search', {
      test: true
    });
  });

  describe('eachBottle()', function () {
    it('returns every bottle added before and in the future', function (done) {
      var barrel = new Barrel();
      var history = [];

      barrel.bottle('a');

      barrel.eachBottle(function (bottle, name) {
        history.push(name);
      });

      barrel.bottle('b');

      history.join('').should.equal('ab');
      done();
    });
  });
});
