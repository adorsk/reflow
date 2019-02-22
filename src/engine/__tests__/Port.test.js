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
})
