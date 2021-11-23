const { error } = require('./notices');

/**
 * Error Handler for gulp-plumber
 *
 * @param {Object} err error object.
 */
function plumberErrorHandler(err) {
  // eslint-disable-next-line
  error(err);
  this.emit('end');
}

module.exports = plumberErrorHandler;
