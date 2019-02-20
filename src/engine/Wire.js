import _ from 'lodash'

export class Wire {
  static TERMINALS_SEPARATOR = '->'

  static NODE_PORT_SEPARATOR = ':'

  constructor ({id = '', src = {}, dest = {}} = {}) {
    this.id = id
    this.src = src
    this.dest = dest
  }

  static fromSpec ({wireSpec = {}, nodes = {}} = {}) {
    if (_.isString(wireSpec)) {
      const [srcSpec, destSpec] = wireSpec.split(
        new RegExp(`\\s*${Wire.TERMINALS_SEPARATOR}\\s*`))
      wireSpec = {src: srcSpec, dest: destSpec}
    }
    const terminals = {}
    for (let srcDest of ['src', 'dest']) {
      let terminalSpec = wireSpec[srcDest]
      if (_.isString(terminalSpec)) {
        const [nodeId, portId] = terminalSpec.split(Wire.NODE_PORT_SEPARATOR)
        terminalSpec = {nodeId, portId}
      }
      const node = terminalSpec.node || nodes[terminalSpec.nodeId]
      const port = (terminalSpec.port || node.getPort({
        ioType: ((srcDest === 'src') ? 'outputs' : 'inputs'),
        portId: terminalSpec.portId,
      }))
      terminals[srcDest] = {node, port}
    }
    const wire = new Wire({
      id: Wire.idFromTerminals({terminals}),
      ...terminals
    })
    return wire
  }

  static idFromTerminals ({terminals}) {
    return ['src', 'dest'].map((srcDest) => {
      const term = terminals[srcDest]
      return [term.node.id, term.port.id].join(Wire.NODE_PORT_SEPARATOR)
    }).join(` ${Wire.TERMINALS_SEPARATOR} `)
  }
}

export default Wire
