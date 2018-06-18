const rollupUtils = require('rollup-pluginutils');
const extend = require('extend');
const helperFn = require('./helperFn');
/**
 * This is Rollup helper plugin for {@link ProjextRollupStylesheetAssetsPlugin} that wraps CSS
 * code being exported by ES modules so it can be found and fixed.
 */
class ProjextRollupStylesheetAssetsHelperPlugin {
  /**
   * @param {ProjextRollupStylesheetAssetsHelperPluginOptions} [options={}]
   * The options to customize the plugin behaviour.
   * @param {string} [name='projext-rollup-plugin-stylesheet-assets-helper']
   * The name of the plugin's instance.
   */
  constructor(options = {}, name = 'projext-rollup-plugin-stylesheet-assets-helper') {
    /**
     * The plugin options.
     * @type {ProjextRollupStylesheetAssetsHelperPluginOptions}
     * @access protected
     * @ignore
     */
    this._options = extend(
      true,
      {
        include: options.include || [/\.(s?css|sass)$/i],
        exclude: [],
        fnName: '___$styleHelper',
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
     * @property {RegExp} code Finds export statements.
     * @access protected
     * @ignore
     */
    this._expressions = {
      code: /^(?:export\s*default|module\.exports\s*=\s*)(.*?);$/ig,
    };
    /**
     * @ignore
     */
    this.intro = this.intro.bind(this);
    /**
     * @ignore
     */
    this.transform = this.transform.bind(this);
  }
  /**
   * Gets the plugin options
   * @return {ProjextRollupStylesheetAssetsHelperPluginOptions}
   */
  getOptions() {
    return this._options;
  }
  /**
   * This gets called when Rollup starts the bundling process. It returns the code for the
   * function that will wrap the CSS styles.
   * @return {string}
   */
  intro() {
    return helperFn.toString().replace(helperFn.name, this._options.fnName);
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
    if (this.filter(filepath) && code.match(this._expressions.code)) {
      // Get the export statements.
      const styles = [];
      let match = this._expressions.code.exec(code);
      while (match) {
        const [, style] = match;
        styles.push(style.trim());
        match = this._expressions.code.exec(code);
      }
      // Get the first export statement (usually there's only one).
      const [style] = styles;
      // Update the file definition.
      result = {
        code: `export default ${this._options.fnName}(${style});`,
        map: {
          mappings: '',
        },
      };
    }

    return result;
  }
}
/**
 * Shorthand method to create an instance of {@link ProjextRollupStylesheetAssetsHelperPlugin}.
 * @param {ProjextRollupStylesheetAssetsHelperPluginOptions} options
 * The options to customize the plugin behaviour.
 * @param {string} name
 * The name of the plugin's instance.
 * @return {ProjextRollupStylesheetAssetsHelperPlugin}
 */
const stylesheetAssetsHelper = (
  options,
  name
) => new ProjextRollupStylesheetAssetsHelperPlugin(options, name);

module.exports = {
  ProjextRollupStylesheetAssetsHelperPlugin,
  stylesheetAssetsHelper,
};
