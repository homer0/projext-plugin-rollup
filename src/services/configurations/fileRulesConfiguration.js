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
      js: this._getJSRule(params),
      scss: this._getSCSSRule(params),
      css: this._getCSSRule(params),
      fonts: this._getFontsRule(params),
      images: this._getImagesRule(params),
      favicon: this._getFaviconRule(params),
      all: this._getAllFilesRule(params),
    };

    const eventName = params.target.is.node ?
      'rollup-file-rules-configuration-for-node' :
      'rollup-file-rules-configuration-for-browser';

    return this.events.reduce(
      [eventName, 'rollup-file-rules-configuration'],
      rules,
      params
    );
  }

  _getJSRule(params) {
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
    return this.events.reduce(
      [eventName, 'rollup-js-rule-configuration'],
      rule,
      params
    );
  }

  _getSCSSRule(params) {
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
    return this.events.reduce(
      [eventName, 'rollup-scss-rule-configuration'],
      rule,
      params
    );
  }

  _getCSSRule(params) {
    const { target } = params;
    const rule = {
      include: [/\.css$/i],
      exclude: [],
    };

    const eventName = target.is.node ?
      'rollup-css-rule-configuration-for-node' :
      'rollup-css-rule-configuration-for-browser';
    return this.events.reduce(
      [eventName, 'rollup-css-rule-configuration'],
      rule,
      params
    );
  }

  _getFontsRule(params) {
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
      output: `${target.paths.build}/${paths.fonts}`,
      url: `/${paths.fonts}`,
    };

    const eventName = target.is.node ?
      'rollup-fonts-rule-configuration-for-node' :
      'rollup-fonts-rule-configuration-for-browser';
    return this.events.reduce(
      [eventName, 'rollup-fonts-rule-configuration'],
      rule,
      params
    );
  }

  _getImagesRule(params) {
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
      output: `${target.paths.build}/${paths.images}`,
      url: `/${paths.images}`,
    };

    const eventName = target.is.node ?
      'rollup-images-rule-configuration-for-node' :
      'rollup-images-rule-configuration-for-browser';
    return this.events.reduce(
      [eventName, 'rollup-images-rule-configuration'],
      rule,
      params
    );
  }

  _getFaviconRule(params) {
    const { target } = params;
    const rule = {
      include: [/favicon\.(png|ico)$/i],
      exclude: [],
      output: `${target.paths.build}/[name].[ext]`,
      url: '/[name].[ext]',
    };

    const eventName = target.is.node ?
      'rollup-favicon-rule-configuration-for-node' :
      'rollup-favicon-rule-configuration-for-browser';
    return this.events.reduce(
      [eventName, 'rollup-favicon-rule-configuration'],
      rule,
      params
    );
  }

  _getAllFilesRule(params) {
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
    return this.events.reduce(
      [eventName, 'rollup-all-files-rule-configuration'],
      rule,
      params
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
