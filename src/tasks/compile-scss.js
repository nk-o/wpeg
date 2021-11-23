const gulp = require('gulp');
const autoprefixer = require('autoprefixer');
const gulpLoadPlugins = require('gulp-load-plugins');
// Use Dart Sass https://sass-lang.com/dart-sass.
const sass = require('gulp-sass')(require('sass'));

const plumberErrorHandler = require('../plumber-error-handler');
const generateCSSComments = require('../generate-css-comments');

const $ = gulpLoadPlugins();

module.exports = {
  label: 'SCSS Compiler',
  isAllowed(cfg) {
    return cfg.compile_scss_files_src && cfg.compile_scss_files_dist;
  },
  fn: (isDev, browserSync) => (cfg) =>
    gulp
      .src(cfg.compile_scss_files_src, cfg.compile_scss_files_src_opts)
      .pipe($.plumber({ errorHandler: plumberErrorHandler, inherit: isDev }))

      // Sourcemaps Init
      .pipe($.if(isDev, $.sourcemaps.init()))

      // SCSS
      .pipe(
        $.sassVariables({
          $rtl: false,
        })
      )
      .pipe(
        sass({
          outputStyle: cfg.compile_scss_files_compress ? 'compressed' : 'expanded',
        }).on('error', sass.logError)
      )

      // Autoprefixer
      .pipe($.postcss([autoprefixer()]))

      // Add TOC Comments
      .pipe($.changeFileContent(generateCSSComments))

      // Rename
      .pipe(
        $.if(
          cfg.compile_scss_files_compress,
          $.rename({
            suffix: '.min',
          })
        )
      )

      // Sourcemaps
      .pipe($.if(isDev, $.sourcemaps.write()))

      // Dest
      .pipe(gulp.dest(cfg.compile_scss_files_dist))

      // Browser Sync
      .pipe(browserSync.stream()),
};
