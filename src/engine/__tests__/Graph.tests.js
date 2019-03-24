import _ from 'lodash'
import Graph from '../Graph.js'
import Node from '../Node.js'

describe('Graph', () => {

  beforeEach(() => {
    jest.useFakeTimers()
  })

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
    it('sets node state from store', () => {
      const nodeId = 'node1'
      const graph = new Graph()
      const someState = graph.store.getOrCreate({key: nodeId})
      someState.set('foo', 'bar')
      graph.store.set({key: nodeId, value: someState})
      const node = graph.addNodeFromSpec({nodeSpec: {id: nodeId}})
      expect(node.state).toEqual(someState)
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

  describe('Graph.fromSpec', () => {
    it.skip('creates expected graph', () => {
      this.fail('flesh this out eventually')
    })
  })
})
