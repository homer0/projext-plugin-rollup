const path = require('path');
const { provider } = require('jimple');

class RollupConfiguration {
  constructor(
    buildVersion,
    pathUtils,
    targets,
    targetConfiguration,
    rollupConfigurations,
    rollupFileRulesConfiguration
  ) {
    this.buildVersion = buildVersion;
    this.pathUtils = pathUtils;
    this.targets = targets;
    this.targetConfiguration = targetConfiguration;
    this.rollupConfigurations = rollupConfigurations;
    this.rollupFileRulesConfiguration = rollupFileRulesConfiguration;
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

    const input = path.join(target.paths.source, target.entry[buildType]);

    const params = {
      target,
      input,
      definitions: this.getDefinitions(target, buildType),
      output: target.output[buildType],
      buildType,
    };

    params.rules = this.rollupFileRulesConfiguration.getConfig(params);

    let config = this.targetConfiguration(
      `rollup/${target.name}.config.js`,
      this.rollupConfigurations[targetType][buildType]
    );
    config = this.targetConfiguration(
      `rollup/${target.name}.${buildType}.config.js`,
      config
    ).getConfig(params);
    config.output = this.pathUtils.join(config.output);

    return config;
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
      app.get('pathUtils'),
      app.get('targets'),
      app.get('targetConfiguration'),
      rollupConfigurations,
      app.get('rollupFileRulesConfiguration')
    );
  });
});

module.exports = {
  RollupConfiguration,
  rollupConfiguration,
};
