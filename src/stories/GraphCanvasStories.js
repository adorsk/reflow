import React from 'react'
import { storiesOf } from '@storybook/react'

import GraphCanvas from '../GraphCanvas.js'

storiesOf('GraphCanvas', module)
  .add('testing', () => {
    const nodes = {
      a: {
        id: 'a',
        pos: {x: 0, y: 0},
      },
      b: {
        id: 'b',
        pos: {x: 100, y: 50},
      }
    }
    return (
      <div>
        <h5>GraphCanvas</h5>
        <GraphCanvas
          style={{position: 'relative'}}
          nodes={nodes}
        />
      </div>
    )
  })
