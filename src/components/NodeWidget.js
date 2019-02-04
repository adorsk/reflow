import React from 'react'
import _ from 'lodash'

import PortWidget from './PortWidget.js'

const nop = () => null

export class NodeWidget extends React.Component {
  constructor (props) {
    super(props)
    this.state = { nodeVersion: 0 }
    this.ViewComponent = this.getViewComponent({node: props.node})
    this.portWidgets = {
      inputs: {},
      outputs: {},
    }
  }

  componentDidMount () {
    const { node } = this.props
    if (! node ) { return }
    this.onNodeChanged = () => {
      this.setState({nodeVersion: this.state.nodeVersion + 1})
    }
    node.changed.add(this.onNodeChanged)
    if (this.props.afterMount) { this.props.afterMount(this) }
  }

  getViewComponent ({node}) {
    if (node.ctx && node.ctx.getViewComponent) {
      return node.ctx.getViewComponent({node})
    }
    return null
  }

  componentWillUnmount () {
    const { node } = this.props
    if (! node) { return }
    if (this.onNodeChange) {
      node.changed.remove(this.onNodeChanged)
    }
    if (this.props.beforeUnmount) { this.props.beforeUnmount(this) }
  }

  render () {
    const style = Object.assign({
      width: '150px',
      borderRadius: '5px',
      border: 'thin solid hsl(0, 0%, 90%)',
    }, this.props.style)
    return (
      <div
        className='node'
        ref={this.props.rootRef}
        style={style}
      >
        {this.renderLabel()}
        {this.renderPorts()}
        {this.renderView()}
        {this.props.showDebug ? this.renderDebug() : null}
      </div>
    )
  }

  renderLabel () {
    const { node } = this.props
    const label = node.label || node.id
    return (
      <label
        ref={this.props.labelRef}
        style={{
          display: 'block',
          textAlign: 'center',
          background: 'gray',
          width: '100%',
          borderBottom: 'thin solid gray',
          cursor: 'pointer',
          borderRadius: '5px 5px 0 0',
        }}
      >
        {label}
      </label>
  )
  }

  renderPorts () {
    return (
      <div
        className="ports"
        style={{
          display: 'grid',
          gridTemplateColumns: '[left] 1fr [right] 1fr',
          background: 'hsl(0, 0%, 95%)',
          border: 'thin solid hsl(0, 0%, 90%)',
        }}
      >
        <div style={{gridColumnStart: 'left'}}>
          {this.renderPortsGroup({ioType: 'inputs'})}
        </div>
        <div style={{gridColumnStart: 'right'}}>
          {this.renderPortsGroup({ioType: 'outputs'})}
        </div>
      </div>
    )
  }

  renderPortsGroup ({ioType}) {
    const { node } = this.props
    const leftRight = (ioType === 'inputs') ? 'left' : 'right'
    const ports = node.getPortsOfType({ioType})
    return (
      <div
        className={`${ioType}-ports`}
        style={{
          width: '100%',
          textAlign: leftRight,
        }}
      >
        {
          _.map(ports, (port) => {
            return (
              <PortWidget
                key={port.id}
                style={{width: '100%'}}
                port={port}
                ref={(el) => {
                  this.portWidgets[ioType][port.id] = el
                }}
              />
            )
          })
        }
      </div>
    )
  }

  renderView () {
    const { node } = this.props
    if (!this.ViewComponent) { return }
    const ViewComponent = this.ViewComponent
    return (
      <div className="view">
        <ViewComponent node={node} />
      </div>
    )
  }

  renderDebug () {
    return (<pre>{this.props.node.toString()}</pre>)
  }

  getPortWidget ({ioType, portId}) {
    return this.portWidgets[ioType][portId]
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
