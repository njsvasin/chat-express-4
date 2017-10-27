const winston = require('winston');
const path = require('path');
const appDir = path.dirname(require.main.filename);

const ENV = process.env.NODE_ENV || 'development';

function getLogger(module) {

	const moduleNameRelative = '/' + path.relative(appDir, module.filename);

	return new winston.Logger({
		transports: [
			new winston.transports.Console({
				colorize: true,
				level: (ENV === 'development') ? 'debug' : 'error',
				label: moduleNameRelative
			})
		]
	});
}

module.exports = getLogger;