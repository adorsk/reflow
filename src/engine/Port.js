import { observable } from 'mobx'
import signals from 'signals'


const DISPOSER_KEYS = {
  state: Symbol('state_disposer_key'),
}

class Port {

  constructor (opts = {}) {
    this.id = opts.id
    this.ctx = opts.ctx
    this.initialValues = opts.initialValues || []
    this.changed = new signals.Signal()
    this.setNode(opts.node)
    this.setState(opts.state || new Map())
    this.setValues(opts.values || [])
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
}

export default Port
