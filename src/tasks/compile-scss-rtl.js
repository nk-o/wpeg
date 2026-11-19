const gulp = require('gulp');
const autoprefixer = require('autoprefixer');
const rtlcss = require('rtlcss');
const gulpLoadPlugins = require('gulp-load-plugins');
// Use Dart Sass https://sass-lang.com/dart-sass.
const sass = require('gulp-sass')(require('sass'));

const plumberErrorHandler = require('../plumber-error-handler');
const generateCSSComments = require('../generate-css-comments');

const $ = gulpLoadPlugins();

module.exports = {
  label: 'SCSS RTL Compiler',
  isAllowed(cfg) {
    return cfg.compile_scss_files_rtl && cfg.compile_scss_files_src && cfg.compile_scss_files_dist;
  },
  fn: (isDev, browserSync) => (cfg) =>
    gulp
      .src(cfg.compile_scss_files_src, { ...cfg.compile_scss_files_src_opts, sourcemaps: isDev })
      .pipe($.plumber({ errorHandler: plumberErrorHandler, inherit: isDev }))

      // SCSS
      .pipe(
        $.sassVariables({
          $rtl: true,
        })
      )
      .pipe(
        sass({
          outputStyle: cfg.compile_scss_files_compress ? 'compressed' : 'expanded',
        }).on('error', sass.logError)
      )

      .pipe(
        $.postcss([
          // Autoprefixer
          autoprefixer(),

          // RTL
          rtlcss(),
        ])
      )

      // Add TOC Comments
      .pipe($.changeFileContent(generateCSSComments))

      // Rename
      .pipe(
        $.if(
          !cfg.compile_scss_files_compress,
          $.rename({
            suffix: '-rtl',
          })
        )
      )
      .pipe(
        $.if(
          cfg.compile_scss_files_compress,
          $.rename({
            suffix: '-rtl.min',
          })
        )
      )

      // Dest
      .pipe(gulp.dest(cfg.compile_scss_files_dist, { sourcemaps: isDev }))

      // Browser Sync
      .pipe(browserSync.stream()),
};
