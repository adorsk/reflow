import _ from 'lodash'
import signals from 'signals'
import { observable } from 'mobx'

import Node from './Node.js'
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
    this.changed.add(_.debounce(this.onChanged.bind(this), 0))
  }

  createStore () {
    return new ObservableMapStore()
  }

  setState (state) {
    this.state = state
  }

  onChanged (evt) {
    this.tick()
  }

  tick () {
    this.propagateOutputs()
    this.tickNodes()
    this.tickCount += 1
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
    node.quenchInputs()
  }

  propagateOutputs () {
    for (let wire of Object.values(this.wires)) {
      const ports = this.getPortsForWire({wire})
      while (ports.src.values.length) {
        ports.dest.pushValues([ports.src.shiftValue()])
      }
    }
  }

  getPortsForWire ({wire}) {
    return {
      src: this.nodes[wire.src.nodeId].getOutputPort(wire.src.portId),
      dest: this.nodes[wire.dest.nodeId].getInputPort(wire.dest.portId),
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
  }

  addNode (node, opts = {noSignals: false}) {
    this.nodes[node.id] = node
    node.changed.add(this.changed.dispatch)
    if (!opts.noSignals) { this.changed.dispatch() }
  }

  removeNode ({nodeId}) {
    this.nodes[nodeId].unmount()
    delete this.nodes[nodeId]
  }

  addWire (wire, opts = {noSignals: false}) {
    const id = this.deriveIdForWire(wire)
    const decoratedWire = {id, ...wire}
    this.wires[id] = decoratedWire
    const ports = this.getPortsForWire({wire})
    console.log("ps: ", ports)
    for (let port of [ports.src, ports.dest]) {
      port.addWire({wire})
    }
    if (!opts.noSignals) {
      this.changed.dispatch()
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
