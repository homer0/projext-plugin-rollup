/**
 * This is a Rollup plugin that inserts a single line of code on the bundle in order to make
 * `global` an alias for `window`.
 */
class ProjextRollupWindowAsGlobalPlugin {
  /**
   * This gets called when Rollup starts the bundling process. It returns the code that will make
   * `global` available as an alias for `window`.
   * @return {string}
   */
  intro() {
    return 'var global = typeof window !== \'undefined\' ? window : {};';
  }
}
/**
 * Shorthand method to create an instance of {@link ProjextRollupWindowAsGlobalPlugin}.
 * @return {ProjextRollupWindowAsGlobalPlugin}
 */
const windowAsGlobal = () => new ProjextRollupWindowAsGlobalPlugin();

module.exports = {
  ProjextRollupWindowAsGlobalPlugin,
  windowAsGlobal,
};
