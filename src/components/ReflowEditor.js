import React from 'react'
import { Button, Divider, List } from 'semantic-ui-react'
import localforage from 'localforage'

import Graph from '../engine/Graph.js'
import GraphEditor from './GraphEditor.js'
import GraphView from './GraphView.js'


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
    const leftPanelWidth = '180px'
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
          className="left panel"
          style={{
            left: 0,
            width: leftPanelWidth,
          }}
        >
          {this.renderLeftPanelContent()}
        </div>

        <div 
          className="right panel"
          style={{
            left: leftPanelWidth,
            right: 0,
          }}
        >
          {this.renderRightPanelContent()}
        </div>
      </div>
    </div>
    )
  }

  renderLeftPanelContent () {
    return (
      <div>
        <Button
          content="add"
          onClick={this.onClickAddGraphRecordButton.bind(this)}
        />
        <Button
          content="load"
          onClick={this.onClickLoadGraphRecordButton.bind(this)}
        />
        <Divider />
        {this.renderGraphRecordList()}
      </div>
    )
  }

  onClickAddGraphRecordButton () {
    const { addGraphRecord } = this.props.actions
    const graphKey = ['graph', (new Date()).getTime(), Math.random()].join(':')
    const graph = new Graph({id: graphKey})
    const graphRecord = {
      key: graph.id,
      label: graph.id,
      graphSerialization: graph.getSerialization()
    }
    addGraphRecord({graphRecord})
  }

  onClickLoadGraphRecordButton () {
    const fileInput = document.createElement('input')
    fileInput.setAttribute('type', 'file')
    const readPromise = new Promise((resolve, reject) => {
      fileInput.onchange = (evt) => {
        const file = evt.target.files[0]
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.readAsText(file)
      }
    })
    fileInput.click()
    readPromise.then(async (plainText) => {
      const graphViewProps = await GraphView.deserializeStringifiedSerialization({
        stringifiedSerialization: plainText
      })
      this.setState({
        currentGraph: graphViewProps.graph,
        currentGraphViewStore: graphViewProps.store,
      })
    })
  }

  renderGraphRecordList () {
    const { graphRecords } = this.props
    if (! graphRecords) { return (<i>no graphrecords</i>) }
    const listItems = graphRecords.map((g) => {
      return this.renderGraphRecordListItem({graphRecord: g})
    })
    return (<List items={listItems} />)
  }

  renderGraphRecordListItem ({graphRecord}) {
    const isSelected = (this.state.selectedGraphRecordKey === graphRecord.key)
    const listItem = (
      <List.Item
        key={graphRecord.key}
        onClick={() => {
          this.onSelectGraphRecord({graphRecord})
        }}
      >
        <span
          style={{
            fontWeight: (isSelected ? 'bold': 'normal'),
          }}
        >
          {graphRecord.label}
        </span>
      </List.Item>
    )
    return listItem
  }

  async onSelectGraphRecord ({graphRecord}) {
    this.setState({
      selectedGraphRecordKey: graphRecord.key,
      currentGraph: null,
    })
    const graph = await Graph.fromSerialization({
      serialization: graphRecord.graphSerialization
    })
    this.setState({currentGraph: graph})
  }

  renderRightPanelContent () {
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


