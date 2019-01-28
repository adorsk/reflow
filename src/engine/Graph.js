import _ from 'lodash'
import signals from 'signals'
import { observable } from 'mobx'

import ObservableMapStore from '../utils/ObservableMapStore.js'

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

  onChanged () {
    this.tick()
  }

  tick () {
    this.propagateOutputs()
    this.tickNodes()
    this.tickCount += 1
  }

  tickNodes () {
    for (let node of Object.values(this.nodes)) {
      node.tick()
    }
  }

  propagateOutputs () {
    for (let wire of Object.values(this.wires)) {
      const { src, dest } = wire
      const srcPort = this.nodes[src.nodeId].getOutputPort(src.portId)
      const destPort = this.nodes[dest.nodeId].getInputPort(dest.portId)
      while (srcPort.values.length) {
        destPort.pushValue(srcPort.shiftValue())
      }
    }
  }

  getNodes () { return this.nodes }

  getWires () { return this.wires }

  addNode (node, opts = {noSignals: false}) {
    this.nodes[node.id] = node
    node.setState(this.store.getOrCreate({key: node.id}))
    for (let port of node.getPorts()) {
      const key = [node.id, port.id].join(':')
      port.setState(this.store.getOrCreate({key}))
    }
    node.changed.add(this.changed.dispatch)
    if (!opts.noSignals) {
      this.changed.dispatch()
    }
  }

  removeNode ({nodeId}) {
    this.nodes[nodeId].unmount()
    delete this.nodes[nodeId]
  }

  addWire (wire, opts = {noSignals: false}) {
    const key = this.deriveKeyForWire(wire)
    this.wires[key] = wire
    if (!opts.noSignals) {
      this.changed.dispatch()
    }
  }

  deriveKeyForWire (wire) {
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
  }
}

export default Graph
