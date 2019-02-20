import _ from 'lodash'
import { observable } from 'mobx'
import signals from 'signals'

import { stringToHashCode } from '../utils/index.js'

const STATE_DISPOSER_KEY = Symbol('state_disposer_key')
const VALUES_KEY = 'VALUES'

class Port {

  constructor (opts = {}) {
    this.id = opts.id
    this.node = opts.node
    this.behaviors = opts.behaviors || {}
    this.ctx = opts.ctx
    this.changed = new signals.Signal()
    this.setNode(opts.node)
    this.setState(opts.state || new Map())
    this.hotValues = []
    this.ioType = opts.ioType
    this.wires = {}

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

  get values () { return this.state.get(VALUES_KEY) || [] }
  set values (values_) { this.state.set(VALUES_KEY, values_) }

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

  pushValues (values, opts = {}) {
    opts = {hot: true, noSignals: false, ...opts}
    this.values.push(...values)
    if (opts.hot) {
      this.hotValues.push(...values)
    }
    if (!opts.noSignals) {
      this.changed.dispatch({type: 'push'})
    }
  }

  shiftValue (opts = {}) {
    opts = {noSignals: false, ...opts}
    const value = this.values.shift()
    if (!opts.noSignals) {
      this.changed.dispatch({type: 'shift'})
    }
    return value
  }

  popValue (opts = {}) {
    opts = {noSignals: false, ...opts}
    const value = this.values.pop()
    if (!opts.noSignals) {
      this.changed.dispatch({type: 'pop'})
    }
    return value
  }

  quenchHotValues () {
    this.hotValues = []
  }

  getMostRecentValue () {
    return this.values[this.values.length - 1]
  }

  get mostRecentValue () {
    return this.getMostRecentValue()
  }

  hasHotValues () {
    return (this.hotValues.length > 0)
  }

  unmount () {
    this.changed.removeAll()
  }

  addWire ({wire}) {
    this.wires[wire.id] = wire
  }
}

export default Port
