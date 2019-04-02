import _ from 'lodash'

import Graph from '../Graph.js'
import Node from '../Node.js'

describe('Graph', () => {

  beforeEach(() => {
    jest.useFakeTimers()
  })

  const genBasicGraph = () => {
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
      srcCode: 'node2.srcCode',
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

  describe('toSpec', () => {
    it('derives expected nodeSpecs', () => {
      const graph = new Graph()
      graph.addNodeFromSpec({nodeSpec: {
        id: 'node1',
        srcCode: 'node1.srcCode',
      }})
      graph.addNodeFromSpec({nodeSpec: {
        id: 'node2',
        srcCode: 'node2.srcCode',
      }})
      const graphSpec = graph.toSpec()
      const expectedGraphSpec = {
        wireSpecs: {},
        nodeSpecs: {
          'node1': 'node1.srcCode',
          'node2': 'node2.srcCode',
        }
      }
      expect(graphSpec).toEqual(expectedGraphSpec)
    })

    it('derives expected wireSpecs', () => {
      const graph = new Graph()
      graph.addNodeFromSpec({nodeSpec: {
        id: 'node1',
        srcCode: 'node1.srcCode',
        portSpecs: {
          outputs: {
            'out1': {},
          }
        },
      }})
      graph.addNodeFromSpec({nodeSpec: {
        id: 'node2',
        srcCode: 'node2.srcCode',
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
      const graphSpec = graph.toSpec()
      const expectedGraphSpec = {
        wireSpecs: {
          'wire1': 'wire1.srcCode',
        },
        nodeSpecs: {
          'node1': 'node1.srcCode',
          'node2': 'node2.srcCode',
        }
      }
      expect(graphSpec).toEqual(expectedGraphSpec)
    })
  })

  describe('Graph.fromSpec', () => {
    it.skip('creates expected graph', () => {
      this.fail('flesh this out eventually')
    })
  })

  describe('serializeState', () => {
    it('copies values for all normal keys', () => {
      const graph = genBasicGraph()
      graph.state.set('pie', 'cherry')
      graph.state.set('animal', 'stoat')
      const serializedState = graph.serializeState()
      expect(serializedState['pie']).toEqual('cherry')
      expect(serializedState['animal']).toEqual('stoat')
    })

    it('handles nested nodeStates', () => {
      const graph = genBasicGraph()
      graph.serializeNodeStates = () => 'mockSerializedNodeStates'
      const serializedState = graph.serializeState()
      expect(serializedState[graph.SYMBOLS.NODE_STATES]).toEqual(
        'mockSerializedNodeStates')
    })

    it('handles nested wireStates', () => {
      const graph = genBasicGraph()
      graph.serializeWireStates = () => 'mockSerializedWireStates'
      const serializedState = graph.serializeState()
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
        node.serializeState = () => mockSerializedNodeState
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
        wire.serializeState = () => mockSerializedWireState
        expectedSerializedWireStates[wire.id] = mockSerializedWireState
      }
      const actualSerializedWireStates = graph.serializeWireStates()
      expect(actualSerializedWireStates).toEqual(expectedSerializedWireStates)
    })
  })
})
