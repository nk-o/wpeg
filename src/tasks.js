const gulp = require('gulp');
const Spinnies = require('spinnies');
const chalk = require('chalk');
const prettyHrtime = require('pretty-hrtime');
const browserSync = require('browser-sync').create();

// Internal data.
const allTasks = require('./tasks/index');
const { getConfig } = require('./config');
const { time } = require('./notices');

const currentLogs = {};
const spinnies = new Spinnies({ color: 'white', succeedColor: 'white' });

function endTask(name) {
  if (currentLogs[name]) {
    spinnies.succeed(name, {
      text: [
        time(),
        ' ',
        chalk.blue((allTasks[name] && allTasks[name].label) || name || ''),
        ' after ',
        chalk.red(prettyHrtime(process.hrtime(currentLogs[name]))),
      ].join(''),
    });
    delete currentLogs[name];
  }
}
function startTask(name) {
  // Already running
  if (currentLogs[name]) {
    endTask(name);
  }

  // Create new log
  spinnies.add(name, {
    text: [time(), ' ', chalk.blue((allTasks[name] && allTasks[name].label) || name || '')].join(
      ''
    ),
  });
  currentLogs[name] = process.hrtime();
}

module.exports = function (tasks = [], config = {}) {
  const configs = getConfig(config);

  // Is development.
  const isDev = tasks.indexOf('watch') !== -1;

  // run streams for each of items (theme and plugins)
  function runStream(name, func, isParallel = false) {
    return (done) => {
      const dynamicTasks = [];

      configs.forEach((data) => {
        if (!name || !allTasks[name] || allTasks[name].isAllowed(data, isDev)) {
          dynamicTasks.push((cb) => func(data, cb));
        }
      });

      if (dynamicTasks.length) {
        gulp.series(
          (cb) => {
            if (name) {
              startTask(name);
            }
            cb();
          },
          gulp[isParallel ? 'parallel' : 'series'](...dynamicTasks),
          (cb) => {
            if (name) {
              endTask(name);
            }
            cb();
          }
        )(done);
      } else {
        done();
      }
    };
  }

  // clean dist folder.
  gulp.task('clean', runStream('clean', allTasks.clean.fn(isDev, browserSync)));

  // copy to dist.
  gulp.task('copy', runStream('copy', allTasks.copy.fn(isDev, browserSync)));

  // remote copy to dist.
  gulp.task('remote_copy', runStream('remote_copy', allTasks.remote_copy.fn(isDev, browserSync)));

  // prefix scss files.
  gulp.task('prefix_scss', runStream('prefix_scss', allTasks.prefix_scss.fn(isDev, browserSync)));

  // compile scss.
  gulp.task(
    'compile_scss',
    runStream('compile_scss', allTasks.compile_scss.fn(isDev, browserSync))
  );

  // compile scss rtl.
  gulp.task(
    'compile_scss_rtl',
    runStream('compile_scss_rtl', allTasks.compile_scss_rtl.fn(isDev, browserSync))
  );

  // compile js.
  gulp.task('compile_js', runStream('compile_js', allTasks.compile_js.fn(isDev, browserSync)));

  // compile jsx.
  gulp.task('compile_jsx', runStream('compile_jsx', allTasks.compile_jsx.fn(isDev, browserSync)));

  // template files.
  gulp.task(
    'template_files',
    runStream('template_files', allTasks.template_files.fn(isDev, browserSync))
  );

  // correct line endings.
  gulp.task(
    'correct_line_endings',
    runStream('correct_line_endings', allTasks.correct_line_endings.fn(isDev, browserSync))
  );

  // translate PHP.
  gulp.task(
    'translate_php',
    runStream('translate_php', allTasks.translate_php.fn(isDev, browserSync))
  );

  // ZIP task.
  gulp.task('zip', runStream('zip', allTasks.zip.fn(isDev, browserSync)));

  // build task.
  gulp.task(
    'build',
    gulp.series(
      (cb) => {
        startTask('Build');
        cb();
      },
      'clean',
      gulp.parallel('copy', 'remote_copy'),
      gulp.parallel('compile_scss', 'compile_scss_rtl'),
      gulp.parallel('compile_js', 'compile_jsx'),
      'prefix_scss',
      'template_files',
      'correct_line_endings',
      'translate_php',
      (cb) => {
        endTask('Build');
        cb();
      }
    )
  );

  let bsInited = false;

  // Browser Sync Init task.
  gulp.task(
    'bs_init',
    runStream('', (cfg, cb) => {
      if (!bsInited && cfg.browser_sync) {
        bsInited = true;
        browserSync.init(cfg.browser_sync);
      }

      cb();
    })
  );

  // Browser Sync Reload task.
  gulp.task(
    'bs_reload',
    runStream('', (cfg, cb) => {
      if (bsInited) {
        browserSync.reload();
      }
      cb();
    })
  );

  // watch task.
  gulp.task(
    'watch',
    gulp.series('bs_init', () => {
      runStream('', (cfg, cb) => {
        if (cfg.watch_files) {
          gulp.watch(
            cfg.watch_files,
            gulp.series(
              'copy',
              'template_files',
              'correct_line_endings',
              'prefix_scss',
              'bs_reload'
            )
          );
        }

        if (cfg.watch_js_files) {
          gulp.watch(cfg.watch_js_files, gulp.series('compile_js', 'bs_reload'));
        }

        if (cfg.watch_jsx_files) {
          gulp.watch(cfg.watch_jsx_files, gulp.series('compile_jsx', 'bs_reload'));
        }

        if (cfg.watch_scss_files) {
          gulp.watch(cfg.watch_scss_files, gulp.series('compile_scss', 'compile_scss_rtl'));
        }

        cb();
      })();
    })
  );

  gulp.series(...tasks)();
};
