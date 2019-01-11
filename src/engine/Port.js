import Deque from '../utils/deque.js'

class Port {
  constructor (opts = {}) {
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
    for (let listener of Object.values(this.listeners)) {
      listener(event)
    }
  }
}

export default Port
