const extraWatch = function extraWatch(files, name = 'projext-rollup-plugin-extra-watch') {
  if (!Array.isArray(files) || !files.length) {
    throw new Error('You need to provide a valid files list');
  }

  const transform = function extraWatchTransform(code, filepath) {
    if (files.includes(filepath)) {
      files.forEach((file) => {
        this.addWatchFile(file);
      });
    }
  };

  return {
    name,
    transform,
  };
};

module.exports = { extraWatch };
