var assert = require('assert'),
    http = require('http'),
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

    var sess,
        server = http.createServer(app);

    beforeEach(function (done) {
      server.listen(0, function (err) {
        if (err) {
          return done(err);
        }
        sess = session('http://127.0.0.1:' + server.address().port);
        done();
      });
    });

    afterEach(function (done) {
      server.close(done);
    });

    it('behaves correctly', function (done) {
      sess
        .get('/')
        .expect(200)
        .expect('GET,,1')
        .end(done);
    });
  });

  describe('(#30) requesting URL of instantiated app', function () {
    it('behaves correctly', function (done) {
      var server = http.createServer(app);
      var sess = session(server);
      sess
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

describe('Session with a cookieConfig', function () {
  it('should configure default cookieAccess', function (done) {
    var sess = session(app);

    assert.strictEqual(sess.cookieAccess.domain, '127.0.0.1');
    assert.strictEqual(sess.cookieAccess.path, '/');
    assert.strictEqual(sess.cookieAccess.secure, false);
    assert.strictEqual(sess.cookieAccess.script, false);

    done();
  });

  it('should allow to specify cookieAccess', function (done) {
    var cookieAccess = {
      domain: 'example.com',
      path: '/testpath',
      secure: true,
      script: true,
    };
    var sess = session(app, { cookieAccess: cookieAccess });

    assert.strictEqual(sess.cookieAccess.domain, cookieAccess.domain);
    assert.strictEqual(sess.cookieAccess.path, cookieAccess.path);
    assert.strictEqual(sess.cookieAccess.secure, cookieAccess.secure);
    assert.strictEqual(sess.cookieAccess.script, cookieAccess.script);

    done();
  });
});
