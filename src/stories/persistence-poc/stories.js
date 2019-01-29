import React from 'react'
import { storiesOf } from '@storybook/react'

import store from './store.js'
import graphFactory from './graphFactory.js'
import GraphEditor from '../../components/GraphEditor.js'

storiesOf('persistence-poc', module)
  .add('example', () => {
    const graph = graphFactory({store})
    console.log("g: ", graph)
    return (<GraphEditor graph={graph} />)
  })
