var app = require('./app'),
    Session = require('../index')({ app: app });

describe('supertest session', function () {
  before(function (done) {
    this.sess = new Session();

    this.sess.request('get', '/')
      .expect(200)
      .expect('1')
      .end(done);
  });

  it('should increment session counter', function (done) {
    this.sess.request('get', '/')
      .expect(200)
      .expect('2')
      .end(done);
  });

  it('should destroy session', function (done) {
    this.sess.destroy();
    this.sess.request('get', '/')
      .expect(200)
      .expect('1')
      .end(done);
  });
});

