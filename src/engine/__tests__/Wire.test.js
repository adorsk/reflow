import Wire from '../Wire.js'

describe('Wire', () => {

  const genBasicWire = () => {
    const wire = new Wire()
    return wire
  }

  describe('constructor', () => {
    it('creates a wire', () => {
      const wire = new Wire()
      expect(wire).toBeDefined()
    })
  })

  describe('getSerializedState', () => {
    it('copies values for all normal keys', () => {
      const wire = genBasicWire()
      wire.state.set('pie', 'cherry')
      wire.state.set('animal', 'stoat')
      const serializedState = wire.getSerializedState()
      expect(serializedState['pie']).toEqual('cherry')
      expect(serializedState['animal']).toEqual('stoat')
    })

    it('handles nested packets', () => {
      const wire = genBasicWire()
      wire.serializePackets = () => 'mockSerializedPackets'
      const serializedState = wire.getSerializedState()
      expect(serializedState[wire.SYMBOLS.PACKETS]).toEqual(
        'mockSerializedPackets')
    })
  })

  describe('serializePackets', () => {
    it('serializes packets', () => {
      const wire = genBasicWire()
      const expectedSerializedPackets = []
      for (let i = 0; i < 3; i++) {
        const mockSerializedPacket = 'mockSerializedPacket:' + i
        wire.pushPacket({serialize: () => mockSerializedPacket})
        expectedSerializedPackets.push(mockSerializedPacket)
      }
      const actualSerializedPackets = wire.serializePackets()
      expect(actualSerializedPackets).toEqual(expectedSerializedPackets)
    })
  })
})
