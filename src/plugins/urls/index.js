const path = require('path');
const rollupUtils = require('rollup-pluginutils');
const extend = require('extend');
const fs = require('fs-extra');
const ProjextRollupUtils = require('../utils');
/**
 * This is a Rollup plugin that find files matching a filter, copy them and replace their code
 * on the bundle with an export with a URL for the file.
 */
class ProjextRollupURLsPlugin {
  /**
   * @param {ProjextRollupURLsPluginOptions} [options={}]
   * The options to customize the plugin behaviour.
   * @param {string} [name='projext-rollup-plugin-urls']
   * The name of the plugin's instance.
   */
  constructor(options, name = 'projext-rollup-plugin-urls') {
    /**
     * The plugin options.
     * @type {ProjextRollupURLsPluginOptions}
     * @access protected
     * @ignore
     */
    this._options = extend(
      true,
      {
        urls: [],
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
     * Loop all `urls` options and create a filter function with their `include` and `exclude`
     * properties.
     */
    this._options.urls = this._options.urls.map((urlSettings) => Object.assign(
      urlSettings,
      {
        filter: rollupUtils.createFilter(
          urlSettings.include,
          urlSettings.exclude
        ),
      }
    ));
    /**
     * A list of the files the plugin will copy after Rollup finishes writing the files.
     * @type {Array}
     * @access protected
     * @ignore
     */
    this._toCopy = [];
    /**
     * @ignore
     */
    this.load = this.load.bind(this);
    /**
     * @ignore
     */
    this.generateBundle = this.generateBundle.bind(this);
  }
  /**
   * Gets the plugin options
   * @return {ProjextRollupURLsPluginOptions}
   */
  getOptions() {
    return this._options;
  }
  /**
   * This is called by Rollup when a file is about to be loaded. The method will check if there's
   * a URL setting for it, replace its content with a default export of the file URL and add the
   * file to the queue of files that will be copied after Rollup finishes the bundling process.
   * @param {string} filepath The path to the file to load.
   * @return {?string} If the file path matches a filter, it will return a new export statement,
   *                   otherwise, it will return just `null`,
   */
  load(filepath) {
    // Define the variable to return.
    let result = null;
    // Try to find a URL setting which filter matches a file path.
    const settings = this._options.urls.find((setting) => setting.filter(filepath));
    // If a URL setting was found...
    if (settings) {
      // Get the file path info.
      const info = path.parse(filepath);
      // Push it to the queue of files that will be copied.
      this._toCopy.push({
        // The original file path.
        from: filepath,
        // The path to where it will be copied.
        to: ProjextRollupUtils.formatPlaceholder(settings.output, info),
      });
      // Get the URL for the file.
      const fileURL = ProjextRollupUtils.formatPlaceholder(settings.url, info);
      // Set to return a export statement with the new file URL.
      result = `export default '${fileURL}';`;
    }

    return result;
  }
  /**
   * This is called by Rollup after it finishes writing the files on the file system. The method
   * will loop the queue and copy all the files that matched a filter during the `load` process.
   */
  generateBundle() {
    // Loop all the files.
    this._toCopy.forEach((toCopy) => {
      // Make sure the output directory exists.
      fs.ensureDirSync(path.dirname(toCopy.to));
      // Copy the file.
      fs.copySync(toCopy.from, toCopy.to);
      // Add a stats entry informing the file was copied.
      this._options.stats(this.name, toCopy.to);
    });
    // Reset the queue.
    this._toCopy = [];
  }
  /**
   * Validates the plugin options.
   * @throws {Error} If no URLs were defined.
   * @access protected
   * @ignore
   */
  _validateOptions() {
    if (!this._options.urls.length) {
      throw new Error(`${this.name}: You need to define the URLs`);
    }
  }
}
/**
 * Shorthand method to create an instance of {@link ProjextRollupURLsPlugin}.
 * @param {ProjextRollupURLsPluginOptions} options
 * The options to customize the plugin behaviour.
 * @param {string} name
 * The name of the plugin's instance.
 * @return {ProjextRollupURLsPlugin}
 */
const urls = (options, name) => new ProjextRollupURLsPlugin(options, name);

module.exports = {
  ProjextRollupURLsPlugin,
  urls,
};
