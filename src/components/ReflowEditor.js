import React from 'react'
import localforage from 'localforage'

import Graph from '../engine/Graph.js'
import GraphEditor from './GraphEditor.js'


class ReflowEditor extends React.Component {

  static defaultProps = {
    reflowStore: localforage.createInstance({name: 'reflow'}),
  }

  constructor (opts) {
    super(opts)
    this.state = {
      selectedGraphRecordKey: null,
      selectedGraph: null,
      currentGraph: null,
      currentGraphViewStore: null,
    }
    this.actions = {
      setCurrentGraphViewProps: ({graphViewProps}) => {
        this.setState({
          currentGraph: graphViewProps.graph,
          currentGraphViewStore: graphViewProps.store,
        })
      },
    }
  }

  componentDidMount () {
    if (! this.state.selectedGraphRecordKey) {
      const graphKey = ['graph', (new Date()).getTime(), Math.random()].join(':')
      const graph = new Graph({
        id: graphKey,
        label: 'graph-' + (new Date()).toISOString(),
      })
      this.setState({currentGraph: graph})
    }
  }

  render () {
    return (
      <div style={this.props.style}>
        <div
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
          }}
        >
          <style>
            {`
          .panel {
            position: absolute;
            top: 0;
            bottom: 0;
            border: thin solid gray;
            overflow: auto;
          }
          `}
        </style>
        <div 
          className="graph-editor-panel panel"
          style={{
            left: 0, 
            right: 0,
          }}
        >
          {this.renderGraphEditorPanelContent()}
        </div>
      </div>
    </div>
    )
  }

  renderGraphEditorPanelContent () {
    const { currentGraph, currentGraphViewStore } = this.state
    if (! currentGraph) { return (<i>no currentGraph</i>) }
    return (
      <div
        style={{
          height: '100%',
          width: '100%',
          position: 'relative',
        }}
      >
        {
          this.renderGraphEditor({
            graph: currentGraph,
            graphViewStore: currentGraphViewStore,
          })
        }
      </div>
    )
  }

  renderGraphEditor ({graph, graphViewStore}) {
    return (
      <GraphEditor
        actions={{
          setCurrentGraphViewProps: this.actions.setCurrentGraphViewProps,
        }}
        reflowStore={this.props.reflowStore}
        graph={graph}
        graphViewStore={graphViewStore}
        style={{
          height: '100%',
          widht: '100%',
        }}
      />
    )
  }
}

export default ReflowEditor


