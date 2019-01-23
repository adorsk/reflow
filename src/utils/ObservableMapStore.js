import { observable } from 'mobx'

export class ObservableMapStore {
  constructor (opts) {
    this.store = observable.map()
  }

  getOrCreate ({key, factoryFn} = {}) {
    if (!this.store.has(key)) {
      factoryFn = factoryFn || (() => observable.map())
      this.store.set(key, factoryFn({key}))
    }
    return this.store.get(key)
  }

  set ({key, value}) {
    this.store.set(key, value)
  }
}

export default ObservableMapStore
