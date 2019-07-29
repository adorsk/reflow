import _ from 'lodash'
import { observable } from 'mobx'
import signals from 'signals'

import { stringToHashCode } from '../utils/index.js'
import Packet from './Packet.js'

const SYMBOLS = {
  DISPOSER: Symbol('DISPOSER'),
  PACKETS: ':PACKETS:',
}


class Port {

  static IO_TYPES = {
    INPUTS: 'inputs',
    OUTPUTS: 'outputs',
  }

  constructor (opts = {}) {
    this.SYMBOLS = SYMBOLS
    this.key = opts.key
    this.id = opts.id || _.uniqueId('port-')
    this.label = opts.key || this.id
    this.behaviors = opts.behaviors || {}
    this.changed = new signals.Signal()
    this.initialValues = opts.initialValues
    this.setNode(opts.node)
    this.setState(opts.state || new Map())
    this.ioType = opts.ioType
    this.ctx = opts.ctx || {}
  }

  init () {
    if (_.isUndefined(this.state.get('initialized'))) {
      for (let value of (this.initialValues || [])) {
        this.pushValue(value)
      }
      this.state.set('initialized', true)
    }

    if (this.behaviors.constant) {
      const stateKey = 'constant:hash'
      const { valueFn } = this.behaviors.constant
      const prevHash = this.state.get(stateKey)
      const currentHash = stringToHashCode(valueFn.toString())
      if (currentHash !== prevHash) {
        this.state.set(stateKey, currentHash)
        this.pushValue(valueFn())
      }
    }
  }

  setNode (node) {
    this.node = node
  }

  setState (state) {
    // unbind prev state
    if (this[this.SYMBOLS.DISPOSER]) { this[this.SYMBOLS.DISPOSER]() }
    state = (state.observe) ? state : observable(state)
    if (! state.has(this.SYMBOLS.PACKETS)) {
      state.set(this.SYMBOLS.PACKETS, observable([], {deep: false}))
    }
    this[this.SYMBOLS.DISPOSER] = state.observe(this.changed.dispatch)
    this.state = state
  }

  clearState () {
    this.setState(new Map())
  }

  loadState (nextState) {
    this.clearState()
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

  get packets () { return this.state.get(this.SYMBOLS.PACKETS) || [] }

  pushPacket (packet) {
    this.packets.push(packet)
    this.state.set('hot', true)
  }

  pushValue (value) {
    this.pushPacket(new Packet({type: Packet.Types.DATA, data: value}))
  }

  pushOpenBracket () {
    this.pushPacket(new Packet({type: Packet.Types.OPEN}))
  }

  pushCloseBracket () {
    this.pushPacket(new Packet({type: Packet.Types.CLOSE}))
  }

  hasPackets () { return this.packets.length > 0 }

  shiftPacket (packet) {
    return this.packets.shift()
  }

  shiftValue (packet) {
    return this.shiftPacket().data
  }

  quench () { this.state.set('hot', false) }
  isHot () { return this.state.get('hot') }

  get wires () {
    return this.node.getWiresForPort({port: this})
  }

  get mostRecentPacket () {
    return ((this.packets.length > 0) ? this.packets[this.packets.length - 1] : undefined)
  }

  get mostRecentValue () {
    const packet = this.mostRecentPacket
    if (packet && (packet.type === Packet.Types.DATA)) { return packet.data }
    return undefined
  }

  unmount () {
    this.changed.removeAll()
  }
}

export default Port
