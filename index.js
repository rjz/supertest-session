var _ = require('lodash'),
    cookie = require('cookie'),
    methods = require('methods'),
    request = require('supertest');

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
  return _.compact(Object.keys(c).map(function (k) {
    if (reservedAvs.indexOf(k.toLowerCase()) === -1) {
      return decodeURIComponent(cookie.serialize(k, c[k]));
    }
  }));
}

module.exports = function (config) {

  if (!config) config = {};

  function Session () {
    this.app = config.app;

    if (config.envs && _.isObject(config.envs)) {
      Object.keys(config.envs).forEach(function(e) {
        process.env[e] = config.envs[e];
      });
    }
  }

  Session.prototype._before = function (req) {
    if (this.cookies) {
      req.cookies = this.cookies.map(serializeCookie).join('; ');
    }
    if (config.before) config.before.call(this, req);
  };

  // Extract cookies once request is complete
  Session.prototype._after = function (req, res) {
    if (config.after) config.after.call(this, req, res);
    if (res.headers.hasOwnProperty('set-cookie')) {
      this.cookies = res.headers['set-cookie'].map(cookie.parse);
    }
  };

  Session.prototype._destroy = function () {
    if (config.destroy) config.destroy.call(this);
    this.cookies = null;
  };

  Session.prototype.request = function (meth, route) {
    var req = request(this.app)[meth](route);
    var sess = this;

    var _end = req.end.bind(req);

    this._before(req);

    req.end = function (callback) {
      return _end(function (err, res) {
        if (err === null) {
          sess._after(req, res);
        }
        return callback(err, res);
      });
    };

    return req;
  };

  Session.prototype.destroy = function () {
    this._destroy();
  };

  methods.forEach(function (m) {
    Session.prototype[m] = _.partial(Session.prototype.request, m);
  });

  // Back-compatibility only; will be removed in future version bump.
  Session.prototype.del = Session.prototype.delete;

  if (_.isObject(config.helpers)) {
    _.extend(Session.prototype, config.helpers);
  }

  return Session;
};

