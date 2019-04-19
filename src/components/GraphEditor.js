import React from 'react'
import _ from 'lodash'
import { Button, Divider, List, Modal } from 'semantic-ui-react'
import { saveAs } from 'file-saver'

import GraphView from './GraphView.js'
import ObservableMapStore from '../engine/ObservableMapStore.js'
import Cryo from '../utils/cryo/cryo.js'
import dedent from '../utils/dedent.js'
import { transformAndCompileCode } from '../utils/index.js'


class GraphEditor extends React.Component {

  static defaultProps = {
    graphViewStore: new ObservableMapStore(),
  }

  constructor (opts) {
    super(opts)
    this.graphViewRef = React.createRef()
    this.state = {
      loadFromStoreModalIsVisible: false,
      keysFromStore: [],
    }
  }

  render () {
    const { graph } = this.props
    if (! graph) { return null }
    const topSectionHeight = '60px'
    return (
      <div style={this.props.style}>
        {
          (this.state.loadFromStoreModalIsVisible) ? (
            this.renderLoadFromStoreModal()
          ): null
        }
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

  renderLoadFromStoreModal () {
    const { loadingKeysFromStore, keysFromStore } = this.state
    const content = (
      (loadingKeysFromStore) ? ("loading...") : (
        <List>
          {
            keysFromStore.map((key) => {
              return (
                <List.Item
                  key={key}
                  content={key}
                  onClick={async () => {
                    const stringifiedSerialization = await (
                      this.props.reflowStore.getItem(key))
                    this.setState({loadFromStoreModalIsVisible: false})
                    this.loadFromStringifiedSerialization(
                      stringifiedSerialization)
                  }} />
              )
            })
          }
        </List>
      )
    )
    return (
      <Modal
        onClose={() => this.setState({loadFromStoreModalIsVisible: false})}
        open={true}
        size='small'
      >
        <Modal.Content>{content}</Modal.Content>
      </Modal>
    )
  }

  renderTopSectionContent ({graph}) {
    return (
      <div>
        <h3>{graph.label}</h3>
        {this.renderAddNodeButton()}
        {this.renderSaveButton()}
        {this.renderDownloadButton()}
        {this.renderLoadFromFileButton()}
        {this.renderLoadFromStoreButton()}
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

  async addBlankNodeToGraph ({graph}) {
    const nodeId = _.uniqueId('node:')
    const specFactorySrcCode = this.generateNodeSrcBoilerplateCode({nodeId})
    const specFactory = transformAndCompileCode(specFactorySrcCode)
    const nodeSpec = await specFactory()
    nodeSpec.srcCode = specFactorySrcCode
    graph.addNodeFromSpec({nodeSpec})
  }

  generateNodeSrcBoilerplateCode ({nodeId}) {
    const boilerplateCode = dedent(`
    async () => {
      const nodeSpec = {
        id: '${nodeId}',
        label: '${nodeId}',
        ctx: {
          getGuiComponent: ({node, React}) => {
            class GuiComponent extends React.Component {
              render () {
                const { node } = this.props
                return (<div>{node.label}</div>)
              }
            }
            return GuiComponent
          },
        }
      }
      return nodeSpec
    }
    `)
    return boilerplateCode
  }

  renderSaveButton () {
    return (
      <Button
        content="save to store"
        onClick={() => this.save()}
      />
    )
  }

  save () {
    const graphView = this.graphViewRef.current
    const serialization = graphView.getSerialization()
    const stringifiedSerialization = Cryo.stringify(serialization)
    this.props.reflowStore.setItem(serialization.key, stringifiedSerialization)
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
    const serialization = graphView.getSerialization()
    const stringifiedSerialization = Cryo.stringify(serialization)
    const blob = new Blob([stringifiedSerialization], {type: 'text/plain'})
    saveAs(blob, this.currentGraph.id + '.reflow')
  }

  renderLoadFromFileButton () {
    return (
      <Button
        content="load from file"
        onClick={this.onClickLoadFromFileButton.bind(this)}
      />
    )
  }

  onClickLoadFromFileButton () {
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
    readPromise.then((stringifiedSerialization) => {
      return this.loadFromStringifiedSerialization(stringifiedSerialization)
    })
  }

  async loadFromStringifiedSerialization (stringifiedSerialization) {
    const serialization = Cryo.parse(stringifiedSerialization)
    const graphViewProps = await GraphView.deserializeSerialization({
      serialization
    })
    this.props.actions.setCurrentGraphViewProps({graphViewProps})
  }

  renderLoadFromStoreButton () {
    return (
      <Button
        content="load from store"
        onClick={this.onClickLoadFromStoreButton.bind(this)}
      />
    )
  }

  async onClickLoadFromStoreButton () {
    this.setState({
      loadFromStoreModalIsVisible: true,
      loadingKeysFromStore: true
    })
    const keysFromStore = await this.props.reflowStore.keys()
    this.setState({keysFromStore, loadingKeysFromStore: false})
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
