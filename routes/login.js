const User = require('models/user').User;
const HttpError = require('error').HttpError;
const AuthError = require('models/user').AuthError;

exports.get = function (req, res) {
	res.render('login');
};

exports.post = function (req, res, next) {
	const username = req.body.username;
	const password = req.body.password;

	User.authorise(username, password, (err, user) => {
		if (err) {
			if (err instanceof AuthError) {
				return next(new HttpError(403, err.message));
			} else {
				return next(err);
			}
		}

		req.session.user = user._id;
		res.send({});
	});

	// async.waterfall([
	//   callback => {
	//     User.findOne({username}, callback)
	//   },
	//   (user, callback) => {
	//     if (user) {
	//       if (user.checkPassword(password)) {
	//         callback(null, user);
	//       } else {
	//         next(new HttpError(403, 'Пароль неверен'));
	//       }
	//     } else {
	//       user = new User({username, password});
	//       user.save()
	//         .then(() => {
	//           callback(null, user);
	//         })
	//         .catch(err => {
	//           return next(err);
	//         });
	//     }
	//   }
	// ], (err, user) => {
	//   if (err) return next(err);
	//   req.session.user = user._id;
	//   res.send({});
	// });

	// User.findOne({username})
	//   .then(user => {
	//     if (user) {
	//       if (user.checkPassword(password)) {
	//         // 200
	//       } else {
	//         // 403
	//       }
	//     } else {
	//       user = new User({username, password});
	//       user.save()
	//         .then(() => {
	//           // 200
	//         })
	//         .catch(err => {
	//           return next(err);
	//         });
	//     }
	//   })
	//   .catch(err => {
	//     return next(err);
	//   });
};
