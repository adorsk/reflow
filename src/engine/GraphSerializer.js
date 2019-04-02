import _ from 'lodash'

export class GraphSerializer {
  serializeGraph ({graph}) {
    const graphSpec = this.deriveSpecFromGraph({graph})
    const serialization = { graphSpec }
    return serialization
  }

  deriveSpecFromGraph ({graph}) {
    const graphSpec = {
      nodeSpecs: {},
      wireSpecs: {},
    }
    for (let node of _.values(graph.getNodes())) {
      graphSpec.nodeSpecs[node.id] = node.srcCode
    }
    for (let wire of _.values(graph.getWires())) {
      graphSpec.wireSpecs[wire.id] = wire.srcCode
    }
    return graphSpec
  }

  serializeGraphState ({graph}) {
    const serializedState = {
      serializedNodeStates: {},
    }
    for (let node of _.values(graph.getNodes())) {
      serializedState.serializedNodeStates[node.id] = (
        this.serializeNodeState({node}))
    }
    return serializedState
  }

  serializeNodeState ({node}) {
    const serializeStateFn = _.get(node, ['ctx', 'serializeState'])
    const serializedState = (
      (serializeStateFn) ? serializeStateFn({node}) : {}
    )
    const serializedPortStates = {}
    for (let port of _.values(node.getPorts())) {
      serializedPortStates[port.key] = this.serializePortState({port})
    }
    const serializedNodeState = {
      serializedState,
      serializedPortStates,
    }
    return serializedNodeState
  }

  serializePortState ({port}) {
    const serializedPortState = {
      serializedState: {
        serializedPackets: _.map(port.packets, (packet) => {
          return this.serializePacket({packet})
        }),
      }
    }
    return serializedPortState
  }

  deserializeGraphState ({serializedGraphState}) {
  }
}

export default GraphSerializer
