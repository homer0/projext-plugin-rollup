const path = require('path');
const { provider } = require('jimple');
/**
 * This build engine is in charge of generating the CLI commands and the configuration to bundle
 * a target using Rollup.
 */
class RollupBuildEngine {
  /**
   * @param {EnvironmentUtils}    environmentUtils    To load environment variables sent by the
   *                                                  CLI command to the configuration builder
   *                                                  method.
   * @param {Targets}             targets             To get a target information.
   * @param {RollupConfiguration} rollupConfiguration To generate a configuration for a target.
   * @param {RollupPluginInfo}    rollupPluginInfo    To get the path to the configuration file.
   */
  constructor(
    environmentUtils,
    targets,
    rollupConfiguration,
    rollupPluginInfo
  ) {
    /**
     * A local reference for the `environmentUtils` service.
     * @type {EnvironmentUtils}
     */
    this.environmentUtils = environmentUtils;
    /**
     * A local reference for the `targets` service.
     * @type {Targets}
     */
    this.targets = targets;
    /**
     * A local reference for the `rollupConfiguration` service.
     * @type {RollupConfiguration}
     */
    this.rollupConfiguration = rollupConfiguration;
    /**
     * A local reference for the plugin information.
     * @type {RollupPluginInfo}
     */
    this.rollupPluginInfo = rollupPluginInfo;
    /**
     * A dictionary of environment variables the service will include on the CLI command and
     * that will be retrieved when generating the configuration.
     * The keys are the purpose and the values the actual names of the variables.
     * @type {Object}
     * @property {string} target  The name of the target being builded.
     * @property {string} type    The intended build type: `development` or `production`.
     * @property {string} run     Whether or not to execute the target. This will be like a fake
     *                            boolean as the CLI doesn't support boolean variables, so its
     *                            value will be either `'true'` or `'false'`.
     * @property {string} watch   Whether or not to watch the target files. This will be like a
     *                            fake boolean as the CLI doesn't support boolean variables, so
     *                            its value will be either `'true'` or `'false'`.
     * @property {string} inspect Whether or not to enable the Node inspector. This will be like a
     *                            fake boolean as the CLI doesn't support boolean variables, so its
     *                            value will be either `'true'` or `'false'`.
     * @property {string} analyze Whether or not to enable the bundle analyzer. This will be like a
     *                            fake boolean as the CLI doesn't support boolean variables, so its
     *                            value will be either `'true'` or `'false'`.
     * @access protected
     * @ignore
     */
    this._envVars = {
      target: 'PXTRP_TARGET',
      type: 'PXTRP_TYPE',
      run: 'PXTRP_RUN',
      watch: 'PXTRP_WATCH',
      inspect: 'PXTRP_INSPECT',
      analyze: 'PXTRP_ANALYZE',
    };
  }
  /**
   * Get the CLI build command to bundle a target.
   * @param {Target}  target               The target information.
   * @param {string}  buildType            The intended build type: `development` or `production`.
   * @param {boolean} [forceRun=false]     Force the target to run even if the `runOnDevelopment`
   *                                       setting is `false`.
   * @param {boolean} [forceWatch=false]   Force Rollup to use the watch mode even if the `watch`
   *                                       setting for the required build type is set to `false`.
   * @param {boolean} [forceInspect=false] Enables the Node inspector even if the target setting
   *                                       is set to `false`.
   * @param {boolean} [forceAnalyze=false] Enables the bundle analyzer.
   * @return {string}
   */
  getBuildCommand(
    target,
    buildType,
    forceRun = false,
    forceWatch = false,
    forceInspect = false,
    forceAnalyze = false
  ) {
    const vars = this._getEnvVarsAsString({
      target: target.name,
      type: buildType,
      run: forceRun,
      watch: forceWatch,
      inspect: forceInspect,
      analyze: forceAnalyze,
    });

    const config = path.join(
      'node_modules',
      this.rollupPluginInfo.name,
      this.rollupPluginInfo.configuration
    );

    const optionsList = [];

    if ((buildType === 'development' && target.runOnDevelopment) || forceRun || forceWatch) {
      optionsList.push('--watch');
    }

    const options = optionsList.join(' ');

    return `${vars} rollup --config ${config} ${options}`;
  }
  /**
   * Get a Rollup configuration for a target.
   * @param {Target} target    The target configuration.
   * @param {string} buildType The intended build type: `development` or `production`.
   * @return {object}
   */
  getConfiguration(target, buildType) {
    return this.rollupConfiguration.getConfig(target, buildType);
  }
  /**
   * Get a Rollup configuration by reading the environment variables sent by the CLI command
   * `getBuildCommand` generates.
   * @return {object}
   * @throws {Error} If the environment variables are not present.
   */
  getRollupConfig() {
    const vars = this._getEnvVarsValues();
    if (!vars.target || !vars.type) {
      throw new Error('This file can only be run by using the `build` command');
    }

    const {
      type,
      run,
      inspect,
      analyze,
    } = vars;
    const target = Object.assign({}, this.targets.getTarget(vars.target));
    if (analyze === 'true') {
      target.analyze = true;
    } else {
      if (run === 'true') {
        target.runOnDevelopment = true;
        if (inspect === 'true') {
          target.inspect.enabled = true;
        }
      }

      if (vars.watch === 'true') {
        target.watch[type] = true;
      }
    }

    return this.getConfiguration(target, type);
  }
  /**
   * Given a dictionary with the environment variables purpose and values, this method generates
   * a string with the variables real names and values.
   * @example
   * console.log(_getEnvVarsAsString{
   *   target: 'my-target',
   *   type: 'development',
   * });
   * // will output `PXTRP_TARGET=my-target PXTRP_TYPE=development`
   * @param {object} values A dictionary with the purpose(alias) of the variables as keys.
   * @return {string}
   * @access protected
   * @ignore
   */
  _getEnvVarsAsString(values) {
    return Object.keys(values)
    .map((name) => `${this._envVars[name]}=${values[name]}`)
    .join(' ');
  }
  /**
   * Load the environment variables and returns them on a dictionary.
   * @return {object} The dictionary will have the purpose(alias) of the variables as keys.
   * @access protected
   * @ignore
   */
  _getEnvVarsValues() {
    const vars = {};
    Object.keys(this._envVars).forEach((name) => {
      vars[name] = this.environmentUtils.get(this._envVars[name]);
    });

    return vars;
  }
}
/**
 * The service provider that once registered on the app container will set an instance of
 * `RollupBuildEngine` as the `rollupBuildEngine` service.
 * @example
 * // Register it on the container
 * container.register(rollupBuildEngine);
 * // Getting access to the service instance
 * const rollupBuildEngine = container.get('rollupBuildEngine');
 * @type {Provider}
 */
const rollupBuildEngine = provider((app) => {
  app.set('rollupBuildEngine', () => new RollupBuildEngine(
    app.get('environmentUtils'),
    app.get('targets'),
    app.get('rollupConfiguration'),
    app.get('rollupPluginInfo')
  ));
});

module.exports = {
  RollupBuildEngine,
  rollupBuildEngine,
};
