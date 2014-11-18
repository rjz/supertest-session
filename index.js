var _ = require('lodash'),
    cookie = require('cookie'),
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
    var req = request(this.app);
    req = req[meth](route);

    this._before(req);

    req.end = _.wrap(req.end.bind(req), function (end, callback) {
      return end(_.wrap(callback, function (callback, err, res) {
        if (err === null) {
          this._after(req, res);
        }
        return callback(err, res);
      }.bind(this)));
    }.bind(this));

    return req;
  };

  Session.prototype.destroy = function () {
    this._destroy();
  };

  ['get', 'put', 'post', 'del', 'patch'].forEach(function (m) {
    Session.prototype[m] = _.partial(Session.prototype.request, m);
  });

  if (_.isObject(config.helpers)) {
    _.extend(Session.prototype, config.helpers);
  }

  return Session;
};

