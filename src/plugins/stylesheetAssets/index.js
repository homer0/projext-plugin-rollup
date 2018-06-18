const url = require('url');
const path = require('path');
const rollupUtils = require('rollup-pluginutils');
const extend = require('extend');
const fs = require('fs-extra');
const ProjextRollupUtils = require('../utils');
const { stylesheetAssetsHelper } = require('./helper');
/**
 * This is a Rollup plugin that reads stylesheets and CSS blocks on JS files in order to find
 * paths for files relative to the styles original definition file, then it copies them to the
 * a given directory and fixes the URL on the stylesheet/CSS block.
 */
class ProjextRollupStylesheetAssetsPlugin {
  /**
   * Returns the helper plugin, which allows to wrap CSS styles being exported by ES modules on
   * an specific function so this plugin can find them and fix their paths.
   * @type {Function}
   * @static
   */
  static get helper() {
    return stylesheetAssetsHelper;
  }
  /**
   * @param {ProjextRollupStylesheetAssetsPluginOptions} [options={}]
   * The options to customize the plugin behaviour.
   * @param {string} [name='projext-rollup-plugin-stylesheet-assets']
   * The name of the plugin's instance.
   */
  constructor(options, name = 'projext-rollup-plugin-stylesheet-assets') {
    /**
     * The plugin options.
     * @type {ProjextRollupStylesheetAssetsPluginOptions}
     * @access protected
     * @ignore
     */
    this._options = extend(
      true,
      {
        stylesheet: '',
        insertFnNames: options.insertFnNames || [
          '___$insertCSSBlocks',
          '___$insertStyle',
          '___$styleHelper',
        ],
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
     * A dictionary of common expressions the plugin uses while parsing files.
     * @type {Object}
     * @property {RegExp} url     Find URLs definitions (`url(...)`) on a style block.
     * @property {RegExp} js      Validates if a file path is for a JS file.
     * @property {RegExp} fullMap Validates a source map.
     * @access protected
     * @ignore
     */
    this._expressions = {
      url: /url\s*\(\s*(?:['|"])?(\.\.?\/.*?)(?:['|"])?\)/ig,
      js: /\.jsx?$/i,
      fullMap: /(\/\*# sourceMappingURL=[\w:/]+;base64,((?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?) \*\/)/ig,
    };
    /**
     * A dictionary with information of the fragments of a source map. This is used to parse and to
     * re generate source maps.
     * @type {Object}
     * @property {string} prefix How a source map starts.
     * @property {string} header The source map type information.
     * @property {string} sufix  How a source map ends.
     * @access protected
     * @ignore
     */
    this._mapFragments = {
      prefix: '/*# sourceMappingURL=',
      header: 'data:application/json;base64,',
      sufix: '*/',
    };
    /**
     * A _"cache dictionary"_ for files the plugin read while parsing source maps.
     * @type {Object}
     * @access protected
     * @ignore
     */
    this._sourcesCache = {};
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
   * @return {ProjextRollupStatsPluginOptions}
   */
  getOptions() {
    return this._options;
  }
  /**
   * This is called after Rollup finishes writing the files on the file system. This is where
   * the plugin opens the file and process the stylesheet/CSS blocks.
   */
  onwrite() {
    const { stylesheet } = this._options;
    // Validate that the target file exists.
    if (fs.pathExistsSync(stylesheet)) {
      // Reset the _"caches"_.
      this._sourcesCache = {};
      this._createdDirectoriesCache = [];
      // Get the file contents.
      const code = fs.readFileSync(stylesheet, 'utf-8');
      // Based on the file type, process it with the right method.
      const processed = stylesheet.match(this._expressions.js) ?
        this._processJS(code) :
        this._processCSS(code);
      // Write the processed result back on the file.
      fs.writeFileSync(stylesheet, processed);
    }
  }
  /**
   * Valiates the plugin options.
   * @throws {Error} If no `stylesheet` was defined.
   * @throws {Error} If no `url`s were defined.
   * @access protected
   * @ignore
   */
  _validateOptions() {
    if (!this._options.stylesheet) {
      throw new Error(`${this.name}: You need to define the stylesheet path`);
    } else if (!this._options.urls.length) {
      throw new Error(`${this.name}: You need to define the URLs`);
    }
  }
  /**
   * Parses a file as a JS file with CSS blocks.
   * @param {string} code The contents of the file.
   * @return {string} The processed code.
   * @access protected
   * @ignore
   */
  _processJS(code) {
    // Define a new reference for the code.
    let newCode = code;
    // Extract all the blocks with CSS on the file.
    const blocks = this._extractJSBlocks(code);
    // Loop all the blocks.
    blocks.forEach((block) => {
      /**
       * Update all the CSS defintions on the block. For JS blocks there's only one, but this
       * plugin handles CSS defintions as Array on all the methods.
       */
      const css = block.css
      .map((cssBlock) => this._updateCSSBlock(cssBlock).css)
      .join('\n');
      // Define the new block code for the file.
      const escaped = JSON.stringify(css);
      const newBlock = `${block.fn}(${escaped});`;
      // Replace the old block.
      newCode = newCode.replace(block.match, newBlock);
    });
    // Return the updated code.
    return newCode;
  }
  /**
   * Parses a file as a stylesheet.
   * @param {string} code The contents of the file.
   * @return {string} The processed code.
   * @access protected
   * @ignore
   */
  _processCSS(code) {
    const blocks = this._extractCSSBlocks(code);
    const updated = blocks.map((cssBlock) => this._updateCSSBlock(cssBlock).css);
    return updated.join('\n\n');
  }
  /**
   * Extracts all the blocks that inject CSS from a JS file.
   * @param {string} code The contents of the JS file.
   * @return {Array} The list of extracted blocks.
   * @access protected
   * @ignore
   */
  _extractJSBlocks(code) {
    // Define the list to be returned.
    const result = [];
    /**
     * Generates part of a RegExp that would match the names of an inject function:
     * `fn1|fn2|fn3`.
     */
    const fns = this._options.insertFnNames
    .map((name) => ProjextRollupUtils.escapeRegex(name))
    .join('|');
    // Get the current timestamp to be used on unique strings during the process.
    const time = Date.now();
    // Define strings that will separate the parts of CSS block.
    const separators = {
      block: `___STYLE-BLOCK-SEPARATOR-${time}__`,
      map: `__STYLE-MAP-SEPARATOR-${time}__`,
    };
    // Define the RegExp that will find where a CSS blocks starts in order to insert a separator.
    const fnsRegexStr = `(${fns}\\s*\\(\\s*['|"])`;
    const fnsRegex = new RegExp(fnsRegexStr, 'ig');
    // Define the RegExp that will find an entire CSS block using the separator.
    const blockRegexStr = `^(${fns})\\s*\\(\\s*['|"](.*?)${separators.map}(?:\\\\n)?\\s*['|"]\\s*(?:,\\s*(\\{.*?\\}|['|"].*?['|"]|null))?\\s*\\);`;
    const blockRegex = new RegExp(blockRegexStr, 'ig');

    /**
     * Quick note: Yes, all this _"separators magic"_ could be done with a few more RegExp, the
     * thing is that using expressions on a big file KILLS the memory, no matter how basic the
     * expression is.
     */

    // Let's start the parsing!
    code
    // Add the separators before each CSS block.
    .replace(fnsRegex, `${separators.block}$1`)
    // Split the code using the seprators.
    .split(separators.block)
    // Loop each part...
    .forEach((part) => {
      // ...get the block map and replace it with a separator.
      let map;
      const partCode = part.replace(this._expressions.fullMap, (match) => {
        map = match;
        return separators.map;
      });
      // If a map was found, which means that the block can be parsed...
      if (map) {
        // Extract the block parts.
        let match = blockRegex.exec(partCode);
        while (match) {
          const [fullMatch, fn, css] = match;
          // This removes escaped quotes.
          const parsed = JSON.parse(`{"css": "${css}"}`).css;
          // Push the block to the final list.
          result.push({
            // Return the full match back to how it was so it can later be found and replaced.
            match: fullMatch.replace(separators.map, map),
            // Format the CSS block as an array in order to match all the other methods.
            css: [{
              // Include the CSS code.
              css: parsed.trim(),
              // Include the source map
              map,
            }],
            // The name of the inject function.
            fn,
          });
          // Execute the expression again to keep the loop.
          match = blockRegex.exec(partCode);
        }
      }
    });

    return result;
  }
  /**
   * Extracts the blocks from a CSS stylesheet. A block starts with CSS code and ends with a
   * source map.
   * @param {string} code The contents of the JS file.
   * @return {Array} The list of extracted blocks.
   * @access protected
   * @ignore
   */
  _extractCSSBlocks(code) {
    // Define the list to be returned.
    const result = [];
    // Get the source map fragments information.
    const { prefix, header, sufix } = this._mapFragments;
    code
    // Split the code using the source map prefix.
    .split(prefix)
    // Loop each block.
    .forEach((block, index) => {
      // If the block starts with the map header, it means that a CSS block was previously added.
      if (block.startsWith(header)) {
        // Find where the map ends and get the entire map.
        const mapEnd = block.indexOf(sufix);
        const mapEndLength = mapEnd + sufix.length;
        const map = block.substr(0, mapEndLength);
        const previousIndex = index - 1;
        // Put the map together and assign it to the previous block.
        result[previousIndex].map = `${prefix}${map}`;
        // Assume everything after the map ended is another CSS block.
        const css = block.substr(mapEndLength).trim();
        // If there was a CSS block, push it to the list with an empty map.
        if (css) {
          result.push({
            css,
            map: '',
          });
        }
      } else {
        /**
         * If it doesn't start with map header, it means this is the first CSS block, so push
         * it to the list with an empty map.
         */
        result.push({
          css: block.trim(),
          map: '',
        });
      }
    });
    // Return the list of blocks.
    return result;
  }
  /**
   * Updates a CSS block code. The method will search for files linked inside the block,
   * copy them to a designated location and replace it URL.
   * @param {Object} block     The CSS block information.
   * @param {string} block.css The block CSS code.
   * @return {Object} The updated block.
   * @access protected
   * @ignore
   */
  _updateCSSBlock(block) {
    // Get all the linked files on the block.
    const paths = this._getPathsForCSSBlock(block);
    let { css } = block;
    // Loop all the files.
    paths
    // Filter those which absolute path couldn't be found.
    .filter((pathChange) => !!pathChange.absPath)
    // Loop the filtered list.
    .forEach((pathChange) => {
      const {
        absPath,
        line,
        query,
        info,
      } = pathChange;
      // Try to find a URL setting which filter matches a file absolute path.
      const settings = this._options.urls.find((setting) => setting.filter(absPath));
      // If a URL setting was found...
      if (settings) {
        // Generate the output path where the file will be copied.
        const output = ProjextRollupUtils.formatPlaceholder(settings.output, info);
        // Get the directory where the file will be copied.
        const outputDir = path.dirname(output);
        // Generate the new URL for the file.
        const urlBase = ProjextRollupUtils.formatPlaceholder(settings.url, info);
        // Append any existing query the file originally had.
        const newURL = `${urlBase}${query}`;
        // Generate the new statement for the CSS.
        const newLine = `url('${newURL}')`;
        // Generate a RegExp that matches the old statement.
        const lineRegex = new RegExp(ProjextRollupUtils.escapeRegex(line.trim()), 'ig');
        // if the directory wasn't already created, create it.
        if (!this._createdDirectoriesCache.includes(outputDir)) {
          fs.ensureDirSync(outputDir);
          this._createdDirectoriesCache.push(outputDir);
        }
        // Copy the file.
        fs.copySync(absPath, output);
        // Add an stats entry that the file was copied.
        this._options.stats(this.name, output);
        // Replace the old statement with the new one.
        css = css.replace(lineRegex, newLine);
      }
    });
    // Return the updated block with the new CSS code.
    return Object.assign({}, block, { css });
  }
  /**
   * Gets a list of dictionaries with the information of all the files linked on a CSS block.
   * @param {Object} block The CSS block information.
   * @param {string} block.map The CSS block source map.
   * @param {string} block.css The actual CSS code.
   * @return {Array}
   * @access protected
   * @ignore
   */
  _getPathsForCSSBlock(block) {
    // Get the list of sources on the block source map.
    const { sources } = this._parseMap(block.map);
    // Load the source contents.
    const files = this._loadSources(sources);
    // Get all the `url(...)` statements on the CSS block.
    return this._extractPaths(block.css)
    // Loop all the statements.
    .map((pathInfo) => {
      let absPath;
      // Loop all the source.
      files.find((file) => {
        /**
         * Validate that the file exists relative to the source and that the statement is also
         * present on the source.
         */
        const pathFromFile = path.join(file.info.dir, pathInfo.file);
        const found = pathInfo.lines.some((line) => file.code.includes(line)) &&
          fs.pathExistsSync(pathFromFile);

        // If the file exists, define its absolute path.
        if (found) {
          absPath = path.resolve(pathFromFile.replace(/\/\.\//ig, '/'));
        }

        return found;
      });
      // Return the statement information plus the absolute path for it.
      return Object.assign({}, pathInfo, { absPath });
    });
  }
  /**
   * Parse a source map.
   * @param {string} map The map comment.
   * @return {Object}
   * @access protected
   * @ignore
   */
  _parseMap(map) {
    const { prefix, header, sufix } = this._mapFragments;
    const fullPrefix = `${prefix}${header}`;
    const codeRange = (map.length - fullPrefix.length - sufix.length);
    const code = map.substr(fullPrefix.length, codeRange).trim();
    const decoded = Buffer.from(code, 'base64').toString('ascii');
    return JSON.parse(decoded.trim());
  }
  /**
   * Loads a list of source files. They are used while parsing blocks in order to find if certain
   * files exists relative to them and if they include the same statements being parsed.
   * @param {Array} sources The list of files.
   * @return {Array} A list of dictionaries with the sources `file`, `code` and `info`rmation about
   *                 their paths.
   * @access protected
   * @ignore
   */
  _loadSources(sources) {
    // Loop all the sources.
    return sources.map((source) => {
      // Make sure the file wasn't already loaded.
      if (!this._sourcesCache[source]) {
        // Get the file contents.
        const code = fs.readFileSync(source, 'utf-8');
        // Add it to the cache.
        this._sourcesCache[source] = {
          file: source,
          code,
          info: path.parse(source),
        };
      }
      // Return the file information from the cache.
      return this._sourcesCache[source];
    });
  }
  /**
   * Extracts all the `url(...)` statements from a CSS block code.
   * @param {string} code The CSS block code.
   * @return {Array}
   * @access protected
   * @ignore
   */
  _extractPaths(code) {
    // Define the list to be removed.
    const result = [];
    // Define a list to prevent the method from parsing the same statement more than once.
    const saved = [];
    // Loop all the statements.
    let match = this._expressions.url.exec(code);
    while (match) {
      // Get the full line and the actual URL.
      const [line, urlPath] = match;
      // Make sure it wasn't already processed.
      if (!saved.includes(line)) {
        // Push the line to the list of processed lines.
        saved.push(line);
        // Get the URL information.
        const urlInfo = this._parseURL(urlPath);
        // Push all the information to the return list.
        result.push(Object.assign(
          // The base information about the URL.
          urlInfo,
          {
            // The line found on the code.
            line,
            // Variations of the same line as the bundle process may have changed quote types.
            lines: [
              line,
              line.replace(/"/g, '\''),
            ],
            // The information of the URL path.
            info: path.parse(urlInfo.file),
          }
        ));
      }
      // Execute the expression again to keep the loop.
      match = this._expressions.url.exec(code);
    }

    return result;
  }
  /**
   * Parse a URL in order to separate a file from a query.
   * @param {string} urlPath The URL to parse.
   * @return {Object} A dictionary with the keys `file` and `query`.
   * @access protected
   * @ignore
   */
  _parseURL(urlPath) {
    const parsed = url.parse(urlPath);
    const urlQuery = parsed.search || '';
    const urlHash = parsed.hash || '';
    const query = `${urlQuery}${urlHash}`;

    return {
      file: parsed.pathname,
      query,
    };
  }
}
/**
 * Shorthand method to create an instance of {@link ProjextRollupStylesheetAssetsPlugin}.
 * @param {ProjextRollupStylesheetAssetsPluginOptions} options
 * The options to customize the plugin behaviour.
 * @param {string} name
 * The name of the plugin's instance.
 * @return {ProjextRollupStylesheetAssetsPlugin}
 */
const stylesheetAssets = (
  options,
  name
) => new ProjextRollupStylesheetAssetsPlugin(options, name);

module.exports = {
  ProjextRollupStylesheetAssetsPlugin,
  stylesheetAssets,
};
