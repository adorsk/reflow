import _ from 'lodash'
import { observable } from 'mobx'
import signals from 'signals'

const DISPOSER_KEY = Symbol('disposer_key')
const VALUES_KEY = 'VALUES'

export class Wire {
  static TERMINALS_SEPARATOR = '->'

  static NODE_PORT_SEPARATOR = ':'

  constructor (opts = {}) {
    this.id = opts.id
    this.src = opts.src
    this.dest = opts.dest
    this.behaviors = {
      drain: 'drain',
      ...opts.behaviors,
    }
    this.changed = new signals.Signal()
    this.setState(opts.state || new Map())
  }

  init() {
    if (_.isUndefined(this.state.get('initialized'))) {
      this.values = observable([], {deep: false})
      this.state.set('initialized', true)
    }
  }

  get values () { return this.state.get(VALUES_KEY) || [] }
  set values (values_) { this.state.set(VALUES_KEY, values_) }

  setState (state) {
    if (this[DISPOSER_KEY]) { this[DISPOSER_KEY]() } // unbind prev state
    state = (state.observe) ? state : observable.map(state)
    this[DISPOSER_KEY] = state.observe(() => {
      this.changed.dispatch({type: 'state'})
    })
    this.state = state
  }

  isHot () { return this.state.get('hot') }

  pushValue (value) {
    this.values.push(value)
    this.state.set('hot', true)
  }

  shiftValue (value) {
    return this.values.shift()
  }

  hasValues () { return this.values.length > 0 }

  quench () { this.state.set('hot', false) }

  unmount () {
    this.changed.removeAll()
  }

  static fromSpec ({wireSpec = {}, nodes = {}} = {}) {
    if (_.isString(wireSpec)) {
      const [srcSpec, destSpec] = wireSpec.split(
        new RegExp(`\\s*${Wire.TERMINALS_SEPARATOR}\\s*`))
      wireSpec = {src: srcSpec, dest: destSpec}
    }
    const terminals = {}
    for (let srcDest of ['src', 'dest']) {
      let terminalSpec = wireSpec[srcDest]
      if (_.isString(terminalSpec)) {
        const [nodeId, portId] = terminalSpec.split(Wire.NODE_PORT_SEPARATOR)
        terminalSpec = {nodeId, portId}
      }
      const node = terminalSpec.node || nodes[terminalSpec.nodeId]
      const port = (terminalSpec.port || node.getPort({
        ioType: ((srcDest === 'src') ? 'outputs' : 'inputs'),
        portId: terminalSpec.portId,
      }))
      terminals[srcDest] = {node, port}
    }
    const wire = new Wire({
      id: Wire.idFromTerminals({terminals}),
      ...terminals,
      behaviors: wireSpec.behaviors,
    })
    return wire
  }

  static idFromTerminals ({terminals}) {
    return ['src', 'dest'].map((srcDest) => {
      const term = terminals[srcDest]
      return [term.node.id, term.port.id].join(Wire.NODE_PORT_SEPARATOR)
    }).join(` ${Wire.TERMINALS_SEPARATOR} `)
  }
}

export default Wire
