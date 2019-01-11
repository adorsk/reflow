export class Graph {
  constructor () {
    this.wires = {}
    this.nodes = {}
  }

  getNodes () { return this.nodes }
  getWires () { return this.wires }

  addNode (node) {
    this.nodes[node.id] = node
  }

  removeNode ({nodeId}) {
    const node = this.nodes[nodeId]
    node.unmount()
    delete this.nodes[nodeId]
  }

  addWire (wire) {
    const key = this.deriveKeyForWire(wire)
    this.wires[key] = wire
    this.setupListenerForWire({wire, key})
  }

  deriveKeyForWire (wire) {
    const { src, dest } = wire
    const key = [src, dest].map((terminal) => {
      return [terminal.nodeId, terminal.portId].join(':')
    }).join(' => ')
    return key
  }

  setupListenerForWire ({wire, key}) {
    const { src, dest } = wire
    const srcPort = this.nodes[src.nodeId].getPort({
      ioType: 'outputs',
      portId: src.portId
    })
    srcPort.addListener({
      key,
      listener: (evt) => {
        if (evt.type !== 'push') { return }
        const destPort = this.nodes[dest.nodeId].getPort({
          ioType: 'inputs',
          portId: dest.portId
        })
        destPort.pushValue(evt.data)
        srcPort.shiftValue()
      }
    })
  }

  removeWire ({wire, key}) {
    this.removeListenerForWire({wire, key})
    delete this.wires[key]
  }

  removeListenerForWire ({wire, key}) {
    const { src } = wire
    const srcPort = this.nodes[src.nodeId].getPort({
      ioType: 'outputs',
      portId: src.portId
    })
    srcPort.removeListener({key})
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
