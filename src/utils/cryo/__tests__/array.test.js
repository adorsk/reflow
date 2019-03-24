import Cryo from '../cryo.js'

describe('Array', function() {

  it('should hydrate a one-dimensional array', function() {
    const original = [1, 2, 3, 'a', 'b', 'c']
    const stringified = Cryo.stringify(original)
    const hydrated = Cryo.parse(stringified)
    expect(Array.isArray(hydrated)).toBe(true)
    expect(hydrated).toEqual(original)
  })

  it('should hydrate a multi-dimensional array', function() {
    const original = [
      [ 0, 1, 2 ],
      [ 3, 4, 5 ],
      [ 'a', 'b', 'c' ]
    ]
    const stringified = Cryo.stringify(original)
    const hydrated = Cryo.parse(stringified)
    expect(Array.isArray(hydrated)).toBe(true)
    expect(hydrated).toEqual(original)
  })

  it('should hydrate an array that has properties', function() {
    const original = [1, 2, 3]
    original.attached = 'some property'
    const stringified = Cryo.stringify(original)
    const hydrated = Cryo.parse(stringified)
    expect(Array.isArray(hydrated)).toBe(true)
    expect(hydrated.length).toEqual(original.length)
    expect(hydrated[0]).toEqual(original[0])
    expect(hydrated[2]).toEqual( original[2])
    expect(hydrated.attached).toEqual(original.attached)
  })

});
