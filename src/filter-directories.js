const { Transform } = require('stream');

module.exports = (nodir) =>
  new Transform({
    objectMode: true,
    transform(file, encoding, callback) {
      callback(null, nodir && file.isDirectory() ? undefined : file);
    },
  });
