const extend = require('extend');
const fs = require('fs-extra');
const prettysize = require('prettysize');
const colors = require('colors/safe');
const { Logger } = require('wootils/node/logger');

class ProjextRollupStatsPlugin {
  constructor(options = {}, name = 'projext-rollup-plugin-stats') {
    this._options = extend(
      true,
      {
        path: '',
      },
      options
    );
    this.name = name;
    this._entries = [];
    this._reportHeaders = {
      file: 'Asset',
      size: 'Size',
      plugin: 'Plugin',
    };
    this._logger = null;

    this.add = this.add.bind(this);
  }

  getOptions() {
    return this._options;
  }

  log(options = {}) {
    const newOptions = extend(
      true,
      {
        extraEntries: [],
        logger: null,
      },
      options
    );

    const logger = this._validateLogger(newOptions.logger);
    if (logger) {
      this._logger = logger;
      delete newOptions.logger;
    }

    newOptions.extraEntries.forEach((entry) => {
      this.add(entry.plugin, entry.filepath);
    });

    return {
      onwrite: this._logStats.bind(this),
    };
  }

  add(plugin, filepath, index = null) {
    const entry = this._isPromise(plugin) ? plugin : {
      plugin,
      filepath,
    };

    if (typeof index === 'number') {
      this._entries[index] = entry;
    } else {
      this._entries.push(entry);
    }
  }

  _validateLogger(logger) {
    let result = null;
    if (
      logger &&
      (
        logger instanceof Logger ||
        typeof logger.log === 'function'
      )
    ) {
      result = logger;
    } else if (logger) {
      throw new Error(`${this.name}: The logger must be an instance of wootils' Logger class`);
    }

    return result;
  }

  _logStats() {
    return this._resolveEntries()
    .then(() => {
      let newEntries = this._sortEntries(this._entries);
      newEntries = this._formatEntries(newEntries);
      const stats = this._generateStats(newEntries);
      if (this._logger) {
        this._logger.log(stats);
      } else {
        // eslint-disable-next-line no-console
        console.log(stats);
      }
    });
  }

  _resolveEntries() {
    const promises = [];
    this._entries.forEach((entry, index) => {
      if (this._isPromise(entry)) {
        promises.push({
          entry,
          index,
        });
      }
    });

    let result;
    if (promises.length) {
      result = Promise.all(promises.map((entryInfo) => this._resolveEntry(entryInfo)));
    } else {
      result = Promise.resolve(this._entries);
    }

    return result;
  }

  _resolveEntry(entryInfo) {
    return entryInfo
    .entry
    .then((newEntry) => {
      this.add(newEntry.plugin, newEntry.filepath, entryInfo.index);
    });
  }

  _isPromise(obj) {
    return typeof obj === 'object' && obj.then && typeof obj.then === 'function';
  }

  _sortEntries(entries) {
    const entriesByFile = {};
    return entries.map((entry) => {
      entriesByFile[entry.filepath] = entry;
      return entry.filepath;
    })
    .sort()
    .map((filepath) => entriesByFile[filepath]);
  }

  _formatEntries(entries) {
    return entries
    .filter((entry) => fs.pathExistsSync(entry.filepath))
    .map((entry) => {
      const { plugin, filepath } = entry;
      const file = this._resolveFilepath(filepath);
      const size = this._getPrettyFilesize(filepath);

      return {
        plugin,
        file,
        size,
      };
    });
  }

  _resolveFilepath(filepath) {
    return filepath.startsWith(this._options.path) ?
      filepath.substr(this._options.path.length) :
      filepath;
  }

  _getPrettyFilesize(filepath) {
    return prettysize(fs.lstatSync(filepath).size)
    .replace(/ Bytes$/g, ' B');
  }

  _generateStats(entries) {
    const cellsWidth = this._getCellsWidth(entries);
    const howMuchSpaceBetweenColumns = 2;
    const spacer = this._addSpaces(howMuchSpaceBetweenColumns);

    const header = [
      '',
      colors.white(this._addSpaces(cellsWidth.file, this._reportHeaders.file, false)),
      colors.white(this._addSpaces(cellsWidth.size, this._reportHeaders.size)),
      colors.white(this._addSpaces(cellsWidth.plugin, this._reportHeaders.plugin)),
    ]
    .join(spacer);

    let rollupFile = ' ';

    const entryLines = entries.map((entry) => {
      let file = this._addSpaces(cellsWidth.file, entry.file, false);
      let size = this._addSpaces(cellsWidth.size, entry.size);
      let plugin = this._addSpaces(cellsWidth.plugin, entry.plugin);

      const isRollupFile = entry.plugin === 'rollup';
      if (isRollupFile) {
        rollupFile = entry.file;
      }

      if (isRollupFile || entry.file.startsWith(rollupFile)) {
        file = colors.cyan(file);
        size = colors.cyan(size);
        plugin = colors.cyan(plugin);
      } else {
        file = colors.green(file);
        size = colors.white(size);
        plugin = colors.gray(plugin);
      }

      return `${spacer}${file}${spacer}${size}${spacer}${plugin}`;
    });

    const lines = [
      '',
      header,
      ...entryLines,
      '',
    ];

    return lines.join('\n');
  }

  _getCellsWidth(entries) {
    let longestPlugin = 0;
    let longestFile = 0;
    let longestSize = 0;

    [
      ...entries,
      this._reportHeaders,
    ]
    .forEach((entry) => {
      if (entry.plugin.length > longestPlugin) {
        longestPlugin = entry.plugin.length;
      }

      if (entry.file.length > longestFile) {
        longestFile = entry.file.length;
      }

      if (entry.size.length > longestSize) {
        longestSize = entry.size.length;
      }
    });

    return {
      plugin: longestPlugin,
      file: longestFile,
      size: longestSize,
    };
  }

  _addSpaces(length, str = '', after = true) {
    const spaces = (new Array(length - str.length)).fill(' ').join('');
    return after ? `${str}${spaces}` : `${spaces}${str}`;
  }
}

const stats = (options, name) => new ProjextRollupStatsPlugin(options, name);

module.exports = {
  ProjextRollupStatsPlugin,
  stats,
};
