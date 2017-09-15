const express = require('express');
const http = require('http');
const path = require('path');
const config = require('config');
const log = require('lib/log')(module);
const HttpError = require('error').HttpError;
const session = require('express-session');
const logger = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const app = express();

app.set('views', `${__dirname}/template`);

app.set('view engine', 'pug');

if (app.get('env') === 'development') {
  app.use(logger('dev'));
} else {
  app.use(logger('default'));
}

app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieParser());

const sessionStore = require('lib/sessionStore');

app.use(session({
  secret: config.get('session:secret'),
  key: config.get('session:key'),
  cookie: config.get('session:cookie'),
  saveUninitialized: false,
  resave: false,
  store: sessionStore
}));

app.use(require('middleware/sendHttpError'));

app.use(require('middleware/loadUser'));

require('routes')(app);

app.use(express.static(path.join(__dirname, 'public')));

app.use(function(err, req, res, next) {
  if (typeof err === 'number') {
    err = new HttpError(err);
  }

  if (err instanceof HttpError) {
    res.sendHttpError(err);
  } else {
    if (app.get('env') == 'development') {
      express.errorHandler()(err, req, res, next);
    } else {
      log.error(err);
      err = new HttpError(500);
      res.sendHttpError(err);
    }
  }
});

const server = http.createServer(app);

server.listen(config.get('port'), function(){
  log.info('Express server listening on port ' + config.get('port'));
});

const io = require('./socket')(server);
app.set('io', io);