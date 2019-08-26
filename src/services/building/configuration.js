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
   * @param {Target} target    The target information.
   * @param {string} buildType The intended build type: `production` or `development`.
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

    const paths = Object.assign({}, target.output[buildType]);

    const input = path.join(target.paths.source, target.entry[buildType]);

    const defaultFormat = this._getTargetDefaultFormat(target);
    const output = {
      sourcemap: !!(target.sourceMap && target.sourceMap[buildType]),
      name: target.name.replace(/-(\w)/ig, (match, letter) => letter.toUpperCase()),
    };

    if (target.library) {
      output.format = this._getLibraryFormat(target.libraryOptions);
      output.exports = 'named';
    } else {
      output.format = defaultFormat;
    }

    const filepath = `./${target.folders.build}/${paths.js}`;

    if (paths.jsChunks === true) {
      paths.jsChunks = this._generateChunkName(paths.js);
    }

    if (paths.jsChunks) {
      output.chunkFileNames = path.basename(paths.jsChunks);
      output.entryFileNames = path.basename(paths.js);
      output.dir = path.dirname(filepath);
      if (target.is.browser && !target.library) {
        output.format = 'es';
      }
    } else {
      output.file = filepath;
    }

    const copy = [];
    if (target.is.browser || target.bundle) {
      copy.push(...this.targets.getFilesToCopy(target, buildType));
    }

    const definitions = this._getDefinitionsGenerator(target, buildType);
    const additionalWatch = this._getBrowserTargetConfigurationDefinitions(target).files;

    const params = {
      input,
      output,
      target,
      targetRules: this.targetsFileRules.getRulesForTarget(target),
      definitions,
      buildType,
      paths,
      copy,
      additionalWatch,
      /**
       * The reason we are taking this property is because it's not part of the `Target` entity,
       * but it may be injected by the build engine.
       */
      analyze: !!target.analyze,
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
   * Based on the taget type, this method will decide which will be the default output format
   * the target will use. The reason this is the "default" format, it's because the service
   * can later changed dependeding in whether the target is a library or not.
   * @param {Target} target The target information.
   * @return {string}
   * @access protected
   * @ignore
   */
  _getTargetDefaultFormat(target) {
    return target.is.node ? 'cjs' : 'iife';
  }
  /**
   * Generates a function that when called will return a dictionary with definitions that will be
   * replaced on the bundle.
   * @param {Target} target    The target information.
   * @param {string} buildType The intended build type: `production` or `development`.
   * @return {Function():Object}
   * @access protected
   * @ignore
   */
  _getDefinitionsGenerator(target, buildType) {
    return () => this._getTargetDefinitions(target, buildType);
  }
  /**
   * Generates a dictionary with definitions that will be replaced on the bundle. These
   * definitions are things like `process.env.NODE_ENV`, the bundle version, a browser target
   * configuration, etc.
   * @param {Target} target    The target information.
   * @param {string} buildType The intended build type: `production` or `development`.
   * @return {Object}
   * @access protected
   * @ignore
   */
  _getTargetDefinitions(target, buildType) {
    const targetVariables = this.targets.loadTargetDotEnvFile(target, buildType);
    const definitions = Object.keys(targetVariables).reduce(
      (current, variableName) => Object.assign({}, current, {
        [`process.env.${variableName}`]: JSON.stringify(targetVariables[variableName]),
      }),
      {}
    );

    definitions['process.env.NODE_ENV'] = `'${buildType}'`;
    definitions[this.buildVersion.getDefinitionVariable()] = JSON.stringify(
      this.buildVersion.getVersion()
    );

    return Object.assign(
      {},
      definitions,
      this._getBrowserTargetConfigurationDefinitions(target).definitions
    );
  }
  /**
   * This is a wrapper on top of {@link Targets#getBrowserTargetConfiguration} so no matter the
   * type of target it recevies, or if the feature is disabled, it will always return the same
   * signature.
   * It also takes care of formatting the configuration on a "definitions object" so it can be
   * added to the rest of the targets definitions.
   * @param {Target} target The target information.
   * @return {Object}
   * @property {Object} definitions A dictionary with
   * @property {Array}  files       The list of files involved on the configuration creation.
   * @access protected
   * @ignore
   */
  _getBrowserTargetConfigurationDefinitions(target) {
    let result;
    if (target.is.browser && target.configuration && target.configuration.enabled) {
      const parsed = this.targets.getBrowserTargetConfiguration(target);
      result = {
        definitions: {
          [target.configuration.defineOn]: JSON.stringify(parsed.configuration),
        },
        files: parsed.files,
      };
    } else {
      result = {
        definitions: {},
        files: [],
      };
    }

    return result;
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
  /**
   * This is a small helper function that parses the default path of the JS file webpack will
   * emmit and adds a `[name]` placeholder for webpack to replace with the chunk name.
   * @param {string} jsPath The original path for the JS file.
   * @return {string}
   * @access protected
   * @ignore
   */
  _generateChunkName(jsPath) {
    const parsed = path.parse(jsPath);
    return path.join(parsed.dir, `${parsed.name}.[name]${parsed.ext}`);
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
