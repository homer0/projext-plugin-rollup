const JimpleMock = require('/tests/mocks/jimple.mock');

jest.mock('jimple', () => JimpleMock);
jest.unmock('/src/services/building/configuration');

const path = require('path');
require('jasmine-expect');
const {
  RollupConfiguration,
  rollupConfiguration,
} = require('/src/services/building/configuration');

const originalNow = Date.now;

describe('services/building:configuration', () => {
  afterEach(() => {
    Date.now = originalNow;
  });

  it('should be instantiated with all its dependencies', () => {
    // Given
    const buildVersion = 'buildVersion';
    const targets = 'targets';
    const targetsFileRules = 'targetsFileRules';
    const targetConfiguration = 'targetConfiguration';
    const rollupConfigurations = 'rollupConfigurations';
    let sut = null;
    // When
    sut = new RollupConfiguration(
      buildVersion,
      targets,
      targetsFileRules,
      targetConfiguration,
      rollupConfigurations
    );
    // Then
    expect(sut).toBeInstanceOf(RollupConfiguration);
    expect(sut.buildVersion).toBe(buildVersion);
    expect(sut.targets).toBe(targets);
    expect(sut.targetsFileRules).toBe(targetsFileRules);
    expect(sut.targetConfiguration).toBe(targetConfiguration);
    expect(sut.rollupConfigurations).toBe(rollupConfigurations);
  });

  it('should throw an error when trying to build a target with an invalid type', () => {
    // Given
    const buildVersion = 'buildVersion';
    const targets = {
      loadTargetDotEnvFile: jest.fn(() => ({})),
    };
    const targetsFileRules = 'targetsFileRules';
    const targetConfiguration = 'targetConfiguration';
    const target = {
      type: 'random-type',
    };
    const rollupConfigurations = {};
    let sut = null;
    // When
    sut = new RollupConfiguration(
      buildVersion,
      targets,
      targetsFileRules,
      targetConfiguration,
      rollupConfigurations
    );
    // Then
    expect(() => sut.getConfig(target))
    .toThrow(/there's no configuration for the selected target type/i);
  });

  it('should throw an error when trying to build with an unknown build type', () => {
    // Given
    const buildVersion = 'buildVersion';
    const targets = {
      loadTargetDotEnvFile: jest.fn(() => ({})),
    };
    const targetsFileRules = 'targetsFileRules';
    const targetConfiguration = 'targetConfiguration';
    const target = {
      type: 'node',
    };
    const buildType = 'randomType';
    const rollupConfigurations = {
      node: {},
    };
    let sut = null;
    // When
    sut = new RollupConfiguration(
      buildVersion,
      targets,
      targetsFileRules,
      targetConfiguration,
      rollupConfigurations
    );
    // Then
    expect(() => sut.getConfig(target, buildType))
    .toThrow(/there's no configuration for the selected build type/i);
  });

  it('should generate the configuration for a Node target', () => {
    // Given
    const versionVariable = 'process.env.VERSION';
    const version = 'latest';
    const buildVersion = {
      getDefinitionVariable: jest.fn(() => versionVariable),
      getVersion: jest.fn(() => version),
    };
    const config = {
      output: {
        path: 'some-output-path',
      },
    };
    const targetConfig = {
      getConfig: jest.fn(() => config),
    };
    const envVarName = 'ROSARIO';
    const envVarValue = 'Charito';
    const targets = {
      loadTargetDotEnvFile: jest.fn(() => ({
        [envVarName]: envVarValue,
      })),
    };
    const targetRules = 'target-rule';
    const targetsFileRules = {
      getRulesForTarget: jest.fn(() => targetRules),
    };
    const targetConfiguration = jest.fn(() => targetConfig);
    const buildType = 'development';
    const target = {
      type: 'node',
      name: 'target',
      paths: {
        source: 'src/target',
      },
      folders: {
        build: 'dist/target',
      },
      entry: {
        [buildType]: 'index.js',
      },
      output: {
        [buildType]: {
          js: 'target.js',
          css: 'css/target/file.2509.css',
          fonts: 'fonts/target/[name].2509.[ext]',
          images: 'images/target/[name].2509.[ext]',
        },
      },
      babel: {},
      library: false,
      is: {
        node: true,
        browser: false,
      },
    };
    const rollupConfigurations = {
      [target.type]: {
        [buildType]: {},
      },
    };
    let sut = null;
    let result = null;
    // When
    sut = new RollupConfiguration(
      buildVersion,
      targets,
      targetsFileRules,
      targetConfiguration,
      rollupConfigurations
    );
    result = sut.getConfig(target, buildType);
    // Then
    expect(result).toEqual(config);
    expect(buildVersion.getDefinitionVariable).toHaveBeenCalledTimes(1);
    expect(buildVersion.getVersion).toHaveBeenCalledTimes(1);
    expect(targetsFileRules.getRulesForTarget).toHaveBeenCalledTimes(1);
    expect(targetsFileRules.getRulesForTarget).toHaveBeenCalledWith(target);
    expect(targetConfiguration).toHaveBeenCalledTimes(['global', 'byBuildType'].length);
    expect(targetConfiguration).toHaveBeenCalledWith(
      `rollup/${target.name}.config.js`,
      {}
    );
    expect(targetConfiguration).toHaveBeenCalledWith(
      `rollup/${target.name}.${buildType}.config.js`,
      targetConfig
    );
    expect(targets.loadTargetDotEnvFile).toHaveBeenCalledTimes(1);
    expect(targets.loadTargetDotEnvFile).toHaveBeenCalledWith(target, buildType);
    expect(targetConfig.getConfig).toHaveBeenCalledTimes(1);
    expect(targetConfig.getConfig).toHaveBeenCalledWith({
      input: path.join(target.paths.source, target.entry[buildType]),
      output: {
        file: `./${target.folders.build}/${target.output[buildType].js}`,
        format: 'cjs',
        sourcemap: false,
        name: 'target',
      },
      target,
      buildType,
      targetRules,
      definitions: {
        [`process.env.${envVarName}`]: `"${envVarValue}"`,
        'process.env.NODE_ENV': `'${buildType}'`,
        [versionVariable]: `"${version}"`,
      },
      paths: target.output[buildType],
      copy: [],
    });
  });

  it('should generate the configuration for a Node target that requires bundling', () => {
    // Given
    const versionVariable = 'process.env.VERSION';
    const version = 'latest';
    const buildVersion = {
      getDefinitionVariable: jest.fn(() => versionVariable),
      getVersion: jest.fn(() => version),
    };
    const config = {
      output: {
        path: 'some-output-path',
      },
    };
    const targetConfig = {
      getConfig: jest.fn(() => config),
    };
    const filesToCopy = ['copy'];
    const targets = {
      getFilesToCopy: jest.fn(() => filesToCopy),
      loadTargetDotEnvFile: jest.fn(() => ({})),
    };
    const targetRules = 'target-rule';
    const targetsFileRules = {
      getRulesForTarget: jest.fn(() => targetRules),
    };
    const targetConfiguration = jest.fn(() => targetConfig);
    const buildType = 'development';
    const target = {
      type: 'node',
      name: 'target',
      paths: {
        source: 'src/target',
      },
      folders: {
        build: 'dist/target',
      },
      entry: {
        [buildType]: 'index.js',
      },
      output: {
        [buildType]: {
          js: 'target.js',
          css: 'css/target/file.2509.css',
          fonts: 'fonts/target/[name].2509.[ext]',
          images: 'images/target/[name].2509.[ext]',
        },
      },
      babel: {},
      library: false,
      bundle: true,
      is: {
        node: true,
        browser: false,
      },
    };
    const rollupConfigurations = {
      [target.type]: {
        [buildType]: {},
      },
    };
    let sut = null;
    let result = null;
    // When
    sut = new RollupConfiguration(
      buildVersion,
      targets,
      targetsFileRules,
      targetConfiguration,
      rollupConfigurations
    );
    result = sut.getConfig(target, buildType);
    // Then
    expect(result).toEqual(config);
    expect(buildVersion.getDefinitionVariable).toHaveBeenCalledTimes(1);
    expect(buildVersion.getVersion).toHaveBeenCalledTimes(1);
    expect(targetsFileRules.getRulesForTarget).toHaveBeenCalledTimes(1);
    expect(targetsFileRules.getRulesForTarget).toHaveBeenCalledWith(target);
    expect(targetConfiguration).toHaveBeenCalledTimes(['global', 'byBuildType'].length);
    expect(targetConfiguration).toHaveBeenCalledWith(
      `rollup/${target.name}.config.js`,
      {}
    );
    expect(targetConfiguration).toHaveBeenCalledWith(
      `rollup/${target.name}.${buildType}.config.js`,
      targetConfig
    );
    expect(targets.loadTargetDotEnvFile).toHaveBeenCalledTimes(1);
    expect(targets.loadTargetDotEnvFile).toHaveBeenCalledWith(target, buildType);
    expect(targetConfig.getConfig).toHaveBeenCalledTimes(1);
    expect(targetConfig.getConfig).toHaveBeenCalledWith({
      input: path.join(target.paths.source, target.entry[buildType]),
      output: {
        file: `./${target.folders.build}/${target.output[buildType].js}`,
        format: 'cjs',
        sourcemap: false,
        name: 'target',
      },
      target,
      buildType,
      targetRules,
      definitions: {
        'process.env.NODE_ENV': `'${buildType}'`,
        [versionVariable]: `"${version}"`,
      },
      paths: target.output[buildType],
      copy: filesToCopy,
    });
    expect(targets.getFilesToCopy).toHaveBeenCalledTimes(1);
    expect(targets.getFilesToCopy).toHaveBeenCalledWith(target, buildType);
  });

  it('should generate the configuration for a Node target that requires code splitting', () => {
    // Given
    const versionVariable = 'process.env.VERSION';
    const version = 'latest';
    const buildVersion = {
      getDefinitionVariable: jest.fn(() => versionVariable),
      getVersion: jest.fn(() => version),
    };
    const config = {
      output: {
        path: 'some-output-path',
      },
    };
    const targetConfig = {
      getConfig: jest.fn(() => config),
    };
    const filesToCopy = ['copy'];
    const targets = {
      getFilesToCopy: jest.fn(() => filesToCopy),
      loadTargetDotEnvFile: jest.fn(() => ({})),
    };
    const targetRules = 'target-rule';
    const targetsFileRules = {
      getRulesForTarget: jest.fn(() => targetRules),
    };
    const targetConfiguration = jest.fn(() => targetConfig);
    const buildType = 'development';
    const target = {
      type: 'node',
      name: 'target',
      paths: {
        source: 'src/target',
      },
      folders: {
        build: 'dist/target',
      },
      entry: {
        [buildType]: 'index.js',
      },
      output: {
        [buildType]: {
          js: 'target.js',
          jsChunks: true,
          css: 'css/target/file.2509.css',
          fonts: 'fonts/target/[name].2509.[ext]',
          images: 'images/target/[name].2509.[ext]',
        },
      },
      babel: {},
      library: false,
      bundle: true,
      is: {
        node: true,
        browser: false,
      },
    };
    const rollupConfigurations = {
      [target.type]: {
        [buildType]: {},
      },
    };
    let sut = null;
    let result = null;
    // When
    sut = new RollupConfiguration(
      buildVersion,
      targets,
      targetsFileRules,
      targetConfiguration,
      rollupConfigurations
    );
    result = sut.getConfig(target, buildType);
    // Then
    expect(result).toEqual(config);
    expect(buildVersion.getDefinitionVariable).toHaveBeenCalledTimes(1);
    expect(buildVersion.getVersion).toHaveBeenCalledTimes(1);
    expect(targetsFileRules.getRulesForTarget).toHaveBeenCalledTimes(1);
    expect(targetsFileRules.getRulesForTarget).toHaveBeenCalledWith(target);
    expect(targetConfiguration).toHaveBeenCalledTimes(['global', 'byBuildType'].length);
    expect(targetConfiguration).toHaveBeenCalledWith(
      `rollup/${target.name}.config.js`,
      {}
    );
    expect(targetConfiguration).toHaveBeenCalledWith(
      `rollup/${target.name}.${buildType}.config.js`,
      targetConfig
    );
    expect(targets.loadTargetDotEnvFile).toHaveBeenCalledTimes(1);
    expect(targets.loadTargetDotEnvFile).toHaveBeenCalledWith(target, buildType);
    expect(targetConfig.getConfig).toHaveBeenCalledTimes(1);
    expect(targetConfig.getConfig).toHaveBeenCalledWith({
      input: path.join(target.paths.source, target.entry[buildType]),
      output: {
        chunkFileNames: target.output[buildType].js.replace(/\.js$/, '.[name].js'),
        entryFileNames: target.output[buildType].js,
        dir: `./${target.folders.build}`,
        format: 'cjs',
        sourcemap: false,
        name: 'target',
      },
      target,
      buildType,
      targetRules,
      definitions: {
        'process.env.NODE_ENV': `'${buildType}'`,
        [versionVariable]: `"${version}"`,
      },
      paths: Object.assign({}, target.output[buildType], {
        jsChunks: target.output[buildType].js.replace(/\.js$/, '.[name].js'),
      }),
      copy: filesToCopy,
    });
    expect(targets.getFilesToCopy).toHaveBeenCalledTimes(1);
    expect(targets.getFilesToCopy).toHaveBeenCalledWith(target, buildType);
  });

  it('should generate the configuration for a browser target', () => {
    // Given
    const hash = '2509';
    Date.now = () => hash;
    const versionVariable = 'process.env.VERSION';
    const version = 'latest';
    const buildVersion = {
      getDefinitionVariable: jest.fn(() => versionVariable),
      getVersion: jest.fn(() => version),
    };
    const config = {
      output: {
        path: 'some-output-path',
      },
    };
    const targetConfig = {
      getConfig: jest.fn(() => config),
    };
    const filesToCopy = ['copy'];
    const targets = {
      getFilesToCopy: jest.fn(() => filesToCopy),
      loadTargetDotEnvFile: jest.fn(() => ({})),
    };
    const targetRules = 'target-rule';
    const targetsFileRules = {
      getRulesForTarget: jest.fn(() => targetRules),
    };
    const targetConfiguration = jest.fn(() => targetConfig);
    const buildType = 'development';
    const target = {
      type: 'browser',
      name: 'target',
      paths: {
        source: 'src/target',
      },
      folders: {
        build: 'dist/target',
      },
      entry: {
        [buildType]: 'index.js',
      },
      output: {
        [buildType]: {
          js: 'js/target/file.2509.js',
          css: 'css/target/file.2509.css',
          fonts: 'fonts/target/[name].2509.[ext]',
          images: 'images/target/[name].2509.[ext]',
        },
      },
      babel: {},
      library: false,
      is: {
        node: false,
        browser: true,
      },
    };
    const rollupConfigurations = {
      [target.type]: {
        [buildType]: {},
      },
    };
    let sut = null;
    let result = null;
    // When
    sut = new RollupConfiguration(
      buildVersion,
      targets,
      targetsFileRules,
      targetConfiguration,
      rollupConfigurations
    );
    result = sut.getConfig(target, buildType);
    // Then
    expect(result).toEqual(config);
    expect(buildVersion.getDefinitionVariable).toHaveBeenCalledTimes(1);
    expect(buildVersion.getVersion).toHaveBeenCalledTimes(1);
    expect(targetConfiguration).toHaveBeenCalledTimes(['global', 'byBuildType'].length);
    expect(targetConfiguration).toHaveBeenCalledWith(
      `rollup/${target.name}.config.js`,
      {}
    );
    expect(targetConfiguration).toHaveBeenCalledWith(
      `rollup/${target.name}.${buildType}.config.js`,
      targetConfig
    );
    expect(targets.loadTargetDotEnvFile).toHaveBeenCalledTimes(1);
    expect(targets.loadTargetDotEnvFile).toHaveBeenCalledWith(target, buildType);
    expect(targetConfig.getConfig).toHaveBeenCalledTimes(1);
    expect(targetConfig.getConfig).toHaveBeenCalledWith({
      input: path.join(target.paths.source, target.entry[buildType]),
      output: {
        file: `./${target.folders.build}/${target.output[buildType].js}`,
        format: 'iife',
        sourcemap: false,
        name: 'target',
      },
      target,
      buildType,
      targetRules,
      definitions: {
        'process.env.NODE_ENV': `'${buildType}'`,
        [versionVariable]: `"${version}"`,
      },
      paths: target.output[buildType],
      copy: filesToCopy,
    });
    expect(targets.getFilesToCopy).toHaveBeenCalledTimes(1);
    expect(targets.getFilesToCopy).toHaveBeenCalledWith(target, buildType);
  });

  it('should generate the configuration for a browser target with code splitting', () => {
    // Given
    const hash = '2509';
    Date.now = () => hash;
    const versionVariable = 'process.env.VERSION';
    const version = 'latest';
    const buildVersion = {
      getDefinitionVariable: jest.fn(() => versionVariable),
      getVersion: jest.fn(() => version),
    };
    const config = {
      output: {
        path: 'some-output-path',
      },
    };
    const targetConfig = {
      getConfig: jest.fn(() => config),
    };
    const filesToCopy = ['copy'];
    const targets = {
      getFilesToCopy: jest.fn(() => filesToCopy),
      loadTargetDotEnvFile: jest.fn(() => ({})),
    };
    const targetRules = 'target-rule';
    const targetsFileRules = {
      getRulesForTarget: jest.fn(() => targetRules),
    };
    const targetConfiguration = jest.fn(() => targetConfig);
    const buildType = 'development';
    const target = {
      type: 'browser',
      name: 'target',
      paths: {
        source: 'src/target',
      },
      folders: {
        build: 'dist/target',
      },
      entry: {
        [buildType]: 'index.js',
      },
      output: {
        [buildType]: {
          js: 'js/target/file.2509.js',
          jsChunks: 'js/target/file.2509.[name].js',
          css: 'css/target/file.2509.css',
          fonts: 'fonts/target/[name].2509.[ext]',
          images: 'images/target/[name].2509.[ext]',
        },
      },
      babel: {},
      library: false,
      is: {
        node: false,
        browser: true,
      },
    };
    const rollupConfigurations = {
      [target.type]: {
        [buildType]: {},
      },
    };
    let sut = null;
    let result = null;
    // When
    sut = new RollupConfiguration(
      buildVersion,
      targets,
      targetsFileRules,
      targetConfiguration,
      rollupConfigurations
    );
    result = sut.getConfig(target, buildType);
    // Then
    expect(result).toEqual(config);
    expect(buildVersion.getDefinitionVariable).toHaveBeenCalledTimes(1);
    expect(buildVersion.getVersion).toHaveBeenCalledTimes(1);
    expect(targetConfiguration).toHaveBeenCalledTimes(['global', 'byBuildType'].length);
    expect(targetConfiguration).toHaveBeenCalledWith(
      `rollup/${target.name}.config.js`,
      {}
    );
    expect(targetConfiguration).toHaveBeenCalledWith(
      `rollup/${target.name}.${buildType}.config.js`,
      targetConfig
    );
    expect(targets.loadTargetDotEnvFile).toHaveBeenCalledTimes(1);
    expect(targets.loadTargetDotEnvFile).toHaveBeenCalledWith(target, buildType);
    expect(targetConfig.getConfig).toHaveBeenCalledTimes(1);
    expect(targetConfig.getConfig).toHaveBeenCalledWith({
      input: path.join(target.paths.source, target.entry[buildType]),
      output: {
        chunkFileNames: path.basename(target.output[buildType].jsChunks),
        entryFileNames: path.basename(target.output[buildType].js),
        dir: path.dirname(`./${target.folders.build}/${target.output[buildType].js}`),
        format: 'es',
        sourcemap: false,
        name: 'target',
      },
      target,
      buildType,
      targetRules,
      definitions: {
        'process.env.NODE_ENV': `'${buildType}'`,
        [versionVariable]: `"${version}"`,
      },
      paths: target.output[buildType],
      copy: filesToCopy,
    });
    expect(targets.getFilesToCopy).toHaveBeenCalledTimes(1);
    expect(targets.getFilesToCopy).toHaveBeenCalledWith(target, buildType);
  });

  it('should generate the configuration for a browser target and `define` its config', () => {
    // Given
    const versionVariable = 'process.env.VERSION';
    const version = 'latest';
    const buildVersion = {
      getDefinitionVariable: jest.fn(() => versionVariable),
      getVersion: jest.fn(() => version),
    };
    const config = {
      output: {
        path: 'some-output-path',
      },
    };
    const targetConfig = {
      getConfig: jest.fn(() => config),
    };
    const targetBrowserConfig = {
      someProp: 'someValue',
    };
    const filesToCopy = ['copy'];
    const targets = {
      getBrowserTargetConfiguration: jest.fn(() => targetBrowserConfig),
      getFilesToCopy: jest.fn(() => filesToCopy),
      loadTargetDotEnvFile: jest.fn(() => ({})),
    };
    const targetRules = 'target-rule';
    const targetsFileRules = {
      getRulesForTarget: jest.fn(() => targetRules),
    };
    const targetConfiguration = jest.fn(() => targetConfig);
    const buildType = 'development';
    const target = {
      type: 'browser',
      name: 'target',
      paths: {
        source: 'src/target',
      },
      folders: {
        build: 'dist/target',
      },
      entry: {
        [buildType]: 'index.js',
      },
      output: {
        [buildType]: {
          js: 'target.js',
        },
      },
      babel: {},
      library: false,
      is: {
        browser: true,
      },
      configuration: {
        enabled: true,
        defineOn: 'process.env.CONFIG',
      },
    };
    const rollupConfigurations = {
      [target.type]: {
        [buildType]: {},
      },
    };
    let sut = null;
    let result = null;
    // When
    sut = new RollupConfiguration(
      buildVersion,
      targets,
      targetsFileRules,
      targetConfiguration,
      rollupConfigurations
    );
    result = sut.getConfig(target, buildType);
    // Then
    expect(result).toEqual(config);
    expect(buildVersion.getDefinitionVariable).toHaveBeenCalledTimes(1);
    expect(buildVersion.getVersion).toHaveBeenCalledTimes(1);
    expect(targetConfiguration).toHaveBeenCalledTimes(['global', 'byBuildType'].length);
    expect(targetConfiguration).toHaveBeenCalledWith(
      `rollup/${target.name}.config.js`,
      {}
    );
    expect(targetConfiguration).toHaveBeenCalledWith(
      `rollup/${target.name}.${buildType}.config.js`,
      targetConfig
    );
    expect(targets.loadTargetDotEnvFile).toHaveBeenCalledTimes(1);
    expect(targets.loadTargetDotEnvFile).toHaveBeenCalledWith(target, buildType);
    expect(targetConfig.getConfig).toHaveBeenCalledTimes(1);
    expect(targetConfig.getConfig).toHaveBeenCalledWith({
      input: path.join(target.paths.source, target.entry[buildType]),
      output: {
        file: `./${target.folders.build}/${target.output[buildType].js}`,
        format: 'iife',
        sourcemap: false,
        name: 'target',
      },
      target,
      buildType,
      targetRules,
      definitions: {
        'process.env.NODE_ENV': `'${buildType}'`,
        [versionVariable]: `"${version}"`,
        [target.configuration.defineOn]: JSON.stringify(targetBrowserConfig),
      },
      paths: target.output[buildType],
      copy: filesToCopy,
    });
    expect(targets.getBrowserTargetConfiguration).toHaveBeenCalledTimes(1);
    expect(targets.getBrowserTargetConfiguration).toHaveBeenCalledWith(target);
    expect(targets.getFilesToCopy).toHaveBeenCalledTimes(1);
    expect(targets.getFilesToCopy).toHaveBeenCalledWith(target, buildType);
  });

  it('should generate the configuration for a Node library target', () => {
    // Given
    const versionVariable = 'process.env.VERSION';
    const version = 'latest';
    const buildVersion = {
      getDefinitionVariable: jest.fn(() => versionVariable),
      getVersion: jest.fn(() => version),
    };
    const config = {
      output: {
        path: 'some-output-path',
        format: 'commonjs',
        exports: 'named',
      },
    };
    const targetConfig = {
      getConfig: jest.fn(() => config),
    };
    const targets = {
      loadTargetDotEnvFile: jest.fn(() => ({})),
    };
    const targetRules = 'target-rule';
    const targetsFileRules = {
      getRulesForTarget: jest.fn(() => targetRules),
    };
    const targetConfiguration = jest.fn(() => targetConfig);
    const buildType = 'development';
    const target = {
      type: 'node',
      name: 'target',
      paths: {
        source: 'src/target',
      },
      folders: {
        build: 'dist/target',
      },
      entry: {
        [buildType]: 'index.js',
      },
      output: {
        [buildType]: {
          js: 'target.js',
          css: 'css/target/file.2509.css',
          fonts: 'fonts/target/[name].2509.[ext]',
          images: 'images/target/[name].2509.[ext]',
        },
      },
      babel: {},
      library: true,
      libraryOptions: {
        libraryTarget: 'commonjs2',
      },
      is: {
        browser: false,
        node: true,
      },
    };
    const rollupConfigurations = {
      [target.type]: {
        [buildType]: {},
      },
    };
    const expectedConfig = {
      output: {
        path: 'some-output-path',
        format: 'commonjs',
        exports: 'named',
      },
    };
    let sut = null;
    let result = null;
    // When
    sut = new RollupConfiguration(
      buildVersion,
      targets,
      targetsFileRules,
      targetConfiguration,
      rollupConfigurations
    );
    result = sut.getConfig(target, buildType);
    // Then
    expect(result).toEqual(expectedConfig);
    expect(buildVersion.getDefinitionVariable).toHaveBeenCalledTimes(1);
    expect(buildVersion.getVersion).toHaveBeenCalledTimes(1);
    expect(targetConfiguration).toHaveBeenCalledTimes(['global', 'byBuildType'].length);
    expect(targetConfiguration).toHaveBeenCalledWith(
      `rollup/${target.name}.config.js`,
      {}
    );
    expect(targetConfiguration).toHaveBeenCalledWith(
      `rollup/${target.name}.${buildType}.config.js`,
      targetConfig
    );
    expect(targets.loadTargetDotEnvFile).toHaveBeenCalledTimes(1);
    expect(targets.loadTargetDotEnvFile).toHaveBeenCalledWith(target, buildType);
    expect(targetConfig.getConfig).toHaveBeenCalledTimes(1);
    expect(targetConfig.getConfig).toHaveBeenCalledWith({
      input: path.join(target.paths.source, target.entry[buildType]),
      output: {
        file: `./${target.folders.build}/${target.output[buildType].js}`,
        format: 'cjs',
        sourcemap: false,
        name: 'target',
        exports: 'named',
      },
      target,
      buildType,
      targetRules,
      definitions: {
        'process.env.NODE_ENV': `'${buildType}'`,
        [versionVariable]: `"${version}"`,
      },
      paths: target.output[buildType],
      copy: [],
    });
  });

  it('should generate the configuration for a browser library target', () => {
    // Given
    const versionVariable = 'process.env.VERSION';
    const version = 'latest';
    const buildVersion = {
      getDefinitionVariable: jest.fn(() => versionVariable),
      getVersion: jest.fn(() => version),
    };
    const config = {
      output: {
        path: 'some-output-path',
        format: 'umd',
        exports: 'named',
        sourcemap: true,
      },
    };
    const targetConfig = {
      getConfig: jest.fn(() => config),
    };
    const filesToCopy = ['copy'];
    const targets = {
      getFilesToCopy: jest.fn(() => filesToCopy),
      loadTargetDotEnvFile: jest.fn(() => ({})),
    };
    const targetRules = 'target-rule';
    const targetsFileRules = {
      getRulesForTarget: jest.fn(() => targetRules),
    };
    const targetConfiguration = jest.fn(() => targetConfig);
    const buildType = 'development';
    const target = {
      type: 'browser',
      name: 'some-target',
      paths: {
        source: 'src/target',
      },
      folders: {
        build: 'dist/target',
      },
      entry: {
        [buildType]: 'index.js',
      },
      output: {
        [buildType]: {
          js: 'target.js',
          css: 'css/target/file.2509.css',
          fonts: 'fonts/target/[name].2509.[ext]',
          images: 'images/target/[name].2509.[ext]',
        },
      },
      babel: {},
      library: true,
      libraryOptions: {
        libraryTarget: 'umd',
      },
      sourceMap: {
        [buildType]: true,
      },
      is: {
        browser: true,
        node: false,
      },
    };
    const rollupConfigurations = {
      [target.type]: {
        [buildType]: {},
      },
    };
    const expectedConfig = {
      output: {
        path: 'some-output-path',
        format: 'umd',
        exports: 'named',
        sourcemap: true,
      },
    };
    let sut = null;
    let result = null;
    // When
    sut = new RollupConfiguration(
      buildVersion,
      targets,
      targetsFileRules,
      targetConfiguration,
      rollupConfigurations
    );
    result = sut.getConfig(target, buildType);
    // Then
    expect(result).toEqual(expectedConfig);
    expect(buildVersion.getDefinitionVariable).toHaveBeenCalledTimes(1);
    expect(buildVersion.getVersion).toHaveBeenCalledTimes(1);
    expect(targetConfiguration).toHaveBeenCalledTimes(['global', 'byBuildType'].length);
    expect(targetConfiguration).toHaveBeenCalledWith(
      `rollup/${target.name}.config.js`,
      {}
    );
    expect(targetConfiguration).toHaveBeenCalledWith(
      `rollup/${target.name}.${buildType}.config.js`,
      targetConfig
    );
    expect(targets.loadTargetDotEnvFile).toHaveBeenCalledTimes(1);
    expect(targets.loadTargetDotEnvFile).toHaveBeenCalledWith(target, buildType);
    expect(targetConfig.getConfig).toHaveBeenCalledTimes(1);
    expect(targetConfig.getConfig).toHaveBeenCalledWith({
      input: path.join(target.paths.source, target.entry[buildType]),
      output: {
        file: `./${target.folders.build}/${target.output[buildType].js}`,
        format: 'umd',
        sourcemap: true,
        name: 'someTarget',
        exports: 'named',
      },
      target,
      buildType,
      targetRules,
      definitions: {
        'process.env.NODE_ENV': `'${buildType}'`,
        [versionVariable]: `"${version}"`,
      },
      paths: target.output[buildType],
      copy: filesToCopy,
    });
    expect(targets.getFilesToCopy).toHaveBeenCalledTimes(1);
    expect(targets.getFilesToCopy).toHaveBeenCalledWith(target, buildType);
  });

  it('should map window to UMD as library target', () => {
    // Given
    const versionVariable = 'process.env.VERSION';
    const version = 'latest';
    const buildVersion = {
      getDefinitionVariable: jest.fn(() => versionVariable),
      getVersion: jest.fn(() => version),
    };
    const config = {
      output: {
        path: 'some-output-path',
        format: 'umd',
        exports: 'named',
        sourcemap: true,
      },
    };
    const targetConfig = {
      getConfig: jest.fn(() => config),
    };
    const targets = {
      loadTargetDotEnvFile: jest.fn(() => ({})),
    };
    const targetRules = 'target-rule';
    const targetsFileRules = {
      getRulesForTarget: jest.fn(() => targetRules),
    };
    const targetConfiguration = jest.fn(() => targetConfig);
    const buildType = 'development';
    const target = {
      type: 'node',
      name: 'some-target',
      paths: {
        source: 'src/target',
      },
      folders: {
        build: 'dist/target',
      },
      entry: {
        [buildType]: 'index.js',
      },
      output: {
        [buildType]: {
          js: 'target.js',
          css: 'css/target/file.2509.css',
          fonts: 'fonts/target/[name].2509.[ext]',
          images: 'images/target/[name].2509.[ext]',
        },
      },
      babel: {},
      library: true,
      libraryOptions: {
        libraryTarget: 'window',
      },
      sourceMap: {
        [buildType]: true,
      },
      is: {
        browser: false,
        node: true,
      },
    };
    const rollupConfigurations = {
      [target.type]: {
        [buildType]: {},
      },
    };
    const expectedConfig = {
      output: {
        path: 'some-output-path',
        format: 'umd',
        exports: 'named',
        sourcemap: true,
      },
    };
    let sut = null;
    let result = null;
    // When
    sut = new RollupConfiguration(
      buildVersion,
      targets,
      targetsFileRules,
      targetConfiguration,
      rollupConfigurations
    );
    result = sut.getConfig(target, buildType);
    // Then
    expect(result).toEqual(expectedConfig);
    expect(buildVersion.getDefinitionVariable).toHaveBeenCalledTimes(1);
    expect(buildVersion.getVersion).toHaveBeenCalledTimes(1);
    expect(targetConfiguration).toHaveBeenCalledTimes(['global', 'byBuildType'].length);
    expect(targetConfiguration).toHaveBeenCalledWith(
      `rollup/${target.name}.config.js`,
      {}
    );
    expect(targetConfiguration).toHaveBeenCalledWith(
      `rollup/${target.name}.${buildType}.config.js`,
      targetConfig
    );
    expect(targets.loadTargetDotEnvFile).toHaveBeenCalledTimes(1);
    expect(targets.loadTargetDotEnvFile).toHaveBeenCalledWith(target, buildType);
    expect(targetConfig.getConfig).toHaveBeenCalledTimes(1);
    expect(targetConfig.getConfig).toHaveBeenCalledWith({
      input: path.join(target.paths.source, target.entry[buildType]),
      output: {
        file: `./${target.folders.build}/${target.output[buildType].js}`,
        format: 'umd',
        sourcemap: true,
        name: 'someTarget',
        exports: 'named',
      },
      target,
      buildType,
      targetRules,
      definitions: {
        'process.env.NODE_ENV': `'${buildType}'`,
        [versionVariable]: `"${version}"`,
      },
      paths: target.output[buildType],
      copy: [],
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
    rollupConfiguration(container);
    [[serviceName, serviceFn]] = container.set.mock.calls;
    sut = serviceFn();
    // Then
    expect(serviceName).toBe('rollupConfiguration');
    expect(serviceFn).toBeFunction();
    expect(sut).toBeInstanceOf(RollupConfiguration);
    expect(sut.buildVersion).toBe('buildVersion');
    expect(sut.buildVersion).toBe('buildVersion');
    expect(sut.targets).toBe('targets');
    expect(sut.targetsFileRules).toBe('targetsFileRules');
    expect(sut.targetConfiguration).toBe('targetConfiguration');
    expect(sut.rollupConfigurations).toEqual({
      node: {
        development: 'rollupNodeDevelopmentConfiguration',
        production: 'rollupNodeProductionConfiguration',
      },
      browser: {
        development: 'rollupBrowserDevelopmentConfiguration',
        production: 'rollupBrowserProductionConfiguration',
      },
    });
  });
});
