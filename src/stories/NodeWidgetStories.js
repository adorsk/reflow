import React from 'react'
import { storiesOf } from '@storybook/react'

import { NodeWidget, DraggableNodeWidget } from '../components/NodeWidget.js'
import Node from '../engine/Node.js'
import DragContainer from '../components/DragContainer.js'

storiesOf('NodeWidget', module)
  .add('default', () => {
    const node = Node.fromSpec({
      id: 'a',
      ports: {
        inputs: {
          'in': {}
        }
      }
    })
    return (
      <div>
        <NodeWidget
          node={node}
          getTickFnCode={'return ({node}) => console.log("tikko", node)'}
        />
      </div>
    )
  })
  .add('draggable', () => {
    const node = Node.fromSpec({
      id: 'a',
      ports: {
        inputs: {
          'in1': {},
          'in2': {},
          'in3': {},
        },
        outputs: {
          'out1': {},
          'out2': {},
          'out3': {},
        }
      },
    })
    return (
      <DragContainer>
        <DraggableNodeWidget
          pos={{x: 100, y: 50}}
          node={node}
        />
      </DragContainer>
    )
  })




