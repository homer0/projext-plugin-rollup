const path = require('path');
const fs = require('fs-extra');
const extend = require('extend');
const { deferred } = require('wootils/shared');
/**
 * This is a Rollup plugin that copies specific files during the bundling process.
 */
class ProjextRollupCopyPlugin {
/**
 * @param {ProjextRollupCopyPluginOptions} [options={}]
 * The options to customize the plugin behaviour.
 * @param {string} [name='projext-rollup-plugin-copy']
 * The name of the plugin's instance.
 */
  constructor(options, name = 'projext-rollup-plugin-copy') {
    /**
     * The plugin options.
     * @type {ProjextRollupCopyPluginOptions}
     * @access protected
     * @ignore
     */
    this._options = extend(
      true,
      {
        files: [],
        stats: () => {},
      },
      options
    );
    /**
     * The name of the plugin's instance.
     * @type {string}
     */
    this.name = name;
    // Validate the received options before doing anything else.
    this._validateOptions();
    /**
     * A list of the directories the plugin created while copying files. This list exists in order
     * to prevent the plugin from trying to create the same directory more than once.
     * @type {Array}
     * @access protected
     * @ignore
     */
    this._createdDirectoriesCache = [];
    /**
     * @ignore
     */
    this.onwrite = this.onwrite.bind(this);
  }
  /**
   * Gets the plugin options
   * @return {ProjextRollupCopyPluginOptions}
   */
  getOptions() {
    return this._options;
  }
  /**
   * This is called after Rollup finishes writing the files on the file system. This is where
   * the plugin will filter the files that doesn't exist and copy the rest.
   * @return {Promise<Array,Error>} The resolved array has the path for each copied file.
   */
  onwrite() {
    // Reset the _"cache"_.
    this._createdDirectoriesCache = [];
    return Promise.all(
      // Loop all the files to copy.
      this._options.files
      // Remove those which origin file doesn't exist.
      .filter((fileInfo) => fs.pathExistsSync(fileInfo.from))
      // Copy the rest...
      .map((fileInfo) => {
        // Make sure the output directory exists.
        this._ensurePath(fileInfo.to);
        // _"Copy"_ the file.
        return this._copy(fileInfo);
      })
    );
  }
  /**
   * Valiates the plugin options.
   * @throws {Error} If a file doesn't have a `from` and/or `to` property.
   * @access protected
   * @ignore
   */
  _validateOptions() {
    const invalid = this._options.files.find((fileInfo) => !fileInfo.from || !fileInfo.to);
    if (invalid) {
      throw new Error(`${this.name}: All files must have 'from' and 'to' properties`);
    }
  }
  /**
   * This is the real method that _"copies"_ a file. If a `transform` property was defined,
   * instead of copying the file, it will read it from the source, send it to the transform
   * function and then write it on the destination path.
   * @param {ProjextRollupCopyPluginItem} fileInfo The information of the file to copy.
   * @return {Promise<string,Error>} The resolved value is the path where the file was copied.
   * @access protected
   * @ignore
   */
  _copy(fileInfo) {
    // Get the file information.
    const { from, to, transform } = fileInfo;
    // Get a deferred for the stats entry.
    const statsDeferred = deferred();
    // Add the deferred promise on the stats.
    this._options.stats(statsDeferred.promise);
    /**
     * If a `transform` property was defined, call the method that handles that, otherwise, just
     * copy the file.
     */
    const firstStep = transform ?
      this._transformFile(fileInfo) :
      fs.copy(from, to);

    return firstStep
    .then(() => {
      // Resolve the deferred for the stats entry.
      statsDeferred.resolve({
        plugin: this.name,
        filepath: to,
      });
      // Resolve the path where the file was copied.
      return to;
    });
  }
  /**
   * This is called when a file is about to be copied but it has a `transform` property.
   * The method will read the file contents, call the function on the `transform` property and
   * then write the _"transformed"_ code on the path where the file should be copied.
   * @param {ProjextRollupCopyPluginItem} fileInfo The information of the file to copy.
   * @return {Promise<undefined,Error>}
   * @access protected
   * @ignore
   */
  _transformFile(fileInfo) {
    // Read the file.
    return fs.readFile(fileInfo.from, 'utf-8')
    // _"Transform it"_.
    .then((contents) => fileInfo.transform(contents))
    // Write the new file.
    .then((contents) => fs.writeFile(fileInfo.to, contents));
  }
  /**
   * This is called before trying to copy any file. The method makes sure a path exists so a file
   * can be copied. It also checks with the _"internal cache"_ to make sure the directory wasn't
   * already created.
   * @param {string} filepath A filepath from which the method will take the directory in order to
   *                          verify it exists.
   * @access protected
   * @ignore
   */
  _ensurePath(filepath) {
    const directory = path.dirname(filepath);
    if (!this._createdDirectoriesCache.includes(directory)) {
      this._createdDirectoriesCache.push(directory);
      fs.ensureDirSync(directory);
    }
  }
}
/**
 * Shorthand method to create an instance of {@link ProjextRollupCopyPlugin}.
 * @param {ProjextRollupCopyPluginOptions} options
 * The options to customize the plugin behaviour.
 * @param {string} name
 * The name of the plugin's instance.
 * @return {ProjextRollupCopyPlugin}
 */
const copy = (options, name) => new ProjextRollupCopyPlugin(options, name);

module.exports = {
  ProjextRollupCopyPlugin,
  copy,
};
