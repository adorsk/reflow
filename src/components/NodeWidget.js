import React from 'react'
import _ from 'lodash'
import { Accordion, Icon } from 'semantic-ui-react'
import 'semantic-ui-css/semantic.min.css'

import CodeEditor from './CodeEditor.js'
import Transformer from '../utils/Transformer.js'
import PortWidget from './PortWidget.js'

const nop = () => null

export class NodeWidget extends React.Component {
  constructor (props) {
    super(props)
    this.transformer = new Transformer()
    this.state = {
      node: null,
      nodeVersion: 0,
      getTickFnCode: '',
      getViewComponentCode: '',
      viewComponent: null,
      activeCells: {
        getTickFn: true,
        getViewComponent: true,
      },
    }
    const node = this.props.node
    this.state.node = node
    const tickFn = node.tickFn
    this.state.getTickFnCode = (
      (tickFn) ? tickFn.toString() : (this.props.getTickFnCode || '')
    )
    this.state.viewComponent = props.viewComponent
    this.state.getViewComponentCode = props.getViewComponentCode
  }

  componentDidMount () {
    this.state.node.addChangeListener({
      key: `${this.state.node.id}-widget`,
      listener: (() => {
        this.setState({nodeVersion: this.state.nodeVersion + 1})
      }),
    })
  }

  componentWillUnmount () {
    const { node } = this.state
    node.removeChangeListener({key: `${node.id}-widget`})
  }

  render () {
    return (
      <div
        className='node'
        ref={this.props.rootRef}
        style={this.props.style}
      >
        {this.renderLabel()}
        <div
          className="body"
          style={{
            position: 'relative'
          }}
        >
          {this.renderPorts()}
          {this.renderEditorCells()}
        </div>
        {this.renderView()}
        {this.props.showDebug ? this.renderDebug() : null}
      </div>
    )
  }

  renderLabel () {
    const node = this.state.node
    const label = node.label || node.id
    return (
      <label
        ref={this.props.labelRef}
        style={{
          display: 'block',
          margin: 'auto',
          textAlign: 'center',
          background: 'gray',
          width: '84%',
          borderRadius: '5px 5px 0 0',
          cursor: 'pointer',
        }}
      >
        {label}
      </label>
  )
  }

  renderPorts () {
    return (
      <>
        {this.renderInputPorts()}
        {this.renderOutputPorts()}
      </>
    )
  }

  renderInputPorts () {
    const { node } = this.state
    const ports = node.getInputPorts()
    return (
      <div
        className="input-ports"
        style={{
          position: 'absolute',
          right: '100%',
          top: '0',
        }}
      >
        {
          _.map(ports, (port) => {
            return (<PortWidget port={port} />)
          })
        }
      </div>
    )
  }

  renderOutputPorts () {
    const { node } = this.state
    const ports = node.getOutputPorts()
    return (
      <div
        className="output-ports"
        style={{
          position: 'absolute',
          left: '100%',
          top: '0',
        }}
      >
        {
          _.map(ports, (port) => {
            return (<PortWidget port={port} />)
          })
        }
      </div>
    )
  }

  renderEditorCells () {
    return (
      <div
        className="cells"
        style={{
          width: '100%',
          borderRadius: 5,
          border: 'thin solid gray',
        }}
      >
        {this.renderGetTickFnCell()}
        {this.renderGetViewComponentCell()}
      </div>
    )
  }

  renderEditorCell ({cellKey, onSave = nop, defaultValue = ''}) {
    const isActive = !!this.state.activeCells[cellKey]
    return (
      <Accordion exclusive={false}>
        <Accordion.Title
          active={isActive}
          index={cellKey}
          onClick={() => {
            this.setState({
              activeCells: {
                ...this.state.activeCells,
                [cellKey]: !isActive,
              }
            })
          }}
        >
          <Icon name='dropdown' />
          {cellKey}
        </Accordion.Title>
        <Accordion.Content active={isActive}>
          <CodeEditor
            key={cellKey}
            style={{height: '100px'}}
            defaultValue={defaultValue}
            onSave={({code}) => {
              onSave(code)
            }}
          />
        </Accordion.Content>
      </Accordion>
    )
  }

  renderGetTickFnCell () {
    return this.renderEditorCell({
      cellKey: 'getTickFn',
      defaultValue: _.get(this.state, 'getTickFnCode'),
      onSave: (code) => {
        const getTickFnFn = this.compileCode(code)
        this.setTickFn(getTickFnFn())
      },
    })
  }

  compileCode (code) {
    // eslint-disable-next-line no-new-func
    return new Function('opts', code)
  }

  setTickFn (tickFn) {
    const node = this.state.node
    node.setTickFn(tickFn)
  }

  renderGetViewComponentCell () {
    return this.renderEditorCell({
      cellKey: 'getViewComponent',
      defaultValue: _.get(this.state, 'getViewComponentCode'),
      onSave: (code) => {
        const transpiledCode = this.transformer.transform(code).code
        // eslint-disable-next-line no-new-func
        const getViewComponentFn = new Function('React', transpiledCode)
        this.setState({viewComponent: getViewComponentFn(React)})
      },
    })

  }

  renderView () {
    const { node, viewComponent: View } = this.state
    if (!View) { return }
    return (<View {...(this.getFnOpts())}/>)
  }

  renderDebug () {
    return this.jsonPre(this.state.node.toJson())
  }

  jsonPre (obj) {
    return (<pre>{JSON.stringify(obj, null, 2)}</pre>)
  }
}

export class DraggableNodeWidget extends React.Component {
  render () {
    const decoratedProps = {
      ...this.props,
      labelRef: this.props.dragHandleRef,
      rootRef: this.props.dragContainerRef,
    }
    return (<NodeWidget {...decoratedProps} />)
  }
}

export default NodeWidget
