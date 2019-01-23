import _ from 'lodash'
import signals from 'signals'

import Deque from '../utils/deque.js'

class Port {
  constructor (opts = {}) {
    this.id = opts.id
    this.setState(opts.state)
    this.node = opts.node
    this.ioType = opts.ioType
    this.values = new Deque()
    this.listeners = []
    this.changed = new signals.Signal()
  }

  setState (state) {
    this.state = state
  }

  setNode (node) {
    this.node = node
  }

  pushValue (value) {
    this.values.push(value)
    this.changed.dispatch({type: 'push', data: value})
  }

  shiftValue () {
    const value = this.values.shift()
    this.changed.dispatch({type: 'shift', data: value})
    return value
  }

  addListener ({key, listener} = {}) {
    this.listeners.push({key, fn: listener})
  }

  removeListener ({key, listener} = {}) {
    this.listeners = _.filter(this.listeners, {key})
  }
}

export default Port
