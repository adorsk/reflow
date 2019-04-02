import Packet from '../Packet.js'

describe('Packet', () => {

  const genDataPacket = ({data = 'someData', ctx} = {}) => {
    const packet = Packet.createDataPacket({data, ctx})
    return packet
  }

  describe('serialize', () => {
    it('serializes timestamp', () => {
      const packet = genDataPacket()
      expect(packet.serialize().timestamp).toEqual(packet.timestamp)
    })

    it('serializes type', () => {
      const packet = genDataPacket()
      expect(packet.serialize().type).toEqual(packet.type)
    })

    it('serializes ctx', () => {
      const packet = genDataPacket({
        ctx: {
          serializeCtx: ({packet}) => {
            return 'mockSerializedCtx:' + packet.timestamp
          }
        }
      })
      expect(packet.serialize().ctx).toEqual(
        'mockSerializedCtx:' + packet.timestamp)
    })
  })

  describe('DataPacket.serialize', () => {
    it('serializes data as-is if no ctx.serializeData fn', () => {
      const packet = genDataPacket()
      expect(packet.serialize().data).toEqual(packet.data)
    })

    it('serializes data per ctx.serializeData fn if provided', () => {
      const packet = genDataPacket({
        ctx: {
          serializeData: ({packet}) => {
            return 'mockSerializedData:' + packet.timestamp
          }
        }
      })
      expect(packet.serialize().data).toEqual(
        'mockSerializedData:' + packet.timestamp)
    })
  })
})
