import _ from 'lodash'

import Graph from '../../engine/Graph.js'
import {
  NumberInput,
  getInputValues,
} from '../../utils/graphFactory-utils.js'

const graphFactory = ({store} = {}) => {
  const graph = new Graph({
    id: 'streams-poc',
    store,
  })

  // itemsGen
  graph.addNodeFromSpec({
    nodeSpec: {
      id: 'itemsGen',
      portSpecs: {
        inputs: {
          n: {
            initialValues: [3],
            ctx: { getGuiComponent: () => NumberInput },
          },
        },
        outputs: {
          items: {},
        },
      },
      tickFn: ({node}) => {
        if (!node.hasHotInputs()) { return }
        const inputValues = getInputValues({node, inputKeys: ['n']})
        const items = _.times(inputValues.n, (i) => i)
        node.getPort('outputs:items').pushValue(items)
      },
    }
  })

  // splitter
  graph.addNodeFromSpec({
    nodeSpec: {
      id: 'splitter',
      portSpecs: {
        inputs: {
          items: {},
        },
        outputs: {
          packet: {},
        },
      },
      tickFn: ({node}) => {
        if (!node.hasHotInputs()) { return }
        const { items } = getInputValues({node, inputKeys: ['items']})
        if (_.isEmpty(items)) { return }
        const packetPort = node.getPort('outputs:packet')
        packetPort.pushValue('<')
        items.forEach((item) => packetPort.pushValue(item))
        packetPort.pushValue('>')
      },
    }
  })

  graph.addWireFromSpec({
    wireSpec: {src: 'itemsGen:items', dest: 'splitter:items'}
  })

  // merger
  graph.addNodeFromSpec({
    nodeSpec: {
      id: 'merger',
      portSpecs: {
        inputs: {
          packet: {},
        },
        outputs: {
          items: {},
        },
      },
      tickFn: ({node}) => {
        const packetPort = node.getPort('inputs:packet')
        const itemsPort = node.getPort('outputs:items')
        while (packetPort.values.length > 0) {
          const packet = packetPort.shiftValue()
          if (packet === '<') {
            node.state.set('items', [])
          } else if (packet === '>') {
            itemsPort.pushValue(node.state.get('items'))
            node.state.delete('items')
          } else {
            node.state.get('items').push(packet)
          }
        }
      },
    }
  })

  graph.addWireFromSpec({
    wireSpec: {src: 'splitter:packet', dest: 'merger:packet'}
  })

  return graph
}

export default graphFactory
