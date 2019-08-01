/**
 * This is a Rollup plugin that allows the building process to watch additional files that may
 * not be included on the entry point in order to restart the process.
 * The reason this is not defined as a class it's because it needs access to `.addWatchFile`,
 * which is only available on the execution context of the `transform` hook.
 * @param {Array}  files                                      The list of additional files to
 *                                                            watch and ONE CONNECTED TO THE
 *                                                            BUNDLE. The reason for that is
 *                                                            because the plugin uses the
 *                                                            `transform` hook for that file to
 *                                                            register the list of files.
 * @param {string} [name='projext-rollup-plugin-extra-watch'] The name of the plugin's instance.
 * @return {Object} plugin
 * @property {string}   name      The name of the plugin's instance.
 * @property {Function} transform The `transform` hook the plugin will use to add the additional
 *                                files.
 * @throws {Error} if `files` is not an array or if it's empty.
 */
const extraWatch = function extraWatch(files, name = 'projext-rollup-plugin-extra-watch') {
  if (!Array.isArray(files) || !files.length) {
    throw new Error('You need to provide a valid files list');
  }
  /**
   * This is called by Rollup when is parsing a file; if checks if the file is the one connected
   * to the bundle and then proceeds to register all the ones from the list.
   * @param {string} code     The file contents.
   * @param {string} filepath The file path.
   */
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
