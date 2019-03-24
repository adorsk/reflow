import Cryo from '../cryo.js'


describe('Function', function() {
  it('should hydrate a function', function() {
    const original = function(from, to) {
      return 'hello world from ' + from + ' to ' + to
    }
    const stringified = Cryo.stringify(original)
    const hydrated = Cryo.parse(stringified)
    const result1 = original('Hunter', 'you')
    const result2 = hydrated('Hunter', 'you')
    expect(result1).toEqual(result2)
  })

  it('should hydrate a function that has properties', function() {
    const original = function(from, to) {
      return 'hello world from ' + from + ' to ' + to
    }
    original.attached = 'some property';
    const stringified = Cryo.stringify(original)
    const hydrated = Cryo.parse(stringified)
    const result1 = original('Hunter', 'you')
    const result2 = hydrated('Hunter', 'you')
    expect(result1).toEqual(result2)
    expect(hydrated.attached).toEqual(original.attached)
  })

  it('should hydrate an async function', async function() {
    const original = async function(from, to) {
      return 'hello world from ' + from + ' to ' + to
    }
    const stringified = Cryo.stringify(original)
    const hydrated = Cryo.parse(stringified)
    const result1 = await original('Hunter', 'you')
    const result2 = await hydrated('Hunter', 'you')
    expect(result1).toEqual(result2)
  })
})
