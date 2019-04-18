import _ from 'lodash'

import Graph from '../Graph.js'
import Node from '../Node.js'

describe('Graph', () => {

  beforeEach(() => {
    jest.useFakeTimers()
  })

  const genBasicGraph = () => {
    const graph = new Graph()
    const nodeSpecFactories = {
      node1: () => {
        const nodeSpec = {
          id: 'node1',
          portSpecs: {
            outputs: {
              'out1': {},
            }
          },
        }
        return nodeSpec
      },
      node2: () => {
        const nodeSpec = {
          id: 'node2',
          portSpecs: {
            inputs: {
              'in1': {},
            }
          }
        }
        return nodeSpec
      }
    }
    const nodeSpecs = _.mapValues(nodeSpecFactories, (factory, key) => {
      const nodeSpec = factory()
      nodeSpec.specFactoryFn = factory
      return nodeSpec
    })
    graph.addNodeFromSpec({nodeSpec: nodeSpecs.node1})
    graph.addNodeFromSpec({nodeSpec: nodeSpecs.node2})

    const wireSpecFactories = {
      'wire1': () => {
        const wireSpec = {
          id: 'wire1',
          src: 'node1:out1',
          dest: 'node2:in1',
          srcCode: 'wire1.srcCode',
        }
        return wireSpec
      }
    }
    const wireSpecs = _.mapValues(wireSpecFactories, (factory, key) => {
      const wireSpec = factory()
      wireSpec.specFactoryFn = factory
      return wireSpec
    })
    graph.addWireFromSpec({wireSpec: wireSpecs.wire1})

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

  describe('addNodeFromSpec', () => {
    it('sets node state', () => {
      const nodeId = 'node1'
      const graph = new Graph()
      const someState = new Map()
      someState.set('foo', 'bar')
      graph.nodeStates.set(nodeId, someState)
      const node = graph.addNodeFromSpec({nodeSpec: {id: nodeId}})
      expect(node.state.get('foo')).toBe('bar')
    })

    it('dispatches changed signal by default', () => {
      const g = new Graph()
      let changeCounter = 0
      g.changed.add(() => changeCounter++)
      g.addNode(new Node())
      expect(changeCounter).toEqual(1)
    })

    it('does not dispatch signal if specified', () => {
      const g = new Graph()
      let changeCounter = 0
      g.changed.add(() => changeCounter++)
      g.addNode(new Node(), {noSignals: true})
      expect(changeCounter).toEqual(0)
    })

    it('adds listener for node.changed', () => {
      const g = new Graph()
      let changeCounter = 0
      const node = new Node()
      g.addNode(node)
      g.changed.add(() => changeCounter++)
      node.changed.dispatch()
      expect(changeCounter).toEqual(1)
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

  describe('getSerializedSpec', () => {
    it('derives expected ctorOpts', () => {
      const graph = new Graph({id: 'someId', label: 'someLabel'})
      const serializeGraphSpec = graph.getSerializedSpec()
      const expectedCtorOpts = {id: graph.id, label: graph.label}
      expect(serializeGraphSpec.ctorOpts).toEqual(expectedCtorOpts)
    })

    it('derives expected serializedNodeSpecs', () => {
      const graph = new Graph()
      graph.addNodeFromSpec({nodeSpec: { id: 'node1' }})
      graph.addNodeFromSpec({nodeSpec: { id: 'node2' }})
      graph.nodes['node1'].getSerializedSpec = () => 'mockSpec:node1'
      graph.nodes['node2'].getSerializedSpec = () => 'mockSpec:node2'
      const serializedGraphSpec = graph.getSerializedSpec()
      const expectedSerializedNodeSpecs = {
        'node1': 'mockSpec:node1',
        'node2': 'mockSpec:node2',
      }
      expect(serializedGraphSpec.serializedNodeSpecs)
        .toEqual(expectedSerializedNodeSpecs)
    })

    it('derives expected serializedWireSpecs', () => {
      const graph = new Graph()
      graph.addNodeFromSpec({nodeSpec: {
        id: 'node1',
        portSpecs: {
          outputs: {
            'out1': {},
          }
        },
      }})
      graph.addNodeFromSpec({nodeSpec: {
        id: 'node2',
        portSpecs: {
          inputs: {
            'in1': {},
          }
        },
      }})
      graph.addWireFromSpec({wireSpec: {
        id: 'wire1',
        src: 'node1:out1',
        dest: 'node2:in1',
        srcCode: 'wire1.srcCode',
      }})
      graph.wires['wire1'].getSerializedSpec = () => 'mockSpec:wire1'
      const serializedGraphSpec = graph.getSerializedSpec()
      const expectedSerializedWireSpecs = { 'wire1': 'mockSpec:wire1' }
      expect(serializedGraphSpec.serializedWireSpecs)
        .toEqual(expectedSerializedWireSpecs)
    })
  })

  describe('getSerializedState', () => {
    it('copies values for all normal keys', () => {
      const graph = genBasicGraph()
      graph.state.set('pie', 'cherry')
      graph.state.set('animal', 'stoat')
      const serializedState = graph.getSerializedState()
      expect(serializedState['pie']).toEqual('cherry')
      expect(serializedState['animal']).toEqual('stoat')
    })

    it('handles nested nodeStates', () => {
      const graph = genBasicGraph()
      graph.serializeNodeStates = () => 'mockSerializedNodeStates'
      const serializedState = graph.getSerializedState()
      expect(serializedState[graph.SYMBOLS.NODE_STATES]).toEqual(
        'mockSerializedNodeStates')
    })

    it('handles nested wireStates', () => {
      const graph = genBasicGraph()
      graph.serializeWireStates = () => 'mockSerializedWireStates'
      const serializedState = graph.getSerializedState()
      expect(serializedState[graph.SYMBOLS.WIRE_STATES]).toEqual(
        'mockSerializedWireStates')
    })
  })

  describe('serializeNodeStates', () => {
    it('serializes nodeStates', () => {
      const graph = genBasicGraph()
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
    it('serializes wireStates', () => {
      const graph = genBasicGraph()
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

  describe('Graph.fromSerializedSpec', () => {
    it('creates expected graph', async () => {
      const orig = genBasicGraph()
      const serializedSpec = orig.getSerializedSpec()
      const hydrated = await Graph.fromSerializedSpec(serializedSpec)
      expect(hydrated.id).toEqual(orig.id)
    })
  })

  describe('getSerialization', () => {
    it('returns expected serialization', () => {
      const graph = genBasicGraph()
      const mocks = {}
      for (let fnName of ['getSerializedSpec', 'getSerializedState']) {
        const mockFn = () => 'mockReturn:' + fnName
        mocks[fnName] = mockFn
        graph[fnName] = mockFn
      }
      const expectedSerialization = {
        serializedSpec: mocks.getSerializedSpec(),
        serializedState: mocks.getSerializedState(),
      }
      const actualSerialization = graph.getSerialization()
      expect(actualSerialization).toEqual(expectedSerialization)
    })
  })

  describe('Graph.fromSerialization', () => {
    it('can create graph from serialization', async () => {
      const orig = genBasicGraph()
      const serialization = orig.getSerialization()
      const hydrated = await Graph.fromSerialization({serialization})
      expect(hydrated.id).toEqual(orig.id)
    })
  })
})
