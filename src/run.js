const meow = require('meow');

const { getWPEGConfig } = require('./config');
const runTasks = require('./tasks');
const { error } = require('./notices');

module.exports = function () {
  const { flags, help } = getWPEGConfig();

  const cli = meow(help, {
    booleanDefault: undefined,
    flags,
  });

  // prepare tasks list.
  const currentTasks = [];
  const allowedTasks = ['clean', 'build', 'watch', 'zip'];
  allowedTasks.forEach((flag) => {
    if (cli.flags && cli.flags[flag]) {
      currentTasks.push(flag);
    }
  });

  // no tasks.
  if (!currentTasks.length) {
    cli.showHelp();
    return;
  }

  // node errors.
  process.on('uncaughtException', (err) => {
    error(`UncaughtException: ${err.message}`);
    error(err.stack);
    process.exit(1);
  });

  // run tasks.
  runTasks(currentTasks, cli.flags.config);
};
