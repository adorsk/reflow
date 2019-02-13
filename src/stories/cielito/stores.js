import ObservableMapStore from '../../engine/ObservableMapStore.js'
import PouchDB from 'pouchdb-browser'

async function getStoresPromise () {
  const engineStore = new ObservableMapStore()
  const viewDb = new PouchDB('cielito-view')
  let initialViewStoreValues
  try { 
    const doc = await viewDb.get('viewStore')
    initialViewStoreValues = doc.values
  } catch (err) {
    console.log(err)
    initialViewStoreValues = {}
  }
  const viewStore = new ObservableMapStore({
    initialValues: initialViewStoreValues
  })
  viewStore.store.observe(async () => {
    try {
      const doc = await viewDb.get('viewStore')
      viewDb.put({
        _id: 'viewStore',
        _rev: doc._rev,
        values: viewStore.store.toJSON(),
      }, {force: true})
    } catch (err) {
      viewDb.put({
        _id: 'viewStore',
        values: viewStore.store.toJSON(),
      })
    }
  })
  return { engineStore, viewStore }
}

export const storesPromise = getStoresPromise()

export default storesPromise
