jest.mock('@rollup/plugin-replace');
jest.unmock('/src/plugins/runtimeReplace');

require('jasmine-expect');
const replace = require('@rollup/plugin-replace');
const {
  ProjextRollupRuntimeReplacePlugin,
  runtimeReplace,
} = require('/src/plugins/runtimeReplace');


describe('plugins:runtimeReplace', () => {
  beforeEach(() => {
    replace.mockClear();
  });

  it('should throw an error when instantiated without a definitions function', () => {
    // Given/When/Then
    expect(() => new ProjextRollupRuntimeReplacePlugin())
    .toThrow(/You need to provide a valid definitions function/i);
  });

  it('should be instantiated', () => {
    // Given
    const definitionsFn = jest.fn(() => ({}));
    let sut = null;
    // When
    sut = new ProjextRollupRuntimeReplacePlugin(definitionsFn);
    // Then
    expect(sut).toBeInstanceOf(ProjextRollupRuntimeReplacePlugin);
    expect(sut.name).toBe('projext-rollup-plugin-runtime-replace');
    expect(sut.buildStart).toBeFunction();
    expect(sut.transform).toBeFunction();
    expect(definitionsFn).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith(({
      values: expect.any(Object),
    }));
  });

  it('should be instantiated with a custom name', () => {
    // Given
    const definitionsFn = jest.fn(() => ({}));
    const name = 'my-runtime-replace-plugin';
    let sut = null;
    // When
    sut = new ProjextRollupRuntimeReplacePlugin(definitionsFn, name);
    // Then
    expect(sut).toBeInstanceOf(ProjextRollupRuntimeReplacePlugin);
    expect(sut.name).toBe(name);
  });

  it('should send the definitions as functions to the original \'replace\' plugin', () => {
    // Given
    const varName = 'ROSARIO';
    const varValue = 'PILAR';
    const definitionsFn = jest.fn(() => ({
      [varName]: varValue,
    }));
    let sut = null;
    let values = null;
    let result = null;
    // When
    sut = new ProjextRollupRuntimeReplacePlugin(definitionsFn);
    [[{ values }]] = replace.mock.calls;
    result = values[varName]();
    // Then
    expect(sut).toBeInstanceOf(ProjextRollupRuntimeReplacePlugin);
    expect(values).toEqual({
      [varName]: expect.any(Function),
    });
    expect(result).toBe(varValue);
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith(({
      values: {
        [varName]: expect.any(Function),
      },
    }));
  });

  it('should call the original \'replace\' plugin on the \'transform\' hook', () => {
    // Given
    const transformed = 'Done!';
    const transform = jest.fn(() => transformed);
    replace.mockImplementationOnce(() => ({ transform }));
    const definitionsFn = jest.fn(() => ({}));
    const code = 'some-code';
    const filepath = 'some-file-path';
    let sut = null;
    let result = null;
    // When
    sut = new ProjextRollupRuntimeReplacePlugin(definitionsFn);
    result = sut.transform(code, filepath);
    // Then
    expect(result).toBe(transformed);
    expect(transform).toHaveBeenCalledTimes(1);
    expect(transform).toHaveBeenCalledWith(code, filepath);
  });

  it('shouldn\'t reload the values the first time the build process starts', () => {
    // Given
    const definitionsFn = jest.fn(() => ({}));
    let sut = null;
    // When
    sut = new ProjextRollupRuntimeReplacePlugin(definitionsFn);
    sut.buildStart();
    // Then
    expect(definitionsFn).toHaveBeenCalledTimes(1);
  });

  it('should reload the values after the first build', () => {
    // Given
    const definitionsFn = jest.fn(() => ({}));
    let sut = null;
    // When
    sut = new ProjextRollupRuntimeReplacePlugin(definitionsFn);
    sut.buildStart();
    sut.buildStart();
    // Then
    expect(definitionsFn).toHaveBeenCalledTimes(2);
  });

  it('should provide a shorthand method to instantiate the plugin', () => {
    // Given
    const definitionsFn = jest.fn(() => ({}));
    let sut = null;
    // When
    sut = runtimeReplace(definitionsFn);
    // Then
    expect(sut).toBeInstanceOf(ProjextRollupRuntimeReplacePlugin);
    expect(sut.name).toBe('projext-rollup-plugin-runtime-replace');
    expect(sut.buildStart).toBeFunction();
    expect(sut.transform).toBeFunction();
  });
});
