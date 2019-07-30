import _ from 'lodash'
import signals from 'signals'

import Node from './Node.js'
import Wire from './Wire.js'
import ObservableMapStore from './ObservableMapStore.js'

const SYMBOLS = {
  NODE_STATES: ':NODE_STATES:',
  WIRE_STATES: ':WIRE_STATES:',
}

const STRUCTURE_CHANGE_EVENTS = [
  'node:add',
  'node:remove',
  'wire:add',
  'wire:remove',
]

export class Graph {

  constructor ({id, label, state = new Map()} = {}) {
    this.SYMBOLS = SYMBOLS
    this.id = id || _.uniqueId('graph-')
    this.label = label || id
    this.setState(state)
    this.wires = {}
    this.nodes = {}
    this.nodesByKey = {}
    this.tickCount = 0
    this.changed = new signals.Signal()
    this.debouncedTick = _.debounce(this.tick, 0)
    this.changed.add(this.onChanged.bind(this))
    this._wireLookup = {}
  }

  createStore () {
    return new ObservableMapStore()
  }

  setState (state) {
    this.state = state
    if (! state.has(this.SYMBOLS.NODE_STATES)) {
      state.set(this.SYMBOLS.NODE_STATES, new Map())
    }
    if (! state.has(this.SYMBOLS.WIRE_STATES)) {
      state.set(this.SYMBOLS.WIRE_STATES, new Map())
    }
  }

  get nodeStates () { return this.state.get(this.SYMBOLS.NODE_STATES) }

  onChanged (evt) {
    console.log("evt: ", evt)
    if (evt && STRUCTURE_CHANGE_EVENTS.includes(evt.type)) {
      this.onGraphStructureChange(evt)
    }
    if (evt && evt.type === 'node') {
      if (evt.data && evt.data.type === 'errors') { return }
    }
    this.debouncedTick()
  }

  onGraphStructureChange () {
    this._wireLookup = this.generateWireLookup()
  }

  generateWireLookup () {
    const wireLookup = {
      bySrc: {},
      byDest: {},
    }
    for (let wire of Object.values(this.wires)) {
      if (wire.src) {
        if (!(wire.src in wireLookup.bySrc)) { wireLookup.bySrc[wire.src] = [] }
        wireLookup.bySrc[wire.src].push(wire)
      }
      if (wire.dest) {
        if (!(wire.dest in wireLookup.byDest)) { wireLookup.byDest[wire.dest] = [] }
        wireLookup.byDest[wire.dest].push(wire)
      }
    }
    return wireLookup
  }

  tick () {
    console.log(`tick #${this.tickCount}`)
    this.drainOutputs()
    this.tickNodes()
    this.tickCount += 1
  }

  drainOutputs () {
    for (let node of Object.values(this.nodes)) {
      this.drainNodeOutputs({node})
    }
  }

  drainNodeOutputs ({node}) {
    for (let port of Object.values(node.getOutputPorts())) {
      if (port.isHot()) {
        console.log("p: ", port, "p.wires: ", port.wires)
        this.drainPortPackets({port, wires: port.wires})
        port.quench()
      }
    }
  }

  drainPortPackets ({port, wires}) {
    const drainingBehaviors = ['drain', 'debouncedDrain']
    const indicesOfPacketsToDrain = []
    for (let i = 0; i < port.packets.length; i++) {
      let shouldDrain = false
      for (let wire of wires) {
        wire.pushPacket(port.packets[i])
        const drainBehavior = _.get(wire, 'behaviors.drain')
        shouldDrain = shouldDrain || drainingBehaviors.includes(drainBehavior)
        if (drainBehavior === 'drain') { break }
      }
      if (shouldDrain) { indicesOfPacketsToDrain.push(i) }
    }
    _.pullAt(port.packets, indicesOfPacketsToDrain) // mutates port.packets
  }

  getWiresForPort ({port}) {
    const terminalKey = [port.node.key, port.ioType, port.key].join(':')
    const bySrcDest = (port.ioType === 'inputs') ? 'byDest' : 'bySrc'
    return _.get(this._wireLookup[bySrcDest], terminalKey, [])
  }

  tickNodes () {
    for (let node of Object.values(this.nodes)) {
      this.tickNode(node)
    }
  }

