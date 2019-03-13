import React from 'react'
import _ from 'lodash'
import PouchDB from 'pouchdb-browser'
import { storiesOf } from '@storybook/react'

import ObservableMapStore from '../engine/ObservableMapStore.js'
import GraphView from '../components/GraphView.js'

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


export class PersistentGraphView extends React.Component {
  state = { engineStore: null, viewStore: null}

  componentDidMount() {
    const storesPromise = memoizedCreateStores({namespace: this.props.namespace})
    storesPromise.then(({viewStore, engineStore}) => {
      this.setState({viewStore, engineStore })
    })
  }

  render() {
    const { viewStore, engineStore } = this.state
    if (!viewStore || !engineStore) { return null }
    const graph = this.props.graphFactory({store: engineStore})
    return (<GraphView store={viewStore} graph={graph} />)
  }
}

export function addGraphStory ({namespace, graphFactory, module}) {
  storiesOf(namespace, module).add('default', () => {
    return (
      <PersistentGraphView
        graphFactory={graphFactory}
        namespace={namespace}
      />
    )
  })
}
