import React from 'react'
import { storiesOf } from '@storybook/react'

import GraphEditor from '../components/GraphEditor.js'
import Graph from '../engine/Graph.js'
import Port from '../engine/Port.js'
import Node from '../engine/Node.js'


storiesOf('GraphEditor', module)
  .add('testing', () => {
    const graph = new Graph()
    graph.addNode(new Node({
      id: 'a',
      tickFn: ((() => {
        let timer = null
        const tickFn = ({node}) => {
          console.log('a.tick')
          timer = setInterval(() => {
            node.getOutputPort('out').pushValue(new Date())
          }, 1000)
        }
        tickFn.unmount = () => clearInterval(timer)
        return tickFn
      })()),
      ports: {
        outputs: {
          out: new Port({id: 'out'})
        }
      },
      state: {
        pos: {x: 0, y: 0},
      },
    }))
    graph.addNode(new Node({
      id: 'b',
      tickFn: ({node}) => {
        console.log('b.tick')
      },
      ports: {
        inputs: {
          in: new Port({id: 'in'})
        }
      },
      state: {
        pos: {x: 100, y: 50},
      },
    }))
    graph.addWire({
      src: {nodeId: 'a', portId: 'out'},
      dest: {nodeId: 'b', portId: 'in'},
    })
    graph.getNodes()['a'].tick()
    return (
      <div>
        <h5>GraphEditor</h5>
        <GraphEditor
          graph={graph}
        />
      </div>
    )
  })
