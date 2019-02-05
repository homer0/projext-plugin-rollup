jest.mock('fs-extra');
jest.mock('rollup-pluginutils');
jest.unmock('/src/plugins/css');
jest.unmock('/src/plugins/css/insertFn');

require('jasmine-expect');
const fs = require('fs-extra');
const rollupUtils = require('rollup-pluginutils');
const insert = require('/src/plugins/css/insertFn');
const {
  ProjextRollupCSSPlugin,
  css,
} = require('/src/plugins/css');

describe('plugins:css', () => {
  beforeEach(() => {
    fs.pathExistsSync.mockReset();
    fs.writeFileSync.mockReset();
    fs.ensureDirSync.mockReset();
    fs.writeFileSync.mockReset();
    rollupUtils.createFilter.mockReset();
  });

  it('should be instantiated with default options', () => {
    // Given
    const filter = 'filter';
    rollupUtils.createFilter.mockImplementationOnce(() => filter);
    let sut = null;
    let result = null;
    let statsFnResult = null;
    // When
    sut = new ProjextRollupCSSPlugin();
    result = sut.getOptions();
    statsFnResult = result.stats();
    // Then
    expect(sut).toBeInstanceOf(ProjextRollupCSSPlugin);
    expect(sut.name).toBe('projext-rollup-plugin-css');
    expect(sut.filter).toBe(filter);
    expect(sut.intro).toBeFunction();
    expect(sut.transform).toBeFunction();
    expect(sut.writeBundle).toBeFunction();
    expect(result).toEqual({
      include: [expect.any(RegExp)],
      exclude: [],
      insert: false,
      output: false,
      processor: null,
      insertFnName: '___$insertCSSBlocks',
      stats: expect.any(Function),
    });
    expect(statsFnResult).toBeUndefined();
    expect(rollupUtils.createFilter).toHaveBeenCalledTimes(1);
    expect(rollupUtils.createFilter).toHaveBeenCalledWith([expect.any(RegExp)], []);
  });

  it('should be instantiated with custom options', () => {
    // Given
    const filter = 'filter';
    rollupUtils.createFilter.mockImplementationOnce(() => filter);
    const stats = 'stats';
    const options = {
      include: ['include-some-files'],
      exclude: ['exclude-some-files'],
      insert: true,
      output: '',
      processor: null,
      insertFnName: 'insertStyles',
      stats: jest.fn(() => stats),
    };
    const name = 'my-css-plugin';
    let sut = null;
    let result = null;
    let statsFnResult = null;
    // When
    sut = new ProjextRollupCSSPlugin(options, name);
    result = sut.getOptions();
    statsFnResult = result.stats();
    // Then
    expect(sut).toBeInstanceOf(ProjextRollupCSSPlugin);
    expect(sut.name).toBe(name);
    expect(sut.filter).toBe(filter);
    expect(result).toEqual(options);
    expect(statsFnResult).toBe(stats);
    expect(rollupUtils.createFilter).toHaveBeenCalledTimes(1);
    expect(rollupUtils.createFilter).toHaveBeenCalledWith(
      options.include,
      options.exclude
    );
  });

  it('should return the insert function on the `intro` method', () => {
    // Given
    const options = {
      insert: true,
      insertFnName: 'myInsertFn',
    };
    let sut = null;
    let result = null;
    // When
    sut = new ProjextRollupCSSPlugin(options);
    result = sut.intro();
    // Then
    expect(result).toMatch(insert.toString().replace(insert.name, options.insertFnName));
  });

  it('shouldn\'t return the insert function on the `intro` method if `insert` is `false`', () => {
    // Given
    let sut = null;
    let result = null;
    // When
    sut = new ProjextRollupCSSPlugin();
    result = sut.intro();
    // Then
    expect(result).toBeNull();
  });

  it('shouldn\'t `transform` a file that doesn\'t match the filter', () => {
    // Given
    const filter = jest.fn(() => false);
    rollupUtils.createFilter.mockImplementationOnce(() => filter);
    const code = 'a { background: red; }';
    const filepath = 'some/file';
    let sut = null;
    let result = null;
    // When
    sut = new ProjextRollupCSSPlugin();
    result = sut.transform(code, filepath);
    // Then
    expect(result).toBeNull();
    expect(filter).toHaveBeenCalledTimes(1);
    expect(filter).toHaveBeenCalledWith(filepath);
  });

  it('shouldn\'t `transform` a file with no code', () => {
    // Given
    const filter = jest.fn(() => true);
    rollupUtils.createFilter.mockImplementationOnce(() => filter);
    const code = '';
    const filepath = 'some/file';
    let sut = null;
    // When
    sut = new ProjextRollupCSSPlugin();
    return sut.transform(code, filepath)
    .then((result) => {
      // Then
      expect(result).toEqual({
        code: 'export default \'\';',
        map: {
          mappings: '',
        },
      });
      expect(filter).toHaveBeenCalledTimes(1);
      expect(filter).toHaveBeenCalledWith(filepath);
    })
    .catch((error) => {
      throw error;
    });
  });

  it('should fail to `transform` because the processor doesn\'t return CSS code', () => {
    // Given
    const filter = jest.fn(() => true);
    rollupUtils.createFilter.mockImplementationOnce(() => filter);
    const code = 'a { background: red; }';
    const filepath = 'some/file';
    const options = {
      processor: jest.fn(() => Promise.resolve({})),
    };
    let sut = null;
    // When
    sut = new ProjextRollupCSSPlugin(options);
    return sut.transform(code, filepath)
    .then(() => {
      expect(true).toBeFalse();
    })
    .catch((result) => {
      // Then
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toMatch(/you need to return the styles/i);
      expect(filter).toHaveBeenCalledTimes(1);
      expect(filter).toHaveBeenCalledWith(filepath);
    });
  });

  it('should `transform` a file into a module', () => {
    // Given
    const filter = jest.fn(() => true);
    rollupUtils.createFilter.mockImplementationOnce(() => filter);
    const code = 'a { background: red; }';
    const encodedCSS = JSON.stringify(code);
    const filepath = 'some/file';
    let sut = null;
    // When
    sut = new ProjextRollupCSSPlugin();
    return sut.transform(code, filepath)
    .then((result) => {
      // Then
      expect(result).toEqual({
        code: `export default ${encodedCSS};`,
        map: {
          mappings: '',
        },
      });
      expect(filter).toHaveBeenCalledTimes(1);
      expect(filter).toHaveBeenCalledWith(filepath);
    })
    .catch((error) => {
      throw error;
    });
  });

  it('should `transform` a file to eventually move it into a bundle', () => {
    // Given
    const filter = jest.fn(() => true);
    rollupUtils.createFilter.mockImplementationOnce(() => filter);
    const code = 'a { background: red; }';
    const filepath = 'some/file';
    const options = {
      output: 'some-file.css',
    };
    let sut = null;
    // When
    sut = new ProjextRollupCSSPlugin(options);
    return sut.transform(code, filepath)
    .then((result) => {
      // Then
      expect(result).toEqual({
        code: 'export default \'\';',
        map: {
          mappings: '',
        },
      });

      return sut.transform(code, filepath);
    })
    .then((result) => {
      expect(result).toEqual({
        code: 'export default \'\';',
        map: {
          mappings: '',
        },
      });
      expect(filter).toHaveBeenCalledTimes(2);
      expect(filter).toHaveBeenCalledWith(filepath);
      expect(filter).toHaveBeenCalledWith(filepath);
    })
    .catch((error) => {
      throw error;
    });
  });

  it('should `transform` a file into injectable styles', () => {
    // Given
    const filter = jest.fn(() => true);
    rollupUtils.createFilter.mockImplementationOnce(() => filter);
    const code = 'a { background: red; }';
    const filepath = 'some/file';
    const options = {
      insert: true,
      insertFnName: 'insertStyles',
    };
    let sut = null;
    const encodedCSS = JSON.stringify(code);
    const expectedCode = `${options.insertFnName}(${encodedCSS})`;
    // When
    sut = new ProjextRollupCSSPlugin(options);
    return sut.transform(code, filepath)
    .then((result) => {
      // Then
      expect(result).toEqual({
        code: `export default ${expectedCode};`,
        map: {
          mappings: '',
        },
      });
      expect(filter).toHaveBeenCalledTimes(1);
      expect(filter).toHaveBeenCalledWith(filepath);
    })
    .catch((error) => {
      throw error;
    });
  });

  it('should `transform` a file into a module with multiple exports', () => {
    // Given
    const filter = jest.fn(() => true);
    rollupUtils.createFilter.mockImplementationOnce(() => filter);
    const code = 'a { background: red; }';
    const encodedCSS = JSON.stringify(code);
    const filepath = 'some/file';
    const extra = 'something-extra';
    const encodedExtra = JSON.stringify(extra);
    const options = {
      processor: jest.fn((cssCode) => Promise.resolve({ css: cssCode, extra })),
    };
    let sut = null;
    // When
    sut = new ProjextRollupCSSPlugin(options);
    return sut.transform(code, filepath)
    .then((result) => {
      // Then
      expect(result).toEqual({
        code: [
          `export default ${encodedCSS};`,
          `export const extra = ${encodedExtra};`,
        ].join('\n'),
        map: {
          mappings: '',
        },
      });
      expect(filter).toHaveBeenCalledTimes(1);
      expect(filter).toHaveBeenCalledWith(filepath);
    })
    .catch((error) => {
      throw error;
    });
  });

  it('shouldn\'t generate a file if the plugin wasn\'t used for bundling', () => {
    // Given
    const options = {
      insert: false,
      output: 'some-file',
    };
    let sut = null;
    // When
    sut = new ProjextRollupCSSPlugin(options);
    sut.writeBundle();
    // Then
    expect(fs.pathExistsSync).toHaveBeenCalledTimes(0);
  });

  it('should generate a bundle', () => {
    // Given
    const filter = jest.fn(() => true);
    rollupUtils.createFilter.mockImplementationOnce(() => filter);
    fs.pathExistsSync.mockImplementationOnce(() => false);
    const code = 'a { background: red; }';
    const filepath = 'some/file';
    const stats = jest.fn();
    const dir = 'some-dir';
    const options = {
      output: `${dir}/some-file.css`,
      stats,
    };
    let sut = null;
    // When
    sut = new ProjextRollupCSSPlugin(options);
    return sut.transform(code, filepath)
    .then(() => {
      sut.writeBundle();
      // Then
      expect(filter).toHaveBeenCalledTimes(1);
      expect(filter).toHaveBeenCalledWith(filepath);
      expect(fs.pathExistsSync).toHaveBeenCalledTimes(1);
      expect(fs.pathExistsSync).toHaveBeenCalledWith(options.output);
      expect(fs.ensureDirSync).toHaveBeenCalledTimes(1);
      expect(fs.ensureDirSync).toHaveBeenCalledWith(dir);
      expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
      expect(fs.writeFileSync).toHaveBeenCalledWith(options.output, code);
      expect(stats).toHaveBeenCalledTimes(1);
      expect(stats).toHaveBeenCalledWith(sut.name, options.output);
    })
    .catch((error) => {
      throw error;
    });
  });

  it('should append code to an existing bundle', () => {
    // Given
    const filter = jest.fn(() => true);
    rollupUtils.createFilter.mockImplementationOnce(() => filter);
    fs.pathExistsSync.mockImplementationOnce(() => true);
    const existingCode = 'strong { color: green; }';
    fs.readFileSync.mockImplementationOnce(() => existingCode);
    const code = 'a { background: red; }';
    const filepath = 'some/file';
    const stats = jest.fn();
    const dir = 'some-dir';
    const options = {
      output: `${dir}/some-file.css`,
      stats,
    };
    let sut = null;
    // When
    sut = new ProjextRollupCSSPlugin(options);
    return sut.transform(code, filepath)
    .then(() => {
      sut.writeBundle();
      // Then
      expect(fs.pathExistsSync).toHaveBeenCalledTimes(1);
      expect(fs.pathExistsSync).toHaveBeenCalledWith(options.output);
      expect(fs.readFileSync).toHaveBeenCalledTimes(1);
      expect(fs.readFileSync).toHaveBeenCalledWith(options.output, 'utf-8');
      expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
      expect(fs.writeFileSync).toHaveBeenCalledWith(options.output, `${existingCode}\n${code}`);
      expect(stats).toHaveBeenCalledTimes(0);
    })
    .catch((error) => {
      throw error;
    });
  });

  it('should provide a shorthand method to instantiate the plugin', () => {
    // Given
    const filter = 'filter';
    rollupUtils.createFilter.mockImplementationOnce(() => filter);
    let sut = null;
    // When
    sut = css();
    // Then
    expect(sut).toBeInstanceOf(ProjextRollupCSSPlugin);
    expect(sut.name).toBe('projext-rollup-plugin-css');
    expect(sut.filter).toBe(filter);
    expect(sut.intro).toBeFunction();
    expect(sut.transform).toBeFunction();
    expect(sut.writeBundle).toBeFunction();
    expect(rollupUtils.createFilter).toHaveBeenCalledTimes(1);
    expect(rollupUtils.createFilter).toHaveBeenCalledWith([expect.any(RegExp)], []);
  });
});
