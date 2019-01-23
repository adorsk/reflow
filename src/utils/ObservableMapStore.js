import { observable } from 'mobx'

export class ObservableMapStore {
  constructor (opts) {
    this.store = observable.map()
  }

  getOrCreate ({key, factoryFn} = {}) {
    if (!this.store.has(key)) {
      this.store.set(key, factoryFn({key}))
    }
    return this.store.get(key)
  }
}

export default ObservableMapStore
