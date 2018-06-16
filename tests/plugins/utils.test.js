jest.mock('rollup-pluginutils');
jest.mock('wootils/node/logger');
jest.unmock('/src/plugins/utils');

require('jasmine-expect');
const { Logger } = require('wootils/node/logger');
const ProjextRollupUtils = require('/src/plugins/utils');

describe('plugins:utils', () => {
  describe('formatPlaceholder', () => {
    it('should replace basic placeholders on a URL', () => {
      // Given
      const placeholder = '[name].[ext]';
      const info = {
        name: 'file',
        ext: '.js',
      };
      let result = null;
      // When
      result = ProjextRollupUtils.formatPlaceholder(placeholder, info);
      // Then
      expect(result).toBe(`${info.name}${info.ext}`);
    });
  });

  describe('escapeRegex', () => {
    it('should escape a string to be used as a RegExp', () => {
      // Given
      const str = '[({})]';
      let result = null;
      const expectedResult = str
      .split('')
      .map((char) => `\\${char}`)
      .join('');
      // When
      result = ProjextRollupUtils.escapeRegex(str);
      // Then
      expect(result).toBe(expectedResult);
    });
  });

  describe('createLogger', () => {
    it('should create a logger if no instance is sent to be validate', () => {
      // Given
      let result = null;
      // When
      result = ProjextRollupUtils.createLogger();
      // Then
      expect(result).toBeInstanceOf(Logger);
    });

    it('should return the same received instance when it\'s an instance of Logger', () => {
      // Given
      const logger = new Logger();
      let result = null;
      // When
      result = ProjextRollupUtils.createLogger('my-plugin', logger);
      // Then
      expect(result).toBe(logger);
    });

    it('should allow a method that support the same methods as Logger', () => {
      // Given
      const logger = {
        success: () => {},
        info: () => {},
        warning: () => {},
        error: () => {},
      };
      let result = null;
      // When
      result = ProjextRollupUtils.createLogger('my-plugin', logger);
      // Then
      expect(result).toBe(logger);
    });

    it('should throw an error when an invalid logger is sent', () => {
      // Given
      const logger = {};
      const name = 'Charito';
      // When/Then
      expect(() => ProjextRollupUtils.createLogger(name, logger))
      .toThrow(
        new RegExp(`${name}: The logger must be an instance of the wootils's Logger class`, 'i')
      );
    });
  });
});
