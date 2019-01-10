import React from 'react'
import _ from 'lodash'

import CodeEditor from './CodeEditor.js'
import Transformer from '../utils/Transformer.js'

const nop = () => null

export class Node extends React.Component {
  constructor (props) {
    super(props)
    this.transformer = new Transformer()
    this.state = {
      getTickFnCode: '',
      tickFn: null,
      getViewComponentCode: '',
      viewComponent: null,
      inputs: null,
      outputs: null,
      nodeState: {},
      ports: {},
      inputsVersion: 0,
      outputsVersion: 0,
    }

    this.incrementInputsVersion = () => {
      this.setState({inputsVersion: this.state.inputsVersion + 1})
    }

    this.incrementOutputsVersion = () => {
      this.setState({outputsVersion: this.state.outputsVersion + 1})
    }

    this.state.ports = props.ports || {}
    _.each(this.state.ports.inputs, (port, portId) => {
      port.registerListener({
        key: this.props.id,
        listener: this.incrementInputsVersion
      })
    })
    _.each(this.state.ports.outputs, (port, portId) => {
      port.registerListener({
        key: this.props.id,
        //listener: this.incrementOutputsVersion
        listener: (evt) => {
          console.log("evt: ", evt)
          this.incrementOutputsVersion()
        }
      })
    })

    this.state.tickFn = props.tickFn
    this.state.getTickFnCode = (
      (this.state.tickFn) ? this.state.tickFn.toString() : ''
    )
    this.state.viewComponent = props.viewComponent
    this.state.getViewComponentCode = props.getViewComponentCode
    this.actions = {
      updateNodeState: (updates) => {
        this.setState({nodeState: {...this.state.nodeState, ...updates}})
      },
      updateInputs: (updates) => {
        this.setState({inputs: {...this.state.inputs, ...updates}})
      },
      updateOutputs: (updates) => {
        this.setState({outputs: {...this.state.outputs, ...updates}})
      },
      pushOutputs: (items) => {
        _.each(items, (value, portId) => {
          this.state.ports.outputs[portId].pushValue(value)
        })
      }
    }
  }

  componentDidMount () {
    this.tick()
  }

  componentDidUpdate (prevProps, prevState) {
    this.tick({prevState})
  }

  tick({prevState = {}} = {}) {
    if (!this.state.tickFn) { return }
    this.state.tickFn.call(this, this.getFnOpts())
  }

  getFnOpts () {
    return {
      ...(_.pick(this.state, ['ports', 'nodeState'])),
      actions: this.actions
    }
  }

  shouldTick (prevState) {
    // new inputs
    if (this.state.inputsVersion !== prevState.inputsVersion) { return true }
    if (this.state.nodeState !== prevState.nodeState) { return true }
    if (this.state.tickFn !== prevState.tickFn) { return true }
    return false
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
    const node = this.props.node
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
        this.setState({tickFn: this.compileCode(code)})
      },
    })
  }

  compileCode (code) {
    // eslint-disable-next-line no-new-func
    return new Function('opts', code)
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
    const {
      ports,
      nodeState,
      actions,
      viewComponent: View
    } = this.state
    if (!View) { return }
    return (<View {...(this.getFnOpts())}/>)
  }

  renderDebug () {
    return (
      <div>
        <div>
          nodeState
          {this.jsonPre(this.state.nodeState)}
        </div>
        <div>
          inputs
          {this.jsonPre(this.state.ports.inputs)}
        </div>
        <div>
          outputs
          {this.jsonPre(this.state.ports.outputs)}
        </div>
      </div>
    )
  }

  jsonPre (obj) {
    return (<pre>{JSON.stringify(obj, null, 2)}</pre>)
  }

  getPort ({ioType, portId}) {
    return this.state.ports[ioType][portId]
  }
}

export class DraggableNode extends React.Component {
  render () {
    const decoratedProps = {
      ...this.props,
      labelRef: this.props.dragHandleRef,
      rootRef: this.props.dragContainerRef,
    }
    return (<Node {...decoratedProps} />)
  }
}

export default Node
