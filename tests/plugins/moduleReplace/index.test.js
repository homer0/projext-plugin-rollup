jest.mock('magic-string');
jest.unmock('/src/plugins/moduleReplace');

require('jasmine-expect');
const MagicString = require('magic-string');
const ProjextRollupUtils = require('/src/plugins/utils');
const {
  ProjextRollupModuleReplacePlugin,
  moduleReplace,
} = require('/src/plugins/moduleReplace');


describe('plugins:moduleReplace', () => {
  beforeEach(() => {
    ProjextRollupUtils.cloneRegex.mockClear();
    MagicString.mockClear();
  });

  it('should throw an error when instantiated without options', () => {
    // Given/When/Then
    expect(() => new ProjextRollupModuleReplacePlugin())
    .toThrow(/You need to provide a valid options object/i);
  });

  it('should throw an error when instantiated without instructions', () => {
    // Given/When/Then
    expect(() => new ProjextRollupModuleReplacePlugin({}))
    .toThrow(/You need to provide a valid instructions list/i);
  });

  it('should throw an error when instantiated with an invalid instruction', () => {
    // Given/When/Then
    expect(() => new ProjextRollupModuleReplacePlugin({ instructions: ['x'] }))
    .toThrow(/Instructions must be objects/i);
  });

  it('should throw an error if an instruction is missing a property', () => {
    // Given/When/Then
    expect(() => new ProjextRollupModuleReplacePlugin({ instructions: [{}] }))
    .toThrow(/The property '\w+' is required in all instructions/i);
  });

  it('should be instantiated', () => {
    // Given
    const options = {
      instructions: [{
        module: /module/,
        search: /search/,
        replace: 'replace',
      }],
    };
    let sut = null;
    let result = null;
    // When
    sut = new ProjextRollupModuleReplacePlugin(options);
    result = sut.getOptions();
    // Then
    expect(sut).toBeInstanceOf(ProjextRollupModuleReplacePlugin);
    expect(sut.name).toBe('projext-rollup-plugin-module-replace');
    expect(sut.transform).toBeFunction();
    expect(result).toEqual(Object.assign({}, options, { sourceMap: true }));
  });

  it('should be instantiated with a custom name and source map disabled', () => {
    // Given
    const options = {
      instructions: [{
        module: /module/,
        search: /search/,
        replace: 'replace',
      }],
      sourceMap: false,
    };
    const name = 'my-module-replace-plugin';
    let sut = null;
    let result = null;
    // When
    sut = new ProjextRollupModuleReplacePlugin(options, name);
    result = sut.getOptions();
    // Then
    expect(sut).toBeInstanceOf(ProjextRollupModuleReplacePlugin);
    expect(sut.name).toBe(name);
    expect(result).toEqual(options);
  });

  it('shouldn\'t transform a file if it doesn\'t match an instruction', () => {
    // Given
    const options = {
      instructions: [{
        module: /module/,
        search: /search/,
        replace: 'replace',
      }],
    };
    let sut = null;
    let result = null;
    // When
    sut = new ProjextRollupModuleReplacePlugin(options);
    result = sut.transform('some-code', 'some-file');
    // Then
    expect(result).toBeNull();
  });

  it('should transform a file', () => {
    // Given
    const search = /search/;
    ProjextRollupUtils.cloneRegex.mockImplementationOnce(() => /search/g);
    ProjextRollupUtils.cloneRegex.mockImplementationOnce(() => /search/);
    const transformedCode = 'transformed-code';
    const mockedMagicString = {
      overwrite: jest.fn(),
      toString: jest.fn(() => transformedCode),
    };
    MagicString.mockImplementationOnce(() => mockedMagicString);
    const replace = 'replace';
    const options = {
      instructions: [{
        module: /module/,
        search,
        replace,
      }],
      sourceMap: false,
    };
    const code = 'search';
    const file = 'module';
    let sut = null;
    let result = null;
    // When
    sut = new ProjextRollupModuleReplacePlugin(options);
    result = sut.transform(code, file);
    // Then
    expect(result).toEqual({
      code: transformedCode,
    });
    expect(MagicString).toHaveBeenCalledTimes(1);
    expect(MagicString).toHaveBeenCalledWith(code);
    expect(mockedMagicString.overwrite).toHaveBeenCalledTimes(1);
    expect(mockedMagicString.overwrite).toHaveBeenCalledWith(
      0,
      code.length,
      replace
    );
    expect(mockedMagicString.toString).toHaveBeenCalledTimes(1);
    expect(ProjextRollupUtils.cloneRegex).toHaveBeenCalledTimes(2);
    expect(ProjextRollupUtils.cloneRegex).toHaveBeenCalledWith(search);
    expect(ProjextRollupUtils.cloneRegex).toHaveBeenCalledWith(search);
  });

  it('should transform a file with a source map', () => {
    // Given
    const search = /search/;
    ProjextRollupUtils.cloneRegex.mockImplementationOnce(() => /search/g);
    ProjextRollupUtils.cloneRegex.mockImplementationOnce(() => /search/);
    const sourceMap = 'source-map';
    const transformedCode = 'transformed-code';
    const mockedMagicString = {
      overwrite: jest.fn(),
      generateMap: jest.fn(() => sourceMap),
      toString: jest.fn(() => transformedCode),
    };
    MagicString.mockImplementationOnce(() => mockedMagicString);
    const replace = 'replace';
    const options = {
      instructions: [{
        module: /module/,
        search,
        replace,
      }],
    };
    const code = 'search';
    const file = 'module';
    let sut = null;
    let result = null;
    // When
    sut = new ProjextRollupModuleReplacePlugin(options);
    result = sut.transform(code, file);
    // Then
    expect(result).toEqual({
      code: transformedCode,
      map: sourceMap,
    });
    expect(MagicString).toHaveBeenCalledTimes(1);
    expect(MagicString).toHaveBeenCalledWith(code);
    expect(mockedMagicString.overwrite).toHaveBeenCalledTimes(1);
    expect(mockedMagicString.overwrite).toHaveBeenCalledWith(
      0,
      code.length,
      replace
    );
    expect(mockedMagicString.generateMap).toHaveBeenCalledTimes(1);
    expect(mockedMagicString.generateMap).toHaveBeenCalledWith({
      hires: true,
    });
    expect(mockedMagicString.toString).toHaveBeenCalledTimes(1);
    expect(ProjextRollupUtils.cloneRegex).toHaveBeenCalledTimes(2);
    expect(ProjextRollupUtils.cloneRegex).toHaveBeenCalledWith(search);
    expect(ProjextRollupUtils.cloneRegex).toHaveBeenCalledWith(search);
  });

  it('should provide a shorthand method to instantiate the plugin', () => {
    // Given
    const options = {
      instructions: [{
        module: /module/,
        search: /search/,
        replace: 'replace',
      }],
    };
    let sut = null;
    // When
    sut = moduleReplace(options);
    // Then
    expect(sut).toBeInstanceOf(ProjextRollupModuleReplacePlugin);
    expect(sut.name).toBe('projext-rollup-plugin-module-replace');
    expect(sut.transform).toBeFunction();
  });
});
