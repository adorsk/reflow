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
    return (
      <div>
        <h5>GraphEditor</h5>
        <GraphEditor
          graph={graph}
        />
      </div>
    )
  })
