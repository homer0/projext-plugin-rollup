const projext = require('projext/index');

const useExpress = (expressApp, targetToBuild, targetToServe) => {
  const rollupMiddleware = projext.get('rollupMiddleware');
  const info = rollupMiddleware.generate(targetToBuild, targetToServe);
  expressApp.use(info.middleware());

  return info;
};

module.exports = useExpress;
