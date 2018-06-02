const resolve = require('rollup-plugin-node-resolve');
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const replace = require('rollup-plugin-replace');
const sass = require('rollup-plugin-sass');
const html = require('rollup-plugin-html');
const json = require('rollup-plugin-json');

const { provider } = require('jimple');
const ConfigurationFile = require('../../abstracts/configurationFile');
const {
  css,
  urls,
  stylesheetAssets,
  nodeRunner,
  stats,
} = require('../../plugins');

class RollupNodeDevelopmentConfiguration extends ConfigurationFile {
  constructor(
    babelConfiguration,
    events,
    pathUtils,
    rollupPluginSettingsConfiguration
  ) {
    super(pathUtils, 'rollup/node.development.config.js');

    this.babelConfiguration = babelConfiguration;
    this.events = events;
    this.rollupPluginSettingsConfiguration = rollupPluginSettingsConfiguration;
  }

  createConfig(params) {
    const { input, output, target } = params;
    const statsPlugin = stats({
      path: `${target.paths.build}/`,
    });

    const pluginSettings = this.rollupPluginSettingsConfiguration.getConfig(
      params,
      statsPlugin.add
    );

    const plugins = [
      resolve(pluginSettings.resolve),
      babel(pluginSettings.babel),
      commonjs(pluginSettings.commonjs),
      replace(pluginSettings.replace),
      sass(pluginSettings.sass),
      css(pluginSettings.css),
      stylesheetAssets.helper(pluginSettings.stylesheetAssetsHelper),
      stylesheetAssets(pluginSettings.stylesheetAssets),
      html(pluginSettings.html),
      json(pluginSettings.json),
      urls(pluginSettings.urls),
      statsPlugin.log(pluginSettings.statsLog),
    ];

    const { external } = pluginSettings.external;

    const config = {
      input,
      output,
      plugins,
      external,
      global: external,
    };

    if (target.runOnDevelopment) {
      config.watch = pluginSettings.watch;
      config.plugins.push(nodeRunner(pluginSettings.nodeRunner));
    }

    return this.events.reduce(
      [
        'rollup-node-development-configuration',
        'rollup-node-configuration',
      ],
      config,
      params
    );
  }
}

const rollupNodeDevelopmentConfiguration = provider((app) => {
  app.set('rollupNodeDevelopmentConfiguration', () => new RollupNodeDevelopmentConfiguration(
    app.get('babelConfiguration'),
    app.get('events'),
    app.get('pathUtils'),
    app.get('rollupPluginSettingsConfiguration')
  ));
});

module.exports = {
  RollupNodeDevelopmentConfiguration,
  rollupNodeDevelopmentConfiguration,
};
