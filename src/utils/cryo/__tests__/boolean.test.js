import Cryo from '../cryo.js'

describe('Boolean', function() {
  it('should hydrate booleans', function() {
    for (let original of [true, false]) {
      const stringified = Cryo.stringify(original)
      const hydrated = Cryo.parse(stringified)
      expect(hydrated).toEqual(original)
    }
  })
})
