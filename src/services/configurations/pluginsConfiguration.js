const fs = require('fs-extra');
const postcss = require('postcss');
const postcssModules = require('postcss-modules');
const { provider } = require('jimple');
const ConfigurationFile = require('../../abstracts/configurationFile');

class RollupPluginSettingsConfiguration extends ConfigurationFile {
  constructor(
    appLogger,
    babelConfiguration,
    babelHelper,
    events,
    packageInfo,
    pathUtils,
    rollupPluginInfo,
    targetsHTML
  ) {
    super(pathUtils, 'rollup/plugins.config.js');

    this.appLogger = appLogger;
    this.babelConfiguration = babelConfiguration;
    this.babelHelper = babelHelper;
    this.events = events;
    this.packageInfo = packageInfo;
    this.rollupPluginInfo = rollupPluginInfo;
    this.targetsHTML = targetsHTML;
  }

  createConfig(params, stats) {
    const external = this._getExternalSettings(params);
    const settings = {
      external,
      globals: this._getGlobalVariablesSettings(params, external.external),
      resolve: this._getResolveSettings(params, stats),
      replace: this._getReplaceSettings(params, stats),
      babel: this._getBabelSettings(params, stats),
      commonjs: this._getCommonJSSettings(params, stats),
      sass: this._getSASSSettings(params, stats),
      css: this._getCSSSettings(params, stats),
      stylesheetAssets: this._getStyleheetAssetsSettings(params, stats),
      stylesheetModulesFixer: this._getStylesheetModulesFixerSettings(params, stats),
      html: this._getHTMLSettings(params, stats),
      json: this._getJSONSettings(params, stats),
      urls: this._getURLsSettings(params, stats),
      watch: this._getWatchSettings(params, stats),
      uglify: this._getUglifySettings(params, stats),
      compression: this._getCompressionSettings(params, stats),
      statsLog: this._getStatsLogSettings(params),
    };

    let eventName;
    if (params.target.is.node) {
      eventName = 'rollup-plugin-settings-configuration-for-node';
      settings.nodeRunner = this._getNodeRunnerSettings(params);
      settings.stylesheetAssetsHelper = this._getStyleheetAssetsHelperSettings(params);
    } else {
      eventName = 'rollup-plugin-settings-configuration-for-browser';
      settings.template = this._getTemplateSettings(params, stats);
      settings.devServer = this._getDevServerSettings(params);
    }

    return this.events.reduce(
      [eventName, 'rollup-plugin-settings-configuration'],
      settings,
      params
    );
  }

  _getExternalSettings(params) {
    const { target, buildType } = params;
    const external = [];

    if (target.excludeModules) {
      external.push(...target.excludeModules);
    }

    if (target.is.node) {
      external.push(...this.rollupPluginInfo.external.map((dependencyName) => (
        `${this.rollupPluginInfo.name}/${dependencyName}`
      )));
      external.push(...Object.keys(this.packageInfo.dependencies));
      if (buildType === 'development') {
        external.push(...Object.keys(this.packageInfo.devDependencies));
      }
    }

    const settings = { external };

    const eventName = target.is.node ?
      'rollup-external-plugin-settings-configuration-for-node' :
      'rollup-external-plugin-settings-configuration-for-browser';

    return this.events.reduce(
      [eventName, 'rollup-external-plugin-settings-configuration'],
      settings,
      params
    );
  }

