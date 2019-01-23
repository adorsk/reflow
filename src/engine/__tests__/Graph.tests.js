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
