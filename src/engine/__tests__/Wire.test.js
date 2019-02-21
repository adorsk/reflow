import Wire from '../Wire.js'

describe('Wire', () => {
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

  describe('pushValue', () => {
    it('pushes value to queue', () => {
      this.fail()
    })

    it('sets hot flag', () => {
      this.fail()
    })
  })

  describe('quench', () => {
    it('unsets hot flag', () => {
      this.fail()
    })
  })

  describe('onConnect', () => {
    it('copies or drains from src to dest', () => {
      this.fail()
    })
  })
})
