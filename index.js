var assign = require('object-assign'),
    methods = require('methods'),
    supertest = require('supertest'),
    util = require('util'),
    http = require('http'),
    https = require('https'),
    CookieAccess = require('cookiejar').CookieAccessInfo,
    parse = require('url').parse;

function Session (app, options) {

  // istanbul ignore if
  if (!app) {
    throw new Error('Session requires an `app`');
  }

  var url = app;

  this.agent = supertest.agent(this.app, this.options);

  if (typeof app === 'function') {
    app = http.createServer(app);
  }

  if (app instanceof http.Server || app instanceof https.Server) {
    url = supertest.Test.prototype.serverAddress(app, '/');
  }

  this.app = app;
  this.url = parse(url);

  this.options = options || {};
  this.reset();

  if (this.options.helpers instanceof Object) {
    assign(this, this.options.helpers);
  }
}

Object.defineProperty(Session.prototype, 'cookies', {
  get: function () {
    return this.agent.jar.getCookies(this.cookieAccess);
  }
});

Session.prototype.reset = function () {

  var cookieAccessOptions, domain, path, secure, script;

  // Unset supertest-session options before forwarding options to superagent.
  var agentOptions = assign({}, this.options, {
    before: undefined,
    cookieAccess: undefined,
    destroy: undefined,
    helpers: undefined
  });

  this.agent = supertest.agent(this.app, agentOptions);

  cookieAccessOptions = this.options.cookieAccess || {};
  domain = cookieAccessOptions.domain || this.url.hostname;
  path = cookieAccessOptions.path || this.url.path;
  secure = !!cookieAccessOptions.secure || 'https:' == this.url.protocol;
  script = !!cookieAccessOptions.script || false;
  this.cookieAccess = CookieAccess(domain, path, secure, script);
};

Session.prototype.destroy = function () {
  if (this.options.destroy) {
    this.options.destroy.call(this);
  }

  this.reset();
};

Session.prototype.request = function (meth, route) {
  var test = this.agent[meth](route);

  if (this.options.before) {
    this.options.before.call(this, test);
  }

  return test;
};

methods.forEach(function (m) {
  Session.prototype[m] = function () {
    var args = [].slice.call(arguments);
    return this.request.apply(this, [m].concat(args));
  };
});

Session.prototype.del = util.deprecate(Session.prototype.delete,
  'supertest-session: Session.del is deprecated; please use Session.delete');

module.exports = function (app, options) {
  return new Session(app, options);
};
