export class Packet {
  constructor (opts) {
    this.timestamp = opts.timestamp || this.createTimestamp()
    this.type = opts.type
    this.data = opts.data
    this.ctx = opts.ctx
  }

  createTimestamp () {
    return performance.timeOrigin + performance.now()
  }

  isOpenBracket () { return this.type === Packet.Types.OPEN }
  isCloseBracket () { return this.type === Packet.Types.CLOSE }
  isData () { return this.type === Packet.Types.DATA }
  get value () {
    if (!this.isData() ) {
      throw new Error("cannot get value for non-data packet")
    }
    return this.data
  }
  set value (v) {
    if (!this.isData() ) {
      throw new Error("cannot get value for non-data packet")
    }
    this.data = v
  }

  clone (opts = {}) {
    return new Packet(Object.assign({
      timestamp: this.timestamp,
      type: this.type,
      data: this.data,
      ctx: this.ctx,
    }, opts))
  }
}

Packet.Types = {
  DATA: Symbol('DATA'),
  OPEN: Symbol('OPEN'),
  CLOSE: Symbol('OPEN'),
}

Packet.createDataPacket = ({data}) => {
  return new Packet({type: Packet.Types.DATA, data})
}

export default Packet
