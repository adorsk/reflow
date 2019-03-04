import React from 'react'
import { storiesOf } from '@storybook/react'

import { storesPromise } from './stores.js'
import graphFactory from './graphFactory.js'
import GraphView from '../../components/GraphView.js'

class AwaitStoresPromise extends React.Component {
  state = { engineStore: null, viewStore: null}

  componentDidMount() {
    storesPromise.then(({viewStore, engineStore}) => {
      this.setState({viewStore, engineStore })
    })
  }

  render() {
    const { viewStore, engineStore } = this.state
    if (!viewStore || !engineStore) { return null }
    const graph = graphFactory({store: engineStore})
    return (<GraphView store={viewStore} graph={graph} />)
  }
}


const mod = storiesOf('asyncStream', module)
mod.add('default', () => {
  return (<AwaitStoresPromise />)
})
