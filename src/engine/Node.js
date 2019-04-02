import _ from 'lodash'
import { observable } from 'mobx'
import signals from 'signals'

import Port from './Port.js'

const SYMBOLS = {
  DISPOSER: Symbol('disposer_key'),
  PORT_STATES: ':PORT_STATES:',
}

export class Node {
  constructor (opts = {}) {
    this.SYMBOLS = SYMBOLS
    this.id = opts.id || _.uniqueId('node-')
    this.behaviors = Object.assign({
      drainIncomingHotWiresBeforeTick: true,
      quenchHotInputsAfterTick: true,
    }, opts.behaviors)
    this.ctx = opts.ctx || {}
    this.srcCode = opts.srcCode || ''
    this.changed = new signals.Signal()
    this.tickFn = opts.tickFn
    this.setState(opts.state || new Map())
    this.ports = {}
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
    // unbind prev state
    if (this[this.SYMBOLS.DISPOSER]) { this[this.SYMBOLS.DISPOSER]() }
    state = (state.observe) ? state : observable.map(state)
    if (! state.has(this.SYMBOLS.PORT_STATES)) {
      state.set(this.SYMBOLS.PORT_STATES, new Map())
    }
    this[this.SYMBOLS.DISPOSER] = state.observe(() => {
      this.changed.dispatch({type: 'state'})
    })
    this.state = state
  }

  clearState () {
    for (let key of this.state.keys()) {
      if (key === this.SYMBOLS.PORT_STATES) { continue }
      this.state.delete(key)
    }
    for (let port of _.values(this.getPorts())) {
      port.clearState()
    }
  }

  loadState (nextState) {
    this.clearState()
    for (let key of nextState.keys()) {
      const value = nextState.get(key)
      if (key === this.SYMBOLS.PORT_STATES) {
        const portStates = value
        for (let portKey of portStates.keys()) {
          const port = this.ports[portKey]
          if (! port) { continue }
          port.loadState(portStates.gte(portKey))
        }
      } else {
        this.state.set(key, value)
      }
    }
  }

  serializeState () {
    const serializedState = {}
    for (let key of this.state.keys()) {
      let serializedValue
      if (key === this.SYMBOLS.PORT_STATES) {
        serializedValue = this.serializePortStates()
      } else {
        serializedValue = this.state.get(key)
      }
      serializedState[key] = serializedValue
    }
    return serializedState
  }

  serializePortStates () {
    const serializedPortStates = {}
    const portStates = this.state.get(this.SYMBOLS.PORT_STATES)
    for (let portKey of portStates.keys()) {
      const port = this.ports[portKey]
      if (! port) { continue }
      serializedPortStates[portKey] = port.serializeState()
    }
    return serializedPortStates
  }

  deserializeState (serializedState) {
    const state = new Map()
    for (let key of Object.keys(serializedState)) {
      const serializedValue = serializedState[key]
      if (key === this.SYMBOLS.PORT_STATES) {
        const portStates = new Map()
        const serializedPortStates = serializedValue
        for (let portKey of Object.keys(serializedPortStates)) {
          const port = this.ports[portKey]
          if (! port) { continue }
          const serializedPortState = serializedPortStates[portKey]
          portStates.set(portKey, port.deserializeState(serializedPortState))
        }
        state.set(this.SYMBOLS.PORT_STATES, portStates)
      } else {
        state.set(key, serializedValue)
      }
    }
    return state
  }

  addPort ({port, ioType}) {
    port.setNode(this)
    port.key = [ioType, port.id].join(':')
    this.ports[port.key] = port
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
    const portKey = [portSpec.ioType, portSpec.portId].join(':')
    return this.ports[portKey]
  }

  getPorts () {
    return [...Object.values(this.ports)]
  }

  getPortsOfType ({ioType}) {
    return _.filter(this.getPorts(), (port) => (port.ioType === ioType))
  }

  getOutputPort (portId) {
    return this.getPort({ioType: 'outputs', portId})
  }

  getInputPort (portId) {
    return this.getPort({ioType: 'inputs', portId})
  }

  getInputPorts () { return this.getPortsOfType({ioType: 'inputs'}) }

  get inputPorts () { return this.getInputPorts() }

  getOutputPorts () { return this.getPortsOfType({ioType: 'outputs'}) }

  get outputPorts () { return this.getOutputPorts() }

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
    if (this[this.SYMBOLS.DISPOSER]) {
      this[this.SYMBOLS.DISPOSER]()
    } 
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
  const portStates = node.state.get(SYMBOLS.PORT_STATES)
  _.each(portSpecs, (portSpecsForIoType, ioType) => {
    _.each(portSpecsForIoType, (portSpec, portId) => {
      const portKey = [ioType, portId].join(':')
      let portState = portStates.get(portKey)
      if (_.isUndefined(portState)) {
        portState = new Map()
        portStates.set(portKey, portState)
      }
      node.addPort({
        port: new Port({
          id: portId,
          key: portKey,
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
