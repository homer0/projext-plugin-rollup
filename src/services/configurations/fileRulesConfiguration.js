const { provider } = require('jimple');
const ConfigurationFile = require('../../abstracts/configurationFile');

class RollupFileRulesConfiguration extends ConfigurationFile {
  constructor(babelConfiguration, events, pathUtils) {
    super(pathUtils, 'rollup/fileRules.config.js');

    this.babelConfiguration = babelConfiguration;
    this.events = events;
  }

  createConfig(params) {
    const rules = {
      js: this.getJSRule(params),
      scss: this.getSCSSRule(params),
      css: this.getCSSRule(params),
      fonts: this.getFontsRule(params),
      images: this.getImagesRule(params),
      favicon: this.getFaviconRule(params),
      all: this.getAllFilesRule(params),
    };

    const eventName = params.target.is.node ?
      'rollup-file-rules-configuration-for-node' :
      'rollup-file-rules-configuration-for-browser';

    return this._reduceConfig(
      [eventName, 'rollup-file-rules-configuration'],
      rules,
      params
    );
  }

  getJSRule(params) {
    const { target } = params;
    const config = this.pathUtils.join('config');
    const rule = {
      include: [
        new RegExp(`${target.paths.source}/.*?\\.jsx?$`, 'i'),
        ...target.includeModules.map((modName) => (
          new RegExp(`/node_modules/${modName}/.*?\\.jsx?$`, 'i')
        )),
        new RegExp(`${config}/.*?\\.jsx?$`, 'i'),
      ],
      exclude: [],
      glob: {
        include: [
          `${target.paths.source}/**/*.{js,jsx}`,
          ...target.includeModules.map((modName) => (
            `node_modules/${modName}/**/*.{js,jsx}`
          )),
        ],
        exclude: [],
      },
    };

    const eventName = target.is.node ?
      'rollup-js-rule-configuration-for-node' :
      'rollup-js-rule-configuration-for-browser';
    return this._reduceConfig(
      [eventName, 'webpack-js-rule-configuration'],
      rule,
      params
    );
  }

  getSCSSRule(params) {
    const { target } = params;
    const rule = {
      include: [
        new RegExp(`${target.paths.source}/.*?\\.scss$`, 'i'),
        ...target.includeModules.map((modName) => (
          new RegExp(`/node_modules/${modName}/.*?\\.scss$`, 'i')
        )),
      ],
      exclude: [],
    };

    const eventName = target.is.node ?
      'rollup-scss-rule-configuration-for-node' :
      'rollup-scss-rule-configuration-for-browser';
    return this._reduceConfig(
      [eventName, 'webpack-scss-rule-configuration'],
      rule,
      params
    );
  }

  getCSSRule(params) {
    const { target } = params;
    const rule = {
      include: [/\.css$/i],
      exclude: [],
    };

    const eventName = target.is.node ?
      'rollup-css-rule-configuration-for-node' :
      'rollup-css-rule-configuration-for-browser';
    return this._reduceConfig(
      [eventName, 'webpack-css-rule-configuration'],
      rule,
      params
    );
  }

  getFontsRule(params) {
    const { target, paths } = params;
    const rule = {
      include: [
        /\.(?:woff2?|ttf|eot)$/i,
        /\/node_modules\/(?:.*?\/)?fonts\/.*?\.svg$/i,
        new RegExp(`${target.paths.source}/(?:.*?/)?fonts/.*?\\.svg$`, 'i'),
        ...target.includeModules.map((modName) => (
          new RegExp(`/node_modules/${modName}/(?:.*?/)?fonts/.*?\\.svg$`)
        )),
      ],
      exclude: [],
      output: `./${target.folders.build}/${paths.fonts}`,
      url: `/${paths.fonts}`,
    };

    const eventName = target.is.node ?
      'rollup-fonts-rule-configuration-for-node' :
      'rollup-fonts-rule-configuration-for-browser';
    return this._reduceConfig(
      [eventName, 'webpack-fonts-rule-configuration'],
      rule,
      params
    );
  }

  getImagesRule(params) {
    const { target, paths } = params;
    const rule = {
      include: [
        /\.(jpe?g|png|gif|svg)$/i,
      ],
      exclude: [
        /favicon\.\w+$/i,
        /\/node_modules\/(?:.*?\/)?fonts\/.*?/i,
        new RegExp(`${target.paths.source}/(?:.*?/)?fonts/.*?`, 'i'),
        ...target.includeModules.map((modName) => (
          new RegExp(`/node_modules/${modName}/(?:.*?/)?fonts/.*?`)
        )),
      ],
      output: `${target.folders.build}/${paths.images}`,
      url: `/${paths.images}`,
    };

    const eventName = target.is.node ?
      'rollup-images-rule-configuration-for-node' :
      'rollup-images-rule-configuration-for-browser';
    return this._reduceConfig(
      [eventName, 'webpack-images-rule-configuration'],
      rule,
      params
    );
  }

  getFaviconRule(params) {
    const { target } = params;
    const rule = {
      include: [/favicon\.(png|ico)$/i],
      exclude: [],
      output: `${target.folders.build}/[name].[ext]`,
      url: '/[name].[ext]',
    };

    const eventName = target.is.node ?
      'rollup-favicon-rule-configuration-for-node' :
      'rollup-favicon-rule-configuration-for-browser';
    return this._reduceConfig(
      [eventName, 'webpack-favicon-rule-configuration'],
      rule,
      params
    );
  }

  getAllFilesRule(params) {
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
    const rule = {
      include: [new RegExp(`${target.paths.build}/.*?${extensionsRegex}`, 'i')],
      exclude: [],
    };

    const eventName = target.is.node ?
      'rollup-all-files-rule-configuration-for-node' :
      'rollup-all-files-rule-configuration-for-browser';
    return this._reduceConfig(
      [eventName, 'webpack-all-files-rule-configuration'],
      rule,
      params
    );
  }

  _reduceConfig(events, config, params) {
    return events.reduce(
      (currentConfig, eventName) => this.events.reduce(eventName, currentConfig, params),
      config
    );
  }
}

const rollupFileRulesConfiguration = provider((app) => {
  app.set('rollupFileRulesConfiguration', () => new RollupFileRulesConfiguration(
    app.get('babelConfiguration'),
    app.get('events'),
    app.get('pathUtils')
  ));
});

module.exports = {
  RollupFileRulesConfiguration,
  rollupFileRulesConfiguration,
};
