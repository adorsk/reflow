import React from 'react'
import _ from 'lodash'
import { Button, Divider, List, Modal } from 'semantic-ui-react'
import { saveAs } from 'file-saver'

import GraphView from './GraphView.js'
import ObservableMapStore from '../engine/ObservableMapStore.js'
import Cryo from '../utils/cryo/cryo.js'
import dedent from '../utils/dedent.js'
import { transformAndCompileCode } from '../utils/index.js'
import CodeEditor from './CodeEditor.js'
import reflowCtx from '../utils/reflowCtx.js'


class GraphEditor extends React.Component {

  static defaultProps = {
    graphViewStore: new ObservableMapStore(),
  }

  constructor (opts) {
    super(opts)
    this.graphViewRef = React.createRef()
    this.state = {
      currentWireSpec: null,
      loadFromStoreModalIsVisible: false,
      wireModalIsVisible: false,
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
            this.renderLoadFromStoreModal()): null
        }
        {
          (this.state.wireModalIsVisible) ? (
            this.renderWireModal()): null
        }
        <div
          style={{
            position: 'relative',
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              width: '100%',
              flex: `0 0 ${topSectionHeight}`
            }}
          >
            {this.renderTopSectionContent({graph})}
          </div>

          <div
            style={{
              width: '100%',
              flex: '1 1 auto',
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
                      this.props.reflowStore.getItem(key)
                    )
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
        {this.renderAddWireButton()}
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
    const nodeId = _.uniqueId('node-')
    const specFactorySrcCode = this.generateNodeSrcBoilerplateCode({nodeId})
    const specFactory = transformAndCompileCode(specFactorySrcCode)
    const nodeSpec = await specFactory({reflowCtx})
    specFactory.srcCode = specFactorySrcCode
    nodeSpec.specFactoryFn = specFactory
    graph.addNodeFromSpec({nodeSpec})
  }

  generateNodeSrcBoilerplateCode ({nodeId}) {
    const boilerplateCode = dedent(`
    async ({reflowCtx}) => {
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

  renderAddWireButton () {
    return (
      <Button
        content="add wire"
        onClick={async () => {
          this.setState({wireModalIsVisible: true})
          const blankWireSpec = await this.generateBlankWireSpec()
          this.setState({currentWireSpec: blankWireSpec})
        }}
      />
    )
  }

  async generateBlankWireSpec () {
    const specFactorySrcCode = dedent(`
    async () => {
      const wireSpec = {
        src: 'srcNodeId:outPortId',
        dest: 'destNodeId:inPortId',
      }
      return wireSpec
    }
    `)
    const wireSpec = this.createWireSpecFromSrcCode(specFactorySrcCode)
    return wireSpec
  }

  async createWireSpecFromSrcCode (srcCode) {
    const specFactory = transformAndCompileCode(srcCode)
    specFactory.srcCode = srcCode
    const wireSpec = await specFactory()
    wireSpec.specFactoryFn = specFactory
    return wireSpec
  }

  renderWireModal () {
    const { currentWireSpec } = this.state
    return (
      <Modal
        onClose={() => this.setState({wireModalIsVisible: false})}
        open={true}
        size='small'
        closeOnEscape={false}
      >
        <Modal.Content>
          {
            currentWireSpec ? (
              this.renderWireSpecEditor({wireSpec: currentWireSpec})
            ) : null
          }
        </Modal.Content>
      </Modal>
    )
  }

  renderWireSpecEditor ({wireSpec}) {
    return (
      <CodeEditor
        cmOpts={{keyMap: 'vim'}}
        style={{
          width: '100%',
          minHeight: '300px',
        }}
        defaultValue={wireSpec.specFactoryFn.srcCode}
        onSave={async ({code}) => {
          const wireSpec = await this.createWireSpecFromSrcCode(code)
          this.currentGraph.addWireFromSpec({wireSpec})
        }}
      />
    )
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
    console.log(
      "saved to store",
      {key: serialization.key, value: stringifiedSerialization}
    )
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
