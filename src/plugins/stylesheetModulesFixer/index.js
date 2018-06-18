const rollupUtils = require('rollup-pluginutils');
const extend = require('extend');
/**
 * This is a Rollup plugin that replaces the default export statements of stylesheet modules with
 * the CSS modules local names.
 * This is for web apps that either inject CSS using functions or bundle all on separated files,
 * because it searches for functions (inject) or empty strings (bundle) on exports.
 */
class ProjextRollupStylesheetModulesFixerPlugin {
  /**
   * @param {ProjextRollupStylesheetModulesFixerPluginOptions} [options={}]
   * The options to customize the plugin behaviour.
   * @param {string} [name='projext-rollup-plugin-stylesheet-modules-fixer']
   * The name of the plugin's instance.
   */
  constructor(options = {}, name = 'projext-rollup-plugin-stylesheet-modules-fixer') {
    /**
     * The plugin options.
     * @type {ProjextRollupStylesheetModulesFixerPluginOptions}
     * @access protected
     * @ignore
     */
    this._options = extend(
      true,
      {
        include: [],
        exclude: [],
        modulesExportName: 'locals',
      },
      options
    );
    /**
     * The name of the plugin's instance.
     * @type {string}
     */
    this.name = name;
    /**
     * The filter to decide which files will be processed and which won't.
     * @type {RollupFilter}
     */
    this.filter = rollupUtils.createFilter(
      this._options.include,
      this._options.exclude
    );
    /**
     * A dictionary of common expressions the plugin uses while parsing files.
     * @type {Object}
     * @property {RegExp} firstExport Finds the first export statement.
     * @property {RexExp} line        Matches an export statement line.
     * @property {RegExp} definition  Gets the parts of a named export.
     * @property {RegExp} empty       Matches an empty export.
     * @access protected
     * @ignore
     */
    this._expressions = {
      firstExport: /^(export\s*)/mi,
      line: /^((?:\w+(?: \w+)?)\s*=|default)\s*([\s\S]*?);$/ig,
      definition: /^(\w+)\s*([\S\s]*?)\s*=/,
      empty: /['|"]{2}/,
    };
    /**
     * @ignore
     */
    this.transform = this.transform.bind(this);
  }
  /**
   * Gets the plugin options
   * @return {ProjextRollupStylesheetModulesFixerPluginOptions}
   */
  getOptions() {
    return this._options;
  }
  /**
   * This is called by Rollup when is parsing a file.
   * @param {string} code     The file contents.
   * @param {string} filepath The file path.
   * @return {?RollupFileDefinition} If the file matches the plugin filter, it will parse it and
   *                                 return a new definition, otherwise it will just return `null`.
   */
  transform(code, filepath) {
    // Define the variable to return.
    let result = null;
    // Make sure the file matches the filter and that it has an export statement.
    if (this.filter(filepath)) {
      // Separate the file into _"contents and exports"_.
      const parts = this._getFileParts(code);
      // Parse the export statements.
      const fileExports = this._getFileExports(parts.exports);
      // Update the export statements.
      const updatedFileExports = this._updateFileExports(fileExports);
      // Generate the export lines.
      const statements = this._generateFileExports(updatedFileExports);
      // Update the file definition.
      result = {
        code: `${parts.contents}\n${statements}`,
        map: {
          mappings: '',
        },
      };
    }

    return result;
  }
  /**
   * Seprates the file into two parts: `content`, everything before the first export, and export
   * statements.
   * @param {string} code The file code.
   * @return {Object}
   * @access protected
   * @ignore
   */
  _getFileParts(code) {
    // Generate a unique separator.
    const time = Date.now();
    const separator = `__EXPORTS-BLOCK-SEPARATOR-${time}__`;
    const [contents, exports] = code
    // Add the separator before the first export.
    .replace(this._expressions.firstExport, `${separator}$1`)
    // Split the code using the separator.
    .split(separator);
    // Return the file parts.
    return {
      contents,
      exports,
    };
  }
  /**
   * Parses the exports statements of a file.
   * @param {string} code The part of the file contents with the export statements.
   * @return {Object} A dictionary with the keys `default`, for the default export, `modules`, for
   *                  the CSS modules locals export, and `all`, with all the statements found.
   * @access protected
   * @ignore
   */
  _getFileExports(code) {
    // Define the variables that will hold the indexes for the default and locals exports.
    let defaultExportIndex = -1;
    let modulesExportIndex = -1;
    const fileExports = code
    // Split the code using the statements.
    .split('export')
    /**
     * Remove extra spaces from all the statements (because with the `split`, `export` was also
     * removed, leaving a leading space on each line).
     */
    .map((line) => line.trim())
    // Filter empty lines and lines that don't match an export statement.
    .filter((line) => !!line && line.match(this._expressions.line))
    // Loop all the filtered lines.
    .map((line, index) => {
      // Define a dictionary with the export information.
      const info = {
        isDefault: false,
        name: '',
        value: '',
        type: null,
      };
      // Get the name of the export and its value.
      let [, name, value] = this._expressions.line.exec(line);
      this._expressions.line.lastIndex = 0;

      // Remove any trailing semicolon, as the final method will add them.
      let endsWithSemi = value.endsWith(';');
      while (endsWithSemi) {
        value = value.substr(0, value.length - 1);
        endsWithSemi = value.endsWith(';');
      }
      // Define a variable to hold the export type.
      let type;
      // If the statement is the default export.
      if (name === 'default') {
        // Save its index.
        defaultExportIndex = index;
        // Set the flag to true on its properties.
        info.isDefault = true;
      } else {
        // If is not the default export, parse the type and name.
        [, type, name] = this._expressions.definition.exec(line);
        this._expressions.definition.lastIndex = 0;
      }
      // If the name of the export matches the one for CSS modules, save its index.
      if (name === this._options.modulesExportName) {
        modulesExportIndex = index;
      }
      // Assign the found properties.
      info.name = name;
      info.value = value;
      info.type = type;
      // Return the object information.
      return info;
    });
    // Return the dictionary with all the findings.
    return {
      // The default export, or `null`.
      default: defaultExportIndex > -1 ? fileExports[defaultExportIndex] : null,
      // The export for the CSS modules locals, or `null`.
      modules: modulesExportIndex > -1 ? fileExports[modulesExportIndex] : null,
      // All the exports.
      all: fileExports,
    };
  }
  /**
   * Gets the updated export statements for a file.
   * @param {Object} fileExports The result of `_getFileExports`, with all the export statements
   *                             information.
   * @return {Array} A list of the final export statements.
   * @access protected
   * @ignore
   */
  _updateFileExports(fileExports) {
    // Define the variable to return.
    let result;
    // Get the export for CSS modules locals.
    const modulesExport = fileExports.modules;
    // If there's an export for the CSS modules locals...
    if (modulesExport) {
      // ...then get the default export information.
      const defaultExport = fileExports.default;
      /**
       * If the default export matches an empty string, it means that its code was sent to a
       * different bundle, so the method can just switch the default export value with the one from
       * the CSS Modules locals.
       * But if is not an empty string, then there's a function to inject the CSS code, so the
       * method will wrap it with another function that calls it and then returns the CSS
       * Modules locals.
       */
      if (defaultExport.value.match(this._expressions.empty)) {
        defaultExport.value = modulesExport.value;
      } else {
        defaultExport.value = [
          '(() => {',
          `  ${defaultExport.value};`,
          `  return ${modulesExport.value};`,
          '})()',
        ]
        .join('\n');
      }
      /**
       * Finally, as the CSS Modules export is already the new default export, set to return a
       * list of all the export statements, except for that one.
       */
      result = fileExports.all.filter((info) => info.name !== modulesExport.name);
    } else {
      // If no CSS Module export was found, set to return all the exports.
      result = fileExports.all;
    }

    return result;
  }
  /**
   * Generates the code for a list of export statements.
   * @param {Array} fileExports The list of export statements information generated by
   *                            `_updateFileExports`.
   * @return {string}
   * @access protected
   * @ignore
   */
  _generateFileExports(fileExports) {
    return fileExports
    .map((info) => {
      const name = info.isDefault ? 'default' : `${info.type} ${info.name} =`;
      return `export ${name} ${info.value};`;
    })
    .join('\n');
  }
}
/**
 * Shorthand method to create an instance of {@link ProjextRollupStylesheetModulesFixerPlugin}.
 * @param {ProjextRollupStylesheetModulesFixerPluginOptions} options
 * The options to customize the plugin behaviour.
 * @param {string} name
 * The name of the plugin's instance.
 * @return {ProjextRollupStylesheetModulesFixerPlugin}
 */
const stylesheetModulesFixer = (
  options,
  name
) => new ProjextRollupStylesheetModulesFixerPlugin(options, name);

module.exports = {
  ProjextRollupStylesheetModulesFixerPlugin,
  stylesheetModulesFixer,
};
