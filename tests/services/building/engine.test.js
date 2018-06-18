const JimpleMock = require('/tests/mocks/jimple.mock');

jest.mock('jimple', () => JimpleMock);
jest.unmock('/src/services/building/engine');

require('jasmine-expect');
const {
  RollupBuildEngine,
  rollupBuildEngine,
} = require('/src/services/building/engine');

describe('services/building:engine', () => {
  it('should be instantiated with all its dependencies', () => {
    // Given
    const environmentUtils = 'environmentUtils';
    const targets = 'targets';
    const rollupConfiguration = 'rollupConfiguration';
    const rollupPluginInfo = 'rollupPluginInfo';
    let sut = null;
    // When
    sut = new RollupBuildEngine(
      environmentUtils,
      targets,
      rollupConfiguration,
      rollupPluginInfo
    );
    // Then
    expect(sut).toBeInstanceOf(RollupBuildEngine);
    expect(sut.environmentUtils).toBe(environmentUtils);
    expect(sut.targets).toBe(targets);
    expect(sut.rollupConfiguration).toBe(rollupConfiguration);
    expect(sut.rollupPluginInfo).toBe(rollupPluginInfo);
  });

  it('should return the command to build a target', () => {
    // Given
    const environmentUtils = 'environmentUtils';
    const targets = 'targets';
    const rollupConfiguration = 'rollupConfiguration';
    const rollupPluginInfo = {
      name: 'my-projext-plugin-rollup',
      configuration: 'my-rollup.config.jsx',
    };
    const buildType = 'development';
    const target = {
      name: 'some-target',
      is: {
        browser: true,
      },
    };
    let sut = null;
    let result = null;
    const expectedConfigPath = 'node_modules' +
      `/${rollupPluginInfo.name}/${rollupPluginInfo.configuration}`;
    // When
    sut = new RollupBuildEngine(
      environmentUtils,
      targets,
      rollupConfiguration,
      rollupPluginInfo
    );
    result = sut.getBuildCommand(target, buildType);
    // Then
    expect(result).toMatch(/PROJEXT_ROLLUP_TARGET=(?:[\w0-9-_]*?).*?rollup/);
    expect(result).toMatch(/PROJEXT_ROLLUP_BUILD_TYPE=(?:\w+).*?rollup/);
    expect(result).toMatch(/PROJEXT_ROLLUP_RUN=(?:true|false).*?rollup/);
    expect(result).toMatch(new RegExp(`rollup --config ${expectedConfigPath}`));
  });

  it('should return the command to build and run a target', () => {
    // Given
    const environmentUtils = 'environmentUtils';
    const targets = 'targets';
    const rollupConfiguration = 'rollupConfiguration';
    const rollupPluginInfo = {
      name: 'my-projext-plugin-rollup',
      configuration: 'my-rollup.config.jsx',
    };
    const buildType = 'development';
    const target = {
      name: 'some-target',
      is: {
        browser: true,
      },
      runOnDevelopment: true,
    };
    let sut = null;
    let result = null;
    const expectedConfigPath = 'node_modules' +
      `/${rollupPluginInfo.name}/${rollupPluginInfo.configuration}`;
    // When
    sut = new RollupBuildEngine(
      environmentUtils,
      targets,
      rollupConfiguration,
      rollupPluginInfo
    );
    result = sut.getBuildCommand(target, buildType);
    // Then
    expect(result).toMatch(/PROJEXT_ROLLUP_TARGET=(?:[\w0-9-_]*?).*?rollup/);
    expect(result).toMatch(/PROJEXT_ROLLUP_BUILD_TYPE=(?:\w+).*?rollup/);
    expect(result).toMatch(/PROJEXT_ROLLUP_RUN=(?:true|false).*?rollup/);
    expect(result).toMatch(new RegExp(`rollup --config ${expectedConfigPath}`));
    expect(result).toMatch(/rollup --config.*?--watch/);
  });

  it('should return the command to build and `force` run a target', () => {
    // Given
    const environmentUtils = 'environmentUtils';
    const targets = 'targets';
    const rollupConfiguration = 'rollupConfiguration';
    const rollupPluginInfo = {
      name: 'my-projext-plugin-rollup',
      configuration: 'my-rollup.config.jsx',
    };
    const buildType = 'development';
    const target = {
      name: 'some-target',
      is: {
        browser: true,
      },
      runOnDevelopment: false,
    };
    let sut = null;
    let result = null;
    // When
    sut = new RollupBuildEngine(
      environmentUtils,
      targets,
      rollupConfiguration,
      rollupPluginInfo
    );
    result = sut.getBuildCommand(target, buildType, true);
    // Then
    expect(result).toMatch(/PROJEXT_ROLLUP_TARGET=(?:[\w0-9-_]*?).*?rollup/);
    expect(result).toMatch(/PROJEXT_ROLLUP_BUILD_TYPE=(?:\w+).*?rollup/);
    expect(result).toMatch(/PROJEXT_ROLLUP_RUN=(?:true|false).*?rollup/);
    expect(result).toMatch(/rollup --config ([\w_\-/]*?)rollup\.config\.js/);
    expect(result).toMatch(/rollup --config.*?--watch/);
  });

  it('should return a target Rollup configuration from the configurations service', () => {
    // Given
    const environmentUtils = 'environmentUtils';
    const targets = 'targets';
    const target = 'some-target';
    const buildType = 'production';
    const config = 'config';
    const rollupConfiguration = {
      getConfig: jest.fn(() => config),
    };
    const rollupPluginInfo = {
      name: 'my-projext-plugin-rollup',
      configuration: 'my-rollup.config.jsx',
    };
    let sut = null;
    let result = null;
    // When
    sut = new RollupBuildEngine(
      environmentUtils,
      targets,
      rollupConfiguration,
      rollupPluginInfo
    );
    result = sut.getConfiguration(target, buildType);
    // Then
    expect(result).toBe(config);
    expect(rollupConfiguration.getConfig).toHaveBeenCalledTimes(1);
    expect(rollupConfiguration.getConfig).toHaveBeenCalledWith(target, buildType);
  });

  it('should return a target Rollup configuration', () => {
    // Given
    const targetName = 'some-target';
    const buildType = 'development';
    const run = false;
    const target = {
      name: targetName,
    };
    const envVars = {
      PROJEXT_ROLLUP_TARGET: targetName,
      PROJEXT_ROLLUP_BUILD_TYPE: buildType,
      PROJEXT_ROLLUP_RUN: run.toString(),
    };
    const envVarsNames = Object.keys(envVars);
    const environmentUtils = {
      get: jest.fn((varName) => envVars[varName]),
    };
    const targets = {
      getTarget: jest.fn(() => target),
    };
    const config = 'config';
    const rollupConfiguration = {
      getConfig: jest.fn(() => config),
    };
    const rollupPluginInfo = {
      name: 'my-projext-plugin-rollup',
      configuration: 'my-rollup.config.jsx',
    };
    let sut = null;
    let result = null;
    // When
    sut = new RollupBuildEngine(
      environmentUtils,
      targets,
      rollupConfiguration,
      rollupPluginInfo
    );
    result = sut.getRollupConfig();
    // Then
    expect(result).toBe(config);
    expect(rollupConfiguration.getConfig).toHaveBeenCalledTimes(1);
    expect(rollupConfiguration.getConfig).toHaveBeenCalledWith(target, buildType);
    expect(targets.getTarget).toHaveBeenCalledTimes(1);
    expect(targets.getTarget).toHaveBeenCalledWith(targetName);
    expect(environmentUtils.get).toHaveBeenCalledTimes(envVarsNames.length);
    envVarsNames.forEach((envVar) => {
      expect(environmentUtils.get).toHaveBeenCalledWith(envVar);
    });
  });

  it('should return a Rollup configuration for running a target', () => {
    // Given
    const targetName = 'some-target';
    const buildType = 'development';
    const run = true;
    const target = {
      name: targetName,
    };
    const envVars = {
      PROJEXT_ROLLUP_TARGET: targetName,
      PROJEXT_ROLLUP_BUILD_TYPE: buildType,
      PROJEXT_ROLLUP_RUN: run.toString(),
    };
    const envVarsNames = Object.keys(envVars);
    const environmentUtils = {
      get: jest.fn((varName) => envVars[varName]),
    };
    const targets = {
      getTarget: jest.fn(() => target),
    };
    const config = 'config';
    const rollupConfiguration = {
      getConfig: jest.fn(() => config),
    };
    const rollupPluginInfo = {
      name: 'my-projext-plugin-rollup',
      configuration: 'my-rollup.config.jsx',
    };
    let sut = null;
    let result = null;
    // When
    sut = new RollupBuildEngine(
      environmentUtils,
      targets,
      rollupConfiguration,
      rollupPluginInfo
    );
    result = sut.getRollupConfig();
    // Then
    expect(result).toBe(config);
    expect(rollupConfiguration.getConfig).toHaveBeenCalledTimes(1);
    expect(rollupConfiguration.getConfig).toHaveBeenCalledWith(Object.assign(
      {},
      target,
      {
        runOnDevelopment: true,
      }
    ), buildType);
    expect(targets.getTarget).toHaveBeenCalledTimes(1);
    expect(targets.getTarget).toHaveBeenCalledWith(targetName);
    expect(environmentUtils.get).toHaveBeenCalledTimes(envVarsNames.length);
    envVarsNames.forEach((envVar) => {
      expect(environmentUtils.get).toHaveBeenCalledWith(envVar);
    });
  });

  it('should throw an error when getting a configuration without the env variables', () => {
    // Given
    const envVarsNames = [
      'PROJEXT_ROLLUP_TARGET',
      'PROJEXT_ROLLUP_BUILD_TYPE',
      'PROJEXT_ROLLUP_RUN',
    ];
    const environmentUtils = {
      get: jest.fn(),
    };
    const targets = 'targets';
    const rollupConfiguration = 'rollupConfiguration';
    const rollupPluginInfo = 'rollupPluginInfo';
    let sut = null;
    // When
    sut = new RollupBuildEngine(
      environmentUtils,
      targets,
      rollupConfiguration,
      rollupPluginInfo
    );
    // Then
    expect(() => sut.getRollupConfig()).toThrow(/can only be run by using the `build` command/);
    expect(environmentUtils.get).toHaveBeenCalledTimes(envVarsNames.length);
    envVarsNames.forEach((envVar) => {
      expect(environmentUtils.get).toHaveBeenCalledWith(envVar);
    });
  });

  it('should include a provider for the DIC', () => {
    // Given
    let sut = null;
    const container = {
      set: jest.fn(),
      get: jest.fn((service) => service),
    };
    let serviceName = null;
    let serviceFn = null;
    // When
    rollupBuildEngine(container);
    [[serviceName, serviceFn]] = container.set.mock.calls;
    sut = serviceFn();
    // Then
    expect(serviceName).toBe('rollupBuildEngine');
    expect(serviceFn).toBeFunction();
    expect(sut).toBeInstanceOf(RollupBuildEngine);
    expect(sut.environmentUtils).toBe('environmentUtils');
    expect(sut.targets).toBe('targets');
    expect(sut.rollupConfiguration).toBe('rollupConfiguration');
    expect(sut.rollupPluginInfo).toBe('rollupPluginInfo');
  });
});