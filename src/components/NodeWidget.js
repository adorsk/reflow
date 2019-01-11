import React from 'react'
import _ from 'lodash'

import CodeEditor from './CodeEditor.js'
import Transformer from '../utils/Transformer.js'

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
        {this.renderEditorCells()}
        {this.renderView()}
        {this.renderDebug()}
      </div>
    )
  }

  renderLabel () {
    const node = this.state.node
    const label = node.label || node.id
    return (<div ref={this.props.labelRef}>{label}</div>)
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
    return (
      <div>
        <label>{cellKey}</label>
        <CodeEditor
          key={cellKey}
          style={{height: '100px'}}
          defaultValue={defaultValue}
          onSave={({code}) => {
            onSave(code)
          }}
        />
      </div>
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
