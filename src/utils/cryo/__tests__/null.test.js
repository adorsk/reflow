import Cryo from '../cryo.js'

function checkHydration (original) {
  const stringified = Cryo.stringify(original)
  const hydrated = Cryo.parse(stringified)
  expect(hydrated).toEqual(original)
}

describe('Null and undefined', function() {

  it('should hydrate a null value', function() {
    checkHydration(null)
  })

  it('should hydrate an undefined value', function() {
    checkHydration(undefined)
  })
})
