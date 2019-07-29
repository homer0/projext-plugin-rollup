const JimpleMock = require('/tests/mocks/jimple.mock');
const ConfigurationFileMock = require('/tests/mocks/configurationFile.mock');

jest.mock('jimple', () => JimpleMock);
jest.mock('fs-extra');
jest.mock('rollup-plugin-node-resolve');
jest.mock('rollup-plugin-babel');
jest.mock('rollup-plugin-commonjs');
jest.mock('rollup-plugin-sass');
jest.mock('rollup-plugin-html');
jest.mock('rollup-plugin-json');
jest.mock('rollup-plugin-polyfill');
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
  devServer,
  extraWatch,
  runtimeReplace,
  stats,
  stylesheetAssets,
  stylesheetModulesFixer,
  template,
  urls,
  windowAsGlobal,
} = require('/src/plugins');
const resolve = require('rollup-plugin-node-resolve');
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const sass = require('rollup-plugin-sass');
const html = require('rollup-plugin-html');
const json = require('rollup-plugin-json');
const polyfill = require('rollup-plugin-polyfill');

describe('services/configurations:browserDevelopmentConfiguration', () => {
  const getPlugins = () => {
    const statsResetValue = 'stats-reset';
    const statsLogValue = 'stats-log';
    const devServerShowURLOnGenValue = 'devServer-showURL-writeBundle';
    const devServerPlugin = {
      showURL: jest.fn(() => ({
        writeBundle: devServerShowURLOnGenValue,
      })),
    };

    const values = {
      copy: 'copy-value',
      css: 'css-plugin',
      urls: 'urls-plugin',
      stylesheetAssets: 'stylesheetAssets-plugin',
      template: 'template-plugin',
      devServer: {
        showURL: expect.any(Function),
      },
      stats: {
        reset: jest.fn(() => statsResetValue),
        log: jest.fn(() => statsLogValue),
        add: 'add-entry',
      },
      stylesheetModulesFixer: 'stylesheetModulesFixer-plugin',
      windowAsGlobal: 'windowAsGlobal-plugin',
      resolve: 'resolve-plugin',
      babel: 'babel-plugin',
      polyfill: 'polyfill-plugin',
      commonjs: 'commonjs-plugin',
      extraWatch: 'extra-watch-plugin',
      runtimeReplace: 'runtime-replace-plugin',
      sass: 'sass-plugin',
      html: 'html-plugin',
      json: 'json-plugin',
    };
    values.statsReset = statsResetValue;
    values.statsLog = statsLogValue;
    values.devServerShowURLOnGenValue = devServerShowURLOnGenValue;
    copy.mockImplementationOnce(() => values.copy);
    css.mockImplementationOnce(() => values.css);
    urls.mockImplementationOnce(() => values.urls);
    stylesheetAssets.mockImplementationOnce(() => values.stylesheetAssets);
    template.mockImplementationOnce(() => values.template);
    devServer.mockImplementationOnce(() => devServerPlugin);
    stats.mockImplementationOnce(() => values.stats);
    stylesheetModulesFixer.mockImplementationOnce(() => values.stylesheetModulesFixer);
    windowAsGlobal.mockImplementationOnce(() => values.windowAsGlobal);
    resolve.mockImplementationOnce(() => values.resolve);
    babel.mockImplementationOnce(() => values.babel);
    polyfill.mockImplementationOnce(() => values.polyfill);
    commonjs.mockImplementationOnce(() => values.commonjs);
    extraWatch.mockImplementationOnce(() => values.extraWatch);
    runtimeReplace.mockImplementationOnce(() => values.runtimeReplace);
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
      devServerPlugin,
      devServerShowURL: devServerPlugin.showURL,
      stats,
      statsReset: values.stats.reset,
      statsLog: values.stats.log,
      stylesheetModulesFixer,
      windowAsGlobal,
      resolve,
      babel,
      polyfill,
      commonjs,
      extraWatch,
      runtimeReplace,
      sass,
      html,
      json,
    };
    const settings = {
      resolve: 'resolve-plugin-settings',
      babel: 'babel-plugin-settings',
      commonjs: 'commonjs-plugin-settings',
      extraWatch: 'extra-watch-plugin-settings',
      sass: 'sass-plugin-settings',
      css: 'css-plugin-settings',
      stylesheetAssets: 'stylesheetAssets-plugin-settings',
      stylesheetModulesFixer: 'stylesheetModulesFixer-plugin-settings',
      html: 'html-plugin-settings',
      json: 'json-plugin-settings',
      urls: 'urls-plugin-settings',
      template: 'template-plugin-settings',
      statsLog: {
        name: 'statsLog-plugin-settings',
      },
      external: {
        external: 'external-plugin-settings',
      },
      globals: {
        name: 'globals-plugin-settings',
      },
      watch: 'watch-plugin-settings',
      devServer: 'devServer-plugin-settings',
      copy: 'copy-plugin-settings',
      polyfill: 'polyfill-plugin-settings',
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
    extraWatch.mockClear();
    runtimeReplace.mockClear();
    sass.mockClear();
    html.mockClear();
    json.mockClear();
    polyfill.mockClear();
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
      watch: {
        development: false,
      },
    };
    const output = {};
    const input = 'input';
    const definitions = 'definitions';
    const params = {
      target,
      input,
      output,
      definitions,
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
        plugins.values.polyfill,
        plugins.values.windowAsGlobal,
        plugins.values.runtimeReplace,
        plugins.values.extraWatch,
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
    expect(plugins.mocks.polyfill).toHaveBeenCalledTimes(1);
    expect(plugins.mocks.polyfill).toHaveBeenCalledWith(plugins.settings.polyfill);
    expect(plugins.mocks.commonjs).toHaveBeenCalledTimes(1);
    expect(plugins.mocks.commonjs).toHaveBeenCalledWith(plugins.settings.commonjs);
    expect(plugins.mocks.windowAsGlobal).toHaveBeenCalledTimes(1);
    expect(plugins.mocks.runtimeReplace).toHaveBeenCalledTimes(1);
    expect(plugins.mocks.runtimeReplace).toHaveBeenCalledWith(definitions);
    expect(plugins.mocks.extraWatch).toHaveBeenCalledTimes(1);
    expect(plugins.mocks.extraWatch).toHaveBeenCalledWith(plugins.settings.extraWatch);
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
      watch: {
        development: false,
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
        plugins.values.polyfill,
        plugins.values.windowAsGlobal,
        plugins.values.runtimeReplace,
        plugins.values.extraWatch,
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

  it('should create a configuration for a target without a Babel polyfill', () => {
    // Given
    const plugins = getPlugins();
    const events = {
      reduce: jest.fn((eventNames, config) => config),
    };
    const pathUtils = 'pathUtils';
    plugins.settings.polyfill = [];
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
      watch: {
        development: false,
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
        plugins.values.runtimeReplace,
        plugins.values.extraWatch,
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
    expect(plugins.mocks.polyfill).toHaveBeenCalledTimes(0);
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
      watch: {
        development: false,
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
        plugins.values.polyfill,
        plugins.values.windowAsGlobal,
        plugins.values.runtimeReplace,
        plugins.values.extraWatch,
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
      watch: {
        development: false,
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
    let statsLogAfterLog = null;
    // When
    sut = new RollupBrowserDevelopmentConfiguration(
      events,
      pathUtils,
      rollupPluginSettingsConfiguration
    );
    result = sut.getConfig(params);
    [[{ afterLog: statsLogAfterLog }]] = plugins.mocks.statsLog.mock.calls;
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
        plugins.values.polyfill,
        plugins.values.windowAsGlobal,
        plugins.values.runtimeReplace,
        plugins.values.extraWatch,
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
    expect(statsLogAfterLog).toBe(plugins.values.devServerShowURLOnGenValue);
    expect(plugins.mocks.devServer).toHaveBeenCalledTimes(1);
    expect(plugins.mocks.devServer).toHaveBeenCalledWith(plugins.settings.devServer);
    expect(plugins.mocks.statsLog).toHaveBeenCalledWith(Object.assign(
      {
        afterLog: plugins.values.devServerShowURLOnGenValue,
      },
      plugins.settings.statsLog
    ));
  });

  it('should create a configuration for a target that will be watched', () => {
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
      runOnDevelopment: false,
      watch: {
        development: true,
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
        plugins.values.polyfill,
        plugins.values.windowAsGlobal,
        plugins.values.runtimeReplace,
        plugins.values.extraWatch,
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
      watch: plugins.settings.watch,
      external: plugins.settings.external.external,
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
