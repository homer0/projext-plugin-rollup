const path = require('path');
const rollupUtils = require('rollup-pluginutils');
const extend = require('extend');
const fs = require('fs-extra');
const zopfli = require('node-zopfli');
const { deferred } = require('wootils/shared');
/**
 * This is a Rollup plugin that takes all the files that match an specific filter and compress using
 * Gzip.
 */
class ProjextRollupCompressionPlugin {
  /**
   * @param {ProjextRollupCompressionPluginOptions} [options={}]
   * The options to customize the plugin behaviour.
   * @param {string} [name='projext-rollup-plugin-compression']
   * The name of the plugin's instance.
   */
  constructor(options = {}, name = 'projext-rollup-plugin-compression') {
    /**
     * The plugin options.
     * @type {ProjextRollupCompressionPluginOptions}
     * @access protected
     * @ignore
     */
    this._options = extend(
      true,
      {
        folder: './dist',
        include: [],
        exclude: [],
        stats: () => {},
      },
      options
    );
    /**
     * The name of the plugin instance.
     * @type {string}
     */
    this.name = name;
    /**
     * The filter to decide which files will be compressed and which won't.
     * @type {RollupFilter}
     */
    this.filter = rollupUtils.createFilter(
      this._options.include,
      this._options.exclude
    );
    /**
     * @ignore
     */
    this.onwrite = this.onwrite.bind(this);
  }
  /**
   * Gets the plugin options
   * @return {ProjextRollupCompressionPluginOptions}
   */
  getOptions() {
    return this._options;
  }
  /**
   * This method gets called after Rollup writes the files on the file system. It takes care
   * of finding all the files that match the filter and compressing them with Gzip.
   * @return {Promise<Array,Error>} If everything goes well, the Promise will resolve on a list
   *                                of {@link ProjextRollupCompressionPluginEntry} objects.
   */
  onwrite() {
    return Promise.all(this._findAllTheFiles().map((file) => this._compressFile(file)));
  }
  /**
   * Finds all the files on the directory specified on the options.
   * @return {Array}
   * @access protected
   * @ignore
   */
  _findAllTheFiles() {
    return this._readDirectory(this._options.folder);
  }
  /**
   * Reads a directory recursively until it finds all the files that match the plugin's filter.
   * @param {string} directory The directory to read.
   * @return {Array}
   * @access protected
   * @ignore
   */
  _readDirectory(directory) {
    const result = [];
    // Get all the items on the directory.
    fs.readdirSync(directory)
    // Filter hidden and already compressed files.
    .filter((item) => !item.startsWith('.') && !item.endsWith('.gz'))
    // Normalize the item information.
    .map((item) => {
      const itemPath = path.join(directory, item);
      return {
        path: itemPath,
        isDirectory: fs.lstatSync(itemPath).isDirectory(),
      };
    })
    // Remove items that aren't directories or that doesn't match the plugin's filter.
    .filter((item) => item.isDirectory || this.filter(item.path))
    // Process the remaining items.
    .forEach((item) => {
      // If the item is a directory...
      if (item.isDirectory) {
        // ...read all its files and push them to the return list.
        result.push(...this._readDirectory(item.path));
      } else {
        // ...otherwise, just add it to the return list.
        result.push(item.path);
      }
    });
    // Return the findings.
    return result;
  }
  /**
   * Compresses a file using Gzip.
   * @param {string} filepath The path to the file to compress.
   * @return {Promise<ProjextRollupCompressionPluginEntry,Error>}
   * @access protected
   * @ignore
   */
  _compressFile(filepath) {
    // Get a deferred for the stats entry.
    const statsDeferred = deferred();
    // Add the deferred promise on the stats.
    this._options.stats(statsDeferred.promise);
    return new Promise((resolve, reject) => {
      // Define the path for the compressed file.
      const newFilepath = `${filepath}.gz`;
      // Read the file.
      fs.createReadStream(filepath)
      .on('error', reject)
      // Compress the file.
      .pipe(zopfli.createGzip())
      // Write the compressed file.
      .pipe(fs.createWriteStream(newFilepath))
      .on('error', (error) => {
        statsDeferred.reject(error);
        reject(error);
      })
      .on('close', () => {
        // Resolve the deferred for the stats entry.
        statsDeferred.resolve({
          plugin: this.name,
          filepath: newFilepath,
        });
        // Resolve the method's promise.
        resolve({
          original: filepath,
          compressed: newFilepath,
        });
      });
    });
  }
}
/**
 * Shorthand method to create an instance of {@link ProjextRollupCompressionPlugin}.
 * @param {ProjextRollupCompressionPluginOptions} options
 * The options to customize the plugin behaviour.
 * @param {string} name
 * The name of the plugin's instance.
 * @return {ProjextRollupCompressionPlugin}
 */
const compression = (options, name) => new ProjextRollupCompressionPlugin(options, name);

module.exports = {
  ProjextRollupCompressionPlugin,
  compression,
};
