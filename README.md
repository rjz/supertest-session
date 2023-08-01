# Supertest sessions

Session wrapper around supertest.

[![Coverage
Status](https://coveralls.io/repos/rjz/supertest-session/badge.png)](https://coveralls.io/r/rjz/supertest-session)

References:

  * https://gist.github.com/joaoneto/5152248
  * https://github.com/visionmedia/supertest/issues/46
  * https://github.com/visionmedia/supertest/issues/26

## Installation

    $ npm install --save-dev supertest supertest-session

## Test

    $ npm test

## Usage

Require `supertest-session` and pass in the test application:

```js
var session = require('supertest-session');
var myApp = require('../../path/to/app');

var testSession = null;

beforeEach(function () {
  testSession = session(myApp);
});
```

And set some expectations:

```js
it('should fail accessing a restricted page', function (done) {
  testSession.get('/restricted')
    .expect(401)
    .end(done)
});

it('should sign in', function (done) {
  testSession.post('/signin')
    .send({ username: 'foo', password: 'password' })
    .expect(200)
    .end(done);
});
```

You can set preconditions:

```js
describe('after authenticating session', function () {

  var authenticatedSession;

  beforeEach(function (done) {
    testSession.post('/signin')
      .send({ username: 'foo', password: 'password' })
      .expect(200)
      .end(function (err) {
        if (err) return done(err);
        authenticatedSession = testSession;
        return done();
      });
  });

  it('should get a restricted page', function (done) {
    authenticatedSession.get('/restricted')
      .expect(200)
      .end(done)
  });

});

```

### Accessing cookies

The cookies attached to the session may be retrieved from `session.cookies`:

```js
var sessionCookie = testSession.cookies.find(function (cookie) {
  return cookie.name === connect.sid;
});
```

If you're using

### Request hooks

By default, supertest-session authenticates using session cookies. If your app
uses a custom strategy to restore sessions, you can provide `before` and `after`
hooks to adjust the request and inspect the response:

```js
var testSession = session(myApp, {
  before: function (req) {
    req.set('authorization', 'Basic aGVsbG86d29ybGQK');
  }
});
```

### Cookie Jar Access Options

By default supertest-session will derive the CookieAccessInfo config of the cookie jar from the
agent configuration. There might be cases where you want to override this, e.g. if you're testing
a service which is configured to run behind a proxy but which [sets secure
cookies](https://expressjs.com/en/api.html#req.secure). To have supertest-session expose these
secure cookies you can provide an override config to the internal call to
[CookieAccessInfo](https://github.com/bmeck/node-cookiejar#cookieaccessinfodomainpathsecurescript):

```js
var cookieAccess = {
  domain: 'example.com',
  path: '/testpath',
  secure: true,
  script: true,
};
var testSession = session(myApp, { cookieAccess: cookieAccess });
```

By default the underlying `supertest` agent will still determine the CookieAccessInfo from the URL.
If you want supertest-session to instead send cookies according to this `cookieAccess` config you
can make use of the `before` hook:

```js
var cookieAccess = {
  domain: 'example.com',
  path: '/testpath',
  secure: true,
  script: true,
};
var testSession = session(myApp, {
  cookieAccess: cookieAccess,
  before: function (req) {
    req.cookies = this.cookies.toValueString();
  },
});
```

## License

MIT

