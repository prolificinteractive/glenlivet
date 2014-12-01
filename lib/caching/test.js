var MemoryCache = require('./MemoryCache');

function runSuite(cache) {
  var BUCKET = 'bucket';
  var ID = 'id';
  var VALUE = 'value';

  function Cache() {
    return new CacheClass(options);
  }

  describe('saving and loading', function () {
    it('returns null when an entry does not exist', function (done) {
      cache.load(BUCKET, ID, function (err, value) {
        (value === null).should.equal(true);
        done();
      });
    });

    it('implements callbacks', function (done) {
      cache.save(BUCKET, ID, VALUE, function () {
        cache.load(BUCKET, ID, function (err, value) {
          if (err) {
            throw err;
          }

          value.should.equal(VALUE);

          done();
        });
      });
    });

    it('implements promises', function (done) {
      cache
        .save(BUCKET, ID, VALUE)
        .then(function () {
          return cache.load(BUCKET, ID);
        })
        .done(function (value) {
          value.should.equal(VALUE);
          done();
        }, function (err) {
          throw err;
        });
    });

    afterEach(function (done) {
      cache.erase(BUCKET, ID, done);
    });
  });

  describe('erasing', function () {
    it('implements callbacks', function (done) {
      cache.save(BUCKET, ID, VALUE, function () {
        cache.load(BUCKET, ID, function (err, value) {
          value.should.equal(VALUE);
          cache.erase(BUCKET, ID, function () {
            cache.load(BUCKET, ID, function (err, value) {
              if (err) {
                throw err;
              }

              (value === null).should.equal(true);

              done();
            });
          });
        });
      });
    });

    it('implements promises', function (done) {
      cache
        .save(BUCKET, ID, VALUE)
        .then(function () {
          return cache.load(BUCKET, ID);
        })
        .then(function (value) {
          value.should.equal(VALUE);
          return cache.erase(BUCKET, ID);
        })
        .then(function () {
          return cache.load(BUCKET, ID);
        })
        .done(function (value) {
          (value === null).should.equal(true);
          done();
        }, function (err) {
          throw err;
        });
    });
  });
}

runSuite(new MemoryCache());
