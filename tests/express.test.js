const JimpleMock = require('/tests/mocks/jimple.mock');

jest.mock('jimple', () => JimpleMock);
jest.mock('projext/index', () => ({ get: jest.fn() }));
jest.unmock('/src/express');

require('jasmine-expect');

const projext = require('projext/index');
const expressImplementation = require('/src/express');

describe('plugin:projextRollup/Express', () => {
  it('should implement the middlewares on the Express App', () => {
    // Given
    const expressApp = {
      use: jest.fn(),
    };
    const middlewareCall = 'middleware!';
    const info = {
      middleware: () => middlewareCall,
    };
    const webpackMiddlewares = {
      generate: jest.fn(() => info),
    };
    projext.get.mockImplementationOnce(() => webpackMiddlewares);
    const targetToBuild = 'target-to-build';
    const targetToServe = 'target-to-serve';
    let result = null;
    // When
    result = expressImplementation(expressApp, targetToBuild, targetToServe);
    // Then
    expect(result).toEqual(info);
    expect(projext.get).toHaveBeenCalledTimes(1);
    expect(projext.get).toHaveBeenCalledWith('rollupMiddleware');
    expect(webpackMiddlewares.generate).toHaveBeenCalledTimes(1);
    expect(webpackMiddlewares.generate).toHaveBeenCalledWith(targetToBuild, targetToServe);
    expect(expressApp.use).toHaveBeenCalledTimes(1);
    expect(expressApp.use).toHaveBeenCalledWith(middlewareCall);
  });
});
