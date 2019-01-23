import ObservableMapStore from '../ObservableMapStore.js'

describe('ObservableMapStore', () => {
  describe('constructor', () => {
    it('creates store', () => {
      const s = new ObservableMapStore()
      expect(s).toBeDefined()
    })
  })

  describe('getOrCreate', () => {
    it('creates if does not exist', () => {
      const s = new ObservableMapStore()
      const someValue = {'someKey': 'someValue'}
      const value = s.getOrCreate({
        key: 'someKey',
        factoryFn: () => someValue
      })
      expect(value).toEqual(someValue)
    })
    
    it('gets existing', () => {
      const s = new ObservableMapStore()
      const someValue = {'someKey': 'someValue'}
      s.getOrCreate({
        key: 'someKey',
        factoryFn: () => someValue
      })
      const value = s.getOrCreate({
        key: 'someKey',
        factoryFn: () => 'someOtherValue'
      })
      expect(value).toEqual(someValue)
    })

  })
})
