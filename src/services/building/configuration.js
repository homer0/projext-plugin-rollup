const path = require('path');
const { provider } = require('jimple');

class RollupConfiguration {
  constructor(
    buildVersion,
    targets,
    targetsFileRules,
    targetConfiguration,
    rollupConfigurations
  ) {
    this.buildVersion = buildVersion;
    this.targets = targets;
    this.targetsFileRules = targetsFileRules;
    this.targetConfiguration = targetConfiguration;
    this.rollupConfigurations = rollupConfigurations;
  }

  getDefinitions(target, env) {
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

    const params = {
      input,
      output,
      target,
      targetRules: this.targetsFileRules.getRulesForTarget(target),
      definitions: this.getDefinitions(target, buildType),
      buildType,
      paths,
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
