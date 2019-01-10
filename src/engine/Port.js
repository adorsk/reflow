import _ from 'lodash'

import Deque from './utils/deque.js'

class Port {
  constructor (opts) {
    this.id = opts.id
    this.values = new Deque()
    this.listeners = {}
  }

  pushValue (value) {
    this.values.push(value)
    this.dispatchEvent({type: 'push', data: value})
  }

  shiftValue () {
    this.dispatchEvent({type: 'shift', data: this.values.shift()})
  }

  registerListener ({key, listener} = {}) {
    this.listeners[key] = listener
  }

  dispatchEvent (event) {
    _.each(this.listeners, (listener, key) => {
      listener(event)
    })
  }
  
}

export default Port
