import _ from 'lodash'
import signals from 'signals'
import { observable } from 'mobx'

import Node from './Node.js'
import Wire from './Wire.js'
import ObservableMapStore from './ObservableMapStore.js'

export class Graph {
  constructor ({id, store, state} = {}) {
    this.id = id || _.uniqueId('graph-')
    this.store = store || this.createStore()
    if (state) {
      state = (state.observe) ? state : observable(state)
      this.store.set({key: this.id, state})
    }
    this.setState(this.store.getOrCreate({key: this.id}))
    this.wires = {}
    this.nodes = {}
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
  }

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
        this.drainPortValues({port, wires: port.wires})
        port.quench()
      }
    }
  }

  drainPortValues ({port, wires}) {
    const drainingBehaviors = ['drain', 'debouncedDrain']
    const indicesOfValuesToDrain = []
    for (let i = 0; i < port.values.length; i++) {
      let shouldDrain = false
      for (let wire of wires) {
        wire.pushValue(port.values[i])
        const drainBehavior = _.get(wire, 'behaviors.drain')
        shouldDrain = shouldDrain || drainingBehaviors.includes(drainBehavior)
        if (drainBehavior === 'drain') { break }
      }
      if (shouldDrain) { indicesOfValuesToDrain.push(i) }
    }
    _.pullAt(port.values, indicesOfValuesToDrain) // mutates port.values
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

  addNodeFromSpec ({nodeSpec, opts}) {
    const node = Node.fromSpec({
      ...nodeSpec,
      state: this.store.getOrCreate({key: nodeSpec.id}),
    })
    this.addNode(node, opts)
    return node
  }

  addNode (node, opts = {noSignals: false}) {
    this.nodes[node.id] = node
    node.changed.add((evt) => this.changed.dispatch({type: 'node', data: evt}))
    if (!opts.noSignals) {
      this.changed.dispatch({type: 'node:add', data: {node}})
    }
  }

  removeNode ({nodeId}) {
    this.nodes[nodeId].unmount()
    delete this.nodes[nodeId]
  }

  addWireFromSpec ({wireSpec, opts}) {
    this.addWire({
      wire: Wire.fromSpec({wireSpec, nodes: this.nodes}),
      opts
    })
  }

  addWire ({wire, opts = {noSignals: false}}) {
    this.wires[wire.id] = wire
    wire.src.port.addWire({wire})
    wire.dest.port.addWire({wire})
    if (!opts.noSignals) {
      this.changed.dispatch({type: 'wire:add', data: {wire}})
    }
  }

  deriveIdForWire (wire) {
    const { src, dest } = wire
    const key = [src, dest].map((terminal) => {
      return [terminal.nodeId, terminal.portId].join(':')
    }).join(' => ')
    return key
  }

  removeWire ({wire, key}) {
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
}

export default Graph
