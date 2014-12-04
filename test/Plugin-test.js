var Plugin = require('../lib/Plugin');
var Bottle = require('../lib/Bottle');

describe('Plugin', function () {
  it('automatically loads configuration from bottles based on namespace', function (done) {
    new Bottle({
      test: {
        x: 5
      }
    }).plugins([
      new Plugin('test', function (config) {
        config.x.should.equal(5);
        done();
      })
    ]);
  });

  it('is given the bottle itself as the context', function (done) {
    new Bottle({
      test: {
        x: 5
      }
    }).plugins([
      new Plugin('test', function () {
        this.config.test.x.should.equal(5);
        done();
      })
    ]);
  });

  it('applies config defaults if provided', function (done) {
    new Bottle({
      test: {
        x: 5
      }
    }).plugins([
      new Plugin('test', {
        x: 10,
        y: 15
      }, function (config) {
        config.x.should.equal(5);
        config.y.should.equal(15);
        done();
      })
    ]);
  });
});
