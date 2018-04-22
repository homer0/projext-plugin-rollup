const path = require('path');
const { provider } = require('jimple');

class RollupBuildEngine {
  constructor(
    environmentUtils,
    targets,
    rollupConfiguration,
    rollupPluginInfo
  ) {
    this.environmentUtils = environmentUtils;
    this.targets = targets;
    this.rollupConfiguration = rollupConfiguration;
    this.rollupPluginInfo = rollupPluginInfo;

    this.envVars = {
      target: 'PROJEXT_WEBPACK_TARGET',
      type: 'PROJEXT_WEBPACK_BUILD_TYPE',
      run: 'PROJEXT_WEBPACK_RUN',
    };
  }

  getBuildCommand(target, buildType, forceRun = false) {
    const vars = this.getEnvVarsAsString({
      target: target.name,
      type: buildType,
      run: forceRun,
    });

    const config = path.join(
      `node_modules/${this.rollupPluginInfo.name}`,
      this.rollupPluginInfo.configuration
    );

    const optionsList = [];

    if ((buildType === 'development' && target.runOnDevelopment) || forceRun) {
      optionsList.push('--watch');
    }

    const options = optionsList.join(' ');

    return `${vars} rollup --config ${config} ${options}`;
  }

  getConfiguration(target, buildType) {
    return this.rollupConfiguration.getConfig(target, buildType);
  }

  getRollupConfig() {
    const vars = this.getEnvVarsValues();
    if (!vars.target || !vars.type) {
      throw new Error('This file can only be run by using the `build` command');
    }

    const { type, run } = vars;
    const target = Object.assign({}, this.targets.getTarget(vars.target));
    if (run === 'true') {
      target.runOnDevelopment = true;
    }

    return this.getConfiguration(target, type);
  }

  getEnvVarsAsString(values) {
    return Object.keys(values)
    .map((name) => `${this.envVars[name]}=${values[name]}`)
    .join(' ');
  }

  getEnvVarsValues() {
    const vars = {};
    Object.keys(this.envVars).forEach((name) => {
      vars[name] = this.environmentUtils.get(this.envVars[name]);
    });

    return vars;
  }
}

const rollupBuildEngine = provider((app) => {
  app.set('rollupBuildEngine', () => new RollupBuildEngine(
    app.get('environmentUtils'),
    app.get('targets'),
    app.get('rollupConfiguration')
  ));
});

module.exports = {
  RollupBuildEngine,
  rollupBuildEngine,
};
