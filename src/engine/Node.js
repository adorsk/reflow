import _ from 'lodash'
import { observable } from 'mobx'
import signals from 'signals'

import Port from './Port.js'

const DISPOSER_KEY = Symbol('disposer_key')

export class Node {
  constructor (opts = {}) {
    this.id = opts.id || _.uniqueId('node-')
    this.behaviors = Object.assign({
      drainIncomingHotWiresBeforeTick: true,
      quenchHotInputsAfterTick: true,
    }, opts.behaviors)
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
    this.errors = []
  }

  setState (state) {
    if (this[DISPOSER_KEY]) { this[DISPOSER_KEY]() } // unbind prev state
    state = (state.observe) ? state : observable.map(state)
    this[DISPOSER_KEY] = state.observe(() => {
      this.changed.dispatch({type: 'state'})
    })
    this.state = state
  }

  addPort ({port, ioType}) {
    port.setNode(this)
    this.ports[ioType][port.id] = port
    port.changed.add((evt) => {
      this.changed.dispatch({type: ioType, data: {port}})
    })
  }

  setErrors (errors, opts = {noSignals: false}) {
    this.errors = errors
    if (!opts.noSignals) { this.changed.dispatch({type: 'errors'}) }
  }

  tick() {
    if (this.behaviors.drainIncomingHotWiresBeforeTick) {
      this.drainIncomingHotWires()
    }
    if (this.tickFn) {
      this.tickFn({node: this})
    }
    if (this.behaviors.quenchHotInputsAfterTick) {
      this.quenchHotInputs()
    }
    this.setTickCount(this.tickCount + 1)
  }

  drainIncomingHotWires () {
    _.each(this.getInputPorts(), (port) => {
      for (let wire of port.wires) {
        if (! wire.isHot()) { return }
        this.drainWire({wire})
      }
    })
  }

  drainWire ({wire}) {
    while (wire.hasPackets()) {
      wire.dest.port.pushPacket(wire.shiftPacket())
    }
    wire.quench()
  }

  setTickCount (count) {
    this.tickCount = count 
  }

  getPort (portSpec) {
    if (typeof portSpec === 'string') {
      const [ioType, portId] = portSpec.split(':')
      portSpec = {ioType, portId}
    }
    return this.ports[portSpec.ioType][portSpec.portId]
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
    return _.some(this.getInputPorts(), port => port.isHot())
  }

  quenchHotInputs () {
    _.each(this.getInputPorts(), (port) => {
      if (port.isHot()) { port.quench() }
    })
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
  const { portSpecs, ...nodeOpts } = spec
  const node = new Node(nodeOpts)
  _.each(portSpecs, (portSpecsForIoType, ioType) => {
    _.each(portSpecsForIoType, (portSpec, portId) => {
      const portKey = [ioType, portId].join(':')
      let portState = node.state.get(portKey)
      if (_.isUndefined(portState)) {
        portState = new Map()
        node.state.set(portKey, portState)
      }
      node.addPort({
        port: new Port({
          id: portId,
          state: portState,
          ioType,
          node,
          ...portSpec,
        }),
        ioType
      })
    })
  })
  return node
}

export default Node
