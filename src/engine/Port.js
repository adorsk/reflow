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
    this.setNode(opts.node)
    this.setState(opts.state || new Map())
    this.ioType = opts.ioType
    this.wires = []

    if (_.isUndefined(this.state.get('initialized'))) {
      this.values = observable([])
      if (opts.initialValues) { this.pushValues(opts.initialValues) }
      this.state.set('initialized', true)
    }

    if (this.behaviors.constant) {
      const stateKey = 'constant:hash'
      const { valueFn } = this.behaviors.constant
      const prevHash = this.state.get(stateKey)
      const currentHash = stringToHashCode(valueFn.toString())
      if (currentHash !== prevHash) {
        this.state.set(stateKey, currentHash)
        this.pushValues([valueFn()])
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
    this[STATE_DISPOSER_KEY] = state.observe((delta) => {
      this.changed.dispatch()
    })
    this.state = state
  }

  get values () { return this.state.get(VALUES_KEY) || [] }
  set values (values_) { this.state.set(VALUES_KEY, values_) }

  pushValue (value) {
  }

  onPushOutputValue (value) {
    let shouldDrain = false
    const drainingBehaviors = ['drain', 'debouncedDrain']
    for (let wire of this.wires) {
      wire.pushValue(value)
      const drainBehavior = _.get(wire, 'behaviors.drain')
      shouldDrain = drainingBehaviors.includes(drainBehavior)
      if (drainBehavior === 'drain') { break }
    }
    if (!shouldDrain) { this.values.push(value) }
  }

  addWire ({wire}) {
    this.wires.push(wire)
  }

  unmount () {
    this.changed.removeAll()
  }
}

export default Port
