var _ = require('lodash'),
    cookie = require('cookie'),
    request = require('supertest');

function serializeCookie (c) {
  return _.compact(_.map(c, function (v, k) {
    if (k.toLowerCase() !== 'path') {
      return decodeURIComponent(cookie.serialize(k, v));
    }
  }));
}

module.exports = function (config) {

  if (!config) config = {};

  function Session () {
    this.app = config.app;

    if (config.envs && _.isObject(config.envs)) {
      _.each(Object.keys(config.envs), function(e) {
        process.env[e] = config.envs[e];
      });
    }
  }

  Session.prototype._before = function (req) {
    req.cookies = _.map(this.cookies, serializeCookie).join('; ');
    if (config.before) config.before.call(this, req);
  };

  // Extract cookies once request is complete
  Session.prototype._after = function (req, res) {
    if (config.after) config.after.call(this, req, res);
    if (_.has(res.headers, 'set-cookie')) {
      this.cookies = _.map(res.headers['set-cookie'], cookie.parse);
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

    req.end = _.wrap(_.bind(req.end, req), function (end, callback) {
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

  _.each(['get','put','post','del'], function (m) {
    Session.prototype[m] = _.partial(Session.prototype.request, m);
  });

  if (_.isObject(config.helpers)) {
    _.extend(Session.prototype, config.helpers);
  }

  return Session;
};

