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
  
  describe('pushValues', () => {
    it('pushes to port.values', () => {
      const port = new Port()
      expect(port.values).toEqual([])
      const values = ['mork', 'kloof']
      port.pushValues(values)
      expect(port.values).toEqual(values)
    })

    it('pushes to port.hotValues by default', () => {
      const port = new Port()
      expect(port.values).toEqual([])
      const values = ['mork', 'kloof']
      port.pushValues(values)
      expect(port.hotValues).toEqual(values)
    })
  })

  describe('getMostRecentValue', () => {
    it('gets most recent value', () => {
      const port = new Port()
      port.pushValues(['v1'])
      port.pushValues(['v2'])
      expect(port.getMostRecentValue()).toEqual('v2')
    })
  })
})
