const path = require('path');
const { provider } = require('jimple');
/**
 * This service reads the targets information and generates what would be the contents of a
 * Rollup configuration file for them.
 */
class RollupConfiguration {
  /**
   * Class constructor.
   * @param {BuildVersion}               buildVersion          To load the project version.
   * @param {Targets}                    targets               To get the target information.
   * @param {TargetsFileRules}           targetsFileRules      To get the file rules of the target.
   * @param {TargetConfigurationCreator} targetConfiguration   To create an overwrite
   *                                                           configuration for the target.
   * @param {RollupConfigurations}       rollupConfigurations  A dictionary of configurations
   *                                                           for target type and build type.
   */
  constructor(
    buildVersion,
    targets,
    targetsFileRules,
    targetConfiguration,
    rollupConfigurations
  ) {
    /**
     * A local reference for the `buildVersion` service.
     * @type {BuildVersion}
     */
    this.buildVersion = buildVersion;
    /**
     * A local reference for the `targets` service.
     * @type {Targets}
     */
    this.targets = targets;
    /**
     * A local reference for the `targetsFileRules` service.
     * @type {TargetsFileRules}
     */
    this.targetsFileRules = targetsFileRules;
    /**
     * A local reference for the `targetConfiguration` function service.
     * @type {TargetConfigurationCreator}
     */
    this.targetConfiguration = targetConfiguration;
    /**
     * A dictionary with the configurations for target type and build type.
     * @type {RollupConfigurations}
     */
    this.rollupConfigurations = rollupConfigurations;
  }
  /**
   * This method generates a complete Rollup configuration for a target.
   * @param {Target}  target    The target information.
   * @param {string}  buildType The intended build type: `production` or `development`.
   * @return {Object}
   * @throws {Error} If there's no base configuration for the target type.
   * @throws {Error} If there's no base configuration for the target type and build type.
   */
  getConfig(target, buildType) {
    const targetType = target.type;
    if (!this.rollupConfigurations[targetType]) {
      throw new Error(`There's no configuration for the selected target type: ${targetType}`);
    } else if (!this.rollupConfigurations[targetType][buildType]) {
      throw new Error(`There's no configuration for the selected build type: ${buildType}`);
    }

    const paths = target.output[buildType];

    const input = path.join(target.paths.source, target.entry[buildType]);

    const defaultFormat = target.is.node ? 'cjs' : 'iife';
    const format = target.library ?
      this._getLibraryFormat(target.libraryOptions) :
      defaultFormat;

    const output = {
      file: `./${target.folders.build}/${paths.js}`,
      format,
      sourcemap: !!(target.sourceMap && target.sourceMap[buildType]),
      name: target.name.replace(/-(\w)/ig, (match, letter) => letter.toUpperCase()),
    };

    if (target.library) {
      output.exports = 'named';
    }

    const copy = [];
    if (target.is.browser || target.bundle) {
      copy.push(...this.targets.getFilesToCopy(target, buildType));
    }

    const params = {
      input,
      output,
      target,
      targetRules: this.targetsFileRules.getRulesForTarget(target),
      definitions: this._getDefinitions(target, buildType),
      buildType,
      paths,
      copy,
    };

    let config = this.targetConfiguration(
      `rollup/${target.name}.config.js`,
      this.rollupConfigurations[targetType][buildType]
    );
    config = this.targetConfiguration(
      `rollup/${target.name}.${buildType}.config.js`,
      config
    ).getConfig(params);

    return config;
  }
  /**
   * Get a dictionary of definitions that will be replaced on the generated bundle. This is done
   * using the `replace` plugin.
   * @param {Target} target The target information.
   * @param {string} env    The `NODE_ENV` to define.
   * @return {Object}
   * @access protected
   * @ignore
   */
  _getDefinitions(target, env) {
    const definitions = {
      'process.env.NODE_ENV': `'${env}'`,
      [this.buildVersion.getDefinitionVariable()]: JSON.stringify(this.buildVersion.getVersion()),
    };

    if (
      target.is.browser &&
      target.configuration &&
      target.configuration.enabled
    ) {
      definitions[target.configuration.defineOn] = JSON.stringify(
        this.targets.getBrowserTargetConfiguration(target)
      );
    }

    return definitions;
  }
  /**
   * Validate and format a target library format in order to make it work with Rollup supported
   * types.
   * @param {ProjectConfigurationNodeTargetTemplateLibraryOptions} options The target library
   *                                                                       options.
   * @return {string}
   * @access protected
   * @ignore
   */
  _getLibraryFormat(options) {
    const format = options.libraryTarget.toLowerCase();
    let result;
    switch (format) {
    case 'commonjs2':
      result = 'cjs';
      break;
    case 'window':
    case 'umd':
    default:
      result = 'umd';
    }

    return result;
  }
}
/**
 * The service provider that once registered on the app container will set an instance of
 * `RollupConfiguration` as the `rollupConfiguration` service.
 * @example
 * // Register it on the container
 * container.register(rollupConfiguration);
 * // Getting access to the service instance
 * const rollupConfiguration = container.get('rollupConfiguration');
 * @type {Provider}
 */
const rollupConfiguration = provider((app) => {
  app.set('rollupConfiguration', () => {
    const rollupConfigurations = {
      node: {
        development: app.get('rollupNodeDevelopmentConfiguration'),
        production: app.get('rollupNodeProductionConfiguration'),
      },
      browser: {
        development: app.get('rollupBrowserDevelopmentConfiguration'),
        production: app.get('rollupBrowserProductionConfiguration'),
      },
    };

    return new RollupConfiguration(
      app.get('buildVersion'),
      app.get('targets'),
      app.get('targetsFileRules'),
      app.get('targetConfiguration'),
      rollupConfigurations
    );
  });
});

module.exports = {
  RollupConfiguration,
  rollupConfiguration,
};
