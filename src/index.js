const { name } = require('../package.json');

const loadPlugin = (app) => {
  app.set('rollupPluginInfo', () => ({
    name,
    configuration: 'src/rollup.config.js',
    externals: [
      'express',
      'jimpex',
    ],
  }));
};

module.exports = loadPlugin;
