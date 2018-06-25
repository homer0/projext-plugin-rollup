jest.unmock('/src/plugins/windowAsGlobal');

require('jasmine-expect');
const {
  ProjextRollupWindowAsGlobalPlugin,
  windowAsGlobal,
} = require('/src/plugins/windowAsGlobal');

describe('plugins:windowAsGlobal', () => {
  it('should be instantiated', () => {
    // Given
    let sut = null;
    // When
    sut = new ProjextRollupWindowAsGlobalPlugin();
    // Then
    expect(sut).toBeInstanceOf(ProjextRollupWindowAsGlobalPlugin);
    expect(sut.intro).toBeFunction();
  });

  it('should add the code for defining global as an alias for `window`', () => {
    // Given
    let sut = null;
    let result = null;
    // When
    sut = new ProjextRollupWindowAsGlobalPlugin();
    result = sut.intro();
    // Then
    expect(result).toBeString();
  });

  it('should provide a shorthand method to instantiate the plugin', () => {
    // Given
    let sut = null;
    // When
    sut = windowAsGlobal();
    // Then
    expect(sut).toBeInstanceOf(ProjextRollupWindowAsGlobalPlugin);
    expect(sut.intro).toBeFunction();
  });
});
