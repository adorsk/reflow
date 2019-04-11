import _ from 'lodash'
import signals from 'signals'

import Graph from '../../engine/Graph.js'


class GraphStore {
  constructor () {
    this.graphRecords = []
    this.changed = new signals.Signal()
    this.updateVersion()
  }

  updateVersion () {
    this.version = new Date()
  }

  getVersion () { return this.version }

  addGraphRecord ({graphRecord}) {
    const sanitizedGraphRecord = this.sanitizeGraphRecord({graphRecord})
    this.graphRecords.push(sanitizedGraphRecord)
    this.updateVersion()
    this.changed.dispatch({type: 'addGraph', payload: {sanitizedGraphRecord}})
  }

  sanitizeGraphRecord ({graphRecord = {}} = {}) {
    const sanitizedGraphRecord = {...graphRecord}
    if (! sanitizedGraphRecord.key) {
      sanitizedGraphRecord.key = ['g', (new Date()).getTime(), Math.random()].join(':')
    }
    return sanitizedGraphRecord
  }

  getGraphRecords () { return this.graphRecords }

  getActions () {
    const actions = {
      addGraphRecord: this.addGraphRecord.bind(this),
      getGraphRecord: this.getGraphRecord.bind(this),
    }
    return actions
  }

  getGraphRecord ({key}) {
    return _.find(this.graphRecords, {key})
  }
}

const graphStore = new GraphStore()
const graphRecords = _.times(3, (i) => {
  const graphKey = ['graph', (new Date()).getTime(), Math.random()].join(':')
  const graph = new Graph({id: graphKey})
  const graphRecord = {
    key: graph.id,
    label: graph.id,
    graphSerialization: graph.getSerialization()
  }
  return graphRecord
})
for (let graphRecord of graphRecords) {
  graphStore.addGraphRecord({graphRecord})
}

export default graphStore
