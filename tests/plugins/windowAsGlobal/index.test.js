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

  describe('code', () => {
    it('should define `global` as an alias for `window`', () => {
      // Given
      let sut = null;
      let code = null;
      const fakeWindow = {};
      // When
      sut = new ProjextRollupWindowAsGlobalPlugin();
      code = sut.intro();
      ((function runCode() {
        // eslint-disable-next-line no-unused-vars
        const window = fakeWindow;
        // eslint-disable-next-line no-eval
        eval(code);
      })());
      // Then
      expect(fakeWindow).toEqual({
        global: fakeWindow,
      });
    });

    it('shouldn\'t define `global` if `window.global` is it\'s already defined', () => {
      // Given
      let sut = null;
      let code = null;
      const fakeGlobal = 'some-fake-global';
      const fakeWindow = { global: fakeGlobal };
      // When
      sut = new ProjextRollupWindowAsGlobalPlugin();
      code = sut.intro();
      ((function runCode() {
        // eslint-disable-next-line no-unused-vars
        const window = fakeWindow;
        // eslint-disable-next-line no-eval
        eval(code);
      })());
      // Then
      expect(fakeWindow).toEqual({
        global: fakeGlobal,
      });
    });

    it('shouldn\'t define `global` if `window` is `undefined`', () => {
      // Given
      let sut = null;
      let code = null;
      const fakeWindowName = 'fake-window';
      const fakeWindow = { name: fakeWindowName };
      // When
      sut = new ProjextRollupWindowAsGlobalPlugin();
      code = sut.intro();
      ((function runCode() {
        // eslint-disable-next-line no-eval
        eval(code);
      })());
      // Then
      expect(fakeWindow).toEqual({
        name: fakeWindowName,
      });
    });
  });
});
