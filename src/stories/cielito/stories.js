import React from 'react'
import { storiesOf } from '@storybook/react'

import { engineStore, viewStore } from './stores.js'
import graphFactory from './graphFactory.js'
import GraphView from '../../components/GraphView.js'


storiesOf('cielito', module)
  .add('default', () => {
    const graph = graphFactory({store: engineStore})
    return (<GraphView store={viewStore} graph={graph} />)
  })
