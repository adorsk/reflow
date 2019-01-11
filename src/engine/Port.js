import _ from 'lodash'
import Deque from '../utils/deque.js'

class Port {
  constructor (opts = {}) {
    this.id = opts.id
    this.values = new Deque()
    this.listeners = []
  }

  pushValue (value) {
    this.values.push(value)
    this.dispatchEvent({type: 'push', data: value})
  }

  shiftValue () {
    this.dispatchEvent({type: 'shift', data: this.values.shift()})
  }

  addListener ({key, listener} = {}) {
    this.listeners.push({key, fn: listener})
  }

  removeListener ({key, listener} = {}) {
    this.listeners = _.filter(this.listeners, {key})
  }

  dispatchEvent (event) {
    for (let listener of this.listeners) {
      listener.fn(event)
    }
  }
}

export default Port
