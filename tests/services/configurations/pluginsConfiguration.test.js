const JimpleMock = require('/tests/mocks/jimple.mock');
const ConfigurationFileMock = require('/tests/mocks/configurationFile.mock');

jest.mock('jimple', () => JimpleMock);
jest.mock('fs-extra');
jest.mock('postcss');
jest.mock('postcss-modules', () => jest.fn());
jest.mock('/src/abstracts/configurationFile', () => ConfigurationFileMock);
jest.unmock('/src/services/configurations/pluginsConfiguration');

require('jasmine-expect');
const fs = require('fs-extra');
const postcss = require('postcss');
const postcssModules = require('postcss-modules');
const builtinModules = require('builtin-modules');
const {
  RollupPluginSettingsConfiguration,
  rollupPluginSettingsConfiguration,
} = require('/src/services/configurations/pluginsConfiguration');

describe('services/configurations:plugins', () => {
  beforeEach(() => {
    ConfigurationFileMock.reset();
    fs.pathExistsSync.mockReset();
    fs.readFileSync.mockReset();
    postcss.mockReset();
    postcssModules.mockReset();
  });

  it('should be instantiated with all its dependencies', () => {
    // Given
    const appLogger = 'appLogger';
    const babelConfiguration = 'babelConfiguration';
    const babelHelper = 'babelHelper';
    const events = 'events';
    const packageInfo = 'packageInfo';
    const pathUtils = 'pathUtils';
    const rollupPluginInfo = 'rollupPluginInfo';
    const targetsHTML = 'targetsHTML';
    let sut = null;
    // When
    sut = new RollupPluginSettingsConfiguration(
      appLogger,
      babelConfiguration,
      babelHelper,
      events,
      packageInfo,
      pathUtils,
      rollupPluginInfo,
      targetsHTML
    );
    // Then
    expect(sut).toBeInstanceOf(RollupPluginSettingsConfiguration);
    expect(sut.constructorMock).toHaveBeenCalledTimes(1);
    expect(sut.constructorMock).toHaveBeenCalledWith(
      pathUtils,
      'rollup/plugins.config.js'
    );
    expect(sut.appLogger).toBe(appLogger);
    expect(sut.babelConfiguration).toBe(babelConfiguration);
    expect(sut.babelHelper).toBe(babelHelper);
    expect(sut.events).toBe(events);
    expect(sut.packageInfo).toBe(packageInfo);
    expect(sut.rollupPluginInfo).toBe(rollupPluginInfo);
    expect(sut.targetsHTML).toBe(targetsHTML);
  });

  it('should generate the plugins configuration for a development Node target build', () => {
    // Given
    const buildType = 'development';
    const definitions = {
      NODE_ENV: 'development',
    };
    const output = {
      file: 'output-file',
    };
    const paths = {
      js: 'js-path',
      css: 'css-path',
      fonts: 'fonts-path',
      images: 'images-path',
    };
    const target = {
      css: {
        modules: false,
      },
      paths: {
        build: 'dist',
      },
      is: {
        node: true,
        browser: false,
      },
    };
    const rules = {
      js: {
        paths: {
          include: ['js-paths-include'],
          exclude: ['js-paths-exclude'],
        },
        files: {
          glob: {
            include: ['js-files-include-glob'],
            exclude: ['js-files-exclude-glob'],
          },
        },
      },
      scss: {
        files: {
          include: ['scss-files-include-regex'],
          exclude: ['scss-files-exclude-regex'],
        },
      },
      css: {
        files: {
          include: ['css-files-include-regex'],
          exclude: ['css-files-exclude-regex'],
        },
      },
      commonFonts: {
        files: {
          include: ['common-fonts-files-include-regex'],
          exclude: ['common-fonts-files-exclude-regex'],
        },
      },
      svgFonts: {
        files: {
          include: ['svg-fonts-files-include-regex'],
          exclude: ['svg-fonts-files-exclude-regex'],
        },
      },
      images: {
        files: {
          include: ['images-files-include-regex'],
          exclude: ['images-files-exclude-regex'],
        },
      },
      favicon: {
        files: {
          include: ['favicon-files-include-regex'],
          exclude: ['favicon-files-exclude-regex'],
        },
      },
    };
    const targetRules = {
      js: {
        getRule: jest.fn(() => rules.js),
      },
      scss: {
        getRule: jest.fn(() => rules.scss),
      },
      css: {
        getRule: jest.fn(() => rules.css),
      },
      fonts: {
        common: {
          getRule: jest.fn(() => rules.commonFonts),
        },
        svg: {
          getRule: jest.fn(() => rules.svgFonts),
        },
      },
      images: {
        getRule: jest.fn(() => rules.images),
      },
      favicon: {
        getRule: jest.fn(() => rules.favicon),
      },
    };
    const copy = ['files-to-copy'];
    const params = {
      buildType,
      definitions,
      output,
      paths,
      target,
      rules,
      targetRules,
      copy,
    };
    const stats = 'stats';

    const appLogger = 'appLogger';
    const babelConfig = {
      babel: true,
    };
    const babelConfiguration = {
      getConfigForTarget: jest.fn(() => babelConfig),
    };
    const babelHelper = {
      disableEnvPresetModules: jest.fn((config) => Object.assign({}, config, { modules: false })),
      addPlugin: jest.fn((config, plugin) => Object.assign({}, config, {
        plugins: {
          [plugin]: true,
        },
      })),
    };
    const events = {
      reduce: jest.fn((eventName, configurationToReduce) => configurationToReduce),
    };
    const packageInfo = {
      dependencies: {
        jimpex: 'latest',
      },
      devDependencies: {
        wootils: 'latest',
        colors: 'next',
      },
    };
    const pathUtils = {
      join: jest.fn((rest) => rest),
    };
    const pluginName = 'plugin';
    const rollupPluginExternal = 'jimpexExt';
    const rollupPluginExternalNormalized = 'JimpexExt';
    const rollupPluginInfo = {
      name: pluginName,
      external: [rollupPluginExternal],
    };
    const targetsHTML = 'targetsHTML';
    let sut = null;
    let result = null;
    const expectedGlobals = {
      [`${pluginName}/${rollupPluginExternal}`]: `${pluginName}${rollupPluginExternalNormalized}`,
    };
    [
      ...builtinModules,
      ...Object.keys(packageInfo.dependencies),
      ...Object.keys(packageInfo.devDependencies),
    ].forEach((name) => {
      expectedGlobals[name] = name;
    });
    const expectedAssets = {
      fonts: {
        include: [
          ...rules.commonFonts.files.include,
          ...rules.svgFonts.files.include,
        ],
        exclude: [
          ...rules.commonFonts.files.exclude,
          ...rules.svgFonts.files.exclude,
        ],
        output: `${target.paths.build}/${paths.fonts}`,
        url: `/${paths.fonts}`,
      },
      images: {
        include: [...rules.images.files.include],
        exclude: [...rules.images.files.exclude],
        output: `${target.paths.build}/${paths.images}`,
        url: `/${paths.images}`,
      },
      favicon: {
        include: [...rules.favicon.files.include],
        exclude: [...rules.favicon.files.exclude],
        output: `${target.paths.build}/[name].[ext]`,
        url: '/[name].[ext]',
      },
    };
    const expectedSettings = {
      external: {
        external: [
          ...builtinModules,
          `${pluginName}/${rollupPluginExternal}`,
          ...Object.keys(packageInfo.dependencies),
          ...Object.keys(packageInfo.devDependencies),
        ],
      },
      globals: expectedGlobals,
      resolve: {
        extensions: ['.js', '.json', '.jsx'],
        browser: false,
        preferBuiltins: true,
      },
      replace: definitions,
      babel: Object.assign({}, babelConfig, {
        modules: false,
        plugins: {
          'external-helpers': true,
        },
        include: rules.js.files.glob.include,
        exclude: rules.js.files.glob.exclude,
      }),
      commonjs: {
        include: [
          /config/i,
          /node_modules\//i,
        ],
      },
      sass: {
        include: rules.scss.files.include,
        exclude: rules.scss.files.exclude,
        options: {
          sourceMapEmbed: true,
          outputStyle: 'compressed',
          includePaths: ['node_modules'],
        },
        failOnError: true,
        processor: expect.any(Function),
        output: false,
      },
      css: {
        include: rules.css.files.include,
        exclude: rules.css.files.exclude,
        processor: expect.any(Function),
        stats,
        output: false,
      },
      stylesheetAssets: {
        stylesheet: output.file,
        stats,
        urls: [
          expectedAssets.fonts,
          expectedAssets.images,
        ],
      },
      stylesheetModulesFixer: {
        include: [
          ...rules.scss.files.include,
          ...rules.css.files.include,
        ],
        exclude: [
          ...rules.scss.files.exclude,
          ...rules.css.files.exclude,
        ],
      },
      html: {},
      json: {},
      urls: {
        urls: [
          expectedAssets.fonts,
          expectedAssets.images,
          expectedAssets.favicon,
        ],
        stats,
      },
      watch: {
        clearScreen: false,
      },
      uglify: {},
      compression: {
        folder: target.paths.build,
        include: [expect.any(RegExp)],
        exclude: [],
        stats,
      },
      copy: {
        files: copy,
        stats,
      },
      statsLog: {
        extraEntries: [
          {
            plugin: 'rollup',
            filepath: `${target.paths.build}/${paths.js}`,
          },
        ],
      },
      nodeRunner: {
        file: output.file,
        logger: appLogger,
      },
      stylesheetAssetsHelper: {
        include: [
          ...rules.scss.files.include,
          ...rules.css.files.include,
        ],
        exclude: [
          ...rules.scss.files.exclude,
          ...rules.css.files.exclude,
        ],
      },
    };
    const expectedEvents = [
      {
        events: [
          'rollup-external-plugin-settings-configuration-for-node',
          'rollup-external-plugin-settings-configuration',
        ],
        settings: expectedSettings.external,
      },
      {
        events: [
          'rollup-global-variables-settings-configuration-for-node',
          'rollup-global-variables-settings-configuration',
        ],
        settings: expectedSettings.globals,
      },
      {
        events: [
          'rollup-resolve-plugin-settings-configuration-for-node',
          'rollup-resolve-plugin-settings-configuration',
        ],
        settings: expectedSettings.resolve,
      },
      {
        events: [
          'rollup-replace-plugin-settings-configuration-for-node',
          'rollup-replace-plugin-settings-configuration',
        ],
        settings: expectedSettings.replace,
      },
      {
        events: [
          'rollup-babel-plugin-settings-configuration-for-node',
          'rollup-babel-plugin-settings-configuration',
        ],
        settings: expectedSettings.babel,
      },
      {
        events: [
          'rollup-commonjs-plugin-settings-configuration-for-node',
          'rollup-commonjs-plugin-settings-configuration',
        ],
        settings: expectedSettings.commonjs,
      },
      {
        events: [
          'rollup-sass-plugin-settings-configuration-for-node',
          'rollup-sass-plugin-settings-configuration',
        ],
        settings: expectedSettings.sass,
      },
      {
        events: [
          'rollup-css-plugin-settings-configuration-for-node',
          'rollup-css-plugin-settings-configuration',
        ],
        settings: expectedSettings.css,
      },
      {
        events: [
          'rollup-stylesheet-assets-plugin-settings-configuration-for-node',
          'rollup-stylesheet-assets-plugin-settings-configuration',
        ],
        settings: expectedSettings.stylesheetAssets,
      },
      {
        events: [
          'rollup-stylesheet-modules-fixer-plugin-settings-configuration-for-node',
          'rollup-stylesheet-modules-fixer-plugin-settings-configuration',
        ],
        settings: expectedSettings.stylesheetModulesFixer,
      },
      {
        events: [
          'rollup-html-plugin-settings-configuration-for-node',
          'rollup-html-plugin-settings-configuration',
        ],
        settings: expectedSettings.html,
      },
      {
        events: [
          'rollup-json-plugin-settings-configuration-for-node',
          'rollup-json-plugin-settings-configuration',
        ],
        settings: expectedSettings.json,
      },
      {
        events: [
          'rollup-urls-plugin-settings-configuration-for-node',
          'rollup-urls-plugin-settings-configuration',
        ],
        settings: expectedSettings.urls,
      },
      {
        events: [
          'rollup-watch-plugin-settings-configuration-for-node',
          'rollup-watch-plugin-settings-configuration',
        ],
        settings: expectedSettings.watch,
      },
      {
        events: [
          'rollup-uglify-plugin-settings-configuration-for-node',
          'rollup-uglify-plugin-settings-configuration',
        ],
        settings: expectedSettings.uglify,
      },
      {
        events: [
          'rollup-compression-plugin-settings-configuration-for-node',
          'rollup-compression-plugin-settings-configuration',
        ],
        settings: expectedSettings.compression,
      },
      {
        events: [
          'rollup-copy-plugin-settings-configuration-for-node',
          'rollup-copy-plugin-settings-configuration',
        ],
        settings: expectedSettings.copy,
      },
      {
        events: [
          'rollup-stats-plugin-settings-configuration-for-node',
          'rollup-stats-plugin-settings-configuration',
        ],
        settings: expectedSettings.statsLog,
      },
      {
        events: 'rollup-node-runner-plugin-settings-configuration',
        settings: expectedSettings.nodeRunner,
      },
      {
        events: 'rollup-stylesheet-assets-helper-plugin-settings-configuration',
        settings: expectedSettings.stylesheetAssetsHelper,
      },
      {
        events: [
          'rollup-plugin-settings-configuration-for-node',
          'rollup-plugin-settings-configuration',
        ],
        settings: expectedSettings,
      },
    ];
    // When
    sut = new RollupPluginSettingsConfiguration(
      appLogger,
      babelConfiguration,
      babelHelper,
      events,
      packageInfo,
      pathUtils,
      rollupPluginInfo,
      targetsHTML
    );
    result = sut.getConfig(params, stats);
    // Then
    expect(result).toEqual(expectedSettings);
    expect(events.reduce).toHaveBeenCalledTimes(expectedEvents.length);
    expectedEvents.forEach((event) => {
      expect(events.reduce).toHaveBeenCalledWith(
        event.events,
        event.settings,
        params
      );
    });
    expect(pathUtils.join).toHaveBeenCalledTimes(1);
    expect(pathUtils.join).toHaveBeenCalledWith('config');
  });

  it('shouldn\'t include the dev dependencies as externals for a Node production build', () => {
    // Given
    const buildType = 'production';
    const definitions = {
      NODE_ENV: 'production',
    };
    const output = {
      file: 'output-file',
    };
    const paths = {
      js: 'js-path',
      css: 'css-path',
      fonts: 'fonts-path',
      images: 'images-path',
    };
    const target = {
      css: {
        modules: false,
      },
      paths: {
        build: 'dist',
      },
      is: {
        node: true,
        browser: false,
      },
    };
    const rules = {
      js: {
        paths: {
          include: ['js-paths-include'],
          exclude: ['js-paths-exclude'],
        },
        files: {
          glob: {
            include: ['js-files-include-glob'],
            exclude: ['js-files-exclude-glob'],
          },
        },
      },
      scss: {
        files: {
          include: ['scss-files-include-regex'],
          exclude: ['scss-files-exclude-regex'],
        },
      },
      css: {
        files: {
          include: ['css-files-include-regex'],
          exclude: ['css-files-exclude-regex'],
        },
      },
      commonFonts: {
        files: {
          include: ['common-fonts-files-include-regex'],
          exclude: ['common-fonts-files-exclude-regex'],
        },
      },
      svgFonts: {
        files: {
          include: ['svg-fonts-files-include-regex'],
          exclude: ['svg-fonts-files-exclude-regex'],
        },
      },
      images: {
        files: {
          include: ['images-files-include-regex'],
          exclude: ['images-files-exclude-regex'],
        },
      },
      favicon: {
        files: {
          include: ['favicon-files-include-regex'],
          exclude: ['favicon-files-exclude-regex'],
        },
      },
    };
    const targetRules = {
      js: {
        getRule: jest.fn(() => rules.js),
      },
      scss: {
        getRule: jest.fn(() => rules.scss),
      },
      css: {
        getRule: jest.fn(() => rules.css),
      },
      fonts: {
        common: {
          getRule: jest.fn(() => rules.commonFonts),
        },
        svg: {
          getRule: jest.fn(() => rules.svgFonts),
        },
      },
      images: {
        getRule: jest.fn(() => rules.images),
      },
      favicon: {
        getRule: jest.fn(() => rules.favicon),
      },
    };
    const copy = ['files-to-copy'];
    const params = {
      buildType,
      definitions,
      output,
      paths,
      target,
      rules,
      targetRules,
      copy,
    };
    const stats = 'stats';

    const appLogger = 'appLogger';
    const babelConfig = {
      babel: true,
    };
    const babelConfiguration = {
      getConfigForTarget: jest.fn(() => babelConfig),
    };
    const babelHelper = {
      disableEnvPresetModules: jest.fn((config) => Object.assign({}, config, { modules: false })),
      addPlugin: jest.fn((config, plugin) => Object.assign({}, config, {
        plugins: {
          [plugin]: true,
        },
      })),
    };
    const events = {
      reduce: jest.fn((eventName, configurationToReduce) => configurationToReduce),
    };
    const packageInfo = {
      dependencies: {
        jimpex: 'latest',
      },
      devDependencies: {
        wootils: 'latest',
        colors: 'next',
      },
    };
    const pathUtils = {
      join: jest.fn((rest) => rest),
    };
    const pluginName = 'plugin';
    const rollupPluginExternal = 'jimpexExt';
    const rollupPluginExternalNormalized = 'JimpexExt';
    const rollupPluginInfo = {
      name: pluginName,
      external: [rollupPluginExternal],
    };
    const targetsHTML = 'targetsHTML';
    let sut = null;
    let result = null;
    const expectedGlobals = {
      [`${pluginName}/${rollupPluginExternal}`]: `${pluginName}${rollupPluginExternalNormalized}`,
    };
    [
      ...builtinModules,
      ...Object.keys(packageInfo.dependencies),
    ].forEach((name) => {
      expectedGlobals[name] = name;
    });
    const expectedAssets = {
      fonts: {
        include: [
          ...rules.commonFonts.files.include,
          ...rules.svgFonts.files.include,
        ],
        exclude: [
          ...rules.commonFonts.files.exclude,
          ...rules.svgFonts.files.exclude,
        ],
        output: `${target.paths.build}/${paths.fonts}`,
        url: `/${paths.fonts}`,
      },
      images: {
        include: [...rules.images.files.include],
        exclude: [...rules.images.files.exclude],
        output: `${target.paths.build}/${paths.images}`,
        url: `/${paths.images}`,
      },
      favicon: {
        include: [...rules.favicon.files.include],
        exclude: [...rules.favicon.files.exclude],
        output: `${target.paths.build}/[name].[ext]`,
        url: '/[name].[ext]',
      },
    };
    const expectedSettings = {
      external: {
        external: [
          ...builtinModules,
          `${pluginName}/${rollupPluginExternal}`,
          ...Object.keys(packageInfo.dependencies),
        ],
      },
      globals: expectedGlobals,
      resolve: {
        extensions: ['.js', '.json', '.jsx'],
        browser: false,
        preferBuiltins: true,
      },
      replace: definitions,
      babel: Object.assign({}, babelConfig, {
        modules: false,
        plugins: {
          'external-helpers': true,
        },
        include: rules.js.files.glob.include,
        exclude: rules.js.files.glob.exclude,
      }),
      commonjs: {
        include: [
          /config/i,
          /node_modules\//i,
        ],
      },
      sass: {
        include: rules.scss.files.include,
        exclude: rules.scss.files.exclude,
        options: {
          sourceMapEmbed: true,
          outputStyle: 'compressed',
          includePaths: ['node_modules'],
        },
        failOnError: true,
        processor: expect.any(Function),
        output: false,
      },
      css: {
        include: rules.css.files.include,
        exclude: rules.css.files.exclude,
        processor: expect.any(Function),
        stats,
        output: false,
      },
      stylesheetAssets: {
        stylesheet: output.file,
        stats,
        urls: [
          expectedAssets.fonts,
          expectedAssets.images,
        ],
      },
      stylesheetModulesFixer: {
        include: [
          ...rules.scss.files.include,
          ...rules.css.files.include,
        ],
        exclude: [
          ...rules.scss.files.exclude,
          ...rules.css.files.exclude,
        ],
      },
      html: {},
      json: {},
      urls: {
        urls: [
          expectedAssets.fonts,
          expectedAssets.images,
          expectedAssets.favicon,
        ],
        stats,
      },
      watch: {
        clearScreen: false,
      },
      uglify: {},
      compression: {
        folder: target.paths.build,
        include: [expect.any(RegExp)],
        exclude: [],
        stats,
      },
      copy: {
        files: copy,
        stats,
      },
      statsLog: {
        extraEntries: [
          {
            plugin: 'rollup',
            filepath: `${target.paths.build}/${paths.js}`,
          },
        ],
      },
      nodeRunner: {
        file: output.file,
        logger: appLogger,
      },
      stylesheetAssetsHelper: {
        include: [
          ...rules.scss.files.include,
          ...rules.css.files.include,
        ],
        exclude: [
          ...rules.scss.files.exclude,
          ...rules.css.files.exclude,
        ],
      },
    };
    const expectedEvents = [
      {
        events: [
          'rollup-external-plugin-settings-configuration-for-node',
          'rollup-external-plugin-settings-configuration',
        ],
        settings: expectedSettings.external,
      },
      {
        events: [
          'rollup-global-variables-settings-configuration-for-node',
          'rollup-global-variables-settings-configuration',
        ],
        settings: expectedSettings.globals,
      },
      {
        events: [
          'rollup-resolve-plugin-settings-configuration-for-node',
          'rollup-resolve-plugin-settings-configuration',
        ],
        settings: expectedSettings.resolve,
      },
      {
        events: [
          'rollup-replace-plugin-settings-configuration-for-node',
          'rollup-replace-plugin-settings-configuration',
        ],
        settings: expectedSettings.replace,
      },
      {
        events: [
          'rollup-babel-plugin-settings-configuration-for-node',
          'rollup-babel-plugin-settings-configuration',
        ],
        settings: expectedSettings.babel,
      },
      {
        events: [
          'rollup-commonjs-plugin-settings-configuration-for-node',
          'rollup-commonjs-plugin-settings-configuration',
        ],
        settings: expectedSettings.commonjs,
      },
      {
        events: [
          'rollup-sass-plugin-settings-configuration-for-node',
          'rollup-sass-plugin-settings-configuration',
        ],
        settings: expectedSettings.sass,
      },
      {
        events: [
          'rollup-css-plugin-settings-configuration-for-node',
          'rollup-css-plugin-settings-configuration',
        ],
        settings: expectedSettings.css,
      },
      {
        events: [
          'rollup-stylesheet-assets-plugin-settings-configuration-for-node',
          'rollup-stylesheet-assets-plugin-settings-configuration',
        ],
        settings: expectedSettings.stylesheetAssets,
      },
      {
        events: [
          'rollup-stylesheet-modules-fixer-plugin-settings-configuration-for-node',
          'rollup-stylesheet-modules-fixer-plugin-settings-configuration',
        ],
        settings: expectedSettings.stylesheetModulesFixer,
      },
      {
        events: [
          'rollup-html-plugin-settings-configuration-for-node',
          'rollup-html-plugin-settings-configuration',
        ],
        settings: expectedSettings.html,
      },
      {
        events: [
          'rollup-json-plugin-settings-configuration-for-node',
          'rollup-json-plugin-settings-configuration',
        ],
        settings: expectedSettings.json,
      },
      {
        events: [
          'rollup-urls-plugin-settings-configuration-for-node',
          'rollup-urls-plugin-settings-configuration',
        ],
        settings: expectedSettings.urls,
      },
      {
        events: [
          'rollup-watch-plugin-settings-configuration-for-node',
          'rollup-watch-plugin-settings-configuration',
        ],
        settings: expectedSettings.watch,
      },
      {
        events: [
          'rollup-uglify-plugin-settings-configuration-for-node',
          'rollup-uglify-plugin-settings-configuration',
        ],
        settings: expectedSettings.uglify,
      },
      {
        events: [
          'rollup-compression-plugin-settings-configuration-for-node',
          'rollup-compression-plugin-settings-configuration',
        ],
        settings: expectedSettings.compression,
      },
      {
        events: [
          'rollup-copy-plugin-settings-configuration-for-node',
          'rollup-copy-plugin-settings-configuration',
        ],
        settings: expectedSettings.copy,
      },
      {
        events: [
          'rollup-stats-plugin-settings-configuration-for-node',
          'rollup-stats-plugin-settings-configuration',
        ],
        settings: expectedSettings.statsLog,
      },
      {
        events: 'rollup-node-runner-plugin-settings-configuration',
        settings: expectedSettings.nodeRunner,
      },
      {
        events: 'rollup-stylesheet-assets-helper-plugin-settings-configuration',
        settings: expectedSettings.stylesheetAssetsHelper,
      },
      {
        events: [
          'rollup-plugin-settings-configuration-for-node',
          'rollup-plugin-settings-configuration',
        ],
        settings: expectedSettings,
      },
    ];
    // When
    sut = new RollupPluginSettingsConfiguration(
      appLogger,
      babelConfiguration,
      babelHelper,
      events,
      packageInfo,
      pathUtils,
      rollupPluginInfo,
      targetsHTML
    );
    result = sut.getConfig(params, stats);
    // Then
    expect(result).toEqual(expectedSettings);
    expect(events.reduce).toHaveBeenCalledTimes(expectedEvents.length);
    expectedEvents.forEach((event) => {
      expect(events.reduce).toHaveBeenCalledWith(
        event.events,
        event.settings,
        params
      );
    });
  });

  it('should generate the plugins configuration for a browser target build', () => {
    // Given
    const buildType = 'development';
    const definitions = {
      NODE_ENV: 'development',
    };
    const output = {
      file: 'output-file',
    };
    const paths = {
      js: 'js-path',
      css: 'css-path',
      fonts: 'fonts-path',
      images: 'images-path',
    };
    const excludeModule = 'colors';
    const target = {
      css: {
        modules: false,
      },
      paths: {
        build: 'dist',
      },
      is: {
        node: false,
        browser: true,
      },
      html: {
        filename: 'my-target.html',
      },
      devServer: {
        host: 'localhost',
        port: 2509,
        ssl: {},
      },
      excludeModules: [
        excludeModule,
      ],
    };
    const rules = {
      js: {
        paths: {
          include: ['js-paths-include'],
          exclude: ['js-paths-exclude'],
        },
        files: {
          glob: {
            include: ['js-files-include-glob'],
            exclude: ['js-files-exclude-glob'],
          },
        },
      },
      scss: {
        files: {
          include: ['scss-files-include-regex'],
          exclude: ['scss-files-exclude-regex'],
        },
      },
      css: {
        files: {
          include: ['css-files-include-regex'],
          exclude: ['css-files-exclude-regex'],
        },
      },
      commonFonts: {
        files: {
          include: ['common-fonts-files-include-regex'],
          exclude: ['common-fonts-files-exclude-regex'],
        },
      },
      svgFonts: {
        files: {
          include: ['svg-fonts-files-include-regex'],
          exclude: ['svg-fonts-files-exclude-regex'],
        },
      },
      images: {
        files: {
          include: ['images-files-include-regex'],
          exclude: ['images-files-exclude-regex'],
        },
      },
      favicon: {
        files: {
          include: ['favicon-files-include-regex'],
          exclude: ['favicon-files-exclude-regex'],
        },
      },
    };
    const targetRules = {
      js: {
        getRule: jest.fn(() => rules.js),
      },
      scss: {
        getRule: jest.fn(() => rules.scss),
      },
      css: {
        getRule: jest.fn(() => rules.css),
      },
      fonts: {
        common: {
          getRule: jest.fn(() => rules.commonFonts),
        },
        svg: {
          getRule: jest.fn(() => rules.svgFonts),
        },
      },
      images: {
        getRule: jest.fn(() => rules.images),
      },
      favicon: {
        getRule: jest.fn(() => rules.favicon),
      },
    };
    const copy = ['files-to-copy'];
    const params = {
      buildType,
      definitions,
      output,
      paths,
      target,
      rules,
      targetRules,
      copy,
    };
    const stats = 'stats';

    const appLogger = 'appLogger';
    const babelConfig = {
      babel: true,
    };
    const babelConfiguration = {
      getConfigForTarget: jest.fn(() => babelConfig),
    };
    const babelHelper = {
      disableEnvPresetModules: jest.fn((config) => Object.assign({}, config, { modules: false })),
      addPlugin: jest.fn((config, plugin) => Object.assign({}, config, {
        plugins: {
          [plugin]: true,
        },
      })),
    };
    const events = {
      reduce: jest.fn((eventName, configurationToReduce) => configurationToReduce),
    };
    const packageInfo = {
      dependencies: {
        jimpex: 'latest',
      },
      devDependencies: {
        wootils: 'latest',
        colors: 'next',
      },
    };
    const pathUtils = {
      join: jest.fn((rest) => rest),
    };
    const pluginName = 'plugin';
    const rollupPluginInfo = {
      name: pluginName,
      external: [],
    };
    const htmlFile = 'index.html';
    const targetsHTML = {
      getFilepath: jest.fn(() => htmlFile),
    };
    let sut = null;
    let result = null;
    const expectedAssets = {
      fonts: {
        include: [
          ...rules.commonFonts.files.include,
          ...rules.svgFonts.files.include,
        ],
        exclude: [
          ...rules.commonFonts.files.exclude,
          ...rules.svgFonts.files.exclude,
        ],
        output: `${target.paths.build}/${paths.fonts}`,
        url: `/${paths.fonts}`,
      },
      images: {
        include: [...rules.images.files.include],
        exclude: [...rules.images.files.exclude],
        output: `${target.paths.build}/${paths.images}`,
        url: `/${paths.images}`,
      },
      favicon: {
        include: [...rules.favicon.files.include],
        exclude: [...rules.favicon.files.exclude],
        output: `${target.paths.build}/[name].[ext]`,
        url: '/[name].[ext]',
      },
    };
    const expectedSettings = {
      external: {
        external: [
          excludeModule,
        ],
      },
      globals: {
        [excludeModule]: excludeModule,
      },
      resolve: {
        extensions: ['.js', '.json', '.jsx'],
        browser: true,
        preferBuiltins: false,
      },
      replace: definitions,
      babel: Object.assign({}, babelConfig, {
        modules: false,
        plugins: {
          'external-helpers': true,
        },
        include: rules.js.files.glob.include,
        exclude: rules.js.files.glob.exclude,
      }),
      commonjs: {
        include: [
          /config/i,
          /node_modules\//i,
        ],
      },
      sass: {
        include: rules.scss.files.include,
        exclude: rules.scss.files.exclude,
        options: {
          sourceMapEmbed: true,
          outputStyle: 'compressed',
          includePaths: ['node_modules'],
        },
        failOnError: true,
        processor: expect.any(Function),
        output: `${target.paths.build}/${paths.css}`,
      },
      css: {
        include: rules.css.files.include,
        exclude: rules.css.files.exclude,
        processor: expect.any(Function),
        stats,
        output: `${target.paths.build}/${paths.css}`,
      },
      stylesheetAssets: {
        stylesheet: `${target.paths.build}/${paths.css}`,
        stats,
        urls: [
          expectedAssets.fonts,
          expectedAssets.images,
        ],
      },
      stylesheetModulesFixer: {
        include: [
          ...rules.scss.files.include,
          ...rules.css.files.include,
        ],
        exclude: [
          ...rules.scss.files.exclude,
          ...rules.css.files.exclude,
        ],
      },
      html: {},
      json: {},
      urls: {
        urls: [
          expectedAssets.fonts,
          expectedAssets.images,
          expectedAssets.favicon,
        ],
        stats,
      },
      watch: {
        clearScreen: false,
      },
      uglify: {},
      compression: {
        folder: target.paths.build,
        include: [expect.any(RegExp)],
        exclude: [],
        stats,
      },
      copy: {
        files: copy,
        stats,
      },
      statsLog: {
        extraEntries: [
          {
            plugin: 'rollup',
            filepath: `${target.paths.build}/${paths.js}`,
          },
          {
            plugin: 'rollup-plugin-sass',
            filepath: `${target.paths.build}/${paths.css}`,
          },
        ],
      },
      template: {
        template: htmlFile,
        output: `${target.paths.build}/${target.html.filename}`,
        stylesheets: [`/${paths.css}`],
        scripts: [`/${paths.js}`],
        urls: [
          expectedAssets.images,
          expectedAssets.favicon,
        ],
        stats,
      },
      devServer: {
        host: target.devServer.host,
        port: target.devServer.port,
        contentBase: target.paths.build,
        historyApiFallback: false,
        open: false,
        https: null,
        logger: appLogger,
      },
    };
    const expectedEvents = [
      {
        events: [
          'rollup-external-plugin-settings-configuration-for-browser',
          'rollup-external-plugin-settings-configuration',
        ],
        settings: expectedSettings.external,
      },
      {
        events: [
          'rollup-global-variables-settings-configuration-for-browser',
          'rollup-global-variables-settings-configuration',
        ],
        settings: expectedSettings.globals,
      },
      {
        events: [
          'rollup-resolve-plugin-settings-configuration-for-browser',
          'rollup-resolve-plugin-settings-configuration',
        ],
        settings: expectedSettings.resolve,
      },
      {
        events: [
          'rollup-replace-plugin-settings-configuration-for-browser',
          'rollup-replace-plugin-settings-configuration',
        ],
        settings: expectedSettings.replace,
      },
      {
        events: [
          'rollup-babel-plugin-settings-configuration-for-browser',
          'rollup-babel-plugin-settings-configuration',
        ],
        settings: expectedSettings.babel,
      },
      {
        events: [
          'rollup-commonjs-plugin-settings-configuration-for-browser',
          'rollup-commonjs-plugin-settings-configuration',
        ],
        settings: expectedSettings.commonjs,
      },
      {
        events: [
          'rollup-sass-plugin-settings-configuration-for-browser',
          'rollup-sass-plugin-settings-configuration',
        ],
        settings: expectedSettings.sass,
      },
      {
        events: [
          'rollup-css-plugin-settings-configuration-for-browser',
          'rollup-css-plugin-settings-configuration',
        ],
        settings: expectedSettings.css,
      },
      {
        events: [
          'rollup-stylesheet-assets-plugin-settings-configuration-for-browser',
          'rollup-stylesheet-assets-plugin-settings-configuration',
        ],
        settings: expectedSettings.stylesheetAssets,
      },
      {
        events: [
          'rollup-stylesheet-modules-fixer-plugin-settings-configuration-for-browser',
          'rollup-stylesheet-modules-fixer-plugin-settings-configuration',
        ],
        settings: expectedSettings.stylesheetModulesFixer,
      },
      {
        events: [
          'rollup-html-plugin-settings-configuration-for-browser',
          'rollup-html-plugin-settings-configuration',
        ],
        settings: expectedSettings.html,
      },
      {
        events: [
          'rollup-json-plugin-settings-configuration-for-browser',
          'rollup-json-plugin-settings-configuration',
        ],
        settings: expectedSettings.json,
      },
      {
        events: [
          'rollup-urls-plugin-settings-configuration-for-browser',
          'rollup-urls-plugin-settings-configuration',
        ],
        settings: expectedSettings.urls,
      },
      {
        events: [
          'rollup-watch-plugin-settings-configuration-for-browser',
          'rollup-watch-plugin-settings-configuration',
        ],
        settings: expectedSettings.watch,
      },
      {
        events: [
          'rollup-uglify-plugin-settings-configuration-for-browser',
          'rollup-uglify-plugin-settings-configuration',
        ],
        settings: expectedSettings.uglify,
      },
      {
        events: [
          'rollup-compression-plugin-settings-configuration-for-browser',
          'rollup-compression-plugin-settings-configuration',
        ],
        settings: expectedSettings.compression,
      },
      {
        events: [
          'rollup-copy-plugin-settings-configuration-for-browser',
          'rollup-copy-plugin-settings-configuration',
        ],
        settings: expectedSettings.copy,
      },
      {
        events: [
          'rollup-stats-plugin-settings-configuration-for-browser',
          'rollup-stats-plugin-settings-configuration',
        ],
        settings: expectedSettings.statsLog,
      },
      {
        events: 'rollup-template-plugin-settings-configuration',
        settings: expectedSettings.template,
      },
      {
        events: 'rollup-dev-server-plugin-settings-configuration',
        settings: expectedSettings.devServer,
      },
      {
        events: [
          'rollup-plugin-settings-configuration-for-browser',
          'rollup-plugin-settings-configuration',
        ],
        settings: expectedSettings,
      },
    ];
    // When
    sut = new RollupPluginSettingsConfiguration(
      appLogger,
      babelConfiguration,
      babelHelper,
      events,
      packageInfo,
      pathUtils,
      rollupPluginInfo,
      targetsHTML
    );
    result = sut.getConfig(params, stats);
    // Then
    expect(result).toEqual(expectedSettings);
    expect(events.reduce).toHaveBeenCalledTimes(expectedEvents.length);
    expectedEvents.forEach((event) => {
      expect(events.reduce).toHaveBeenCalledWith(
        event.events,
        event.settings,
        params
      );
    });
  });

  it('should generate the settings for a browser target that injects its styles', () => {
    // Given
    const buildType = 'development';
    const definitions = {
      NODE_ENV: 'development',
    };
    const output = {
      file: 'output-file',
    };
    const paths = {
      js: 'js-path',
      css: 'css-path',
      fonts: 'fonts-path',
      images: 'images-path',
    };
    const excludeModule = 'colors';
    const target = {
      css: {
        modules: false,
        inject: true,
      },
      paths: {
        build: 'dist',
      },
      is: {
        node: false,
        browser: true,
      },
      html: {
        filename: 'my-target.html',
      },
      devServer: {
        host: 'localhost',
        port: 2509,
        ssl: {},
      },
      excludeModules: [
        excludeModule,
      ],
    };
    const rules = {
      js: {
        paths: {
          include: ['js-paths-include'],
          exclude: ['js-paths-exclude'],
        },
        files: {
          glob: {
            include: ['js-files-include-glob'],
            exclude: ['js-files-exclude-glob'],
          },
        },
      },
      scss: {
        files: {
          include: ['scss-files-include-regex'],
          exclude: ['scss-files-exclude-regex'],
        },
      },
      css: {
        files: {
          include: ['css-files-include-regex'],
          exclude: ['css-files-exclude-regex'],
        },
      },
      commonFonts: {
        files: {
          include: ['common-fonts-files-include-regex'],
          exclude: ['common-fonts-files-exclude-regex'],
        },
      },
      svgFonts: {
        files: {
          include: ['svg-fonts-files-include-regex'],
          exclude: ['svg-fonts-files-exclude-regex'],
        },
      },
      images: {
        files: {
          include: ['images-files-include-regex'],
          exclude: ['images-files-exclude-regex'],
        },
      },
      favicon: {
        files: {
          include: ['favicon-files-include-regex'],
          exclude: ['favicon-files-exclude-regex'],
        },
      },
    };
    const targetRules = {
      js: {
        getRule: jest.fn(() => rules.js),
      },
      scss: {
        getRule: jest.fn(() => rules.scss),
      },
      css: {
        getRule: jest.fn(() => rules.css),
      },
      fonts: {
        common: {
          getRule: jest.fn(() => rules.commonFonts),
        },
        svg: {
          getRule: jest.fn(() => rules.svgFonts),
        },
      },
      images: {
        getRule: jest.fn(() => rules.images),
      },
      favicon: {
        getRule: jest.fn(() => rules.favicon),
      },
    };
    const copy = ['files-to-copy'];
    const params = {
      buildType,
      definitions,
      output,
      paths,
      target,
      rules,
      targetRules,
      copy,
    };
    const stats = 'stats';

    const appLogger = 'appLogger';
    const babelConfig = {
      babel: true,
    };
    const babelConfiguration = {
      getConfigForTarget: jest.fn(() => babelConfig),
    };
    const babelHelper = {
      disableEnvPresetModules: jest.fn((config) => Object.assign({}, config, { modules: false })),
      addPlugin: jest.fn((config, plugin) => Object.assign({}, config, {
        plugins: {
          [plugin]: true,
        },
      })),
    };
    const events = {
      reduce: jest.fn((eventName, configurationToReduce) => configurationToReduce),
    };
    const packageInfo = {
      dependencies: {
        jimpex: 'latest',
      },
      devDependencies: {
        wootils: 'latest',
        colors: 'next',
      },
    };
    const pathUtils = {
      join: jest.fn((rest) => rest),
    };
    const pluginName = 'plugin';
    const rollupPluginInfo = {
      name: pluginName,
      external: [],
    };
    const htmlFile = 'index.html';
    const targetsHTML = {
      getFilepath: jest.fn(() => htmlFile),
    };
    let sut = null;
    let result = null;
    const expectedAssets = {
      fonts: {
        include: [
          ...rules.commonFonts.files.include,
          ...rules.svgFonts.files.include,
        ],
        exclude: [
          ...rules.commonFonts.files.exclude,
          ...rules.svgFonts.files.exclude,
        ],
        output: `${target.paths.build}/${paths.fonts}`,
        url: `/${paths.fonts}`,
      },
      images: {
        include: [...rules.images.files.include],
        exclude: [...rules.images.files.exclude],
        output: `${target.paths.build}/${paths.images}`,
        url: `/${paths.images}`,
      },
      favicon: {
        include: [...rules.favicon.files.include],
        exclude: [...rules.favicon.files.exclude],
        output: `${target.paths.build}/[name].[ext]`,
        url: '/[name].[ext]',
      },
    };
    const expectedSettings = {
      external: {
        external: [
          excludeModule,
        ],
      },
      globals: {
        [excludeModule]: excludeModule,
      },
      resolve: {
        extensions: ['.js', '.json', '.jsx'],
        browser: true,
        preferBuiltins: false,
      },
      replace: definitions,
      babel: Object.assign({}, babelConfig, {
        modules: false,
        plugins: {
          'external-helpers': true,
        },
        include: rules.js.files.glob.include,
        exclude: rules.js.files.glob.exclude,
      }),
      commonjs: {
        include: [
          /config/i,
          /node_modules\//i,
        ],
      },
      sass: {
        include: rules.scss.files.include,
        exclude: rules.scss.files.exclude,
        options: {
          sourceMapEmbed: true,
          outputStyle: 'compressed',
          includePaths: ['node_modules'],
        },
        failOnError: true,
        processor: expect.any(Function),
        insert: true,
      },
      css: {
        include: rules.css.files.include,
        exclude: rules.css.files.exclude,
        processor: expect.any(Function),
        stats,
        insert: true,
      },
      stylesheetAssets: {
        stylesheet: output.file,
        stats,
        urls: [
          expectedAssets.fonts,
          expectedAssets.images,
        ],
      },
      stylesheetModulesFixer: {
        include: [
          ...rules.scss.files.include,
          ...rules.css.files.include,
        ],
        exclude: [
          ...rules.scss.files.exclude,
          ...rules.css.files.exclude,
        ],
      },
      html: {},
      json: {},
      urls: {
        urls: [
          expectedAssets.fonts,
          expectedAssets.images,
          expectedAssets.favicon,
        ],
        stats,
      },
      watch: {
        clearScreen: false,
      },
      uglify: {},
      compression: {
        folder: target.paths.build,
        include: [expect.any(RegExp)],
        exclude: [],
        stats,
      },
      copy: {
        files: copy,
        stats,
      },
      statsLog: {
        extraEntries: [
          {
            plugin: 'rollup',
            filepath: `${target.paths.build}/${paths.js}`,
          },
        ],
      },
      template: {
        template: htmlFile,
        output: `${target.paths.build}/${target.html.filename}`,
        stylesheets: [],
        scripts: [`/${paths.js}`],
        urls: [
          expectedAssets.images,
          expectedAssets.favicon,
        ],
        stats,
      },
      devServer: {
        host: target.devServer.host,
        port: target.devServer.port,
        contentBase: target.paths.build,
        historyApiFallback: false,
        open: false,
        https: null,
        logger: appLogger,
      },
    };
    const expectedEvents = [
      {
        events: [
          'rollup-external-plugin-settings-configuration-for-browser',
          'rollup-external-plugin-settings-configuration',
        ],
        settings: expectedSettings.external,
      },
      {
        events: [
          'rollup-global-variables-settings-configuration-for-browser',
          'rollup-global-variables-settings-configuration',
        ],
        settings: expectedSettings.globals,
      },
      {
        events: [
          'rollup-resolve-plugin-settings-configuration-for-browser',
          'rollup-resolve-plugin-settings-configuration',
        ],
        settings: expectedSettings.resolve,
      },
      {
        events: [
          'rollup-replace-plugin-settings-configuration-for-browser',
          'rollup-replace-plugin-settings-configuration',
        ],
        settings: expectedSettings.replace,
      },
      {
        events: [
          'rollup-babel-plugin-settings-configuration-for-browser',
          'rollup-babel-plugin-settings-configuration',
        ],
        settings: expectedSettings.babel,
      },
      {
        events: [
          'rollup-commonjs-plugin-settings-configuration-for-browser',
          'rollup-commonjs-plugin-settings-configuration',
        ],
        settings: expectedSettings.commonjs,
      },
      {
        events: [
          'rollup-sass-plugin-settings-configuration-for-browser',
          'rollup-sass-plugin-settings-configuration',
        ],
        settings: expectedSettings.sass,
      },
      {
        events: [
          'rollup-css-plugin-settings-configuration-for-browser',
          'rollup-css-plugin-settings-configuration',
        ],
        settings: expectedSettings.css,
      },
      {
        events: [
          'rollup-stylesheet-assets-plugin-settings-configuration-for-browser',
          'rollup-stylesheet-assets-plugin-settings-configuration',
        ],
        settings: expectedSettings.stylesheetAssets,
      },
      {
        events: [
          'rollup-stylesheet-modules-fixer-plugin-settings-configuration-for-browser',
          'rollup-stylesheet-modules-fixer-plugin-settings-configuration',
        ],
        settings: expectedSettings.stylesheetModulesFixer,
      },
      {
        events: [
          'rollup-html-plugin-settings-configuration-for-browser',
          'rollup-html-plugin-settings-configuration',
        ],
        settings: expectedSettings.html,
      },
      {
        events: [
          'rollup-json-plugin-settings-configuration-for-browser',
          'rollup-json-plugin-settings-configuration',
        ],
        settings: expectedSettings.json,
      },
      {
        events: [
          'rollup-urls-plugin-settings-configuration-for-browser',
          'rollup-urls-plugin-settings-configuration',
        ],
        settings: expectedSettings.urls,
      },
      {
        events: [
          'rollup-watch-plugin-settings-configuration-for-browser',
          'rollup-watch-plugin-settings-configuration',
        ],
        settings: expectedSettings.watch,
      },
      {
        events: [
          'rollup-uglify-plugin-settings-configuration-for-browser',
          'rollup-uglify-plugin-settings-configuration',
        ],
        settings: expectedSettings.uglify,
      },
      {
        events: [
          'rollup-compression-plugin-settings-configuration-for-browser',
          'rollup-compression-plugin-settings-configuration',
        ],
        settings: expectedSettings.compression,
      },
      {
        events: [
          'rollup-copy-plugin-settings-configuration-for-browser',
          'rollup-copy-plugin-settings-configuration',
        ],
        settings: expectedSettings.copy,
      },
      {
        events: [
          'rollup-stats-plugin-settings-configuration-for-browser',
          'rollup-stats-plugin-settings-configuration',
        ],
        settings: expectedSettings.statsLog,
      },
      {
        events: 'rollup-template-plugin-settings-configuration',
        settings: expectedSettings.template,
      },
      {
        events: 'rollup-dev-server-plugin-settings-configuration',
        settings: expectedSettings.devServer,
      },
      {
        events: [
          'rollup-plugin-settings-configuration-for-browser',
          'rollup-plugin-settings-configuration',
        ],
        settings: expectedSettings,
      },
    ];
    // When
    sut = new RollupPluginSettingsConfiguration(
      appLogger,
      babelConfiguration,
      babelHelper,
      events,
      packageInfo,
      pathUtils,
      rollupPluginInfo,
      targetsHTML
    );
    result = sut.getConfig(params, stats);
    // Then
    expect(result).toEqual(expectedSettings);
    expect(events.reduce).toHaveBeenCalledTimes(expectedEvents.length);
    expectedEvents.forEach((event) => {
      expect(events.reduce).toHaveBeenCalledWith(
        event.events,
        event.settings,
        params
      );
    });
  });

  it('should generate the configurations with a dev server that supports SSL', () => {
    // Given
    // - key file
    fs.pathExistsSync.mockImplementationOnce(() => true);
    fs.readFileSync.mockImplementationOnce((filepath) => filepath);
    // - cert file
    fs.pathExistsSync.mockImplementationOnce(() => false);
    const buildType = 'development';
    const definitions = {
      NODE_ENV: 'development',
    };
    const output = {
      file: 'output-file',
    };
    const paths = {
      js: 'js-path',
      css: 'css-path',
      fonts: 'fonts-path',
      images: 'images-path',
    };
    const excludeModule = 'colors';
    const target = {
      css: {
        modules: false,
      },
      paths: {
        build: 'dist',
      },
      is: {
        node: false,
        browser: true,
      },
      html: {
        filename: 'my-target.html',
      },
      devServer: {
        host: 'localhost',
        port: 2509,
        ssl: {
          key: 'file.key',
          cert: 'file.cert',
        },
      },
      excludeModules: [
        excludeModule,
      ],
    };
    const rules = {
      js: {
        paths: {
          include: ['js-paths-include'],
          exclude: ['js-paths-exclude'],
        },
        files: {
          glob: {
            include: ['js-files-include-glob'],
            exclude: ['js-files-exclude-glob'],
          },
        },
      },
      scss: {
        files: {
          include: ['scss-files-include-regex'],
          exclude: ['scss-files-exclude-regex'],
        },
      },
      css: {
        files: {
          include: ['css-files-include-regex'],
          exclude: ['css-files-exclude-regex'],
        },
      },
      commonFonts: {
        files: {
          include: ['common-fonts-files-include-regex'],
          exclude: ['common-fonts-files-exclude-regex'],
        },
      },
      svgFonts: {
        files: {
          include: ['svg-fonts-files-include-regex'],
          exclude: ['svg-fonts-files-exclude-regex'],
        },
      },
      images: {
        files: {
          include: ['images-files-include-regex'],
          exclude: ['images-files-exclude-regex'],
        },
      },
      favicon: {
        files: {
          include: ['favicon-files-include-regex'],
          exclude: ['favicon-files-exclude-regex'],
        },
      },
    };
    const targetRules = {
      js: {
        getRule: jest.fn(() => rules.js),
      },
      scss: {
        getRule: jest.fn(() => rules.scss),
      },
      css: {
        getRule: jest.fn(() => rules.css),
      },
      fonts: {
        common: {
          getRule: jest.fn(() => rules.commonFonts),
        },
        svg: {
          getRule: jest.fn(() => rules.svgFonts),
        },
      },
      images: {
        getRule: jest.fn(() => rules.images),
      },
      favicon: {
        getRule: jest.fn(() => rules.favicon),
      },
    };
    const copy = ['files-to-copy'];
    const params = {
      buildType,
      definitions,
      output,
      paths,
      target,
      rules,
      targetRules,
      copy,
    };
    const stats = 'stats';

    const appLogger = 'appLogger';
    const babelConfig = {
      babel: true,
    };
    const babelConfiguration = {
      getConfigForTarget: jest.fn(() => babelConfig),
    };
    const babelHelper = {
      disableEnvPresetModules: jest.fn((config) => Object.assign({}, config, { modules: false })),
      addPlugin: jest.fn((config, plugin) => Object.assign({}, config, {
        plugins: {
          [plugin]: true,
        },
      })),
    };
    const events = {
      reduce: jest.fn((eventName, configurationToReduce) => configurationToReduce),
    };
    const packageInfo = {
      dependencies: {
        jimpex: 'latest',
      },
      devDependencies: {
        wootils: 'latest',
        colors: 'next',
      },
    };
    const pathUtils = {
      join: jest.fn((rest) => rest),
    };
    const pluginName = 'plugin';
    const rollupPluginInfo = {
      name: pluginName,
      external: [],
    };
    const htmlFile = 'index.html';
    const targetsHTML = {
      getFilepath: jest.fn(() => htmlFile),
    };
    let sut = null;
    let result = null;
    const expectedAssets = {
      fonts: {
        include: [
          ...rules.commonFonts.files.include,
          ...rules.svgFonts.files.include,
        ],
        exclude: [
          ...rules.commonFonts.files.exclude,
          ...rules.svgFonts.files.exclude,
        ],
        output: `${target.paths.build}/${paths.fonts}`,
        url: `/${paths.fonts}`,
      },
      images: {
        include: [...rules.images.files.include],
        exclude: [...rules.images.files.exclude],
        output: `${target.paths.build}/${paths.images}`,
        url: `/${paths.images}`,
      },
      favicon: {
        include: [...rules.favicon.files.include],
        exclude: [...rules.favicon.files.exclude],
        output: `${target.paths.build}/[name].[ext]`,
        url: '/[name].[ext]',
      },
    };
    const expectedSettings = {
      external: {
        external: [
          excludeModule,
        ],
      },
      globals: {
        [excludeModule]: excludeModule,
      },
      resolve: {
        extensions: ['.js', '.json', '.jsx'],
        browser: true,
        preferBuiltins: false,
      },
      replace: definitions,
      babel: Object.assign({}, babelConfig, {
        modules: false,
        plugins: {
          'external-helpers': true,
        },
        include: rules.js.files.glob.include,
        exclude: rules.js.files.glob.exclude,
      }),
      commonjs: {
        include: [
          /config/i,
          /node_modules\//i,
        ],
      },
      sass: {
        include: rules.scss.files.include,
        exclude: rules.scss.files.exclude,
        options: {
          sourceMapEmbed: true,
          outputStyle: 'compressed',
          includePaths: ['node_modules'],
        },
        failOnError: true,
        processor: expect.any(Function),
        output: `${target.paths.build}/${paths.css}`,
      },
      css: {
        include: rules.css.files.include,
        exclude: rules.css.files.exclude,
        processor: expect.any(Function),
        stats,
        output: `${target.paths.build}/${paths.css}`,
      },
      stylesheetAssets: {
        stylesheet: `${target.paths.build}/${paths.css}`,
        stats,
        urls: [
          expectedAssets.fonts,
          expectedAssets.images,
        ],
      },
      stylesheetModulesFixer: {
        include: [
          ...rules.scss.files.include,
          ...rules.css.files.include,
        ],
        exclude: [
          ...rules.scss.files.exclude,
          ...rules.css.files.exclude,
        ],
      },
      html: {},
      json: {},
      urls: {
        urls: [
          expectedAssets.fonts,
          expectedAssets.images,
          expectedAssets.favicon,
        ],
        stats,
      },
      watch: {
        clearScreen: false,
      },
      uglify: {},
      compression: {
        folder: target.paths.build,
        include: [expect.any(RegExp)],
        exclude: [],
        stats,
      },
      copy: {
        files: copy,
        stats,
      },
      statsLog: {
        extraEntries: [
          {
            plugin: 'rollup',
            filepath: `${target.paths.build}/${paths.js}`,
          },
          {
            plugin: 'rollup-plugin-sass',
            filepath: `${target.paths.build}/${paths.css}`,
          },
        ],
      },
      template: {
        template: htmlFile,
        output: `${target.paths.build}/${target.html.filename}`,
        stylesheets: [`/${paths.css}`],
        scripts: [`/${paths.js}`],
        urls: [
          expectedAssets.images,
          expectedAssets.favicon,
        ],
        stats,
      },
      devServer: {
        host: target.devServer.host,
        port: target.devServer.port,
        contentBase: target.paths.build,
        historyApiFallback: false,
        open: false,
        https: {
          key: target.devServer.ssl.key,
        },
        logger: appLogger,
      },
    };
    const expectedEvents = [
      {
        events: [
          'rollup-external-plugin-settings-configuration-for-browser',
          'rollup-external-plugin-settings-configuration',
        ],
        settings: expectedSettings.external,
      },
      {
        events: [
          'rollup-global-variables-settings-configuration-for-browser',
          'rollup-global-variables-settings-configuration',
        ],
        settings: expectedSettings.globals,
      },
      {
        events: [
          'rollup-resolve-plugin-settings-configuration-for-browser',
          'rollup-resolve-plugin-settings-configuration',
        ],
        settings: expectedSettings.resolve,
      },
      {
        events: [
          'rollup-replace-plugin-settings-configuration-for-browser',
          'rollup-replace-plugin-settings-configuration',
        ],
        settings: expectedSettings.replace,
      },
      {
        events: [
          'rollup-babel-plugin-settings-configuration-for-browser',
          'rollup-babel-plugin-settings-configuration',
        ],
        settings: expectedSettings.babel,
      },
      {
        events: [
          'rollup-commonjs-plugin-settings-configuration-for-browser',
          'rollup-commonjs-plugin-settings-configuration',
        ],
        settings: expectedSettings.commonjs,
      },
      {
        events: [
          'rollup-sass-plugin-settings-configuration-for-browser',
          'rollup-sass-plugin-settings-configuration',
        ],
        settings: expectedSettings.sass,
      },
      {
        events: [
          'rollup-css-plugin-settings-configuration-for-browser',
          'rollup-css-plugin-settings-configuration',
        ],
        settings: expectedSettings.css,
      },
      {
        events: [
          'rollup-stylesheet-assets-plugin-settings-configuration-for-browser',
          'rollup-stylesheet-assets-plugin-settings-configuration',
        ],
        settings: expectedSettings.stylesheetAssets,
      },
      {
        events: [
          'rollup-stylesheet-modules-fixer-plugin-settings-configuration-for-browser',
          'rollup-stylesheet-modules-fixer-plugin-settings-configuration',
        ],
        settings: expectedSettings.stylesheetModulesFixer,
      },
      {
        events: [
          'rollup-html-plugin-settings-configuration-for-browser',
          'rollup-html-plugin-settings-configuration',
        ],
        settings: expectedSettings.html,
      },
      {
        events: [
          'rollup-json-plugin-settings-configuration-for-browser',
          'rollup-json-plugin-settings-configuration',
        ],
        settings: expectedSettings.json,
      },
      {
        events: [
          'rollup-urls-plugin-settings-configuration-for-browser',
          'rollup-urls-plugin-settings-configuration',
        ],
        settings: expectedSettings.urls,
      },
      {
        events: [
          'rollup-watch-plugin-settings-configuration-for-browser',
          'rollup-watch-plugin-settings-configuration',
        ],
        settings: expectedSettings.watch,
      },
      {
        events: [
          'rollup-uglify-plugin-settings-configuration-for-browser',
          'rollup-uglify-plugin-settings-configuration',
        ],
        settings: expectedSettings.uglify,
      },
      {
        events: [
          'rollup-compression-plugin-settings-configuration-for-browser',
          'rollup-compression-plugin-settings-configuration',
        ],
        settings: expectedSettings.compression,
      },
      {
        events: [
          'rollup-copy-plugin-settings-configuration-for-browser',
          'rollup-copy-plugin-settings-configuration',
        ],
        settings: expectedSettings.copy,
      },
      {
        events: [
          'rollup-stats-plugin-settings-configuration-for-browser',
          'rollup-stats-plugin-settings-configuration',
        ],
        settings: expectedSettings.statsLog,
      },
      {
        events: 'rollup-template-plugin-settings-configuration',
        settings: expectedSettings.template,
      },
      {
        events: 'rollup-dev-server-plugin-settings-configuration',
        settings: expectedSettings.devServer,
      },
      {
        events: [
          'rollup-plugin-settings-configuration-for-browser',
          'rollup-plugin-settings-configuration',
        ],
        settings: expectedSettings,
      },
    ];
    // When
    sut = new RollupPluginSettingsConfiguration(
      appLogger,
      babelConfiguration,
      babelHelper,
      events,
      packageInfo,
      pathUtils,
      rollupPluginInfo,
      targetsHTML
    );
    result = sut.getConfig(params, stats);
    // Then
    expect(result).toEqual(expectedSettings);
    expect(events.reduce).toHaveBeenCalledTimes(expectedEvents.length);
    expectedEvents.forEach((event) => {
      expect(events.reduce).toHaveBeenCalledWith(
        event.events,
        event.settings,
        params
      );
    });
  });

  it('should generate the plugins configuration for a browser target with source map', () => {
    // Given
    const buildType = 'development';
    const definitions = {
      NODE_ENV: 'development',
    };
    const output = {
      file: 'output-file',
    };
    const paths = {
      js: 'js-path',
      css: 'css-path',
      fonts: 'fonts-path',
      images: 'images-path',
    };
    const excludeModule = 'colors';
    const target = {
      css: {
        modules: false,
      },
      paths: {
        build: 'dist',
      },
      is: {
        node: false,
        browser: true,
      },
      html: {
        filename: 'my-target.html',
      },
      devServer: {
        host: 'localhost',
        port: 2509,
        ssl: {},
      },
      sourceMap: {
        [buildType]: true,
      },
      excludeModules: [
        excludeModule,
      ],
    };
    const rules = {
      js: {
        paths: {
          include: ['js-paths-include'],
          exclude: ['js-paths-exclude'],
        },
        files: {
          glob: {
            include: ['js-files-include-glob'],
            exclude: ['js-files-exclude-glob'],
          },
        },
      },
      scss: {
        files: {
          include: ['scss-files-include-regex'],
          exclude: ['scss-files-exclude-regex'],
        },
      },
      css: {
        files: {
          include: ['css-files-include-regex'],
          exclude: ['css-files-exclude-regex'],
        },
      },
      commonFonts: {
        files: {
          include: ['common-fonts-files-include-regex'],
          exclude: ['common-fonts-files-exclude-regex'],
        },
      },
      svgFonts: {
        files: {
          include: ['svg-fonts-files-include-regex'],
          exclude: ['svg-fonts-files-exclude-regex'],
        },
      },
      images: {
        files: {
          include: ['images-files-include-regex'],
          exclude: ['images-files-exclude-regex'],
        },
      },
      favicon: {
        files: {
          include: ['favicon-files-include-regex'],
          exclude: ['favicon-files-exclude-regex'],
        },
      },
    };
    const targetRules = {
      js: {
        getRule: jest.fn(() => rules.js),
      },
      scss: {
        getRule: jest.fn(() => rules.scss),
      },
      css: {
        getRule: jest.fn(() => rules.css),
      },
      fonts: {
        common: {
          getRule: jest.fn(() => rules.commonFonts),
        },
        svg: {
          getRule: jest.fn(() => rules.svgFonts),
        },
      },
      images: {
        getRule: jest.fn(() => rules.images),
      },
      favicon: {
        getRule: jest.fn(() => rules.favicon),
      },
    };
    const copy = ['files-to-copy'];
    const params = {
      buildType,
      definitions,
      output,
      paths,
      target,
      rules,
      targetRules,
      copy,
    };
    const stats = 'stats';

    const appLogger = 'appLogger';
    const babelConfig = {
      babel: true,
    };
    const babelConfiguration = {
      getConfigForTarget: jest.fn(() => babelConfig),
    };
    const babelHelper = {
      disableEnvPresetModules: jest.fn((config) => Object.assign({}, config, { modules: false })),
      addPlugin: jest.fn((config, plugin) => Object.assign({}, config, {
        plugins: {
          [plugin]: true,
        },
      })),
    };
    const events = {
      reduce: jest.fn((eventName, configurationToReduce) => configurationToReduce),
    };
    const packageInfo = {
      dependencies: {
        jimpex: 'latest',
      },
      devDependencies: {
        wootils: 'latest',
        colors: 'next',
      },
    };
    const pathUtils = {
      join: jest.fn((rest) => rest),
    };
    const pluginName = 'plugin';
    const rollupPluginInfo = {
      name: pluginName,
      external: [],
    };
    const htmlFile = 'index.html';
    const targetsHTML = {
      getFilepath: jest.fn(() => htmlFile),
    };
    let sut = null;
    let result = null;
    const expectedAssets = {
      fonts: {
        include: [
          ...rules.commonFonts.files.include,
          ...rules.svgFonts.files.include,
        ],
        exclude: [
          ...rules.commonFonts.files.exclude,
          ...rules.svgFonts.files.exclude,
        ],
        output: `${target.paths.build}/${paths.fonts}`,
        url: `/${paths.fonts}`,
      },
      images: {
        include: [...rules.images.files.include],
        exclude: [...rules.images.files.exclude],
        output: `${target.paths.build}/${paths.images}`,
        url: `/${paths.images}`,
      },
      favicon: {
        include: [...rules.favicon.files.include],
        exclude: [...rules.favicon.files.exclude],
        output: `${target.paths.build}/[name].[ext]`,
        url: '/[name].[ext]',
      },
    };
    const expectedSettings = {
      external: {
        external: [
          excludeModule,
        ],
      },
      globals: {
        [excludeModule]: excludeModule,
      },
      resolve: {
        extensions: ['.js', '.json', '.jsx'],
        browser: true,
        preferBuiltins: false,
      },
      replace: definitions,
      babel: Object.assign({}, babelConfig, {
        modules: false,
        plugins: {
          'external-helpers': true,
        },
        include: rules.js.files.glob.include,
        exclude: rules.js.files.glob.exclude,
      }),
      commonjs: {
        include: [
          /config/i,
          /node_modules\//i,
        ],
      },
      sass: {
        include: rules.scss.files.include,
        exclude: rules.scss.files.exclude,
        options: {
          sourceMapEmbed: true,
          outputStyle: 'compressed',
          includePaths: ['node_modules'],
        },
        failOnError: true,
        processor: expect.any(Function),
        output: `${target.paths.build}/${paths.css}`,
      },
      css: {
        include: rules.css.files.include,
        exclude: rules.css.files.exclude,
        processor: expect.any(Function),
        stats,
        output: `${target.paths.build}/${paths.css}`,
      },
      stylesheetAssets: {
        stylesheet: `${target.paths.build}/${paths.css}`,
        stats,
        urls: [
          expectedAssets.fonts,
          expectedAssets.images,
        ],
      },
      stylesheetModulesFixer: {
        include: [
          ...rules.scss.files.include,
          ...rules.css.files.include,
        ],
        exclude: [
          ...rules.scss.files.exclude,
          ...rules.css.files.exclude,
        ],
      },
      html: {},
      json: {},
      urls: {
        urls: [
          expectedAssets.fonts,
          expectedAssets.images,
          expectedAssets.favicon,
        ],
        stats,
      },
      watch: {
        clearScreen: false,
      },
      uglify: {},
      compression: {
        folder: target.paths.build,
        include: [expect.any(RegExp)],
        exclude: [],
        stats,
      },
      copy: {
        files: copy,
        stats,
      },
      statsLog: {
        extraEntries: [
          {
            plugin: 'rollup',
            filepath: `${target.paths.build}/${paths.js}`,
          },
          {
            plugin: 'rollup',
            filepath: `${target.paths.build}/${paths.js}.map`,
          },
          {
            plugin: 'rollup-plugin-sass',
            filepath: `${target.paths.build}/${paths.css}`,
          },
        ],
      },
      template: {
        template: htmlFile,
        output: `${target.paths.build}/${target.html.filename}`,
        stylesheets: [`/${paths.css}`],
        scripts: [`/${paths.js}`],
        urls: [
          expectedAssets.images,
          expectedAssets.favicon,
        ],
        stats,
      },
      devServer: {
        host: target.devServer.host,
        port: target.devServer.port,
        contentBase: target.paths.build,
        historyApiFallback: false,
        open: false,
        https: null,
        logger: appLogger,
      },
    };
    const expectedEvents = [
      {
        events: [
          'rollup-external-plugin-settings-configuration-for-browser',
          'rollup-external-plugin-settings-configuration',
        ],
        settings: expectedSettings.external,
      },
      {
        events: [
          'rollup-global-variables-settings-configuration-for-browser',
          'rollup-global-variables-settings-configuration',
        ],
        settings: expectedSettings.globals,
      },
      {
        events: [
          'rollup-resolve-plugin-settings-configuration-for-browser',
          'rollup-resolve-plugin-settings-configuration',
        ],
        settings: expectedSettings.resolve,
      },
      {
        events: [
          'rollup-replace-plugin-settings-configuration-for-browser',
          'rollup-replace-plugin-settings-configuration',
        ],
        settings: expectedSettings.replace,
      },
      {
        events: [
          'rollup-babel-plugin-settings-configuration-for-browser',
          'rollup-babel-plugin-settings-configuration',
        ],
        settings: expectedSettings.babel,
      },
      {
        events: [
          'rollup-commonjs-plugin-settings-configuration-for-browser',
          'rollup-commonjs-plugin-settings-configuration',
        ],
        settings: expectedSettings.commonjs,
      },
      {
        events: [
          'rollup-sass-plugin-settings-configuration-for-browser',
          'rollup-sass-plugin-settings-configuration',
        ],
        settings: expectedSettings.sass,
      },
      {
        events: [
          'rollup-css-plugin-settings-configuration-for-browser',
          'rollup-css-plugin-settings-configuration',
        ],
        settings: expectedSettings.css,
      },
      {
        events: [
          'rollup-stylesheet-assets-plugin-settings-configuration-for-browser',
          'rollup-stylesheet-assets-plugin-settings-configuration',
        ],
        settings: expectedSettings.stylesheetAssets,
      },
      {
        events: [
          'rollup-stylesheet-modules-fixer-plugin-settings-configuration-for-browser',
          'rollup-stylesheet-modules-fixer-plugin-settings-configuration',
        ],
        settings: expectedSettings.stylesheetModulesFixer,
      },
      {
        events: [
          'rollup-html-plugin-settings-configuration-for-browser',
          'rollup-html-plugin-settings-configuration',
        ],
        settings: expectedSettings.html,
      },
      {
        events: [
          'rollup-json-plugin-settings-configuration-for-browser',
          'rollup-json-plugin-settings-configuration',
        ],
        settings: expectedSettings.json,
      },
      {
        events: [
          'rollup-urls-plugin-settings-configuration-for-browser',
          'rollup-urls-plugin-settings-configuration',
        ],
        settings: expectedSettings.urls,
      },
      {
        events: [
          'rollup-watch-plugin-settings-configuration-for-browser',
          'rollup-watch-plugin-settings-configuration',
        ],
        settings: expectedSettings.watch,
      },
      {
        events: [
          'rollup-uglify-plugin-settings-configuration-for-browser',
          'rollup-uglify-plugin-settings-configuration',
        ],
        settings: expectedSettings.uglify,
      },
      {
        events: [
          'rollup-compression-plugin-settings-configuration-for-browser',
          'rollup-compression-plugin-settings-configuration',
        ],
        settings: expectedSettings.compression,
      },
      {
        events: [
          'rollup-copy-plugin-settings-configuration-for-browser',
          'rollup-copy-plugin-settings-configuration',
        ],
        settings: expectedSettings.copy,
      },
      {
        events: [
          'rollup-stats-plugin-settings-configuration-for-browser',
          'rollup-stats-plugin-settings-configuration',
        ],
        settings: expectedSettings.statsLog,
      },
      {
        events: 'rollup-template-plugin-settings-configuration',
        settings: expectedSettings.template,
      },
      {
        events: 'rollup-dev-server-plugin-settings-configuration',
        settings: expectedSettings.devServer,
      },
      {
        events: [
          'rollup-plugin-settings-configuration-for-browser',
          'rollup-plugin-settings-configuration',
        ],
        settings: expectedSettings,
      },
    ];
    // When
    sut = new RollupPluginSettingsConfiguration(
      appLogger,
      babelConfiguration,
      babelHelper,
      events,
      packageInfo,
      pathUtils,
      rollupPluginInfo,
      targetsHTML
    );
    result = sut.getConfig(params, stats);
    // Then
    expect(result).toEqual(expectedSettings);
    expect(events.reduce).toHaveBeenCalledTimes(expectedEvents.length);
    expectedEvents.forEach((event) => {
      expect(events.reduce).toHaveBeenCalledWith(
        event.events,
        event.settings,
        params
      );
    });
  });

  it('should generate the settings for processing SASS', () => {
    // Given
    postcss.mockImplementationOnce(() => ({
      process: jest.fn((css) => Promise.resolve({
        css: css.split('/').shift().trim(),
      })),
    }));
    const postcssModulesName = 'postcss-modules-plugin';
    postcssModules.mockImplementationOnce(() => postcssModulesName);
    const buildType = 'development';
    const definitions = {
      NODE_ENV: 'development',
    };
    const output = {
      file: 'output-file',
    };
    const paths = {
      js: 'js-path',
      css: 'css-path',
      fonts: 'fonts-path',
      images: 'images-path',
    };
    const excludeModule = 'colors';
    const target = {
      css: {
        modules: false,
      },
      paths: {
        build: 'dist',
      },
      is: {
        node: false,
        browser: true,
      },
      html: {
        filename: 'my-target.html',
      },
      devServer: {
        host: 'localhost',
        port: 2509,
        ssl: {},
      },
      excludeModules: [
        excludeModule,
      ],
    };
    const rules = {
      js: {
        paths: {
          include: ['js-paths-include'],
          exclude: ['js-paths-exclude'],
        },
        files: {
          glob: {
            include: ['js-files-include-glob'],
            exclude: ['js-files-exclude-glob'],
          },
        },
      },
      scss: {
        files: {
          include: ['scss-files-include-regex'],
          exclude: ['scss-files-exclude-regex'],
        },
      },
      css: {
        files: {
          include: ['css-files-include-regex'],
          exclude: ['css-files-exclude-regex'],
        },
      },
      commonFonts: {
        files: {
          include: ['common-fonts-files-include-regex'],
          exclude: ['common-fonts-files-exclude-regex'],
        },
      },
      svgFonts: {
        files: {
          include: ['svg-fonts-files-include-regex'],
          exclude: ['svg-fonts-files-exclude-regex'],
        },
      },
      images: {
        files: {
          include: ['images-files-include-regex'],
          exclude: ['images-files-exclude-regex'],
        },
      },
      favicon: {
        files: {
          include: ['favicon-files-include-regex'],
          exclude: ['favicon-files-exclude-regex'],
        },
      },
    };
    const targetRules = {
      js: {
        getRule: jest.fn(() => rules.js),
      },
      scss: {
        getRule: jest.fn(() => rules.scss),
      },
      css: {
        getRule: jest.fn(() => rules.css),
      },
      fonts: {
        common: {
          getRule: jest.fn(() => rules.commonFonts),
        },
        svg: {
          getRule: jest.fn(() => rules.svgFonts),
        },
      },
      images: {
        getRule: jest.fn(() => rules.images),
      },
      favicon: {
        getRule: jest.fn(() => rules.favicon),
      },
    };
    const copy = ['files-to-copy'];
    const params = {
      buildType,
      definitions,
      output,
      paths,
      target,
      rules,
      targetRules,
      copy,
    };
    const stats = 'stats';

    const appLogger = 'appLogger';
    const babelConfig = {
      babel: true,
    };
    const babelConfiguration = {
      getConfigForTarget: jest.fn(() => babelConfig),
    };
    const babelHelper = {
      disableEnvPresetModules: jest.fn((config) => Object.assign({}, config, { modules: false })),
      addPlugin: jest.fn((config, plugin) => Object.assign({}, config, {
        plugins: {
          [plugin]: true,
        },
      })),
    };
    const events = {
      reduce: jest.fn((eventName, configurationToReduce) => configurationToReduce),
    };
    const packageInfo = {
      dependencies: {
        jimpex: 'latest',
      },
      devDependencies: {
        wootils: 'latest',
        colors: 'next',
      },
    };
    const pathUtils = {
      join: jest.fn((rest) => rest),
    };
    const pluginName = 'plugin';
    const rollupPluginInfo = {
      name: pluginName,
      external: [],
    };
    const htmlFile = 'index.html';
    const targetsHTML = {
      getFilepath: jest.fn(() => htmlFile),
    };
    const cssMap = 'css-map';
    const cssMapStr = `/*# sourceMappingURL=${cssMap} */`;
    const cssCode = 'css-code';
    const cssCodeWithMap = `${cssCode}${cssMapStr}`;
    const cssFilepath = 'css-file-path';
    let sut = null;
    let result = null;
    let sassProcessor = null;
    // When
    sut = new RollupPluginSettingsConfiguration(
      appLogger,
      babelConfiguration,
      babelHelper,
      events,
      packageInfo,
      pathUtils,
      rollupPluginInfo,
      targetsHTML
    );
    result = sut.getConfig(params, stats);
    sassProcessor = result.sass.processor;
    // Then
    return sassProcessor(cssCodeWithMap, cssFilepath)
    .then((processed) => {
      expect(processed).toBe(`${cssCode}\n\n${cssMapStr}\n`);
      expect(postcssModules).toHaveBeenCalledTimes(0);
      expect(postcss).toHaveBeenCalledTimes(1);
      expect(postcss).toHaveBeenCalledWith([]);
    })
    .catch(() => {
      expect(true).toBeFalse();
    });
  });

  it('should generate the settings for processing SASS with modules', () => {
    // Given
    const postcssModulesName = 'postcss-modules-plugin';
    const postcssModulesLocals = 'locals';
    let postcssModulesOptions = null;
    postcssModules.mockImplementationOnce((opts) => {
      postcssModulesOptions = opts;
      return postcssModulesName;
    });
    postcss.mockImplementationOnce(() => {
      postcssModulesOptions.getJSON('', postcssModulesLocals);
      return {
        process: jest.fn((css) => Promise.resolve({
          css: css.split('/').shift().trim(),
        })),
      };
    });
    const buildType = 'development';
    const definitions = {
      NODE_ENV: 'development',
    };
    const output = {
      file: 'output-file',
    };
    const paths = {
      js: 'js-path',
      css: 'css-path',
      fonts: 'fonts-path',
      images: 'images-path',
    };
    const excludeModule = 'colors';
    const target = {
      css: {
        modules: true,
      },
      paths: {
        build: 'dist',
      },
      is: {
        node: false,
        browser: true,
      },
      html: {
        filename: 'my-target.html',
      },
      devServer: {
        host: 'localhost',
        port: 2509,
        ssl: {},
      },
      excludeModules: [
        excludeModule,
      ],
    };
    const rules = {
      js: {
        paths: {
          include: ['js-paths-include'],
          exclude: ['js-paths-exclude'],
        },
        files: {
          glob: {
            include: ['js-files-include-glob'],
            exclude: ['js-files-exclude-glob'],
          },
        },
      },
      scss: {
        files: {
          include: ['scss-files-include-regex'],
          exclude: ['scss-files-exclude-regex'],
        },
      },
      css: {
        files: {
          include: ['css-files-include-regex'],
          exclude: ['css-files-exclude-regex'],
        },
      },
      commonFonts: {
        files: {
          include: ['common-fonts-files-include-regex'],
          exclude: ['common-fonts-files-exclude-regex'],
        },
      },
      svgFonts: {
        files: {
          include: ['svg-fonts-files-include-regex'],
          exclude: ['svg-fonts-files-exclude-regex'],
        },
      },
      images: {
        files: {
          include: ['images-files-include-regex'],
          exclude: ['images-files-exclude-regex'],
        },
      },
      favicon: {
        files: {
          include: ['favicon-files-include-regex'],
          exclude: ['favicon-files-exclude-regex'],
        },
      },
    };
    const targetRules = {
      js: {
        getRule: jest.fn(() => rules.js),
      },
      scss: {
        getRule: jest.fn(() => rules.scss),
      },
      css: {
        getRule: jest.fn(() => rules.css),
      },
      fonts: {
        common: {
          getRule: jest.fn(() => rules.commonFonts),
        },
        svg: {
          getRule: jest.fn(() => rules.svgFonts),
        },
      },
      images: {
        getRule: jest.fn(() => rules.images),
      },
      favicon: {
        getRule: jest.fn(() => rules.favicon),
      },
    };
    const copy = ['files-to-copy'];
    const params = {
      buildType,
      definitions,
      output,
      paths,
      target,
      rules,
      targetRules,
      copy,
    };
    const stats = 'stats';

    const appLogger = 'appLogger';
    const babelConfig = {
      babel: true,
    };
    const babelConfiguration = {
      getConfigForTarget: jest.fn(() => babelConfig),
    };
    const babelHelper = {
      disableEnvPresetModules: jest.fn((config) => Object.assign({}, config, { modules: false })),
      addPlugin: jest.fn((config, plugin) => Object.assign({}, config, {
        plugins: {
          [plugin]: true,
        },
      })),
    };
    const events = {
      reduce: jest.fn((eventName, configurationToReduce) => configurationToReduce),
    };
    const packageInfo = {
      dependencies: {
        jimpex: 'latest',
      },
      devDependencies: {
        wootils: 'latest',
        colors: 'next',
      },
    };
    const pathUtils = {
      join: jest.fn((rest) => rest),
    };
    const pluginName = 'plugin';
    const rollupPluginInfo = {
      name: pluginName,
      external: [],
    };
    const htmlFile = 'index.html';
    const targetsHTML = {
      getFilepath: jest.fn(() => htmlFile),
    };
    const cssCode = 'css-code';
    const cssFilepath = 'css-file-path';
    let sut = null;
    let result = null;
    let sassProcessor = null;
    // When
    sut = new RollupPluginSettingsConfiguration(
      appLogger,
      babelConfiguration,
      babelHelper,
      events,
      packageInfo,
      pathUtils,
      rollupPluginInfo,
      targetsHTML
    );
    result = sut.getConfig(params, stats);
    sassProcessor = result.sass.processor;
    // Then
    return sassProcessor(cssCode, cssFilepath)
    .then((processed) => {
      expect(processed).toEqual({
        css: `${cssCode}\n\n\n`,
        locals: postcssModulesLocals,
      });
      expect(postcssModules).toHaveBeenCalledTimes(1);
      expect(postcssModules).toHaveBeenCalledWith({
        getJSON: expect.any(Function),
      });
      expect(postcss).toHaveBeenCalledTimes(1);
      expect(postcss).toHaveBeenCalledWith([postcssModulesName]);
    })
    .catch(() => {
      expect(true).toBeFalse();
    });
  });

  it('should generate the settings for processing CSS', () => {
    // Given
    postcss.mockImplementationOnce(() => ({
      process: jest.fn((css) => Promise.resolve({
        css: css.split('/').shift().trim(),
      })),
    }));
    const postcssModulesName = 'postcss-modules-plugin';
    postcssModules.mockImplementationOnce(() => postcssModulesName);
    const buildType = 'development';
    const definitions = {
      NODE_ENV: 'development',
    };
    const output = {
      file: 'output-file',
    };
    const paths = {
      js: 'js-path',
      css: 'css-path',
      fonts: 'fonts-path',
      images: 'images-path',
    };
    const excludeModule = 'colors';
    const target = {
      css: {
        modules: false,
      },
      paths: {
        build: 'dist',
      },
      is: {
        node: false,
        browser: true,
      },
      html: {
        filename: 'my-target.html',
      },
      devServer: {
        host: 'localhost',
        port: 2509,
        ssl: {},
      },
      excludeModules: [
        excludeModule,
      ],
    };
    const rules = {
      js: {
        paths: {
          include: ['js-paths-include'],
          exclude: ['js-paths-exclude'],
        },
        files: {
          glob: {
            include: ['js-files-include-glob'],
            exclude: ['js-files-exclude-glob'],
          },
        },
      },
      scss: {
        files: {
          include: ['scss-files-include-regex'],
          exclude: ['scss-files-exclude-regex'],
        },
      },
      css: {
        files: {
          include: ['css-files-include-regex'],
          exclude: ['css-files-exclude-regex'],
        },
      },
      commonFonts: {
        files: {
          include: ['common-fonts-files-include-regex'],
          exclude: ['common-fonts-files-exclude-regex'],
        },
      },
      svgFonts: {
        files: {
          include: ['svg-fonts-files-include-regex'],
          exclude: ['svg-fonts-files-exclude-regex'],
        },
      },
      images: {
        files: {
          include: ['images-files-include-regex'],
          exclude: ['images-files-exclude-regex'],
        },
      },
      favicon: {
        files: {
          include: ['favicon-files-include-regex'],
          exclude: ['favicon-files-exclude-regex'],
        },
      },
    };
    const targetRules = {
      js: {
        getRule: jest.fn(() => rules.js),
      },
      scss: {
        getRule: jest.fn(() => rules.scss),
      },
      css: {
        getRule: jest.fn(() => rules.css),
      },
      fonts: {
        common: {
          getRule: jest.fn(() => rules.commonFonts),
        },
        svg: {
          getRule: jest.fn(() => rules.svgFonts),
        },
      },
      images: {
        getRule: jest.fn(() => rules.images),
      },
      favicon: {
        getRule: jest.fn(() => rules.favicon),
      },
    };
    const copy = ['files-to-copy'];
    const params = {
      buildType,
      definitions,
      output,
      paths,
      target,
      rules,
      targetRules,
      copy,
    };
    const stats = 'stats';

    const appLogger = 'appLogger';
    const babelConfig = {
      babel: true,
    };
    const babelConfiguration = {
      getConfigForTarget: jest.fn(() => babelConfig),
    };
    const babelHelper = {
      disableEnvPresetModules: jest.fn((config) => Object.assign({}, config, { modules: false })),
      addPlugin: jest.fn((config, plugin) => Object.assign({}, config, {
        plugins: {
          [plugin]: true,
        },
      })),
    };
    const events = {
      reduce: jest.fn((eventName, configurationToReduce) => configurationToReduce),
    };
    const packageInfo = {
      dependencies: {
        jimpex: 'latest',
      },
      devDependencies: {
        wootils: 'latest',
        colors: 'next',
      },
    };
    const pathUtils = {
      join: jest.fn((rest) => rest),
    };
    const pluginName = 'plugin';
    const rollupPluginInfo = {
      name: pluginName,
      external: [],
    };
    const htmlFile = 'index.html';
    const targetsHTML = {
      getFilepath: jest.fn(() => htmlFile),
    };
    const cssCode = 'css-code';
    const cssFilepath = 'css-file-path';
    let sut = null;
    let result = null;
    let cssProcessor = null;
    // When
    sut = new RollupPluginSettingsConfiguration(
      appLogger,
      babelConfiguration,
      babelHelper,
      events,
      packageInfo,
      pathUtils,
      rollupPluginInfo,
      targetsHTML
    );
    result = sut.getConfig(params, stats);
    cssProcessor = result.css.processor;
    // Then
    return cssProcessor(cssCode, cssFilepath)
    .then((processed) => {
      expect(processed.trim()).toBe(cssCode);
      expect(postcssModules).toHaveBeenCalledTimes(0);
      expect(postcss).toHaveBeenCalledTimes(1);
      expect(postcss).toHaveBeenCalledWith([]);
    })
    .catch(() => {
      expect(true).toBeFalse();
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
    rollupPluginSettingsConfiguration(container);
    [[serviceName, serviceFn]] = container.set.mock.calls;
    sut = serviceFn();
    // Then
    expect(serviceName).toBe('rollupPluginSettingsConfiguration');
    expect(serviceFn).toBeFunction();
    expect(sut).toBeInstanceOf(RollupPluginSettingsConfiguration);
    expect(sut.appLogger).toBe('appLogger');
    expect(sut.babelConfiguration).toBe('babelConfiguration');
    expect(sut.babelHelper).toBe('babelHelper');
    expect(sut.events).toBe('events');
    expect(sut.packageInfo).toBe('packageInfo');
    expect(sut.rollupPluginInfo).toBe('rollupPluginInfo');
    expect(sut.targetsHTML).toBe('targetsHTML');
  });
});
