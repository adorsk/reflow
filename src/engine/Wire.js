import _ from 'lodash'
import { observable } from 'mobx'
import signals from 'signals'

const DISPOSER_KEY = Symbol('disposer_key')
const PACKETS_KEY = 'PACKETS'

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
      this.packets = observable([], {deep: false})
      this.state.set('initialized', true)
    }
  }

  get packets () { return this.state.get(PACKETS_KEY) || [] }
  set packets (packets_) { this.state.set(PACKETS_KEY, packets_) }

  setState (state) {
    if (this[DISPOSER_KEY]) { this[DISPOSER_KEY]() } // unbind prev state
    state = (state.observe) ? state : observable.map(state)
    this[DISPOSER_KEY] = state.observe(() => {
      this.changed.dispatch({type: 'state'})
    })
    this.state = state
  }

  isHot () { return this.state.get('hot') }

  pushPacket (packet) {
    if (this.behaviors.transform) {
      packet = this.behaviors.transform({wire: this, packet})
    }
    this.packets.push(packet)
    this.state.set('hot', true)
  }

  shiftPacket (packet) {
    return this.packets.shift()
  }

  hasPackets () { return this.packets.length > 0 }

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
