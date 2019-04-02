import _ from 'lodash'


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

  serialize () {
    const serializedPacket = {
      timestamp: this.timestamp,
      type: this.type,
    }
    if (this.ctx) { serializedPacket.ctx = this.serializeCtx() }
    if (this.isData()) { serializedPacket.data = this.serializeData() }
    return serializedPacket
  }

  serializeCtx () {
    const serializeCtxFn = _.get(this, ['ctx', 'serializeCtx'])
    const serializedCtx = (
      (serializeCtxFn) ? serializeCtxFn({packet: this}) : this.ctx
    )
    return serializedCtx
  }

  serializeData () {
    const serializeDataFn = _.get(this, ['ctx', 'serializeData'])
    const serializedData = (
      (serializeDataFn) ? serializeDataFn({packet: this}) : this.data
    )
    return serializedData
  }
}

Packet.Types = {
  DATA: Symbol('DATA'),
  OPEN: Symbol('OPEN'),
  CLOSE: Symbol('OPEN'),
}

Packet.createDataPacket = ({data, ctx}) => {
  return new Packet({type: Packet.Types.DATA, data, ctx})
}

Packet.fromSerializedPacket = ({serializedPacket}) => {
  return new Packet({...serializedPacket})
}

export default Packet
