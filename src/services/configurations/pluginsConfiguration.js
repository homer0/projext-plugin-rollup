const fs = require('fs-extra');
const postcss = require('postcss');
const postcssModules = require('postcss-modules');
const { provider } = require('jimple');
const ConfigurationFile = require('../../abstracts/configurationFile');

class RollupPluginSettingsConfiguration extends ConfigurationFile {
  constructor(
    appLogger,
    babelConfiguration,
    events,
    packageInfo,
    pathUtils,
    rollupPluginInfo,
    targetsHTML
  ) {
    super(pathUtils, 'rollup/plugins.config.js');

    this.appLogger = appLogger;
    this.babelConfiguration = babelConfiguration;
    this.events = events;
    this.packageInfo = packageInfo;
    this.rollupPluginInfo = rollupPluginInfo;
    this.targetsHTML = targetsHTML;
  }

  createConfig(params) {
    const settings = {
      resolve: this.getResolveSettings(params),
      replace: this.getReplaceSettings(params),
      babel: this.getBabelSettings(params),
      commonjs: this.getCommonJSSettings(params),
      sass: this.getSASSSettings(params),
      css: this.getCSSSettings(params),
      stylesheetAssets: this.getStyleheetAssetsSettings(params),
      html: this.getHTMLSettings(params),
      json: this.getJSONSettings(params),
      urls: this.getURLsSettings(params),
      watch: this.getWatchSettings(params),
      uglify: this.getUglifySettings(params),
      compression: this.getCompressionSettings(params),
    };

    let eventName;
    if (params.target.is.node) {
      eventName = 'rollup-plugin-settings-configuration-for-node';
      settings.external = this.getExternalSettings(params);
      settings.nodeRunner = this.getNodeRunnerSettings(params);
      settings.stylesheetAssetsHelper = this.getStyleheetAssetsHelperSettings(params);
    } else {
      eventName = 'rollup-plugin-settings-configuration-for-browser';
      settings.template = this.getTemplateSettings(params);
      settings.devServer = this.getDevServerSettings(params);
    }

    return this._reduceConfig(
      [eventName, 'rollup-plugin-settings-configuration'],
      settings,
      params
    );
  }

  getResolveSettings(params) {
    const settings = {
      extensions: ['.js', '.json', '.jsx'],
    };

    const eventName = params.target.is.node ?
      'rollup-resolve-plugin-settings-configuration-for-node' :
      'rollup-resolve-plugin-settings-configuration-for-browser';

    return this._reduceConfig(
      [eventName, 'rollup-resolve-plugin-settings-configuration'],
      settings,
      params
    );
  }

  getReplaceSettings(params) {
    const settings = Object.assign({}, params.definitions);

    const eventName = params.target.is.node ?
      'rollup-replace-plugin-settings-configuration-for-node' :
      'rollup-replace-plugin-settings-configuration-for-browser';

    return this._reduceConfig(
      [eventName, 'rollup-replace-plugin-settings-configuration'],
      settings,
      params
    );
  }

  getBabelSettings(params) {
    const { target, rules } = params;

    const babel = this.babelConfiguration.getConfigForTarget(target);

    if (babel.presets && babel.presets.length) {
      const envPreset = babel.presets.find((preset) => {
        const [presetName] = preset;
        return presetName === 'env';
      });

      if (envPreset) {
        const [, envPresetOptions] = envPreset;
        if (envPresetOptions) {
          envPresetOptions.modules = false;
        }
      }
    }

    const settings = Object.assign(
      {},
      babel,
      {
        include: rules.js.glob.include,
        exclude: rules.js.glob.exclude,
      }
    );

    const eventName = params.target.is.node ?
      'rollup-babel-plugin-settings-configuration-for-node' :
      'rollup-babel-plugin-settings-configuration-for-browser';

    return this._reduceConfig(
      [eventName, 'rollup-babel-plugin-settings-configuration'],
      settings,
      params
    );
  }

