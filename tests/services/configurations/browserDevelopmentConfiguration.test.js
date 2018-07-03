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
jest.unmock('/src/services/configurations/browserDevelopmentConfiguration');

require('jasmine-expect');
const {
  RollupBrowserDevelopmentConfiguration,
  rollupBrowserDevelopmentConfiguration,
} = require('/src/services/configurations/browserDevelopmentConfiguration');
const {
  copy,
  css,
  urls,
  stylesheetAssets,
  template,
  devServer,
  stats,
  stylesheetModulesFixer,
  windowAsGlobal,
} = require('/src/plugins');
const resolve = require('rollup-plugin-node-resolve');
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const replace = require('rollup-plugin-replace');
const sass = require('rollup-plugin-sass');
const html = require('rollup-plugin-html');
const json = require('rollup-plugin-json');

describe('services/configurations:browserDevelopmentConfiguration', () => {
  const getPlugins = () => {
    const statsResetValue = 'stats-reset';
    const statsLogValue = 'stats-log';
    const values = {
      copy: 'copy-value',
      css: 'css-plugin',
      urls: 'urls-plugin',
      stylesheetAssets: 'stylesheetAssets-plugin',
      template: 'template-plugin',
      devServer: 'devServer-plugin',
      stats: {
        reset: jest.fn(() => statsResetValue),
        log: jest.fn(() => statsLogValue),
        add: 'add-entry',
      },
      stylesheetModulesFixer: 'stylesheetModulesFixer-plugin',
      windowAsGlobal: 'windowAsGlobal-plugin',
      resolve: 'resolve-plugin',
      babel: 'babel-plugin',
      commonjs: 'commonjs-plugin',
      replace: 'replace-plugin',
      sass: 'sass-plugin',
      html: 'html-plugin',
      json: 'json-plugin',
    };
    values.statsReset = statsResetValue;
    values.statsLog = statsLogValue;
    copy.mockImplementationOnce(() => values.copy);
    css.mockImplementationOnce(() => values.css);
    urls.mockImplementationOnce(() => values.urls);
    stylesheetAssets.mockImplementationOnce(() => values.stylesheetAssets);
    template.mockImplementationOnce(() => values.template);
    devServer.mockImplementationOnce(() => values.devServer);
    stats.mockImplementationOnce(() => values.stats);
    stylesheetModulesFixer.mockImplementationOnce(() => values.stylesheetModulesFixer);
    windowAsGlobal.mockImplementationOnce(() => values.windowAsGlobal);
    resolve.mockImplementationOnce(() => values.resolve);
    babel.mockImplementationOnce(() => values.babel);
    commonjs.mockImplementationOnce(() => values.commonjs);
    replace.mockImplementationOnce(() => values.replace);
    sass.mockImplementationOnce(() => values.sass);
    html.mockImplementationOnce(() => values.html);
    json.mockImplementationOnce(() => values.json);
    const mocks = {
      copy,
      css,
      urls,
      stylesheetAssets,
      template,
      devServer,
      stats,
      statsReset: values.stats.reset,
      statsLog: values.stats.log,
      stylesheetModulesFixer,
      windowAsGlobal,
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
      stylesheetModulesFixer: 'stylesheetModulesFixer-plugin-settings',
      html: 'html-plugin-settings',
      json: 'json-plugin-settings',
      urls: 'urls-plugin-settings',
      template: 'template-plugin-settings',
      statsLog: 'statsLog-plugin-settings',
      external: {
        external: 'external-plugin-settings',
      },
      globals: {
        name: 'globals-plugin-settings',
      },
      watch: 'watch-plugin-settings',
      devServer: 'devServer-plugin-settings',
      copy: 'copy-plugin-settings',
    };
    return {
      values,
      mocks,
      settings,
    };
  };

  beforeEach(() => {
    ConfigurationFileMock.reset();
    copy.mockClear();
    css.mockClear();
    urls.mockClear();
    stylesheetAssets.mockClear();
    template.mockClear();
    devServer.mockClear();
    stats.mockClear();
    stylesheetModulesFixer.mockClear();
    windowAsGlobal.mockClear();
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
    sut = new RollupBrowserDevelopmentConfiguration(
      events,
      pathUtils,
      rollupPluginSettingsConfiguration
    );
    // Then
    expect(sut).toBeInstanceOf(RollupBrowserDevelopmentConfiguration);
    expect(sut.constructorMock).toHaveBeenCalledTimes(1);
    expect(sut.constructorMock).toHaveBeenCalledWith(
      pathUtils,
      [
        'config/rollup/browser.development.config.js',
        'config/rollup/browser.config.js',
      ]
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
        plugins.values.statsReset,
        plugins.values.resolve,
        plugins.values.commonjs,
        plugins.values.babel,
        plugins.values.windowAsGlobal,
        plugins.values.replace,
        plugins.values.sass,
        plugins.values.css,
        plugins.values.stylesheetAssets,
        plugins.values.html,
        plugins.values.json,
        plugins.values.urls,
        plugins.values.template,
        plugins.values.copy,
        plugins.values.statsLog,
      ],
      external: plugins.settings.external.external,
    };
    // When
    sut = new RollupBrowserDevelopmentConfiguration(
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
    expect(plugins.mocks.statsReset).toHaveBeenCalledTimes(1);
    expect(plugins.mocks.resolve).toHaveBeenCalledTimes(1);
    expect(plugins.mocks.resolve).toHaveBeenCalledWith(plugins.settings.resolve);
    expect(plugins.mocks.babel).toHaveBeenCalledTimes(1);
    expect(plugins.mocks.babel).toHaveBeenCalledWith(plugins.settings.babel);
    expect(plugins.mocks.commonjs).toHaveBeenCalledTimes(1);
    expect(plugins.mocks.commonjs).toHaveBeenCalledWith(plugins.settings.commonjs);
    expect(plugins.mocks.windowAsGlobal).toHaveBeenCalledTimes(1);
    expect(plugins.mocks.replace).toHaveBeenCalledTimes(1);
    expect(plugins.mocks.replace).toHaveBeenCalledWith(plugins.settings.replace);
    expect(plugins.mocks.sass).toHaveBeenCalledTimes(1);
    expect(plugins.mocks.sass).toHaveBeenCalledWith(plugins.settings.sass);
    expect(plugins.mocks.css).toHaveBeenCalledTimes(1);
    expect(plugins.mocks.css).toHaveBeenCalledWith(plugins.settings.css);
    expect(plugins.mocks.stylesheetAssets).toHaveBeenCalledTimes(1);
    expect(plugins.mocks.stylesheetAssets).toHaveBeenCalledWith(plugins.settings.stylesheetAssets);
    expect(plugins.mocks.html).toHaveBeenCalledTimes(1);
    expect(plugins.mocks.html).toHaveBeenCalledWith(plugins.settings.html);
    expect(plugins.mocks.json).toHaveBeenCalledTimes(1);
    expect(plugins.mocks.json).toHaveBeenCalledWith(plugins.settings.json);
    expect(plugins.mocks.urls).toHaveBeenCalledTimes(1);
    expect(plugins.mocks.urls).toHaveBeenCalledWith(plugins.settings.urls);
    expect(plugins.mocks.template).toHaveBeenCalledTimes(1);
    expect(plugins.mocks.template).toHaveBeenCalledWith(plugins.settings.template);
    expect(plugins.mocks.copy).toHaveBeenCalledTimes(1);
    expect(plugins.mocks.copy).toHaveBeenCalledWith(plugins.settings.copy);
    expect(plugins.mocks.statsLog).toHaveBeenCalledTimes(1);
    expect(plugins.mocks.statsLog).toHaveBeenCalledWith(plugins.settings.statsLog);
    expect(events.reduce).toHaveBeenCalledTimes(1);
    expect(events.reduce).toHaveBeenCalledWith(
      [
        'rollup-browser-development-configuration',
        'rollup-browser-configuration',
      ],
      expectedConfig,
      params
    );
  });

  it('should create a configuration for a target with CSS modules', () => {
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
      css: {
        modules: true,
      },
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
    // When
    sut = new RollupBrowserDevelopmentConfiguration(
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
        plugins.values.statsReset,
        plugins.values.resolve,
        plugins.values.commonjs,
        plugins.values.babel,
        plugins.values.windowAsGlobal,
        plugins.values.replace,
        plugins.values.sass,
        plugins.values.css,
        plugins.values.stylesheetAssets,
        plugins.values.stylesheetModulesFixer,
        plugins.values.html,
        plugins.values.json,
        plugins.values.urls,
        plugins.values.template,
        plugins.values.copy,
        plugins.values.statsLog,
      ],
      external: plugins.settings.external.external,
    });
    expect(plugins.mocks.stylesheetModulesFixer).toHaveBeenCalledTimes(1);
    expect(plugins.mocks.stylesheetModulesFixer)
    .toHaveBeenCalledWith(plugins.settings.stylesheetModulesFixer);
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
      css: {
        modules: true,
      },
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
    sut = new RollupBrowserDevelopmentConfiguration(
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
        plugins.values.statsReset,
        plugins.values.resolve,
        plugins.values.commonjs,
        plugins.values.babel,
        plugins.values.windowAsGlobal,
        plugins.values.replace,
        plugins.values.sass,
        plugins.values.css,
        plugins.values.stylesheetAssets,
        plugins.values.stylesheetModulesFixer,
        plugins.values.html,
        plugins.values.json,
        plugins.values.urls,
        plugins.values.template,
        plugins.values.copy,
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
      css: {
        modules: true,
      },
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
    sut = new RollupBrowserDevelopmentConfiguration(
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
        plugins.values.statsReset,
        plugins.values.resolve,
        plugins.values.commonjs,
        plugins.values.babel,
        plugins.values.windowAsGlobal,
        plugins.values.replace,
        plugins.values.sass,
        plugins.values.css,
        plugins.values.stylesheetAssets,
        plugins.values.stylesheetModulesFixer,
        plugins.values.html,
        plugins.values.json,
        plugins.values.urls,
        plugins.values.template,
        plugins.values.copy,
        plugins.values.statsLog,
        plugins.values.devServer,
      ],
      watch: plugins.settings.watch,
      external: plugins.settings.external.external,
    });
    expect(plugins.mocks.devServer).toHaveBeenCalledTimes(1);
    expect(plugins.mocks.devServer).toHaveBeenCalledWith(plugins.settings.devServer);
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
    rollupBrowserDevelopmentConfiguration(container);
    [[serviceName, serviceFn]] = container.set.mock.calls;
    sut = serviceFn();
    // Then
    expect(serviceName).toBe('rollupBrowserDevelopmentConfiguration');
    expect(serviceFn).toBeFunction();
    expect(sut).toBeInstanceOf(RollupBrowserDevelopmentConfiguration);
    expect(sut.events).toBe('events');
    expect(sut.pathUtils).toBe('pathUtils');
    expect(sut.rollupPluginSettingsConfiguration).toBe('rollupPluginSettingsConfiguration');
  });
});
