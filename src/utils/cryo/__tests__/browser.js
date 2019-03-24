import Cryo from '../cryo.js'

describe('Cryo - Browser', function() {
  it('should ignore DOM references in objects', function() {
    const original = {
      domRef: document.createElement('div'),
      otherData: 'Hello'
    }
    const stringified = Cryo.stringify(original)
    const hydrated = Cryo.parse(stringified)
    expect(hydrated.domRef).toBeUndefined()
    expect(hydrated.otherData).toEqual(original.otherData)
  })

  it('should ignore DOM references in arrays', function() {
    const ref = document.createElement('div')
    const original = [ref, ref, 3, ref]
    const stringified = Cryo.stringify(original)
    const hydrated = Cryo.parse(stringified)
    expect(hydrated.length).toEqual(3)
    expect(hydrated[2]).toEqual(3)
    expect(hydrated.ref).toBeUndefined()
  })

  it('should ignore DOM references on dates', function() {
    const ref = document.createElement('div')
    const original = new Date()
    original.attached = 'some property'
    original.ref = ref
    const stringified = Cryo.stringify(original)
    const hydrated = Cryo.parse(stringified)
    expect(hydrated instanceof Date).toBe(true)
    expect(hydrated.getTime()).toEqual(original.getTime())
    expect(hydrated.attached).toEqual(original.attached)
    expect(hydrated.ref).toBeUndefined()
  })

  it('should ignore a direct DOM reference', function() {
    const ref = document.createElement('div')
    const stringified = Cryo.stringify(ref)
    const hydrated = Cryo.parse(stringified)
    expect(hydrated).toBeUndefined()
  })
})
