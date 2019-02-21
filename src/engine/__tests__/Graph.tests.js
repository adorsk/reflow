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

  describe('addWire', () => {
    it('calls onConnect', () => {
      this.fail()
    })
  })
})
