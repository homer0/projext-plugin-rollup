jest.unmock('/src/plugins/stylesheetAssets/helperFn');

const helperFn = require('/src/plugins/stylesheetAssets/helperFn');

describe('plugins:stylesheetAssets/helperFn', () => {
  it('should return whatever it receives', () => {
    // Given
    const code = 'a { background: red; }';
    let result = null;
    // When
    result = helperFn(code);
    // Then
    expect(result).toBe(code);
  });
});
