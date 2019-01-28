import _ from 'lodash'
import { observable } from 'mobx'
import signals from 'signals'


const DISPOSER_KEYS = {
  state: Symbol('state_disposer_key'),
  values: Symbol('values_disposer_key'),
}

class Port {

  constructor (opts = {}) {
    this.id = opts.id
    this.changed = new signals.Signal()
    this.setNode(opts.node)
    this.setState(opts.state || new Map())
    this.setValues(opts.values || new Array())
    this.hotValues = []
    this.ioType = opts.ioType
  }

  setNode (node) {
    this.node = node
  }

  setState (state) {
    // unbind prev state
    if (this[DISPOSER_KEYS.state]) { this[DISPOSER_KEYS.state]() }
    state = (state.observe) ? state : observable(state)
    this[DISPOSER_KEYS.state] = state.observe(this.changed.dispatch)
    this.state = state
  }

  setValues (values) {
    // unbind prev values
    if (this[DISPOSER_KEYS.values]) { this[DISPOSER_KEYS.values]() }
    values = (values.observe) ? values : observable(values)
    this[DISPOSER_KEYS.values] = values.observe(this.changed.dispatch)
    this.values = values
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

  quenchHotValues () {
    this.hotValues = []
  }

  getMostRecentValue () {
    return this.values[this.values.length - 1]
  }

  hasHotValues () {
    return (this.hotValues.length > 0)
  }
}

export default Port
