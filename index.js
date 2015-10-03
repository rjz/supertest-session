var assign = require('object-assign'),
    cookie = require('cookie'),
    methods = require('methods'),
    request = require('supertest'),
    util = require('util');

// A/V pairs defined for Set-Cookie in RFC-6265
var reservedAvs = [
  'path',
  'expires',
  'max-age',
  'domain',
  'secure',
  'httponly'
];

function serializeCookie (c) {
  return Object.keys(c).reduce(function (pairs, key) {
    var isReserved = reservedAvs.indexOf(key.toLowerCase()) === -1;
    if (isReserved) {
      return pairs.concat(decodeURIComponent(cookie.serialize(key, c[key])));
    }
    return pairs;
  }, []);
}

function Session (app, options) {

  if (!app) {
    throw new Error('Session requires an `app`');
  }

  this.app = app;
  this.options = options || {};

  if (this.options.helpers instanceof Object) {
    assign(this, this.options.helpers);
  }
}

Session.prototype._before = function (req) {
  if (this.cookies) {
    req.cookies = this.cookies.map(serializeCookie).join('; ');
  }

  if (this.options.before) {
    this.options.before.call(this, req);
  }
};

// Extract cookies once request is complete
Session.prototype._after = function (req, res) {
  if (this.options.after) {
    this.options.after.call(this, req, res);
  }

  if (res.headers.hasOwnProperty('set-cookie')) {
    this.cookies = res.headers['set-cookie'].map(cookie.parse);
  }
};

Session.prototype.destroy = function () {
  if (this.options.destroy) {
    this.options.destroy.call(this);
  }
  this.cookies = null;
};

Session.prototype.request = function (meth, route) {
  var req = request(this.app)[meth](route);
  var sess = this;
  var _end = req.end.bind(req);

  this._before(req);

  req.end = function (callback) {
    return _end(function (err, res) {
      if (err === null) sess._after(req, res);
      return callback(err, res);
    });
  };

  return req;
};

methods.forEach(function (m) {
  Session.prototype[m] = function () {
    var args = [].slice.call(arguments);
    return this.request.apply(this, [m].concat(args));
  };
});

Session.prototype.del = util.deprecate(Session.prototype.delete,
  'supertest-session: Session.del is deprecated; please use Session.delete');

function legacySession (config) {

  if (!config) config = {};

  // Bind session to `config`
  function LegacySession () {
    Session.call(this, config.app, config);
  }

  util.inherits(LegacySession, Session);
  assign(LegacySession.prototype, {}, config.helpers);

  return LegacySession;
}

var deprecatedLegacySession = util.deprecate(legacySession,
  'supertest-session: module configuration will be removed in next version.');

module.exports = function (app, options) {
  if (typeof app != 'function') {
    return deprecatedLegacySession(app);
  }

  return new Session(app, options);
};

