const JimpleMock = require('/tests/mocks/jimple.mock');
const ConfigurationFileMock = require('/tests/mocks/configurationFile.mock');

jest.mock('jimple', () => JimpleMock);
jest.mock('fs-extra');
jest.mock('rollup-plugin-node-resolve');
jest.mock('rollup-plugin-babel');
jest.mock('rollup-plugin-commonjs');
jest.mock('rollup-plugin-replace');
jest.mock('rollup-plugin-sass');
jest.mock('rollup-plugin-html');
jest.mock('rollup-plugin-json');
jest.mock('/src/abstracts/configurationFile', () => ConfigurationFileMock);
jest.unmock('/src/services/configurations/nodeDevelopmentConfiguration');

require('jasmine-expect');
const {
  RollupNodeDevelopmentConfiguration,
  rollupNodeDevelopmentConfiguration,
} = require('/src/services/configurations/nodeDevelopmentConfiguration');
const {
  css,
  urls,
  stylesheetAssets,
  nodeRunner,
  stats,
} = require('/src/plugins');
const resolve = require('rollup-plugin-node-resolve');
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const replace = require('rollup-plugin-replace');
const sass = require('rollup-plugin-sass');
const html = require('rollup-plugin-html');
const json = require('rollup-plugin-json');

describe('services/configurations:nodeDevelopmentConfiguration', () => {
  const getPlugins = () => {
    const statsLogValue = 'stats-log';
    const values = {
      css: 'css-plugin',
      urls: 'urls-plugin',
      stylesheetAssets: 'stylesheetAssets-plugin',
      stylesheetAssetsHelper: 'stylesheetAssetsHelper-plugin',
      nodeRunner: 'nodeRunner-plugin',
      stats: {
        log: jest.fn(() => statsLogValue),
        add: 'add-entry',
      },
      resolve: 'resolve-plugin',
      babel: 'babel-plugin',
      commonjs: 'commonjs-plugin',
      replace: 'replace-plugin',
      sass: 'sass-plugin',
      html: 'html-plugin',
      json: 'json-plugin',
    };
    values.statsLog = statsLogValue;
    css.mockImplementationOnce(() => values.css);
    urls.mockImplementationOnce(() => values.urls);
    stylesheetAssets.mockImplementationOnce(() => values.stylesheetAssets);
    stylesheetAssets.helper = jest.fn(() => values.stylesheetAssetsHelper);
    nodeRunner.mockImplementationOnce(() => values.nodeRunner);
    stats.mockImplementationOnce(() => values.stats);
    resolve.mockImplementationOnce(() => values.resolve);
    babel.mockImplementationOnce(() => values.babel);
    commonjs.mockImplementationOnce(() => values.commonjs);
    replace.mockImplementationOnce(() => values.replace);
    sass.mockImplementationOnce(() => values.sass);
    html.mockImplementationOnce(() => values.html);
    json.mockImplementationOnce(() => values.json);
    const mocks = {
      css,
      urls,
      stylesheetAssets,
      nodeRunner,
      stats,
      statsLog: values.stats.log,
      resolve,
      babel,
      commonjs,
      replace,
      sass,
      html,
      json,
    };
    const settings = {
      resolve: 'resolve-plugin-settings',
      babel: 'babel-plugin-settings',
      commonjs: 'commonjs-plugin-settings',
      replace: 'replace-plugin-settings',
      sass: 'sass-plugin-settings',
      css: 'css-plugin-settings',
      stylesheetAssets: 'stylesheetAssets-plugin-settings',
      stylesheetAssetsHelper: 'stylesheetAssetsHelper-plugin-settings',
      html: 'html-plugin-settings',
      json: 'json-plugin-settings',
      urls: 'urls-plugin-settings',
      nodeRunner: 'nodeRunner-plugin-settings',
      statsLog: 'statsLog-plugin-settings',
      external: {
        external: 'external-plugin-settings',
      },
      globals: {
        name: 'globals-plugin-settings',
      },
      watch: 'watch-plugin-settings',
    };
    return {
      values,
      mocks,
      settings,
    };
  };

  beforeEach(() => {
    ConfigurationFileMock.reset();
    css.mockClear();
    urls.mockClear();
    stylesheetAssets.mockClear();
    nodeRunner.mockClear();
    stats.mockClear();
    resolve.mockClear();
    babel.mockClear();
    commonjs.mockClear();
    replace.mockClear();
    sass.mockClear();
    html.mockClear();
    json.mockClear();
  });

  it('should be instantiated with all its dependencies', () => {
    // Given
    const events = 'events';
    const pathUtils = 'pathUtils';
    const rollupPluginSettingsConfiguration = 'rollupPluginSettingsConfiguration';
    let sut = null;
    // When
    sut = new RollupNodeDevelopmentConfiguration(
      events,
      pathUtils,
      rollupPluginSettingsConfiguration
    );
    // Then
    expect(sut).toBeInstanceOf(RollupNodeDevelopmentConfiguration);
    expect(sut.constructorMock).toHaveBeenCalledTimes(1);
    expect(sut.constructorMock).toHaveBeenCalledWith(
      pathUtils,
      'rollup/node.development.config.js'
    );
    expect(sut.events).toBe(events);
    expect(sut.pathUtils).toBe(pathUtils);
    expect(sut.rollupPluginSettingsConfiguration).toBe(rollupPluginSettingsConfiguration);
  });

  it('should create a configuration for a target', () => {
    // Given
    const plugins = getPlugins();
    const events = {
      reduce: jest.fn((eventNames, config) => config),
    };
    const pathUtils = 'pathUtils';
    const rollupPluginSettingsConfiguration = {
      getConfig: jest.fn(() => plugins.settings),
    };
    const target = {
      css: {},
      paths: {
        build: 'dist',
      },
    };
    const output = {};
    const input = 'input';
    const params = {
      target,
      input,
      output,
    };
    let sut = null;
    let result = null;
    const expectedConfig = {
      input,
      output: Object.assign({}, output, {
        globals: plugins.settings.globals,
      }),
      plugins: [
        plugins.values.resolve,
        plugins.values.babel,
        plugins.values.commonjs,
        plugins.values.replace,
        plugins.values.sass,
        plugins.values.css,
        plugins.values.stylesheetAssetsHelper,
        plugins.values.stylesheetAssets,
        plugins.values.html,
        plugins.values.json,
        plugins.values.urls,
        plugins.values.statsLog,
      ],
      external: plugins.settings.external.external,
    };
    // When
    sut = new RollupNodeDevelopmentConfiguration(
      events,
      pathUtils,
      rollupPluginSettingsConfiguration
    );
    result = sut.getConfig(params);
    // Then
    expect(result).toEqual(expectedConfig);
    expect(plugins.mocks.stats).toHaveBeenCalledTimes(1);
    expect(plugins.mocks.stats).toHaveBeenCalledWith({
      path: `${target.paths.build}/`,
    });
    expect(plugins.mocks.resolve).toHaveBeenCalledTimes(1);
    expect(plugins.mocks.resolve).toHaveBeenCalledWith(plugins.settings.resolve);
    expect(plugins.mocks.babel).toHaveBeenCalledTimes(1);
    expect(plugins.mocks.babel).toHaveBeenCalledWith(plugins.settings.babel);
    expect(plugins.mocks.commonjs).toHaveBeenCalledTimes(1);
    expect(plugins.mocks.commonjs).toHaveBeenCalledWith(plugins.settings.commonjs);
    expect(plugins.mocks.replace).toHaveBeenCalledTimes(1);
    expect(plugins.mocks.replace).toHaveBeenCalledWith(plugins.settings.replace);
    expect(plugins.mocks.sass).toHaveBeenCalledTimes(1);
    expect(plugins.mocks.sass).toHaveBeenCalledWith(plugins.settings.sass);
    expect(plugins.mocks.css).toHaveBeenCalledTimes(1);
    expect(plugins.mocks.css).toHaveBeenCalledWith(plugins.settings.css);
    expect(plugins.mocks.stylesheetAssets.helper).toHaveBeenCalledTimes(1);
    expect(plugins.mocks.stylesheetAssets.helper)
    .toHaveBeenCalledWith(plugins.settings.stylesheetAssetsHelper);
    expect(plugins.mocks.stylesheetAssets).toHaveBeenCalledTimes(1);
    expect(plugins.mocks.stylesheetAssets).toHaveBeenCalledWith(plugins.settings.stylesheetAssets);
    expect(plugins.mocks.html).toHaveBeenCalledTimes(1);
    expect(plugins.mocks.html).toHaveBeenCalledWith(plugins.settings.html);
    expect(plugins.mocks.json).toHaveBeenCalledTimes(1);
    expect(plugins.mocks.json).toHaveBeenCalledWith(plugins.settings.json);
    expect(plugins.mocks.urls).toHaveBeenCalledTimes(1);
    expect(plugins.mocks.urls).toHaveBeenCalledWith(plugins.settings.urls);
    expect(plugins.mocks.statsLog).toHaveBeenCalledTimes(1);
    expect(plugins.mocks.statsLog).toHaveBeenCalledWith(plugins.settings.statsLog);
    expect(events.reduce).toHaveBeenCalledTimes(1);
    expect(events.reduce).toHaveBeenCalledWith(
      [
        'rollup-node-development-configuration',
        'rollup-node-configuration',
      ],
      expectedConfig,
      params
    );
  });

  it('should create a configuration for a target with custom globals', () => {
    // Given
    const plugins = getPlugins();
    const events = {
      reduce: jest.fn((eventNames, config) => config),
    };
    const pathUtils = 'pathUtils';
    const rollupPluginSettingsConfiguration = {
      getConfig: jest.fn(() => plugins.settings),
    };
    const target = {
      css: {},
      paths: {
        build: 'dist',
      },
    };
    const output = {
      globals: {
        wootils: 'wootils',
      },
    };
    const input = 'input';
    const params = {
      target,
      input,
      output,
    };
    let sut = null;
    let result = null;
    // When
    sut = new RollupNodeDevelopmentConfiguration(
      events,
      pathUtils,
      rollupPluginSettingsConfiguration
    );
    result = sut.getConfig(params);
    // Then
    expect(result).toEqual({
      input,
      output: Object.assign({}, output, {
        globals: Object.assign({}, output.globals, plugins.settings.globals),
      }),
      plugins: [
        plugins.values.resolve,
        plugins.values.babel,
        plugins.values.commonjs,
        plugins.values.replace,
        plugins.values.sass,
        plugins.values.css,
        plugins.values.stylesheetAssetsHelper,
        plugins.values.stylesheetAssets,
        plugins.values.html,
        plugins.values.json,
        plugins.values.urls,
        plugins.values.statsLog,
      ],
      external: plugins.settings.external.external,
    });
  });

  it('should create a configuration for a target that will run', () => {
    // Given
    const plugins = getPlugins();
    const events = {
      reduce: jest.fn((eventNames, config) => config),
    };
    const pathUtils = 'pathUtils';
    const rollupPluginSettingsConfiguration = {
      getConfig: jest.fn(() => plugins.settings),
    };
    const target = {
      css: {},
      paths: {
        build: 'dist',
      },
      runOnDevelopment: true,
    };
    const output = {};
    const input = 'input';
    const params = {
      target,
      input,
      output,
    };
    let sut = null;
    let result = null;
    // When
    sut = new RollupNodeDevelopmentConfiguration(
      events,
      pathUtils,
      rollupPluginSettingsConfiguration
    );
    result = sut.getConfig(params);
    // Then
    expect(result).toEqual({
      input,
      output: Object.assign({}, output, {
        globals: plugins.settings.globals,
      }),
      plugins: [
        plugins.values.resolve,
        plugins.values.babel,
        plugins.values.commonjs,
        plugins.values.replace,
        plugins.values.sass,
        plugins.values.css,
        plugins.values.stylesheetAssetsHelper,
        plugins.values.stylesheetAssets,
        plugins.values.html,
        plugins.values.json,
        plugins.values.urls,
        plugins.values.statsLog,
        plugins.values.nodeRunner,
      ],
      external: plugins.settings.external.external,
      watch: plugins.settings.watch,
    });
    expect(plugins.mocks.nodeRunner).toHaveBeenCalledTimes(1);
    expect(plugins.mocks.nodeRunner).toHaveBeenCalledWith(plugins.settings.nodeRunner);
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
    rollupNodeDevelopmentConfiguration(container);
    [[serviceName, serviceFn]] = container.set.mock.calls;
    sut = serviceFn();
    // Then
    expect(serviceName).toBe('rollupNodeDevelopmentConfiguration');
    expect(serviceFn).toBeFunction();
    expect(sut).toBeInstanceOf(RollupNodeDevelopmentConfiguration);
    expect(sut.events).toBe('events');
    expect(sut.pathUtils).toBe('pathUtils');
    expect(sut.rollupPluginSettingsConfiguration).toBe('rollupPluginSettingsConfiguration');
  });
});
