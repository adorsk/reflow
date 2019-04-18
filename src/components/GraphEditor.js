import React from 'react'
import _ from 'lodash'
import { Button, Divider } from 'semantic-ui-react'
import { saveAs } from 'file-saver'

import GraphView from './GraphView.js'
import ObservableMapStore from '../engine/ObservableMapStore.js'


class GraphEditor extends React.Component {

  static defaultProps = {
    graphViewStore: new ObservableMapStore(),
  }

  constructor (opts) {
    super(opts)
    this.graphViewRef = React.createRef()
  }

  render () {
    const { graph } = this.props
    if (! graph) { return null }
    const topSectionHeight = '60px'
    return (
      <div style={this.props.style}>
        <div
          style={{
            position: 'relative',
            height: '100%',
            width: '100%',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              width: '100%',
              height: topSectionHeight,
            }}
          >
            {this.renderTopSectionContent({graph})}
          </div>

          <div
            style={{
              position: 'absolute',
              top: topSectionHeight,
              width: '100%',
              bottom: 0,
            }}
          >
            {this.renderBottomSectionContent({graph})}
          </div>

        </div>
      </div>
    )
  }

  renderTopSectionContent ({graph}) {
    return (
      <div>
        <h3>{graph.label}</h3>
        {this.renderAddNodeButton()}
        {this.renderSaveButton()}
        {this.renderDownloadButton()}
        <Divider />
      </div>
    )
  }

  renderAddNodeButton () {
    return (
      <Button
        content="add node"
        onClick={() => {
          this.addBlankNodeToGraph({graph: this.currentGraph})
        }}
      />
    )
  }

  get currentGraph () { return this.graphViewRef.current.props.graph }

  addBlankNodeToGraph ({graph}) {
    const blankNodeSpec = {
      label: _.uniqueId('node:'),
    }
    graph.addNodeFromSpec({nodeSpec: blankNodeSpec})
  }

  renderSaveButton () {
    return (
      <Button
        content="save"
        onClick={() => this.save()}
      />
    )
  }

  save () {
    const graphView = this.graphViewRef.current
    const stringifiedSerialization = graphView.getStringifiedSerialization()
    console.log('save', stringifiedSerialization)
  }

  renderDownloadButton () {
    return (
      <Button
        content="download"
        onClick={() => this.generateDownload()}
      />
    )
  }

  generateDownload () {
    const graphView = this.graphViewRef.current
    const stringifiedSerialization = graphView.getStringifiedSerialization()
    const blob = new Blob([stringifiedSerialization], {type: 'text/plain'})
    saveAs(blob, this.currentGraph.id + '.reflow')
  }

  renderBottomSectionContent ({graph}) {
    const { graphViewStore } = this.props
    return (
      <GraphView
        ref={this.graphViewRef}
        style={{
          width: '100%',
          height: '100%',
        }}
        graph={graph}
        store={graphViewStore}
      />
    )
  }
}

export default GraphEditor
