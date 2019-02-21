import Port from '../Port.js'


describe('Port', () => {
  describe('constructor', () => {
    it('creates a port', () => {
      const port = new Port()
      expect(port).toBeDefined()
    })
    it('sets default state to an observable', () => {
      const port = new Port()
      expect(port.state.observe).toBeDefined()
    })
  })

  describe('setState', () => {
    it('sets up observer', () => {
      const port = new Port()
      let changeCounter = 0
      port.changed.add(() => changeCounter++)
      const state = new Map()
      port.setState(state)
      expect(changeCounter).toEqual(0)
      port.state.set('foo', 'bar')
      expect(changeCounter).toEqual(1)
    })
  })
  
  describe.only('onPushOutputValue', () => {
    const wireFactory = ({drainBehavior}) => {
      const values = []
      return {
        behaviors: { drain: drainBehavior },
        values,
        pushValue: values.push.bind(values),
      }
    }

    let port
    beforeEach(() => {
      port = new Port({ioType: 'outputs'})
    })

    it('pushes to wires that come after debouncedDrain wires', () => {
      const debounceWire = wireFactory({drainBehavior: 'debouncedDrain'})
      const copyWire = wireFactory({drainBehavior: 'copy'})
      port.addWire({wire: debounceWire})
      port.addWire({wire: copyWire})
      port.onPushOutputValue(1)
      expect(debounceWire.values).toEqual([1])
      expect(copyWire.values).toEqual([1])
    })
    it('does not push to wires after a drain wire', () => {
      const drainWire = wireFactory({drainBehavior: 'drain'})
      const copyWire = wireFactory({drainBehavior: 'copy'})
      port.addWire({wire: drainWire})
      port.addWire({wire: copyWire})
      port.onPushOutputValue(1)
      expect(drainWire.values).toEqual([1])
      expect(copyWire.values).toEqual([])
    })
    it('only adds to value queue if there was no drain', () => {
      port.onPushOutputValue(1)
      expect(port.values).toEqual([1])
      port.addWire({wire: wireFactory({drainBehavior: 'copy'})})
      port.onPushOutputValue(2)
      expect(port.values).toEqual([1, 2])
      port.addWire({wire: wireFactory({drainBehavior: 'debouncedDrain'})})
      port.onPushOutputValue(3)
      expect(port.values).toEqual([1, 2])
      port.addWire({wire: wireFactory({drainBehavior: 'drain'})})
      port.onPushOutputValue(4)
      expect(port.values).toEqual([1, 2])
    })
  })

  describe('onConnect', () => {
    it('pushes values to wire', () => {
      this.fail()
    })

    it('drains value queue only for draining wires', () => {
      this.fail()
    })
  })

})
