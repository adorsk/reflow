import Cryo from '../cryo.js'

function checkHydration (original) {
  const stringified = Cryo.stringify(original)
  const hydrated = Cryo.parse(stringified)
  expect(hydrated).toEqual(original)
}

describe('Number', function() {
  it('should hydrate a simple number', function() {
    checkHydration(123)
  })

  it('should hydrate zero', function() {
    checkHydration(0)
  })

  it('should hydrate Infinity', function() {
    checkHydration(Infinity)
  })

  it('should hydrate a negative number', function() {
    checkHydration(-123)
  })

  it('should hydrate a decimal', function() {
    checkHydration(333/444 + 0.00005)
  })
})
