const extend = require('extend');
const fs = require('fs-extra');
const prettysize = require('prettysize');
const colors = require('colors/safe');
const { Logger } = require('wootils/node/logger');
/**
 * This is a Rollup plugin that shows stats on the files generated and/or copied. The way this
 * plugin works is kind of different: Once instantiated, it has an `add` metho for registering
 * stats entries and that can be sent to other plugins; and at the same time, it has a `log` method
 * that you would add as a plugin and it would show the entries.
 *
 * @example
 * const stats = new ProjextRollupStatsPlugin();
 * stats.add(...);
 * stats.add(...);
 * ...
 * module.exports = {
 *   plugins: [
 *     commonjs(),
 *     resolve(),
 *     ...,
 *     stats.log(),
 *   ],
 * };
 */
class ProjextRollupStatsPlugin {
  /**
   * @param {ProjextRollupStatsPluginOptions} [options={}]
   * The options to customize the plugin behaviour.
   * @param {string} [name='projext-rollup-plugin-node-stats']
   * The name of the plugin's instance.
   */
  constructor(options = {}, name = 'projext-rollup-plugin-stats') {
    /**
     * The plugin options.
     * @type {ProjextRollupStatsPluginOptions}
     * @access protected
     * @ignore
     */
    this._options = extend(
      true,
      {
        path: '',
      },
      options
    );
    /**
     * The name of the plugin's instance.
     * @type {string}
     */
    this.name = name;
    /**
     * The list of entries added to the plugin's instance.
     * @type {Array}
     * @access protected
     * @ignore
     */
    this._entries = [];
    /**
     * The dictionary with the headers of the report table the plugin will show when it logs
     * the entries.
     * @type {Object}
     * @access protected
     * @ignore
     */
    this._reportHeaders = {
      file: 'Asset',
      size: 'Size',
      plugin: 'Plugin',
    };
    /**
     * A custom {@link Logger} to log the report table. It can be set on the options of the `log`
     * method.
     * @type {?Logger}
     * @access protected
     * @ignore
     */
    this._logger = null;
    /**
     * @ignore
     */
    this.add = this.add.bind(this);
  }
  /**
   * Gets the plugin options
   * @return {ProjextRollupStatsPluginOptions}
   */
  getOptions() {
    return this._options;
  }
  /**
   * Generates a _"sub plugin"_ to add to the plugins queue and that will reset the entries list.
   * The reason this exists is because when Rollup is on _"watch mode"_, the plugins can run more
   * than once, and if the queue is not reseted, the report table will show the entries for ALL
   * the times the plugin ran.
   * @return {ProjextRollupStatsPluginReset}
   */
  reset() {
    return {
      intro: () => {
        this._entries = [];
      },
    };
  }
  /**
   * Generates a _"sub plugin"_ to add to the plugins queue and that will take care of logging
   * all the added entries on a report table.
   * @param {ProjextRollupStatsPluginLogOptions} [options={}] Custom options for the _"sub plugin"_.
   * @return {ProjextRollupStatsPluginLog}
   */
  log(options = {}) {
    // Merge the default and custom options.
    const newOptions = extend(
      true,
      {
        extraEntries: [],
        logger: null,
      },
      options
    );
    // Validate the logger.
    const logger = this._validateLogger(newOptions.logger);
    // If there was a valid logger, assign it to the local property and remove it form the options.
    if (logger) {
      this._logger = logger;
      delete newOptions.logger;
    }
    // Return the _"sub plugin"_.
    return {
      onwrite: () => {
        /**
         * Add any extra entry specified on the options. The reason they're being added here
         * instead of the parent scope it's because the `reset` _"sub plugin"_ may remove them
         * if they are added out of the plugins cycle.
         */
        newOptions.extraEntries.forEach((entry) => {
          this.add(entry.plugin, entry.filepath);
        });
        // Log the report table.
        return this._logStats();
      },
    };
  }
  /**
   * Adds a new stats entry.
   * @param {string|Promise} plugin       This can be either the name of the plugin generating the
   *                                      entry, or, if the spot should be saved but the actual
   *                                      entry is involved on an async task, a promise the plugin
   *                                      will wait for. The promise should be resolved with an
   *                                      object with the keys `plugin` and `filepath`.
   * @param {?string}        [filepath]   The path for the file that was generatedcopied. This is
   *                                      not required if `plugin` is a promise.
   * @param {?number}        [index=null] If this value is specified, instead of adding the entry
   *                                      to the list, it will be set at the given index. This is
   *                                      used internally by the plugin after resolving promise
   *                                      based entries, instead of adding the resolved value, the
   *                                      plugin replaces the entry that had the promise with the
   *                                      resolved information.
   */
  add(plugin, filepath, index = null) {
    // Build the entry object after validating if `plugin` is a promise.
    const entry = this._isPromise(plugin) ? plugin : {
      plugin,
      filepath,
    };
    // If index was defined...
    if (typeof index === 'number') {
      // Replace the entry at the given index.
      this._entries[index] = entry;
    } else {
      // Push the entry at the end of the list.
      this._entries.push(entry);
    }
  }
  /**
   * Validates if an object can be used as a logger. The object is only allowed if it's an instance
   * of {@link Logger} or it has a `log` method.
   * @param {Logger|Object} logger The logger to validate.
   * @return {Logger|Object}
   * @throws {Error} If the object is not an instance of {@link Logger} and it doesn't have a `log`
   *                 method.
   * @access protected
   * @ignore
   */
  _validateLogger(logger) {
    let result = null;
    /**
     * If `logger` is _"truthy"_ and it's either an instance of {@link Logger} or has a `log`
     * method...
     */
    if (
      logger &&
      (
        logger instanceof Logger ||
        typeof logger.log === 'function'
      )
    ) {
      // ...set it to be returned as a valid logger.
      result = logger;
    } else if (logger) {
      // ...but if there's a `logger` but it doesn't have a valid interface, throw an error.
      throw new Error(`${this.name}: The logger must be an instance of wootils' Logger class`);
    }

    return result;
  }
  /**
   * This is the method in charge of logging the report table.
   * @return {Promise<undefined,Error>}
   * @access protected
   * @ignore
   */
  _logStats() {
    // Resolve any pending entry.
    return this._resolveEntries()
    .then(() => {
      // Sort the entries list.
      let newEntries = this._sortEntries(this._entries);
      // Normalize the entries paths and obtain the files size.
      newEntries = this._formatEntries(newEntries);
      // Generate the report table.
      const stats = this._generateStats(newEntries);
      // If a valid `logger` was sent, use it to log the table, otherwise use the `console`.
      if (this._logger) {
        this._logger.log(stats);
      } else {
        // eslint-disable-next-line no-console
        console.log(stats);
      }
    });
  }
  /**
   * Resolves any pending entries that were added as promises.
   * @return {Promise<undefined,Error>}
   * @access protected
   * @ignore
   */
  _resolveEntries() {
    const promises = [];
    // Loop all the entries and pick the promises and their indexes.
    this._entries.forEach((entry, index) => {
      if (this._isPromise(entry)) {
        promises.push({
          entry,
          index,
        });
      }
    });
    // Define the variable to return.
    let result;
    // If there are promises to solve...
    if (promises.length) {
      // ...set to return a `Promise.all` of all of them.
      result = Promise.all(promises.map((entryInfo) => this._resolveEntry(entryInfo)));
    } else {
      // ...otherwise, return an already resolved promise.
      result = Promise.resolve();
    }

    return result;
  }
  /**
   * Resolves a single promise based entry.
   * @param {Object}                entryInfo       The information of the entry to be resolved.
   * @param {Promise<Object,Error>} entryInfo.entry The promise to resolve.
   * @return {Promise<undefined,Error>}
   * @access protected
   * @ignore
   */
  _resolveEntry(entryInfo) {
    // Wait for the promise to be resolved.
    return entryInfo
    .entry
    .then((newEntry) => {
      // Replace the entry with the obtained information.
      this.add(newEntry.plugin, newEntry.filepath, entryInfo.index);
    });
  }
  /**
   * Checks whether an object is a promise or not. It should be of type `Object` and have a `then`
   * method.
   * @param {*} obj The object to validate.
   * @return {boolean}
   * @access protected
   * @ignore
   */
  _isPromise(obj) {
    return typeof obj === 'object' && obj.then && typeof obj.then === 'function';
  }
  /**
   * Sorts an entries list.
   * @param {Array} entries The entries list.
   * @return {Array}
   * @access protected
   * @ignore
   */
  _sortEntries(entries) {
    const entriesByFile = {};
    /**
     * Loop all the entries, put them on a dictionary using the file path as key, and build a
     * list of file paths.
     */
    return entries.map((entry) => {
      entriesByFile[entry.filepath] = entry;
      return entry.filepath;
    })
    // Sort the list of file paths.
    .sort()
    /**
     * Build a new array by looping the sorted entries and retrieving the information from
     * the dictionary.
     */
    .map((filepath) => entriesByFile[filepath]);
  }
  /**
   * Formats a list of entries by normalizing their paths, obtaining their size and making it
   * human readable.
   * @param {Array} entries The list of entries.
   * @return {Array}
   * @access protected
   * @ignore
   */
  _formatEntries(entries) {
    // Loop all the entries.
    return entries
    // Filter all entries which files don't exist.
    .filter((entry) => fs.pathExistsSync(entry.filepath))
    // Loop all the filtered entries.
    .map((entry) => {
      const { plugin, filepath } = entry;
      // Normalize the file path.
      const file = this._resolveFilepath(filepath);
      // Normalize the file size.
      const size = this._getPrettyFilesize(filepath);
      // Return an object with the new information.
      return {
        plugin,
        file,
        size,
      };
    });
  }
  /**
   * Removes the plugin's `path` option from a filepath that starts with it.
   * @param {string} filepath The file path to _"normalize"_.
   * @return {string}
   * @access protected
   * @ignore
   */
  _resolveFilepath(filepath) {
    return filepath.startsWith(this._options.path) ?
      filepath.substr(this._options.path.length) :
      filepath;
  }
  /**
   * Gets and formats a file size.
   * @param {string} filepath The path to the file.
   * @return {string}
   * @access protected
   * @ignore
   */
  _getPrettyFilesize(filepath) {
    return prettysize(fs.lstatSync(filepath).size)
    .replace(/ Bytes$/g, ' B');
  }
  /**
   * Generates the report table to log the entries.
   * @param {Array} entries The list of entries.
   * @return {string}
   * @access protected
   * @ignore
   */
  _generateStats(entries) {
    // Get the widths for each cell.
    const cellsWidth = this._getCellsWidth(entries);
    // Define the spacing between columns.
    const howMuchSpaceBetweenColumns = 2;
    // Generate the string for the spacing between columns.
    const spacer = this._addSpaces(howMuchSpaceBetweenColumns);

    // Define the _"Headers line"_.
    const header = [
      '',
      colors.white(this._addSpaces(cellsWidth.file, this._reportHeaders.file, false)),
      colors.white(this._addSpaces(cellsWidth.size, this._reportHeaders.size)),
      colors.white(this._addSpaces(cellsWidth.plugin, this._reportHeaders.plugin)),
    ]
    .join(spacer);
    /**
     * Define the variable that will hold the file that was generated by Rollup itself. The reason
     * it's saved on a string it's because if while looping all the entries, a file that starts
     * with the same string as this file is found, it will also be highlighted, as it may be
     * a variation of the main file (`gz` or `map`).
     */
    let rollupFile = ' ';
    // Build the lines for each entry.
    const entryLines = entries.map((entry) => {
      // Define the cell for the file path.
      let file = this._addSpaces(cellsWidth.file, entry.file, false);
      // Define the cell for the file size.
      let size = this._addSpaces(cellsWidth.size, entry.size);
      // Define the cell for the plugin's name.
      let plugin = this._addSpaces(cellsWidth.plugin, entry.plugin);

      // Validate if the entry was generated by Rollup itself.
      const isRollupFile = entry.plugin === 'rollup';
      // If the entry was generated by Rollup, save the filepath.
      if (isRollupFile) {
        rollupFile = entry.file;
      }
      /**
       * If the file was generated by Rollup or it's a variation of it (starts with the
       * same path)...
       */
      if (isRollupFile || entry.file.startsWith(rollupFile)) {
        // ...highlight the cells.
        file = colors.cyan(file);
        size = colors.cyan(size);
        plugin = colors.cyan(plugin);
      } else {
        // ...otherwise, add some regular colors to the cells.
        file = colors.green(file);
        size = colors.white(size);
        plugin = colors.gray(plugin);
      }
      // Return the line.
      return `${spacer}${file}${spacer}${size}${spacer}${plugin}`;
    });
    // Define all the report lines.
    const lines = [
      '',
      header,
      ...entryLines,
      '',
    ];
    // Return the lines joined on a single string.
    return lines.join('\n');
  }
  /**
   * Calculates the width of the report table cells by finding each property longest value.
   * @param {Array} entries The entries list.
   * @return {ProjextRollupStatsPluginCellsWidth}
   * @access protected
   * @ignore
   */
  _getCellsWidth(entries) {
    // Define the initial values.
    let longestPlugin = 0;
    let longestFile = 0;
    let longestSize = 0;

    // Loop all the entries and the headers.
    [
      ...entries,
      this._reportHeaders,
    ]
    .forEach((entry) => {
      // Validate the longest plugin name.
      if (entry.plugin.length > longestPlugin) {
        longestPlugin = entry.plugin.length;
      }

      // Validate the longest file path.
      if (entry.file.length > longestFile) {
        longestFile = entry.file.length;
      }

      // Validate the longest file size.
      if (entry.size.length > longestSize) {
        longestSize = entry.size.length;
      }
    });
    // Return the width for each cell type.
    return {
      plugin: longestPlugin,
      file: longestFile,
      size: longestSize,
    };
  }
  /**
   * Prefix or sufix an string with a number of spaces.
   * @param {number}  length       How many spaces should be added.
   * @param {string}  [str='']     The string to prefix or sufix.
   * @param {boolean} [after=true] Whether the spaces should be after or before the string.
   * @return {string}
   * @access protected
   * @ignore
   */
  _addSpaces(length, str = '', after = true) {
    const spaces = (new Array(length - str.length)).fill(' ').join('');
    return after ? `${str}${spaces}` : `${spaces}${str}`;
  }
}
/**
 * Shorthand method to create an instance of {@link ProjextRollupStatsPlugin}.
 * @param {ProjextRollupStatsPluginOptions} options
 * The options to customize the plugin behaviour.
 * @param {string} name
 * The name of the plugin's instance.
 * @return {ProjextRollupStatsPlugin}
 */
const stats = (options, name) => new ProjextRollupStatsPlugin(options, name);

module.exports = {
  ProjextRollupStatsPlugin,
  stats,
};
