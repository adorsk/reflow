import Cryo from '../cryo.js'

function checkHydration (original) {
  const stringified = Cryo.stringify(original)
  const hydrated = Cryo.parse(stringified)
  expect(hydrated).toEqual(original)
}

describe('Object', function() {
  it('should hydrate an empty object', function() {
    checkHydration({})
  })

  it('should hydrate an object with a string property', function() {
    checkHydration({myString: 'my string'})
  })

  it('should hydrate an object with a number property', function() {
    checkHydration({ myNum: -128 })
  })

  it('should hydrate an object with a boolean property', function() {
    checkHydration({myBool: false})
  })

  it('should hydrate an object with an array property', function() {
   checkHydration({myArray: ['a', 2, 3, 'd', false, true]})
  })

  it('should hydrate an object with an null property', function() {
    checkHydration({myNull: null})
  })

  it('should hydrate an object with an undefined property', function() {
    checkHydration({myUndefined: undefined})
  })

  it('should hydrate an object with several native types', function() {
   checkHydration({
      myString: 'my string',
      myNum: 128,
      myArray: ['a', 2, 3, 'd', false, true],
      myBool: false,
      myNull: null,
      myUndefined: undefined
    })
  })

  it('should hydrate an object with nested objects', function() {
    checkHydration({
      first: {
        second: {
          myString: 'my string',
          myNum: 128,
          myArray: ['a', 2, 3, 'd', false, true],
          myBool: false,
          myNull: null,
          myUndefined: undefined
        },
        secondSibling: [1, 2, 3],
        thirdSibling: undefined
      },
      firstSibling: 'hello'
    })
  })
})
