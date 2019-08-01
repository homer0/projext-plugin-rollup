jest.unmock('/src/plugins/extraWatch');

require('jasmine-expect');
const {
  extraWatch,
} = require('/src/plugins/extraWatch');


describe('plugins:extraWatch', () => {
  it('should throw an error when instantiated without a definitions funciton', () => {
    // Given/When/Then
    expect(() => extraWatch())
    .toThrow(/You need to provide a valid files list/i);
  });

  it('should be instantiated', () => {
    // Given
    const files = ['Rosario', 'Pilar'];
    let sut = null;
    // When
    sut = extraWatch(files);
    // Then
    expect(sut).toBeObject();
    expect(sut.name).toBe('projext-rollup-plugin-extra-watch');
    expect(sut.transform).toBeFunction();
  });

  it('should be instantiated with a custom name', () => {
    // Given
    const files = ['Rosario', 'Pilar'];
    const name = 'my-runtime-replace-plugin';
    let sut = null;
    // When
    sut = extraWatch(files, name);
    // Then
    expect(sut).toBeObject();
    expect(sut.name).toBe(name);
  });

  it('shouldn\'t add the files if \'transform\' is called for an unknown file', () => {
    // Given
    const files = ['Rosario', 'Pilar'];
    const context = {
      addWatchFile: jest.fn(),
    };
    let sut = null;
    // When
    sut = extraWatch(files);
    sut.transform.bind(context)('some-code', 'some-file');
    // Then
    expect(context.addWatchFile).toHaveBeenCalledTimes(0);
  });

  it('should add the files when \'transform\' is called for a file from the list', () => {
    // Given
    const files = ['Rosario', 'Pilar'];
    const context = {
      addWatchFile: jest.fn(),
    };
    let sut = null;
    // When
    sut = extraWatch(files);
    sut.transform.bind(context)('some-code', files[0]);
    // Then
    expect(context.addWatchFile).toHaveBeenCalledTimes(files.length);
    files.forEach((file) => {
      expect(context.addWatchFile).toHaveBeenCalledWith(file);
    });
  });
});
