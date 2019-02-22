import Node from '../Node.js'
import Port from '../Port.js'


describe('Node', () => {

  beforeEach(() => {
    jest.useFakeTimers()
  })

  describe('constructor', () => {
    it('creates a node', () => {
      const node = new Node()
      expect(node).toBeDefined()
    })

    it('sets default state to an observable map', () => {
      const node = new Node()
      expect(node.state.observe).toBeDefined()
    })
  })

  describe('setState', () => {
    it('sets up state observer', () => {
      const node = new Node()
      let changeCounter = 0
      node.changed.add(() => changeCounter++)
      const state = new Map()
      node.setState(state)
      expect(changeCounter).toEqual(0)
      node.state.set('foo', 'bar')
      expect(changeCounter).toEqual(1)
    })
  })

  describe('addPort', () => {
    describe('addInputPort', () => {
      it('adds listener for port.pushed event', () => {
        const node = new Node()
        let changeCounter = 0
        node.changed.add(() => changeCounter++)
        expect(changeCounter).toEqual(0)
        const port = new Port()
        node.addPort({port, ioType: 'inputs'})
        port.pushValue('someValue')
        expect(changeCounter).toEqual(1)
      })
    })
  })

  describe('getPort', () => {
    it('returns expected ports', () => {
      const node = new Node()
      const inPort = new Port({id: 'in'})
      const outPort = new Port({id: 'out'})
      node.addPort({port: inPort, ioType: 'inputs'})
      node.addPort({port: outPort, ioType: 'outputs'})
      expect(node.getPort('inputs:in')).toBe(inPort)
      expect(node.getPort('outputs:out')).toBe(outPort)
    })
  })
})
