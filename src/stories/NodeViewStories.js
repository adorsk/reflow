import React from 'react'
import { storiesOf } from '@storybook/react'

import { NodeView, DraggableNodeView } from '../components/NodeView.js'
import Node from '../engine/Node.js'
import DragContainer from '../components/DragContainer.js'

storiesOf('NodeView', module)
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
        <NodeView
          node={node}
          getTickFnCode={'return ({node}) => console.log("tikko", node)'}
        />
      </div>
    )
  })
  .add('draggable', () => {
    const genPorts = ({prefix, numPorts}) => {
      const portNums = [...((new Array(numPorts)).keys())]
      return portNums.reduce((ports, portNum) => {
        return Object.assign(ports, {[`${prefix}-${portNum}`]: {}})
      }, {})
    }
    const node = Node.fromSpec({
      id: 'a',
      ports: {
        inputs: genPorts({prefix: 'in', numPorts: 6}),
        outputs: genPorts({prefix: 'out', numPorts: 4}),
      },
    })
    return (
      <DragContainer>
        <DraggableNodeView
          pos={{x: 100, y: 50}}
          node={node}
        />
      </DragContainer>
    )
  })




