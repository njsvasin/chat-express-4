const log = require('lib/log')(module);
const config = require('config');
const cookieParser = require('cookie-parser');
const async = require('async');
const cookie = require('cookie');
const sessionStore = require('lib/sessionStore');
const HttpError = require('error').HttpError;
const User = require('models/user').User;

function loadSession(sid, callback) {
	sessionStore.load(sid, function (err, session) {
		if (arguments.length === 0) {
			return callback(null, null);
		} else {
			return callback(null, session);
		}
	})
}

function loadUser(session, callback) {
	if (!session.user) {
		log.debug(`Session ${session.id} is anonymous`);
		return callback(null, null);
	}

	log.debug('retrieving user ', session.user);

	User.findById(session.user, (err, user) => {
		if (err) return callback(err);

		if (!user) {
			return callback(null, null);
		}

		log.debug(`user findById result: ${user}`);
		callback(null, user);
	})
}

module.exports = function (server) {
	const io = require('socket.io').listen(server);

	io.use(function (socket, next) {
		const handshake = socket.handshake;

		async.waterfall([
			callback => {
				handshake.cookies = cookie.parse(handshake.headers.cookie || '');
				const sidCookie = handshake.cookies[config.get('session:key')];
				const sid = cookieParser.signedCookie(sidCookie, config.get('session:secret'));

				loadSession(sid, callback);
			},
			(session, callback) => {
				if (!session) {
					callback(new HttpError(401, 'No session'));
				}

				handshake.session = session;
				loadUser(session, callback);
			},
			(user, callback) => {
				if (!user) {
					callback(new HttpError(403, 'Anonymous session may not connect'));
				}

				handshake.user = user;
				callback(null);
			}
		], err => {
			if (!err) {
				return next(null, true);
			}

			if (err instanceof HttpError) {
				return next(null, false);
			}

			next(err);
		});
	});


	io.sockets.on('sessionreload', sid => {
		io.sockets.clients((err, clients) => {
			if (err) {
				console.log(err);
			}

			clients.forEach(clientId => {
				const client = io.sockets.sockets[clientId];

				if (client.handshake.session.sid !== sid) return;

				sessionStore.get(sid, (err, session) => {
					if (err) {
						client.emit('error', 'server error');
						client.disconnect();
						return;
					}

					if (!session) {
						client.emit('logout');
						client.disconnect();
						return;
					}

					client.handshake.session = session;
				});
			});
		});
	});

	io.sockets.on('connection', function (socket) {
		const username = socket.handshake.user.get('username');

		socket.broadcast.emit('join', username);

		socket.on('message', (text, callback) => {
			socket.broadcast.emit('message', username, text);
			callback && callback();
		});

		socket.on('disconnect', () => {
			socket.broadcast.emit('leave', username);
		});
	});

	return io;
};
