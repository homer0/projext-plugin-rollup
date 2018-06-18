const projext = require('projext/index');
/**
 * Implements the Rollup middleware for a target on an Express app.
 * @param {Express} expressApp    The app where the middleware is going to be `use`d.
 * @param {string}  targetToBuild The name of the target that will be builded on the middleware.
 * @param {string}  targetToServe The name of the target that will implement the middleware.
 *                                When the other target is builded, it will assume that is on the
 *                                distribution directory, and if the target serving it is being
 *                                executed from the source directory it won't be able to use the
 *                                file system without hardcoding some relatives paths from the
 *                                build to the source; to avoid that, the method gets the build
 *                                path of this target, so when using `getDirectory()`, it
 *                                will think they are both on the distribution directory and the
 *                                paths can be created relative to that.
 * @return {MiddlewareInformation}
 */
const useExpress = (expressApp, targetToBuild, targetToServe) => {
  // Get the middleware service.
  const rollupMiddleware = projext.get('rollupMiddleware');
  // Generate the middleware for the target.
  const info = rollupMiddleware.generate(targetToBuild, targetToServe);
  // Register the middleware on the app.
  expressApp.use(info.middleware());

  return info;
};

module.exports = useExpress;
