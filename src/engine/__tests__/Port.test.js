import Port from '../Port.js'


describe('Port', () => {

  const genBasicPort = () => {
    const port = new Port()
    return port
  }

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

  describe('getSerializedState', () => {
    it('copies values for all normal keys', () => {
      const port = genBasicPort()
      port.state.set('pie', 'cherry')
      port.state.set('animal', 'stoat')
      const serializedState = port.getSerializedState()
      expect(serializedState['pie']).toEqual('cherry')
      expect(serializedState['animal']).toEqual('stoat')
    })

    it('handles nested packets', () => {
      const port = genBasicPort()
      port.serializePackets = () => 'mockSerializedPackets'
      const serializedState = port.getSerializedState()
      expect(serializedState[port.SYMBOLS.PACKETS]).toEqual(
        'mockSerializedPackets')
    })
  })

  describe('serializePackets', () => {
    it('serializes packets', () => {
      const port = genBasicPort()
      const expectedSerializedPackets = []
      for (let i = 0; i < 3; i++) {
        const mockSerializedPacket = 'mockSerializedPacket:' + i
        port.pushPacket({serialize: () => mockSerializedPacket})
        expectedSerializedPackets.push(mockSerializedPacket)
      }
      const actualSerializedPackets = port.serializePackets()
      expect(actualSerializedPackets).toEqual(expectedSerializedPackets)
    })
  })
})
