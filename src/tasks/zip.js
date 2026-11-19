const gulp = require('gulp');
const gulpLoadPlugins = require('gulp-load-plugins');

const plumberErrorHandler = require('../plumber-error-handler');

const $ = gulpLoadPlugins();

module.exports = {
  label: 'ZIP Files',
  isAllowed(cfg) {
    return cfg.zip_files && cfg.zip_files && cfg.zip_files.length;
  },
  fn: (isDev) => (cfg, done) => {
    const zipTasks = cfg.zip_files.map(
      (zipData) =>
        function (cb) {
          if (!zipData.src || !zipData.dist) {
            cb();
            return null;
          }

          const pathAndName = zipData.dist.match(/^(.*)[\\/](.*)/);

          if (!pathAndName || pathAndName.length !== 3) {
            cb();
            return null;
          }

          const zipDist = pathAndName[1];
          const zipName = pathAndName[2];

          return gulp
            .src(zipData.src, {
              nodir: true,
              ...(zipData.src_opts || {}),
            })
            .pipe($.plumber({ errorHandler: plumberErrorHandler, inherit: isDev }))
            .pipe($.zip(zipName))
            .pipe(gulp.dest(zipDist));
        }
    );

    return gulp.series(...zipTasks)(done);
  },
};
