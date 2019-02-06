import _ from 'lodash'
import { observable } from 'mobx'
import signals from 'signals'

import Port from './Port.js'

const DISPOSER_KEY = Symbol('disposer_key')

export class Node {
  constructor (opts = {}) {
    this.id = opts.id || _.uniqueId('node-')
    this.ctx = opts.ctx
    this.changed = new signals.Signal()
    this.tickFn = opts.tickFn
    this.setState(opts.state || new Map())
    this.ports = {
      inputs: {},
      outputs: {},
    }
    for (let ioType of ['inputs', 'outputs']) {
      const portsForIoType = (opts.ports && opts.ports[ioType]) || {}
      _.map(portsForIoType, (port) => {
        this.addPort({port, ioType})
      })
    }
    this.tickCount = 0
    this.versions = {
      inputs: 0,
      outputs: 0,
      state: 0,
      tickFn: 0,
    }
    this.debouncedTick = _.debounce(this.tick.bind(this), 0)
  }

  setState (state) {
    if (this[DISPOSER_KEY]) { this[DISPOSER_KEY]() } // unbind prev state
    state = (state.observe) ? state : observable.map(state)
    this[DISPOSER_KEY] = state.observe(this.changed.dispatch)
    this.state = state
  }

  addPort ({port, ioType}) {
    port.setNode(this)
    this.ports[ioType][port.id] = port
    port.changed.add((evt) => {
      if (evt.type === 'push') {
        this.changed.dispatch({type: ioType})
      }
    })
  }

  tick() {
    if (this.tickFn) {
      this.tickFn({node: this})
    }
    this.setTickCount(this.tickCount + 1)
  }

  setTickCount (count) {
    this.tickCount = count 
  }

  getPort (arg1) {
    let portId, ioType
    if (typeof arg1 === 'string') {
      [ioType, portId] = arg1.split(':')
    } else {
      portId = arg1.portId
      ioType = arg1.ioType
    }
    return this.ports[ioType][portId]
  }

  getPorts () {
    return [
      ...Object.values(this.ports.inputs),
      ...Object.values(this.ports.outputs)
    ] 
  }

  getPortsOfType ({ioType}) {
    return this.ports[ioType]
  }

  getOutputPort (portId) {
    return this.getPort({ioType: 'outputs', portId})
  }

  getInputPort (portId) {
    return this.getPort({ioType: 'inputs', portId})
  }

  getInputPorts () { return this.ports['inputs'] }

  get inputPorts () { return this.getInputPorts() }

  getOutputPorts () { return this.ports['outputs'] }

  hasHotInputs () {
    return _.some(this.getInputPorts(), port => port.hasHotValues())
  }

  quenchInputs () {
    _.each(this.getInputPorts(), port => port.quenchHotValues())
  }

  updateState (updates) {
    this.state = {...this.state, ...updates}
  }

  setTickFn (tickFn) {
    this.unmountTickFn()
    this.tickFn = tickFn
  }

  unmountTickFn () {
    if (this.tickFn && this.tickFn.unmount) {
      this.tickFn.unmount({node: this})
    }
  }

  toJson () {
    return {
      id: this.id,
      tickCount: this.tickCount,
      state: this.state,
      ports: this.ports,
      tickFn: (
        (this.tickFn && this.tickFn.toString && this.tickFn.toString())
        || this.tickFn
      )
    }
  }

  unmount () {
    for (let port of this.getPorts()) {
      port.unmount()
    }
    this.unmountTickFn()
    if (this[DISPOSER_KEY]) { this[DISPOSER_KEY]() } 
    this.changed.removeAll()
  }

  toString () {
    let seen = []
    return JSON.stringify(
      this,
      function handleCircular(key, val) {
        if (val != null && typeof val == "object") {
          if (seen.indexOf(val) >= 0) {
            return
          }
          seen.push(val)
        }
        return val
      },
      2
    )
  }
}

Node.fromSpec = (spec) => {
  const nodeOpts = {...spec}
  if (spec.ports) {
    let ports = {}
    for (let ioType of Object.keys(spec.ports)) {
      ports[ioType] = []
      const portSpecsForIoTypes = spec.ports[ioType]
      for (let key of Object.keys(portSpecsForIoTypes)) {
        const portOpts = {id: key, ioType, ...portSpecsForIoTypes[key]}
        ports[ioType].push(new Port(portOpts))
      }
    }
    nodeOpts.ports = ports
  }
  const node = new Node(nodeOpts)
  return node
}

export default Node
