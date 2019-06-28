import _ from 'lodash'
import signals from 'signals'

import Node from './Node.js'
import Wire from './Wire.js'
import ObservableMapStore from './ObservableMapStore.js'

const SYMBOLS = {
  NODE_STATES: ':NODE_STATES:',
  WIRE_STATES: ':WIRE_STATES:',
}

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
    if (evt && evt.type && evt.type === 'node') {
      if (evt.data && evt.data.type === 'errors') { return }
    }
    this.debouncedTick()
  }

  tick () {
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

  addNode ({node, state}) {
    this.nodes[node.id] = node
    this.nodesByKey[node.key] = node
    const nodeStates = this.state.get(SYMBOLS.NODE_STATES)
    state = state || nodeStates.get(node.id) || new Map()
    nodeStates.set(node.id, state)
    this.setNodeState({node, state})
    this.addNodeListener({node})
    node.init()
    this.changed.dispatch({type: 'node:add', data: {node}})
  }

  setNodeState ({node, state}) {
    this.state.get(this.SYMBOLS.NODE_STATES).set(node.id, state)
  }

  addNodeListener ({node}) {
    node.changed.add((evt) => this.changed.dispatch({type: 'node', data: evt}))
  }

  removeNode ({nodeId}) {
    if (this.nodes[nodeId]) { this.nodes[nodeId].unmount() }
    this.state.get(this.SYMBOLS.NODE_STATES).delete(nodeId)
    delete this.nodes[nodeId]
  }

  async addWireFromSpec ({wireSpec, opts}) {
    const wire = await Wire.fromSpec({wireSpec, nodesByKey: this.nodesByKey})
    const wireStates = this.state.get(this.SYMBOLS.WIRE_STATES)
    if (! wireStates.has(wire.id)) {
      wireStates.set(wire.id, new Map())
    }
    wire.setState(wireStates.get(wire.id))
    wire.init()
    this.addWire({wire, opts})
  }

  addWire ({wire, opts = {noSignals: false}}) {
    this.wires[wire.id] = wire
    wire.src.port.addWire({wire})
    wire.dest.port.addWire({wire})
    wire.changed.add((evt) => this.changed.dispatch({type: 'wire', data: evt}))
    if (!opts.noSignals) {
      this.changed.dispatch({type: 'wire:add', data: {wire}})
    }
  }

  removeWire ({wire, key}) {
    this.wires[wire.id].unmount()
    delete this.wires[key]
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

  replaceNode ({node}) {
    const state = node.state
    this.removeNode({nodeId: node.id})
    this.addNode({node, state})
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
