import React from 'react'
import _ from 'lodash'
import PouchDB from 'pouchdb-browser'
import { storiesOf } from '@storybook/react'

import ObservableMapStore from '../engine/ObservableMapStore.js'
import GraphEditor from '../components/GraphEditor.js'

export async function createStores ({namespace}) {
  const engineStore = new ObservableMapStore()
  const viewDb = new PouchDB(namespace)
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
  viewStore.store.observe(async (delta) => {
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

export const memoizedCreateStores = _.memoize(
  createStores,
  function cacheKeyResolver ({namespace}) {
    return namespace
  }
)


export class PersistentGraphEditor extends React.Component {
  state = { graph: null, viewStore: null}

  componentDidMount() {
    (async () => {
      const stores = await this.props.storesFactory()
      const graph = await this.props.graphFactory({store: stores.engineStore})
      this.setState({graph, viewStore: stores.viewStore})
    })()
  }

  render() {
    const { graph, viewStore} = this.state
    if (!graph || !viewStore) { return null }
    return (
      <GraphEditor
        store={viewStore}
        graph={graph} 
        style={{width: '100vw', height: '100vh'}}
      />
    )
  }
}

export function addGraphStory ({namespace, graphFactory, module}) {
  storiesOf(namespace, module).add('default', () => {
    return (
      <PersistentGraphEditor
        graphFactory={graphFactory}
        storesFactory={() => memoizedCreateStores({namespace})}
      />
    )
  })
}
