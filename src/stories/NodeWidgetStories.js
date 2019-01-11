import React from 'react'
import { storiesOf } from '@storybook/react'

import NodeWidget from '../components/NodeWidget.js'
import Node from '../engine/Node.js'

storiesOf('NodeWidget', module)
  .add('testing', () => {
    const node = Node.fromSpec({
      id: 'a',
      ports: {
        inputs: {
          'in': {}
        }
      }
    })
    window.n = node
    return (
      <div>
        <h5>NodeWidget</h5>
        <NodeWidget
          node={node}
          getTickFnCode={'return ({node}) => console.log("tikko", node)'}
        />
      </div>
    )
  })
