import _ from 'lodash'
import { observable } from 'mobx'
import signals from 'signals'

import { stringToHashCode } from '../utils/index.js'

const STATE_DISPOSER_KEY = Symbol('state_disposer_key')
const VALUES_KEY = 'VALUES'

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
      this.values = observable([], {deep: false})
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

  get values () { return this.state.get(VALUES_KEY) || [] }
  set values (values_) { this.state.set(VALUES_KEY, values_) }

  pushValue (value) {
    this.values.push(value)
    this.state.set('hot', true)
  }

  quench () { this.state.set('hot', false) }
  isHot () { return this.state.get('hot') }

  addWire ({wire}) {
    this.wires.push(wire)
  }

  get mostRecentValue () {
    return ((this.values.length > 0) ? this.values[this.values.length - 1] : undefined)
  }

  unmount () {
    this.changed.removeAll()
  }
}

export default Port
