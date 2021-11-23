const gulp = require('gulp');
const gulpLoadPlugins = require('gulp-load-plugins');

const plumberErrorHandler = require('../plumber-error-handler');

const $ = gulpLoadPlugins();

module.exports = {
  label: 'Correct line endings for non UNIX systems',
  isAllowed(cfg) {
    return cfg.correct_line_endings_files_src && cfg.correct_line_endings_files_dist;
  },
  fn: (isDev) => (cfg) =>
    gulp
      .src(cfg.correct_line_endings_files_src, cfg.correct_line_endings_files_src_opts)
      .pipe($.plumber({ errorHandler: plumberErrorHandler, inherit: isDev }))
      .pipe($.if(isDev, $.changed(cfg.correct_line_endings_files_src)))
      .pipe($.lineEndingCorrector())
      .pipe(gulp.dest(cfg.correct_line_endings_files_dist)),
};
