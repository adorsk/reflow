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
}

Packet.Types = {
  DATA: Symbol('DATA'),
  OPEN: Symbol('OPEN'),
  CLOSE: Symbol('OPEN'),
}

export default Packet
