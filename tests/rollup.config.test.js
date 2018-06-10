const JimpleMock = require('/tests/mocks/jimple.mock');

jest.mock('jimple', () => JimpleMock);
jest.mock('projext/index', () => ({
  get: jest.fn(() => ({
    getRollupConfig: () => 'rollupConfig',
  })),
}));
jest.unmock('/src/rollup.config');

require('jasmine-expect');
const projext = require('projext/index');
require('/src/rollup.config');

describe('plugin:rollup.config', () => {
  it('should register all the services', () => {
    // Given/When/Then
    expect(projext.get).toHaveBeenCalledTimes(1);
    expect(projext.get).toHaveBeenCalledWith('rollupBuildEngine');
  });
});
