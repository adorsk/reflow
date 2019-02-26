import _ from 'lodash'
import { observable } from 'mobx'
import signals from 'signals'

import { stringToHashCode } from '../utils/index.js'
import Packet from './Packet.js'

const STATE_DISPOSER_KEY = Symbol('state_disposer_key')
const PACKETS_KEY = 'PACKETS'

class Port {
  constructor (opts = {}) {
    this.id = opts.id
    this.behaviors = opts.behaviors || {}
    this.ctx = opts.ctx
    this.changed = new signals.Signal()
    this.initialValues = opts.initialValues
    this.setNode(opts.node)
    this.setState(opts.state || new Map())
    this.ioType = opts.ioType
    this.wires = []
    this.init()
  }

  init() {
    if (_.isUndefined(this.state.get('initialized'))) {
      this.packets = observable([], {deep: false})
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
    if (this[STATE_DISPOSER_KEY]) { this[STATE_DISPOSER_KEY]() }
    state = (state.observe) ? state : observable(state)
    this[STATE_DISPOSER_KEY] = state.observe(this.changed.dispatch)
    this.state = state
  }

  get packets () { return this.state.get(PACKETS_KEY) || [] }
  set packets (packets_) { this.state.set(PACKETS_KEY, packets_) }

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

  shiftPacket (packet) {
    return this.packets.shift()
  }

  quench () { this.state.set('hot', false) }
  isHot () { return this.state.get('hot') }

  addWire ({wire}) {
    this.wires.push(wire)
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
