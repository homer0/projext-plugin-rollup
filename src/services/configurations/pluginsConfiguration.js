const fs = require('fs-extra');
const postcss = require('postcss');
const postcssModules = require('postcss-modules');
const { provider } = require('jimple');
const ConfigurationFile = require('../../abstracts/configurationFile');

class RollupPluginSettingsConfiguration extends ConfigurationFile {
  constructor(
    babelConfiguration,
    events,
    packageInfo,
    pathUtils,
    rollupPluginInfo,
    targetsHTML
  ) {
    super(pathUtils, 'rollup/plugins.config.js');

    this.babelConfiguration = babelConfiguration;
    this.events = events;
    this.packageInfo = packageInfo;
    this.rollupPluginInfo = rollupPluginInfo;
    this.targetsHTML = targetsHTML;
  }

  createConfig(params) {
    const settings = {
      babel: this.getBabelSettings(params),
    };

    const eventName = params.target.is.node ?
      'rollup-plugin-settings-configuration-for-node' :
      'rollup-plugin-settings-configuration-for-browser';

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
    const settings = Object.assign(
      {},
      this.babelConfiguration.getConfigForTarget(target),
      {
        include: rules.js.include,
        exclude: rules.js.exclude,
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
    const { target, output, rules } = params;

    const settings = {
      include: rules.scss.include,
      exclude: rules.scss.exclude,
      options: {
        sourceMapEmbed: true,
        outputStyle: 'compressed',
      },
    };

    if (target.css.inject) {
      settings.insert = true;
    } else {
      settings.output = `./${target.folders.build}/${output.css}`;
    }

    if (target.css.modules) {
      settings.processor = (css) => postcss([postcssModules])
      .process(css)
      .then((result) => result.css);
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
    const { target, output, rules } = params;

    const settings = {
      include: rules.css.include,
      exclude: rules.css.exclude,
      urls: [
        rules.fonts,
        rules.images,
      ],
    };

    if (target.css.inject) {
      settings.insert = true;
    } else {
      settings.output = `./${target.folders.build}/${output.css}`;
    }

    if (target.css.modules) {
      settings.processor = (css) => postcss([postcssModules])
      .process(css)
      .then((result) => result.css);
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
    const { target, output, rules } = params;

    const settings = {
      stylesheet: `./${target.folders.build}/${output.css}`,
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
    const { target, output, rules } = params;
    const settings = {
      template: this.targetsHTML.getFilepath(target),
      output: `./${target.folders.build}/${target.html.filename}`,
      stylesheets: target.css.inject ?
        [] :
        [`/${output.css}`],
      urls: [
        rules.images,
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
    const externals = [
      ...this.rollupPluginInfo.externals.map((dependencyName) => (
        `${this.rollupPluginInfo.name}/${dependencyName}`
      )),
      ...target.excludeModules,
      ...Object.keys(this.packageInfo.dependencies),
      ...(buildType === 'development' ? Object.keys(this.packageInfo.devDependencies) : []),
    ];


    const settings = { externals };

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
      contentBase: `./${target.folders.build}`,
      historyApiFallback: !!devServer.historyApiFallback,
    };

    let ssl = false;
    const sslSettings = {
      key: 'ssl_key',
      cert: 'ssl_cert',
      ca: 'ssl_ciphers',
    };

    Object.keys(sslSettings).forEach((sslSettingName) => {
      const file = devServer.ssl[sslSettingName];
      if (typeof file === 'string') {
        const filepath = this.pathUtils.join(file);
        if (fs.pathExistsSync(filepath)) {
          ssl = true;
          settings[sslSettings[sslSettingName]] = fs.readFileSync(filepath, 'utf-8');
        }
      }
    });

    settings.ssl = ssl;

    const eventName = params.target.is.node ?
      'rollup-devServer-plugin-settings-configuration-for-node' :
      'rollup-devServer-plugin-settings-configuration-for-browser';

    return this._reduceConfig(
      [eventName, 'rollup-devServer-plugin-settings-configuration'],
      settings,
      params
    );
  }
}

const rollupPluginSettingsConfiguration = provider((app) => {
  app.set('rollupPluginSettingsConfiguration', () => new RollupPluginSettingsConfiguration(
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
