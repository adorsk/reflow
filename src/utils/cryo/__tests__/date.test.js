import Cryo from '../cryo.js'

describe('Date', function() {
  it('should hydrate a date', function() {
    const original = new Date()
    const stringified = Cryo.stringify(original)
    const hydrated = Cryo.parse(stringified)
    expect(hydrated instanceof Date).toBe(true)
    expect(hydrated.getTime()).toEqual(original.getTime())
  });

  it('should hydrate a date that has properties', function() {
    const original = new Date()
    original.attached = 'some property'
    const stringified = Cryo.stringify(original)
    const hydrated = Cryo.parse(stringified)
    expect(hydrated instanceof Date).toBe(true)
    expect(hydrated.getTime()).toEqual(original.getTime())
    expect(hydrated.attached).toEqual(original.attached)
  })
})
