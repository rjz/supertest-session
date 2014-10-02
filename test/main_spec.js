var _ = require('lodash'),
    tr = require('through'),
    assert = require('assert'),
    app = require('./app'),
    session = require('../index');

describe('supertest session', function () {

  var Session = session({
    app: app,
    envs: { NODE_ENV: 'development'}
  });

  before(function (done) {
    this.sess = new Session();
    this.sess.request('get', '/')
      .expect(200)
      .expect('GET,,1')
      .end(done);
  });

  it('should increment session counter', function (done) {
    this.sess.request('get', '/')
      .expect(200)
      .expect('GET,,2')
      .end(done);
  });

  it('should set enviromental variables', function(done) {
    this.sess.request('get', '/env')
      .expect(200)
      .end(function(err, res) {
        assert.equal(err, undefined);
        assert.equal(JSON.parse(res.text).NODE_ENV, 'development');
        done();
      });
  });

  it('should destroy session', function (done) {
    this.sess.destroy();
    this.sess.get('/')
      .expect(200)
      .expect('GET,,1')
      .end(done);
  });

  it('supports streaming', function (done) {
    var sess = new Session();
    sess.get('/')
      .pipe(tr(function (data) {
        assert.equal(data.toString('utf8'), 'GET,,1');
      }, done));
  });

  describe('method sugar', function () {
    var count = 1,
        methods = {
          'del'   : 'DELETE',
          'get'   : 'GET',
          'post'  : 'POST',
          'put'   : 'PUT',
          'patch' : 'PATCH'
        };

    _.each(methods, function (v, m) {
      it('should support ' + m, function (done) {
        this.sess[m]('/')
          .expect(200)
          .expect([v, '', ++count].join(','))
          .end(done);
      });
    });
  });
});

describe('Session with a .before hook', function () {

  var Session = session({
    app: app,
    before: function (req) {
      req.set('authorization', 'bearer TEST_SESSION_TOKEN');
    }
  });

  before(function (done) {
    this.sess = new Session();
    this.sess.request('get', '/token')
      .expect(200)
      .expect('GET,token,1')
      .end(done);
  });

  it('should increment session counter', function (done) {
    this.sess.request('get', '/token')
      .expect(200)
      .expect('GET,token,2')
      .end(done);
  });
});

