import _ from 'lodash'

import Graph from '../Graph.js'

describe('Graph', () => {

  beforeEach(() => {
    jest.useFakeTimers()
  })

  const genBasicGraph = async () => {
    const graph = new Graph()
    const nodeSpecs = {
      node1: {
        id: 'node1',
        builderFn: (node) => {
          node.addOutput('out1')
        },
      },
      node2: {
        id: 'node2',
        builderFn: (node) => {
          node.addInput('in1')
        },
      }
    }
    for (let nodeSpec of Object.values(nodeSpecs)) {
      await graph.addNodeFromSpec({nodeSpec})
    }
    const wireSpecs = {
      wire1: {
        id: 'wire1',
        builderFn: (wire) => {
          wire.src = 'node1:out1'
          wire.dest = 'node2:in1'
        }
      }
    }
    for (let wireSpec of Object.values(wireSpecs)) {
      await graph.addWireFromSpec({wireSpec})
    }
    return graph
  }

  describe('onChange listener', () => {
    it('ticks for onChange event', () => {
      const g = new Graph()
      expect(g.tickCount).toEqual(0)
      g.changed.dispatch()
      jest.runAllTimers()
      expect(g.tickCount).toEqual(1)
    })
  })

  describe('drainPortPackets', () => {
    const wireFactory = ({drainBehavior}) => {
      const packets = []
      return {
        behaviors: { drain: drainBehavior },
        packets,
        pushPacket: packets.push.bind(packets),
      }
    }

    let graph
    beforeEach(() => {
      graph = new Graph()
    })

    it('pushes to wires that come after debouncedDrain wires', () => {
      const debounceWire = wireFactory({drainBehavior: 'debouncedDrain'})
      const copyWire = wireFactory({drainBehavior: 'copy'})
      const port = { packets: [1] }
      graph.drainPortPackets({port, wires: [debounceWire, copyWire]})
      expect(debounceWire.packets).toEqual([1])
      expect(copyWire.packets).toEqual([1])
      expect(port.packets).toEqual([])
    })

    it('does not push to wires after a drain wire', () => {
      const drainWire = wireFactory({drainBehavior: 'drain'})
      const copyWire = wireFactory({drainBehavior: 'copy'})
      const port = { packets: [1] }
      graph.drainPortPackets({port, wires: [drainWire, copyWire]})
      expect(drainWire.packets).toEqual([1])
      expect(copyWire.packets).toEqual([])
      expect(port.packets).toEqual([])
    })

    it('does not drain if there were no draining wires', () => {
      const copyWire = wireFactory({drainBehavior: 'copy'})
      const port = { packets: [1] }
      graph.drainPortPackets({port, wires: [copyWire]})
      expect(copyWire.packets).toEqual([1])
      expect(port.packets).toEqual([1])
    })
  })

  describe('getSerializedState', () => {
    it('copies values for all normal keys', async () => {
      const graph = await genBasicGraph()
      graph.state.set('pie', 'cherry')
      graph.state.set('animal', 'stoat')
      const serializedState = graph.getSerializedState()
      expect(serializedState['pie']).toEqual('cherry')
      expect(serializedState['animal']).toEqual('stoat')
    })

    it('handles nested nodeStates', async () => {
      const graph = await genBasicGraph()
      graph.serializeNodeStates = () => 'mockSerializedNodeStates'
      const serializedState = graph.getSerializedState()
      expect(serializedState[graph.SYMBOLS.NODE_STATES]).toEqual(
        'mockSerializedNodeStates')
    })

    it('handles nested wireStates', async () => {
      const graph = await genBasicGraph()
      graph.serializeWireStates = () => 'mockSerializedWireStates'
      const serializedState = graph.getSerializedState()
      expect(serializedState[graph.SYMBOLS.WIRE_STATES]).toEqual(
        'mockSerializedWireStates')
    })
  })

  describe('serializeNodeStates', () => {
    it('serializes nodeStates', async () => {
      const graph = await genBasicGraph()
      const expectedSerializedNodeStates = {}
      for (let node of _.values(graph.getNodes())) {
        const mockSerializedNodeState = 'mock:' + node.id
        node.getSerializedState = () => mockSerializedNodeState
        expectedSerializedNodeStates[node.id] = mockSerializedNodeState
      }
      const actualSerializedNodeStates = graph.serializeNodeStates()
      expect(actualSerializedNodeStates).toEqual(expectedSerializedNodeStates)
    })
  })

  describe('serializeWireStates', () => {
    it('serializes wireStates', async () => {
      const graph = await genBasicGraph()
      const expectedSerializedWireStates = {}
      for (let wire of _.values(graph.getWires())) {
        const mockSerializedWireState = 'mock:' + wire.id
        wire.getSerializedState = () => mockSerializedWireState
        expectedSerializedWireStates[wire.id] = mockSerializedWireState
      }
      const actualSerializedWireStates = graph.serializeWireStates()
      expect(actualSerializedWireStates).toEqual(expectedSerializedWireStates)
    })
  })

  describe('getSerialization', () => {
    it('returns expected serialization', async () => {
      const graph = await genBasicGraph()
      const mocks = {}
      for (let fnName of ['getSpec', 'getSerializedState']) {
        const mockFn = () => 'mockReturn:' + fnName
        mocks[fnName] = mockFn
        graph[fnName] = mockFn
      }
      const expectedSerialization = {
        spec: mocks.getSpec(),
        serializedState: mocks.getSerializedState(),
      }
      const actualSerialization = graph.getSerialization()
      expect(actualSerialization).toEqual(expectedSerialization)
    })
  })

  describe('Graph.fromSerialization', () => {
    it('can create graph from serialization', async () => {
      const orig = await genBasicGraph()
      const serialization = orig.getSerialization()
      const hydrated = await Graph.fromSerialization({serialization})
      expect(hydrated.id).toEqual(orig.id)
    })
  })
})
