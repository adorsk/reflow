import React from 'react'
import { storiesOf } from '@storybook/react'

import Graph from '../engine/Graph.js'
import {
  memoizedCreateStores,
  PersistentGraphView,
} from '../utils/graphStory-utils.js'


storiesOf('GraphSpec', module)
  .add('default', () => {
    const graphSpec = {
      id: 'graph-from-spec',
      nodeSpecs: [
        {
          id: 'a',
        },
        {
          id: 'b',
        },
      ],
      wireSpecs: [
      ]
    }
    const graphFactory = async ({store}) => {
      return await Graph.fromSpec({graphSpec, store})
    }
    return (
      <PersistentGraphView
        storesFactory={() => memoizedCreateStores({namespace: graphSpec.id})}
        graphFactory={graphFactory}
      />
    )
  })

