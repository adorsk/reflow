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

  describe('addNode', () => {
    it('sets node state from store', () => {
      const graph = new Graph()
      const node = new Node({id: 'node1'})
      const someState = graph.store.getOrCreate({key: node.id})
      someState.set('foo', 'bar')
      graph.store.set({key: node.id, value: someState})
      expect(node.state).not.toEqual(someState)
      graph.addNode(node)
      expect(node.state).toEqual(someState)
    })

    it('sets node port states from store', () => {
      const graph = new Graph()
      const node = Node.fromSpec({
        id: 'node1',
        ports: {
          inputs: {
            'in1': {},
          },
          outputs: {
            'out1': {},
          },

        }
      })
      const inPort = node.ports.inputs.in1
      const outPort = node.ports.outputs.out1
      const inPortState = graph.store.getOrCreate({
        key: [node.id, node.ports.inputs.in1.id].join(':'),
      })
      inPortState.set('foo', 'bar')
      const outPortState = graph.store.getOrCreate({
        key: [node.id, node.ports.outputs.out1.id].join(':'),
      })
      outPortState.set('foo', 'bar')
      expect(inPort.state).not.toEqual(inPortState)
      expect(outPort.state).not.toEqual(outPortState)
      graph.addNode(node)
      expect(inPort.state).toEqual(inPortState)
      expect(outPort.state).toEqual(outPortState)
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

  describe('addWire', () => {
    it('dispatches changed signal by default', () => {
      const g = new Graph()
      let changeCounter = 0
      g.changed.add(() => changeCounter++)
      const wire = {
        src: {nodeId: 'srcNodeId', portId: 'srcPortId'},
        dest: {nodeId: 'destNodeId', portId: 'destPortId'},
      }
      g.addWire(wire)
      expect(changeCounter).toEqual(1)
    })

    it('does not dispatch signal if specified', () => {
      const g = new Graph()
      let changeCounter = 0
      g.changed.add(() => changeCounter++)
      const wire = {
        src: {nodeId: 'srcNodeId', portId: 'srcPortId'},
        dest: {nodeId: 'destNodeId', portId: 'destPortId'},
      }
      g.addWire(wire, {noSignals: true})
      expect(changeCounter).toEqual(0)
    })
  })

  describe('propagateOutputs', () => {
    it('drains src.outputs to dest.inputs for each wire' , () => {
      const g = new Graph()
      const n1 = Node.fromSpec({
        id: 'n1',
        ports: {
          outputs: {
            'out': {}
          }
        },
      })
      const n2 = Node.fromSpec({
        id: 'n2',
        ports: {
          inputs: {
            'in': {}
          },
        },
      })
      g.addNode(n1, {noSignals: true})
      g.addNode(n2, {noSignals: true})
      g.addWire({
        src: {nodeId: n1.id, portId: 'out'},
        dest: {nodeId: n2.id, portId: 'in'},
      })
      const value = 'someValue'
      n1.getOutputPort('out').pushValue(value)
      expect(n2.getInputPort('in').values.toArray()).toEqual([])
      g.propagateOutputs()
      expect(n2.getInputPort('in').values.toArray()).toEqual([value])
    })
  })

  describe('tick', () => {
    it('propagates outputs and ticks nodes', () => {
      const g = new Graph()
      const n1 = Node.fromSpec({
        id: 'n1',
        tickFn: () => null,
        ports: {
          outputs: {
            'out': {}
          }
        },
      })
      const n2 = Node.fromSpec({
        id: 'n2',
        tickFn: () => null,
        ports: {
          inputs: {
            'in': {}
          },
        },
      })
      g.addNode(n1, {noSignals: true})
      g.addNode(n2, {noSignals: true})
      g.addWire(
        {
          src: {nodeId: n1.id, portId: 'out'},
          dest: {nodeId: n2.id, portId: 'in'},
        },
        {noSignals: true}
      )
      const value = 'someValue'
      n1.getOutputPort('out').pushValue(value)
      expect([n1.tickCount, n2.tickCount]).toEqual([0, 0])
      expect(n2.getInputPort('in').values.toArray()).toEqual([])
      g.tick()
      expect([n1.tickCount, n2.tickCount]).toEqual([1, 1])
      expect(n2.getInputPort('in').values.toArray()).toEqual([value])
    })
  })
})
