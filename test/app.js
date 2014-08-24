var connect = require('connect');

var app = module.exports = connect();

app.use(connect.cookieParser());
app.use(connect.cookieSession({ secret: 'not-very' }));

function counter (req, res, next) {
  var count = req.session.count || 0;
  req.session.count = count + 1;
  next();
}

var _sessions = {};

function tokenSession (req, res, next) {
  var token;

  if (req.headers.authorization) {
    token = req.headers.authorization.split(' ').pop();
    req.session = _sessions[token] || { count: 0, type: 'token' };
    _sessions[token] = req.session;
  }

  next();
}

app.use(tokenSession);
app.use(counter);

app.use(function (req, res) {
  res.statusCode = 200;

  if (req.url === '/env') {
    res.end(JSON.stringify(process.env));
  }
  else {
    res.end([req.method, req.session.type, req.session.count].join(','));
  }
});