  _getGlobalVariablesSettings(params, external) {
    const settings = {};
    external.forEach((name) => {
      const globalName = name
      .replace(/\//g, '-')
      .replace(/-(\w)/g, (match, letter) => letter.toUpperCase());
      settings[name] = globalName;
    });

    const eventName = params.target.is.node ?
      'rollup-global-variables-settings-configuration-for-node' :
      'rollup-global-variables-settings-configuration-for-browser';

    return this.events.reduce(
      [eventName, 'rollup-global-variables-settings-configuration'],
      settings,
      params
    );
  }

  _getResolveSettings(params) {
    const settings = {
      extensions: ['.js', '.json', '.jsx'],
    };

    const eventName = params.target.is.node ?
      'rollup-resolve-plugin-settings-configuration-for-node' :
      'rollup-resolve-plugin-settings-configuration-for-browser';

    return this.events.reduce(
      [eventName, 'rollup-resolve-plugin-settings-configuration'],
      settings,
      params
    );
  }

  _getReplaceSettings(params) {
    const settings = Object.assign({}, params.definitions);

    const eventName = params.target.is.node ?
      'rollup-replace-plugin-settings-configuration-for-node' :
      'rollup-replace-plugin-settings-configuration-for-browser';

    return this.events.reduce(
      [eventName, 'rollup-replace-plugin-settings-configuration'],
      settings,
      params
    );
  }

  _getBabelSettings(params) {
    const { target, targetRules } = params;
    const jsRule = targetRules.js.getRule();

    const baseConfiguration = this.babelConfiguration.getConfigForTarget(target);
    const configuration = this.babelHelper.disableEnvPresetModules(baseConfiguration);

    const settings = Object.assign(
      {},
      configuration,
      {
        include: [...jsRule.files.glob.include],
        exclude: [...jsRule.files.glob.exclude],
      }
    );

    const eventName = target.is.node ?
      'rollup-babel-plugin-settings-configuration-for-node' :
      'rollup-babel-plugin-settings-configuration-for-browser';

    return this.events.reduce(
      [eventName, 'rollup-babel-plugin-settings-configuration'],
      settings,
      params
    );
  }

  _getCommonJSSettings(params) {
    const settings = {};

    const eventName = params.target.is.node ?
      'rollup-commonjs-plugin-settings-configuration-for-node' :
      'rollup-commonjs-plugin-settings-configuration-for-browser';

    return this.events.reduce(
      [eventName, 'rollup-commonjs-plugin-settings-configuration'],
      settings,
      params
    );
  }

  _getSASSSettings(params) {
    const { target, paths, targetRules } = params;
    const scssRule = targetRules.scss.getRule();

    const settings = {
      include: [...scssRule.files.include],
      exclude: [...scssRule.files.exclude],
      options: {
        sourceMapEmbed: true,
        outputStyle: 'compressed',
      },
      processor: this._getStylesProcessor(target.css.modules),
    };

    if (target.css.inject) {
      settings.insert = true;
    } else if (target.is.browser) {
      settings.output = `${target.paths.build}/${paths.css}`;
    } else {
      settings.output = false;
    }

    const eventName = target.is.node ?
      'rollup-sass-plugin-settings-configuration-for-node' :
      'rollup-sass-plugin-settings-configuration-for-browser';

    return this.events.reduce(
      [eventName, 'rollup-sass-plugin-settings-configuration'],
      settings,
      params
    );
  }

  _getCSSSettings(params, stats) {
    const { target, paths, targetRules } = params;
    const cssRule = targetRules.css.getRule();

    const settings = {
      include: [...cssRule.files.include],
      exclude: [...cssRule.files.exclude],
      processor: this._getStylesProcessor(false, { map: true }),
      stats,
    };

    if (target.css.inject) {
      settings.insert = true;
    } else if (target.is.browser) {
      settings.output = `${target.paths.build}/${paths.css}`;
    } else {
      settings.output = false;
    }

    const eventName = target.is.node ?
      'rollup-css-plugin-settings-configuration-for-node' :
      'rollup-css-plugin-settings-configuration-for-browser';

    return this.events.reduce(
      [eventName, 'rollup-css-plugin-settings-configuration'],
      settings,
      params
    );
  }

  _getStyleheetAssetsSettings(params, stats) {
    const {
      target,
      paths,
      output,
    } = params;
    const assetsRules = this._getAssetsRules(params);

    const stylesheet = target.css.inject || target.is.node ?
      output.file :
      `${target.paths.build}/${paths.css}`;

    const settings = {
      stylesheet,
      stats,
      urls: [
        assetsRules.fonts,
        assetsRules.images,
      ],
    };

    const eventName = target.is.node ?
      'rollup-stylesheet-assets-plugin-settings-configuration-for-node' :
      'rollup-stylesheet-assets-plugin-settings-configuration-for-browser';

    return this.events.reduce(
      [eventName, 'rollup-stylesheet-assets-plugin-settings-configuration'],
      settings,
      params
    );
  }

  _getStylesheetModulesFixerSettings(params) {
    const { target, targetRules } = params;
    const scssRule = targetRules.scss.getRule();
    const cssRule = targetRules.css.getRule();

    const settings = {
      include: [
        ...scssRule.files.include,
        ...cssRule.files.include,
      ],
      exclude: [
        ...scssRule.files.exclude,
        ...cssRule.files.exclude,
      ],
    };

    const eventName = target.is.node ?
      'rollup-stylesheet-modules-fixer-plugin-settings-configuration-for-node' :
      'rollup-stylesheet-modules-fixer-plugin-settings-configuration-for-browser';

    return this.events.reduce(
      [eventName, 'rollup-stylesheet-modules-fixer-plugin-settings-configuration'],
      settings,
      params
    );
  }

  _getStyleheetAssetsHelperSettings(params) {
    const { targetRules } = params;
    const scssRule = targetRules.scss.getRule();
    const cssRule = targetRules.css.getRule();

    const settings = {
      include: [
        ...scssRule.files.include,
        ...cssRule.files.include,
      ],
      exclude: [
        ...scssRule.files.exclude,
        ...cssRule.files.exclude,
      ],
    };

    return this.events.reduce(
      'rollup-stylesheet-assets-helper-plugin-settings-configuration',
      settings,
      params
    );
  }

  _getHTMLSettings(params) {
    const settings = {};

    const eventName = params.target.is.node ?
      'rollup-html-plugin-settings-configuration-for-node' :
      'rollup-html-plugin-settings-configuration-for-browser';

    return this.events.reduce(
      [eventName, 'rollup-html-plugin-settings-configuration'],
      settings,
      params
    );
  }

  _getJSONSettings(params) {
    const settings = {};

    const eventName = params.target.is.node ?
      'rollup-json-plugin-settings-configuration-for-node' :
      'rollup-json-plugin-settings-configuration-for-browser';

    return this.events.reduce(
      [eventName, 'rollup-json-plugin-settings-configuration'],
      settings,
      params
    );
  }

  _getURLsSettings(params, stats) {
    const { target } = params;
    const assetsRules = this._getAssetsRules(params);
    const settings = {
      urls: [
        assetsRules.fonts,
        assetsRules.images,
        assetsRules.favicon,
      ],
      stats,
    };

    const eventName = target.is.node ?
      'rollup-urls-plugin-settings-configuration-for-node' :
      'rollup-urls-plugin-settings-configuration-for-browser';

    return this.events.reduce(
      [eventName, 'rollup-urls-plugin-settings-configuration'],
      settings,
      params
    );
  }

  _getTemplateSettings(params, stats) {
    const { target, paths } = params;
    const assetsRules = this._getAssetsRules(params);
    const settings = {
      template: this.targetsHTML.getFilepath(target),
      output: `${target.paths.build}/${target.html.filename}`,
      stylesheets: target.css.inject ?
        [] :
        [`/${paths.css}`],
      scripts: [`/${paths.js}`],
      urls: [
        assetsRules.images,
        assetsRules.favicon,
      ],
      stats,
    };

    return this.events.reduce(
      'rollup-template-plugin-settings-configuration',
      settings,
      params
    );
  }

  _getWatchSettings(params) {
    const settings = {
      clearScreen: false,
    };

    const eventName = params.target.is.node ?
      'rollup-watch-plugin-settings-configuration-for-node' :
      'rollup-watch-plugin-settings-configuration-for-browser';

    return this.events.reduce(
      [eventName, 'rollup-watch-plugin-settings-configuration'],
      settings,
      params
    );
  }

  _getDevServerSettings(params) {
    const { target } = params;
    const { devServer } = target;
    const settings = {
      host: devServer.host,
      port: devServer.port,
      contentBase: target.paths.build,
      historyApiFallback: !!devServer.historyApiFallback,
      https: null,
      logger: this.appLogger,
    };

    const sslSettings = {};
    let atLeastOneSSLSetting = false;
    [
      'key',
      'cert',
      'ca',
    ].forEach((sslSettingName) => {
      const file = devServer.ssl[sslSettingName];
      if (typeof file === 'string') {
        const filepath = this.pathUtils.join(file);
        if (fs.pathExistsSync(filepath)) {
          atLeastOneSSLSetting = true;
          sslSettings[sslSettingName] = fs.readFileSync(filepath, 'utf-8');
        }
      }
    });

    if (atLeastOneSSLSetting) {
      settings.https = sslSettings;
    }

    return this.events.reduce(
      'rollup-dev-server-plugin-settings-configuration',
      settings,
      params
    );
  }

  _getUglifySettings(params) {
    const settings = {};

    const eventName = params.target.is.node ?
      'rollup-uglify-plugin-settings-configuration-for-node' :
      'rollup-uglify-plugin-settings-configuration-for-browser';

    return this.events.reduce(
      [eventName, 'rollup-uglify-plugin-settings-configuration'],
      settings,
      params
    );
  }

  _getCompressionSettings(params, stats) {
    const { target } = params;
    const rule = this._getARuleForAllTheAssets(params);

    const settings = {
      folder: target.paths.build,
      include: rule.include,
      exclude: rule.exclude,
      stats,
    };

    const eventName = target.is.node ?
      'rollup-compression-plugin-settings-configuration-for-node' :
      'rollup-compression-plugin-settings-configuration-for-browser';

    return this.events.reduce(
      [eventName, 'rollup-compression-plugin-settings-configuration'],
      settings,
      params
    );
  }

  _getStatsLogSettings(params) {
    const { target, paths, buildType } = params;

    const extraEntries = [
      {
        plugin: 'rollup',
        filepath: `${target.paths.build}/${paths.js}`,
      },
    ];

    if (target.sourceMap && target.sourceMap[buildType]) {
      extraEntries.push({
        plugin: 'rollup',
        filepath: `${target.paths.build}/${paths.js}.map`,
      });
    }

    if (target.is.browser && !target.css.inject) {
      extraEntries.push({
        plugin: 'rollup-plugin-sass',
        filepath: `${target.paths.build}/${paths.css}`,
      });
    }

    const settings = {
      extraEntries,
    };

    const eventName = target.is.node ?
      'rollup-stats-plugin-settings-configuration-for-node' :
      'rollup-stats-plugin-settings-configuration-for-browser';

    return this.events.reduce(
      [eventName, 'rollup-stats-plugin-settings-configuration'],
      settings,
      params
    );
  }

  _getNodeRunnerSettings(params) {
    const { output } = params;

    const settings = {
      file: output.file,
      logger: this.appLogger,
    };

    return this.events.reduce(
      'rollup-node-runner-plugin-settings-configuration',
      settings,
      params
    );
  }

  _getAssetsRules(params) {
    const { target, targetRules, paths } = params;
    const commonFontsRule = targetRules.fonts.common.getRule();
    const svgFontsRule = targetRules.fonts.svg.getRule();
    const imagesRule = targetRules.images.getRule();
    const faviconRule = targetRules.favicon.getRule();

    return {
      fonts: {
        include: [
          ...commonFontsRule.files.include,
          ...svgFontsRule.files.include,
        ],
        exclude: [
          ...commonFontsRule.files.exclude,
          ...svgFontsRule.files.exclude,
        ],
        output: `${target.paths.build}/${paths.fonts}`,
        url: `/${paths.fonts}`,
      },
      images: {
        include: [...imagesRule.files.include],
        exclude: [...imagesRule.files.exclude],
        output: `${target.paths.build}/${paths.images}`,
        url: `/${paths.images}`,
      },
      favicon: {
        include: [...faviconRule.files.include],
        exclude: [...faviconRule.files.exclude],
        output: `${target.paths.build}/[name].[ext]`,
        url: '/[name].[ext]',
      },
    };
  }

  _getARuleForAllTheAssets(params) {
    const { target } = params;
    const extensions = [
      'js',
      'jsx',
      'css',
      'html',
      'map',
      'woff',
      'woff2',
      'ttf',
      'eot',
      'jpg',
      'jpeg',
      'png',
      'gif',
      'svg',
      'ico',
    ];
    const extensionsStr = extensions.join('|');
    const extensionsRegex = `\\.(?:${extensionsStr})$`;
    return {
      include: [new RegExp(`${target.paths.build}/.*?${extensionsRegex}`, 'i')],
      exclude: [],
    };
  }

  _getSourceMap(code) {
    const regex = /(\/\*# sourceMappingURL=.*? \*\/)/i;
    const match = regex.exec(code);
    let result;
    if (match) {
      [result] = match;
    }

    return result;
  }

  _getStylesProcessor(modules, processorOptions = {}) {
    const options = Object.assign(
      {},
      {
        map: false,
        from: undefined,
      },
      processorOptions
    );

    return (css, filepath) => {
      let map;
      if (options.map) {
        options.from = filepath;
      } else {
        map = this._getSourceMap(css) || '';
      }

      let locals;
      const plugins = [];
      if (modules) {
        plugins.push(postcssModules({
          getJSON: (filename, json) => {
            locals = json;
          },
        }));
      }

      return postcss(plugins)
      .process(css, options)
      .then((processed) => {
        const cssCode = options.map ?
          `${processed.css}\n` :
          `${processed.css}\n\n${map}\n`;
        let result;
        if (modules) {
          result = {
            css: cssCode,
            locals,
          };
        } else {
          result = cssCode;
        }

        return result;
      });
    };
  }
}

const rollupPluginSettingsConfiguration = provider((app) => {
  app.set('rollupPluginSettingsConfiguration', () => new RollupPluginSettingsConfiguration(
    app.get('appLogger'),
    app.get('babelConfiguration'),
    app.get('babelHelper'),
    app.get('events'),
    app.get('packageInfo'),
    app.get('pathUtils'),
    app.get('rollupPluginInfo'),
    app.get('targetsHTML')
  ));
});

module.exports = {
  RollupPluginSettingsConfiguration,
  rollupPluginSettingsConfiguration,
};