  getCommonJSSettings(params) {
    const settings = {};

    const eventName = params.target.is.node ?
      'rollup-commonjs-plugin-settings-configuration-for-node' :
      'rollup-commonjs-plugin-settings-configuration-for-browser';

    return this._reduceConfig(
      [eventName, 'rollup-commonjs-plugin-settings-configuration'],
      settings,
      params
    );
  }

  getSASSSettings(params) {
    const { target, paths, rules } = params;

    const settings = {
      include: rules.scss.include,
      exclude: rules.scss.exclude,
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

    return this._reduceConfig(
      [eventName, 'rollup-sass-plugin-settings-configuration'],
      settings,
      params
    );
  }

  getCSSSettings(params) {
    const { target, paths, rules } = params;

    const settings = {
      include: rules.css.include,
      exclude: rules.css.exclude,
      processor: this._getStylesProcessor(false, { map: true }),
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

    return this._reduceConfig(
      [eventName, 'rollup-css-plugin-settings-configuration'],
      settings,
      params
    );
  }

  getStyleheetAssetsSettings(params) {
    const {
      target,
      paths,
      rules,
      output,
    } = params;

    const stylesheet = target.css.inject || target.is.node ?
      output.file :
      `${target.paths.build}/${paths.css}`;

    const settings = {
      stylesheet,
      urls: [
        rules.fonts,
        rules.images,
      ],
    };

    const eventName = target.is.node ?
      'rollup-stylesheet-assets-plugin-settings-configuration-for-node' :
      'rollup-stylesheet-assets-plugin-settings-configuration-for-browser';

    return this._reduceConfig(
      [eventName, 'rollup-stylesheet-assets-plugin-settings-configuration'],
      settings,
      params
    );
  }

  getStyleheetAssetsHelperSettings(params) {
    const { target, rules } = params;

    const settings = {
      include: [
        ...rules.css.include,
        ...rules.scss.include,
      ],
      exclude: [
        ...rules.css.exclude,
        ...rules.scss.exclude,
      ],
    };

    const eventName = target.is.node ?
      'rollup-stylesheet-assets-helper-plugin-settings-configuration-for-node' :
      'rollup-stylesheet-assets-helper-plugin-settings-configuration-for-browser';

    return this._reduceConfig(
      [eventName, 'rollup-stylesheet-assets-helper-plugin-settings-configuration'],
      settings,
      params
    );
  }

  getHTMLSettings(params) {
    const settings = {};

    const eventName = params.target.is.node ?
      'rollup-html-plugin-settings-configuration-for-node' :
      'rollup-html-plugin-settings-configuration-for-browser';

    return this._reduceConfig(
      [eventName, 'rollup-html-plugin-settings-configuration'],
      settings,
      params
    );
  }

  getJSONSettings(params) {
    const settings = {};

    const eventName = params.target.is.node ?
      'rollup-json-plugin-settings-configuration-for-node' :
      'rollup-json-plugin-settings-configuration-for-browser';

    return this._reduceConfig(
      [eventName, 'rollup-json-plugin-settings-configuration'],
      settings,
      params
    );
  }

  getURLsSettings(params) {
    const { target, rules } = params;
    const settings = {
      urls: [
        rules.fonts,
        rules.images,
        rules.favicon,
      ],
    };

    const eventName = target.is.node ?
      'rollup-urls-plugin-settings-configuration-for-node' :
      'rollup-urls-plugin-settings-configuration-for-browser';

    return this._reduceConfig(
      [eventName, 'rollup-urls-plugin-settings-configuration'],
      settings,
      params
    );
  }

  getTemplateSettings(params) {
    const { target, paths, rules } = params;
    const settings = {
      template: this.targetsHTML.getFilepath(target),
      output: `${target.paths.build}/${target.html.filename}`,
      stylesheets: target.css.inject ?
        [] :
        [`/${paths.css}`],
      scripts: [`/${paths.js}`],
      urls: [
        rules.images,
        rules.favicon,
      ],
    };

    const eventName = target.is.node ?
      'rollup-urls-plugin-settings-configuration-for-node' :
      'rollup-urls-plugin-settings-configuration-for-browser';

    return this._reduceConfig(
      [eventName, 'rollup-urls-plugin-settings-configuration'],
      settings,
      params
    );
  }

  getWatchSettings(params) {
    const settings = {
      clearScreen: false,
    };

    const eventName = params.target.is.node ?
      'rollup-watch-plugin-settings-configuration-for-node' :
      'rollup-watch-plugin-settings-configuration-for-browser';

    return this._reduceConfig(
      [eventName, 'rollup-watch-plugin-settings-configuration'],
      settings,
      params
    );
  }

  getExternalSettings(params) {
    const { target, buildType } = params;
    const external = [
      ...this.rollupPluginInfo.external.map((dependencyName) => (
        `${this.rollupPluginInfo.name}/${dependencyName}`
      )),
      ...(target.excludeModules || []),
      ...Object.keys(this.packageInfo.dependencies),
      ...(buildType === 'development' ? Object.keys(this.packageInfo.devDependencies) : []),
    ];


    const settings = { external };

    const eventName = params.target.is.node ?
      'rollup-external-plugin-settings-configuration-for-node' :
      'rollup-external-plugin-settings-configuration-for-browser';

    return this._reduceConfig(
      [eventName, 'rollup-external-plugin-settings-configuration'],
      settings,
      params
    );
  }

  getDevServerSettings(params) {
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

    const eventName = params.target.is.node ?
      'rollup-devServer-plugin-settings-configuration-for-node' :
      'rollup-devServer-plugin-settings-configuration-for-browser';

    return this._reduceConfig(
      [eventName, 'rollup-devServer-plugin-settings-configuration'],
      settings,
      params
    );
  }

  getUglifySettings(params) {
    const settings = {};

    const eventName = params.target.is.node ?
      'rollup-uglify-plugin-settings-configuration-for-node' :
      'rollup-uglify-plugin-settings-configuration-for-browser';

    return this._reduceConfig(
      [eventName, 'rollup-uglify-plugin-settings-configuration'],
      settings,
      params
    );
  }

  getCompressionSettings(params) {
    const { target, rules } = params;

    const settings = {
      folder: target.paths.build,
      include: rules.all.include,
      exclude: rules.all.exclude,
    };

    const eventName = target.is.node ?
      'rollup-compression-plugin-settings-configuration-for-node' :
      'rollup-compression-plugin-settings-configuration-for-browser';

    return this._reduceConfig(
      [eventName, 'rollup-compression-plugin-settings-configuration'],
      settings,
      params
    );
  }

  getNodeRunnerSettings(params) {
    const { target, output } = params;

    const settings = {
      file: output.file,
      logger: this.appLogger,
    };

    const eventName = target.is.node ?
      'rollup-nodeRuner-plugin-settings-configuration-for-node' :
      'rollup-nodeRuner-plugin-settings-configuration-for-browser';

    return this._reduceConfig(
      [eventName, 'rollup-nodeRuner-plugin-settings-configuration'],
      settings,
      params
    );
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
        map = this._getSourceMap(css);
      }

      let names;
      const plugins = [];
      if (modules) {
        plugins.push(postcssModules({
          getJSON: (filename, json) => {
            names = json;
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
            names,
          };
        } else {
          result = cssCode;
        }

        return result;
      });
    };
  }

  _reduceConfig(events, config, params) {
    return events.reduce(
      (currentConfig, eventName) => this.events.reduce(eventName, currentConfig, params),
      config
    );
  }
}

const rollupPluginSettingsConfiguration = provider((app) => {
  app.set('rollupPluginSettingsConfiguration', () => new RollupPluginSettingsConfiguration(
    app.get('appLogger'),
    app.get('babelConfiguration'),
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
