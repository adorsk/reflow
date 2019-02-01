import React from 'react'
import { storiesOf } from '@storybook/react'

import store from './store.js'
import graphFactory from './graphFactory.js'
import GraphView from '../../components/GraphView.js'

storiesOf('persistence-poc', module)
  .add('example', () => {
    const graph = graphFactory({store})
    console.log("g: ", graph)
    return (<GraphView graph={graph} />)
  })
