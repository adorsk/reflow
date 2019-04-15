import { observable } from 'mobx'

export class ObservableMapStore {
  constructor ({initialValues={}} = {}) {
    this.store = observable.map(initialValues, {deep: false})
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

  toJSON () { return this.store.toJSON() }
  toJS () { return this.store.toJS() }
}

export default ObservableMapStore
