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

  describe('fromSpec', () => {
    it('creates a wire', () => {
      const mockPorts = {
        port1: {id: 'port1'},
        port2: {id: 'port2'},
      }
      const mockNodes = {
        src: { id: 'src', getPort: () => mockPorts.port1 },
        dest: { id: 'dest', getPort: () => mockPorts.port2 },
      }
      const wire = Wire.fromSpec({
        wireSpec: 'src:port1 -> dest:port2',
        nodes: mockNodes,
      })
      expect(wire.src.node).toBe(mockNodes.src)
      expect(wire.src.port).toBe(mockNodes.src.getPort('outputs:port1'))
      expect(wire.dest.node).toBe(mockNodes.dest)
      expect(wire.dest.port).toBe(mockNodes.dest.getPort('inputs:port2'))
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

  describe('getSerializedSpec', () => {
    it('uses ctx.getSerializedSpec if present', () => {
      const wire = genBasicWire()
      wire.ctx.getSerializedSpec = () => 'mockSpec'
      expect(wire.getSerializedSpec()).toEqual('mockSpec')
    })

    it('uses specFactoryFn if no ctx.getSerializedSpec', () => {
      const wire = genBasicWire()
      wire.specFactoryFn = 'mockSpec'
      const expectedSerializedSpec = { specFactoryFn: wire.specFactoryFn }
      expect(wire.getSerializedSpec()).toEqual(expectedSerializedSpec)
    })
  })
})