  tickNode (node) {
    try {
      node.setErrors([], {noSignals: true})
      node.tick()
    }
    catch (err) {
      console.error(err)
      node.setErrors([err])
    }
  }

  getNodes () { return this.nodes }

  getWires () { return this.wires }

  async addNodeFromSpec ({nodeSpec}) {
    const node = await Node.fromSpec(nodeSpec)
    this.addNode({node})
  }

  addNode ({node, state}) {
    node.setGraph(this)
    this.nodes[node.id] = node
    this.nodesByKey[node.key] = node
    const nodeStates = this.state.get(SYMBOLS.NODE_STATES)
    state = state || nodeStates.get(node.id) || new Map()
    nodeStates.set(node.id, state)
    this.setNodeState({node, state})
    this.addNodeListener({node})
    this.changed.dispatch({type: 'node:add', data: {node}})
    node.init()
  }

  setNodeState ({node, state}) {
    this.state.get(this.SYMBOLS.NODE_STATES).set(node.id, state)
  }

  addNodeListener ({node}) {
    node.changed.add((evt) => this.changed.dispatch({type: 'node:changed', data: evt}))
  }

  removeNode ({nodeId}) {
    if (this.nodes[nodeId]) { this.nodes[nodeId].unmount() }
    this.state.get(this.SYMBOLS.NODE_STATES).delete(nodeId)
    delete this.nodes[nodeId]
    this.changed.dispatch({type: 'node:remove', data: {nodeId}})
  }

  replaceNode ({node}) {
    const state = node.state
    this.removeNode({nodeId: node.id})
    this.addNode({node, state})
  }

  async addWireFromSpec ({wireSpec}) {
    const wire = await Wire.fromSpec(wireSpec)
    this.addWire({wire})
  }

  addWire ({wire, state, opts = {noSignals: false}}) {
    this.wires[wire.id] = wire
    const wireStates = this.state.get(SYMBOLS.WIRE_STATES)
    state = state || wireStates.get(wire.id) || new Map()
    wireStates.set(wire.id, state)
    wire.setState(state)
    if (!opts.noSignals) {
      this.changed.dispatch({type: 'wire:add', data: {wire}})
    }
    wire.changed.add((evt) => this.changed.dispatch({type: 'wire:changed', data: evt}))
  }

  removeWire ({wireId}) {
    this.wires[wireId].unmount()
    delete this.wires[wireId]
    this.changed.dispatch({type: 'wire:remove', data: {wireId}})
  }

  replaceWire ({wire}) {
    const state = wire.state
    this.removeWire({wireId: wire.id})
    this.addWire({wire, state})
  }

