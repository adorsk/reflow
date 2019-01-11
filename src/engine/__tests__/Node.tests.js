import Node from '../Node.js'


describe('Node', () => {

  beforeEach(() => {
    jest.useFakeTimers()
  })

  describe('onChange', () => {
    it('ticks if inputs changed', () => {
      const node = Node.fromSpec({
        ports: {
          inputs: {
            'in': {}
          }
        }
      })
      expect(node.tickCount).toBe(0)
      node.getPort({ioType: 'inputs', portId: 'in'}).pushValue('foo')
      jest.runAllTimers()
      expect(node.tickCount).toBe(1)
    })

    it('ticks if tickFn has changed', () => {
      const node = Node.fromSpec({tickFn: () => null})
      expect(node.tickCount).toBe(0)
      node.setTickFn({tickFn: () => null})
      jest.runAllTimers()
      expect(node.tickCount).toBe(1)
    })

    it('ticks if state has changed', () => {
      const node = Node.fromSpec({})
      expect(node.tickCount).toBe(0)
      node.updateState({foo: 'bar'})
      jest.runAllTimers()
      expect(node.tickCount).toBe(1)
    })

    it('does not tick if only outputs have changed', () => {
      const node = Node.fromSpec({
        ports: {
          outputs: {
            'out': {}
          }
        }
      })
      expect(node.tickCount).toBe(0)
      node.getPort({ioType: 'outputs', portId: 'out'}).pushValue('foo')
      jest.runAllTimers()
      expect(node.tickCount).toBe(0)
    })
  })
})
