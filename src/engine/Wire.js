import _ from 'lodash'
import { observable } from 'mobx'
import signals from 'signals'

import Packet from './Packet.js'

const SYMBOLS = {
  DISPOSER: Symbol('DISPOSER'),
  PACKETS: ':PACKETS:',
}

export class Wire {
  static TERMINALS_SEPARATOR = '->'

  static NODE_PORT_SEPARATOR = ':'

  constructor (opts = {}) {
    this.SYMBOLS = SYMBOLS
    this.ctx = opts.ctx || {}
    this.id = opts.id
    this.builderFn = opts.builderFn
    this.srcCode = opts.srcCode || _.get(this.builderFn, 'srcCode')
    this.src = opts.src
    this.dest = opts.dest
    this.srcCode = opts.srcCode
    this.behaviors = {
      drain: 'debouncedDrain',
      ...opts.behaviors,
    }
    this.changed = new signals.Signal()
    this.setState(opts.state || new Map())
  }

  init() {
    if (_.isUndefined(this.state.get('initialized'))) {
      this.state.set('initialized', true)
    }
  }

  get packets () { return this.state.get(this.SYMBOLS.PACKETS) || [] }

  setState (state) {
    if (this[this.SYMBOLS.DISPOSER]) { this[this.SYMBOLS.DISPOSER]() } // unbind prev state
    state = (state.observe) ? state : observable.map(state)
    if (! state.has(this.SYMBOLS.PACKETS)) {
      state.set(this.SYMBOLS.PACKETS, observable([], {deep: false}))
    }
    this[this.SYMBOLS.DISPOSER] = state.observe(() => {
      this.changed.dispatch({type: 'state'})
    })
    this.state = state
  }

  clearState () {
    this.state.clear()
  }

  loadState (nextState) {
    this.state.clear()
    for (let key of nextState.keys()) {
      const value = nextState.get(key)
      this.state.set(key, value)
    }
  }

  getSerializedState () {
    const serializedState = {}
    for (let key of this.state.keys()) {
      let serializedValue
      if (key === this.SYMBOLS.PACKETS) {
        serializedValue = this.serializePackets()
      } else {
        serializedValue = this.state.get(key)
      }
      serializedState[key] = serializedValue
    }
    return serializedState
  }

  serializePackets () {
    const serializedPackets = this.packets.map((packet) => packet.serialize())
    return serializedPackets
  }

  deserializeState (serializedState) {
    const state = new Map()
    for (let key of Object.keys(serializedState)) {
      const serializedValue = serializedState[key]
      if (key === this.SYMBOLS.PACKETS) {
        const packets = []
        const serializedPackets = serializedValue
        for (let serializedPacket of serializedPackets) {
          packets.push(Packet.fromSerializedPacket({serializedPacket}))
        }
        state.set(this.SYMBOLS.PACKETS, packets)
      } else {
        state.set(key, serializedValue)
      }
    }
    return state
  }

  isHot () { return this.state.get('hot') }

  pushPacket (packet) {
    if (this.behaviors.transform) {
      packet = this.behaviors.transform({wire: this, packet})
    }
    this.packets.push(packet)
    this.state.set('hot', true)
  }

  shiftPacket (packet) {
    return this.packets.shift()
  }

  hasPackets () { return this.packets.length > 0 }

  quench () { this.state.set('hot', false) }

  unmount () {
    this.changed.removeAll()
  }

  getSpec () {
    const spec = {
      id: this.id,
      builderFn: this.builderFn,
    }
    return spec
  }
}


Wire.fromSpec = async (spec) => {
  const { id, builderFn } = spec
  const wire = new Wire({id})
  wire.builderFn = builderFn
  await builderFn(wire)
  return wire
}

export default Wire
