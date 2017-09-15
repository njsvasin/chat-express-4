const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const config = require('config');

mongoose.connect(config.get('mongoose:uri'), config.get('mongoose:options'));

module.exports = mongoose;
