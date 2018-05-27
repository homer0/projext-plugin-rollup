const projext = require('projext/index');
const { middleware } = require('jimpex');

const { rollupFrontendFs, rollupSendFile } = require('./jimpex/index');

const useJimpex = (jimpexApp, targetToBuild, targetToServe) => {
  const rollupMiddleware = projext.get('rollupMiddleware');
  const info = rollupMiddleware.generate(targetToBuild, targetToServe);
  jimpexApp.register(rollupFrontendFs(
    info.getDirectory,
    info.getFileSystem
  ));
  jimpexApp.register(rollupSendFile);
  jimpexApp.use(middleware(() => info.middleware()));
  jimpexApp.get('events').once('after-start', () => {
    jimpexApp.get('appLogger').warning('waiting for Rollup...');
  });

  return info;
};

module.exports = useJimpex;
