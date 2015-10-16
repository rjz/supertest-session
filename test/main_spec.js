var assert = require('assert'),
    app = require('./app'),
    session = require('../index');

function isTestCookie (c) {
  return c.name === 'supertest-session';
}

describe('supertest-session', function () {

  var sess = null;

  beforeEach(function (done) {
    sess = session(app);
    sess.request('get', '/')
      .expect(200)
      .expect('GET,,1')
      .end(done);
  });

  it('should increment session counter', function (done) {
    sess.request('get', '/')
      .expect(200)
      .expect('GET,,2')
      .end(done);
  });

  it('should expose cookies', function () {
    expect(sess.cookies.some(isTestCookie)).toBeTruthy();
  });

  it('should destroy session', function (done) {
    sess.destroy();
    sess.get('/')
      .expect(200)
      .expect('GET,,1')
      .end(done);
  });

  describe('method sugar', function () {
    var methods = {
      'del'   : 'DELETE',
      'get'   : 'GET',
      'post'  : 'POST',
      'put'   : 'PUT',
      'patch' : 'PATCH'
    };

    Object.keys(methods).forEach(function (key) {
      it('should support ' + key, function (done) {
        sess[key]('/')
          .expect(200)
          .expect(methods[key] + ',,2')
          .end(done);
      });
    });
  });

  describe('(#16) requesting URL of existing app', function () {

    var serverUrl, test;

    beforeEach(function () {
      // use supertest to set up the app.js server, returning a `Test` instance
      test = session(app).request('get', '');

      // obtain the running server's URL
      serverUrl = test.url;
    });

    afterEach(function (done) {
      test.end(done);
    });

    it('behaves correctly', function (done) {
      sess = session(serverUrl)
        .get('/')
        .expect(200)
        .expect('GET,,1')
        .end(done);
    });
  });
});

describe('Session with a .before hook', function () {

  var sess = null;

  beforeEach(function (done) {
    sess = session(app, {
      before: function (req) {
        req.set('authorization', 'bearer TEST_SESSION_TOKEN');
      }
    });

    sess.request('get', '/token')
      .expect(200)
      .expect('GET,token,1')
      .end(done);
  });

  it('should increment session counter', function (done) {
    sess.request('get', '/token')
      .expect(200)
      .expect('GET,token,2')
      .end(done);
  });
});

