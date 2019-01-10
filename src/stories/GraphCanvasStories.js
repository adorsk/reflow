import React from 'react'
import { storiesOf } from '@storybook/react'

import GraphCanvas from '../components/GraphCanvas.js'

storiesOf('GraphCanvas', module)
  .add('testing', () => {
    const nodes = {
      a: {
        id: 'a',
        pos: {x: 0, y: 0},
        ports: {
          outputs: {
            out: {}
          }
        },
      },
      b: {
        id: 'b',
        pos: {x: 100, y: 50},
        ports: {
          inputs: {
            in: {}
          }
        },
      }
    }
    const graph = {
      nodes
    }
    return (
      <div>
        <h5>GraphCanvas</h5>
        <GraphCanvas
          graph={graph}
        />
      </div>
    )
  })
