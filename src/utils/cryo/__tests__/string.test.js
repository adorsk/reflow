import Cryo from '../cryo.js'

describe('String', function() {
  it('should hydrate a simple string', function() {
    const original = [
      "This is my simple string. Isn't it beautiful!?",
      "Here is a mustache: {{"
    ].join('\n')
    const stringified = Cryo.stringify(original)
    const hydrated = Cryo.parse(stringified)
    expect(hydrated).toEqual(original)
  })

  it('should hydrate an empty string', function() {
    const original = ''
    const stringified = Cryo.stringify(original)
    const hydrated = Cryo.parse(stringified)
    expect(hydrated).toEqual(original)
  })
})
