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
    srcPort.registerListener({
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
}

export default Graph
