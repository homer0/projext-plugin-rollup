const replace = require('@rollup/plugin-replace');
/**
 * This is a Rollup plugin that works as a wrapper for `@rollup/plugin-replace` in order to reload
 * all definitions when the bundle changes.
 */
class ProjextRollupRuntimeReplacePlugin {
  /**
   * @param {Function():Object} definitionsFn                       When this function is called,
   *                                                                it should return the object
   *                                                                with the definitions.
   * @param {string} [name='projext-rollup-plugin-runtime-replace'] The name of the plugin's
   *                                                                instance.
   * @throws {Error} If `definitionsFn` is not a function.
   */
  constructor(definitionsFn, name = 'projext-rollup-plugin-runtime-replace') {
    if (typeof definitionsFn !== 'function') {
      throw new Error('You need to provide a valid definitions function');
    }
    /**
     * The name of the plugin's instance.
     * @type {string}
     */
    this.name = name;
    /**
     * The function that will generate the definitions.
     * @type {Function():Object}
     * @access protected
     * @ignore
     */
    this._definitionsFn = definitionsFn;
    /**
     * This is where the plugin will "refresh" the definitions when the bundle changes.
     * @type {Object}
     * @access protected
     * @ignore
     */
    this._values = {};
    /**
     * The instance of the real `@rollup/plugin-replace` this plugin will call on `transform`.
     * @type {Object}
     * @access protected
     * @ignore
     */
    this._replace = this._createReplace();
    /**
     * This is a flag the plugin uses to avoid reload the definitions on the first build, since at
     * that point, the definitions were already loaded in order to create the
     * `@rollup/plugin-replace` instance.
     * @type {boolean}
     * @access protected
     * @ignore
     */
    this._firstReload = false;
    /**
     * @ignore
     */
    this.buildStart = this.buildStart.bind(this);
    /**
     * @ignore
     */
    this.transform = this.transform.bind(this);
  }
  /**
   * This is called when Rollup starts the building process; if it's not the first build, it will
   * reload the definitions. The reason it doesn't load them on the first build it's because
   * when the plugin is instantiated, the definitions are already loaded for the
   * `@rollup/plugin-replace` instance creation.
   */
  buildStart() {
    if (this._firstReload) {
      this._reloadValues();
    } else {
      this._firstReload = true;
    }
  }
  /**
   * This is called by Rollup when is parsing a file, and it just "forwards the call" to
   * `@rollup/plugin-replace`.
   * @param {string} code     The file contents.
   * @param {string} filepath The file path.
   * @return {*} Whatever `@rollup/plugin-replace` returns.
   */
  transform(code, filepath) {
    return this._replace.transform(code, filepath);
  }
  /**
   * Reloads the saved values on the instance by calling the `definitionsFn`.
   * @access protected
   * @ignore
   */
  _reloadValues() {
    this._values = this._definitionsFn();
    return this._values;
  }
  /**
   * Creates an instance of `@rollup/plugin-replace` using the definitions as options.
   * @return {Object}
   * @access protected
   * @ignore
   */
  _createReplace() {
    const keys = Object.keys(this._reloadValues());
    const values = keys.reduce(
      (settings, key) => Object.assign({}, settings, {
        [key]: () => this._getValue(key),
      }),
      {}
    );

    return replace({ values });
  }
  /**
   * Get a single value from a definition already loaded.
   * @param {string} key The definition key.
   * @return {string}
   * @access protected
   * @ignore
   */
  _getValue(key) {
    return this._values[key];
  }
}
/**
 * Shorthand method to create an instance of {@link ProjextRollupRuntimeReplacePlugin}
 * @param {Function():Object} definitionsFn When this function is called, it should return the
 *                                          object with the definitions.
 * @param {string}            [name]        The name of the plugin's instance.
 * @return {ProjextRollupRuntimeReplacePlugin}
 */
const runtimeReplace = (definitionsFn, name) => new ProjextRollupRuntimeReplacePlugin(
  definitionsFn,
  name
);

module.exports = {
  ProjextRollupRuntimeReplacePlugin,
  runtimeReplace,
};
