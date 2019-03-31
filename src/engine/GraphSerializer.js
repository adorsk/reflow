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
      const serializeStateFn = _.get(node, ['ctx', 'serializeState'])
      if (! serializeStateFn) { continue }
      serializedState.serializedNodeStates[node.id] = serializeStateFn({node})
    }
    return serializedState
  }
}

export default GraphSerializer