  unmount () {
    _.each(this.wires, (wire, key) => {
      this.removeWire({wire, key})
    })
    _.each(this.nodes, (node, id) => {
      this.removeNode({nodeId: id})
    })
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

  clearState () {
    for (let key of this.state.keys()) {
      if (key === this.SYMBOLS.NODE_STATES) { continue }
      if (key === this.SYMBOLS.WIRE_STATES) { continue }
      this.state.delete(key)
    }
    for (let node of _.values(this.nodes)) {
      node.clearState()
    }
    for (let wire of _.values(this.wires)) {
      wire.clearState()
    }
  }

  loadState (nextState) {
    this.clearState()
    for (let key of nextState.keys()) {
      const value = nextState.get(key)
      if (key === this.SYMBOLS.NODE_STATES) {
        const nodeStates = value
        for (let nodeKey of nodeStates.keys()) {
          const node = this.nodes[nodeKey]
          if (! node) { continue }
          node.loadState(nodeStates.get(nodeKey))
        }
      } else if (key === this.SYMBOLS.WIRE_STATES) {
        const wireStates = value
        for (let wireKey of wireStates.keys()) {
          const wire = this.wires[wireKey]
          if (! wire) { continue }
          wire.loadState(wireStates.get(wireKey))
        }
      } else {
        this.state.set(key, value)
      }
    }
  }

  getSerialization () {
    const serialization = {
      spec: this.getSpec(),
      serializedState: this.getSerializedState(),
    }
    return serialization
  }

  getSpec () {
    const getSpecsForItems = (items) => {
      const keyedItems = _.keyBy(items, 'id')
      return _.mapValues(keyedItems, (item) => item.getSpec())
    }
    const spec = {
      ctorOpts: {
        id: this.id,
        label: this.label,
      },
      nodeSpecs: getSpecsForItems(this.getNodes()),
      wireSpecs: getSpecsForItems(this.getWires()),
    }
    return spec
  }

  getSerializedState () {
    const serializedState = {}
    for (let key of this.state.keys()) {
      let serializedValue
      if (key === this.SYMBOLS.NODE_STATES) {
        serializedValue = this.serializeNodeStates()
      } else if (key === this.SYMBOLS.WIRE_STATES) {
        serializedValue = this.serializeWireStates()
      } else {
        serializedValue = this.state.get(key)
      }
      serializedState[key] = serializedValue
    }
    return serializedState
  }

  serializeNodeStates () {
    const serializedNodeStates = {}
    const nodeStates = this.state.get(this.SYMBOLS.NODE_STATES)
    for (let nodeKey of nodeStates.keys()) {
      const node = this.nodes[nodeKey]
      if (! node) { continue }
      serializedNodeStates[nodeKey] = node.getSerializedState()
    }
    return serializedNodeStates
  }

  serializeWireStates () {
    const serializedWireStates = {}
    const wireStates = this.state.get(this.SYMBOLS.WIRE_STATES)
    for (let wireKey of wireStates.keys()) {
      const wire = this.wires[wireKey]
      if (! wire) { continue }
      serializedWireStates[wireKey] = wire.getSerializedState()
    }
    return serializedWireStates
  }

  deserializeState (serializedState) {
    const state = new Map()
    for (let key of Object.keys(serializedState)) {
      const serializedValue = serializedState[key]
      if (key === this.SYMBOLS.NODE_STATES) {
        const nodeStates = new Map()
        const serializedNodeStates = serializedValue
        for (let nodeKey of Object.keys(serializedNodeStates)) {
          const node = this.nodes[nodeKey]
          if (! node) { continue }
          const serializedNodeState = serializedNodeStates[nodeKey]
          nodeStates.set(nodeKey, node.deserializeState(serializedNodeState))
        }
        state.set(this.SYMBOLS.NODE_STATES, nodeStates)
      } else if (key === this.SYMBOLS.WIRE_STATES) {
        const wireStates = new Map()
        const serializedWireStates = serializedValue
        for (let wireKey of Object.keys(serializedWireStates)) {
          const wire = this.wires[wireKey]
          if (! wire) { continue }
          const serializedWireState = serializedWireStates[wireKey]
          wireStates.set(wireKey, wire.deserializeState(serializedWireState))
        }
        state.set(this.SYMBOLS.WIRE_STATES, wireStates)
      } else {
        state.set(key, serializedValue)
      }
    }
    return state
  }

}

Graph.fromSerialization = async ({serialization}) => {
  const graph = await Graph.fromSpec({spec: serialization.spec})
  const state = graph.deserializeState(serialization.serializedState)
  graph.loadState(state)
  return graph
}

Graph.deserializeSpec = async (serializedSpec) => {
  const deserializeSpecs = async ({serializedSpecs, deserializer}) => {
    return await Promise.all(serializedSpecs.map(deserializer))
  }
  const spec = {
    ctorOpts: serializedSpec.ctorOpts,
    nodeSpecs: await deserializeSpecs({
      serializedSpecs: _.values(serializedSpec.serializedNodeSpecs),
      deserializer: Node.deserializeSpec,
    }),
    wireSpecs: await deserializeSpecs({
      serializedSpecs: _.values(serializedSpec.serializedWireSpecs),
      deserializer: Wire.deserializeSpec,
    }),
  }
  return spec 
}

Graph.fromSpec = async ({spec}) => {
  const graph = new Graph(spec.ctorOpts || {})
  const nodePromises = []
  for (let nodeSpec of _.values(spec.nodeSpecs)) {
    nodePromises.push(graph.addNodeFromSpec({nodeSpec}))
  }
  await Promise.all(nodePromises)
  const wirePromises = []
  for (let wireSpec of _.values(spec.wireSpecs)) {
    wirePromises.push(graph.addWireFromSpec({wireSpec}))
  }
  await Promise.all(wirePromises)
  return graph
}

export default Graph
