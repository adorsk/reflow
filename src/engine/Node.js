import _ from 'lodash'
import { observable } from 'mobx'
import signals from 'signals'

import Port from './Port.js'
import { AsyncFunction, transformCode } from '../utils/index.js'


const SYMBOLS = {
  DISPOSER: Symbol('disposer_key'),
  PORT_STATES: ':PORT_STATES:',
}


export class Node {
  constructor (opts = {}) {
    this.SYMBOLS = SYMBOLS
    this.id = opts.id || _.uniqueId('node-')
    this.key = opts.key || _.uniqueId('node-')
    this.label = opts.label
    this.setGraph(opts.graph)
    this.behaviors = Object.assign({
      drainIncomingHotWiresBeforeTick: true,
      quenchHotInputsAfterTick: true,
    }, opts.behaviors)
    this.builderFn = opts.builderFn
    this.srcCode = opts.srcCode
    this.changed = new signals.Signal()
    this.tickFn = opts.tickFn
    this.setState(opts.state || new Map())
    this.ports = {}
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

  setGraph (graph) {
    this.graph = graph
  }

  init () {
    for (let port of this.getPorts()) {
      this.addPortListener({port})
      port.init()
    }
  }

  addPortListener ({port}) {
    port.changed.add((evt) => {
      this.changed.dispatch({type: 'port:changed', data: {port, evt}})
    })
  }

  addInput (key, portOpts = {}) {
    portOpts = {key, ...portOpts}
    portOpts.id = portOpts.id || this._generatePortId()
    portOpts.ioType = Port.IO_TYPES.INPUTS
    this.addPort({port: new Port(portOpts)})
  }

  _generatePortId () {
    return [this.id, _.uniqueId('port-')].join(':')
  }

  addPort ({port}) {
    port.setNode(this)
    const ioKey = this.getIoKeyForPort({port})
    this.ports[ioKey] = port
    this.state.get(this.SYMBOLS.PORT_STATES).set(port.id, port.state)
  }

  addOutput (key, portOpts = {}) {
    portOpts = {key, ...portOpts}
    portOpts.id = portOpts.id || this._generatePortId()
    portOpts.ioType = Port.IO_TYPES.OUTPUTS
    this.addPort({port: new Port(portOpts)})
  }

  setState (state) {
    // unbind prev state
    if (this[this.SYMBOLS.DISPOSER]) { this[this.SYMBOLS.DISPOSER]() }
    this.state = (state.observe) ? state : observable.map(state)
    if (! this.state.has(this.SYMBOLS.PORT_STATES)) {
      this.state.set(this.SYMBOLS.PORT_STATES, new Map())
    }
    this.propagatePortStates()
    this[this.SYMBOLS.DISPOSER] = this.state.observe(() => {
      this.changed.dispatch({type: 'state'})
    })
  }

  propagatePortStates () {
    const portStates = this.state.get(this.SYMBOLS.PORT_STATES)
    for (let portKey of portStates.keys()) {
      const port = this.ports[portKey]
      if (! port) { continue }
      port.setState(portStates.get(portKey))
    }
  }

  clearState () {
    for (let key of this.state.keys()) {
      if (key === this.SYMBOLS.PORT_STATES) { continue }
      this.state.delete(key)
    }
    for (let port of this.getPorts()) {
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
          port.loadState(portStates.get(portKey))
        }
      } else {
        this.state.set(key, value)
      }
    }
  }

  getSerializedState () {
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
      serializedPortStates[portKey] = port.getSerializedState()
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
        this.drainWireToPort({port, wire})
      }
    })
  }

  drainWireToPort ({port, wire}) {
    while (wire.hasPackets()) {
      const packet = wire.shiftPacket()
      port.pushPacket(packet)
    }
    wire.quench()
  }

  setTickCount (count) {
    this.tickCount = count 
  }

  getPort (portSpec) {
    if (typeof portSpec === 'string') {
      const [ioType, key] = portSpec.split(':')
      portSpec = {ioType, key}
    }
    const ioKey = this.getIoKeyForPort({port: portSpec})
    return this.ports[ioKey]
  }

  getPorts () {
    return [...Object.values(this.ports)]
  }

  getIoKeyForPort ({port}) {
    return [port.ioType, port.key].join(':')
  }

  getPortsOfType ({ioType}) {
    const ports =_.filter(this.getPorts(), (port) => (port.ioType === ioType))
    return _.keyBy(ports, 'id')
  }

  getOutputPort (portId) {
    return this.getPort({ioType: 'outputs', portId})
  }

  getInputPort (portId) {
    return this.getPort({ioType: 'inputs', portId})
  }

  getInputPorts () {
    return this.getPortsOfType({ioType: Port.IO_TYPES.INPUTS})
  }
  get inputPorts () { return this.getInputPorts() }

  getOutputPorts () {
    return this.getPortsOfType({ioType: Port.IO_TYPES.OUTPUTS})
  }
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

  getSpec () {
    const spec = {
      id: this.id,
      builderFn: this.builderFn,
    }
    return spec
  }

  getInputValues ({inputKeys=null} = {}) {
    inputKeys = (
      inputKeys || Object.values(this.getInputPorts()).map((port) => port.key)
    )
    const inputValues = {}
    for (let inputKey of inputKeys) {
      const port = this.getPort('inputs:' + inputKey)
      const value = _.get(port, ['mostRecentPacket', 'data'])
      if (_.isUndefined(value)) {
        throw new Node.InputsError(`'${inputKey}' is undefined`)
      }
      inputValues[inputKey] = value
    }
    return inputValues
  }

  getWiresForPort ({port}) {
    return this.graph.getWiresForPort({port})
  }
}


class InputsError extends Error {}
Node.InputsError = InputsError

Node.fromSpec = async (spec) => {
  const { id, builderFn } = spec
  const node = new Node({id})
  node.builderFn = (
    (typeof builderFn === 'string') ? (
      new AsyncFunction('node', transformCode(builderFn))
    ) : builderFn
  )
  node.srcCode = builderFn.srcCode || builderFn.toString()
  await node.builderFn(node)
  return node
}

export default Node
