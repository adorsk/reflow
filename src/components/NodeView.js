import React from 'react'
import _ from 'lodash'
import { Button, Message } from 'semantic-ui-react'

import WindowPortal from './WindowPortal.js'
import PortView from './PortView.js'

export class NodeView extends React.Component {
  constructor (props) {
    super(props)
    this.state = { nodeVersion: 0 }
    this.GuiComponent = this.getGuiComponent({node: props.node})
    this.portViews = {
      inputs: {},
      outputs: {},
    }
  }

  componentDidMount () {
    const { node } = this.props
    if (! node ) { return }
    this.onNodeChanged = _.debounce(() => {
      this.setState({nodeVersion: this.state.nodeVersion + 1})
    }, 0)
    node.changed.add(this.onNodeChanged)
    if (this.props.afterMount) { this.props.afterMount(this) }
  }

  getGuiComponent ({node}) {
    if (node.ctx && node.ctx.getGuiComponent) {
      return node.ctx.getGuiComponent({node})
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
      width: '200px',
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
        {this.renderErrors()}
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
              <PortView
                key={port.id}
                style={{width: '100%'}}
                port={port}
                ref={(el) => {
                  this.portViews[ioType][port.id] = el
                }}
              />
            )
          })
        }
      </div>
    )
  }

  renderErrors () {
    const { node } = this.props
    const errors = node.errors
    if (! errors || errors.length < 1) { return null }
    return (
      <Message negative style={{maxHeight: '6em', overflow: 'auto'}}>
        <ul>
          {errors.map((err, i) => (
            <li key={i}>{'' + err}</li>
          )) }
        </ul>
      </Message>
    )
  }

  renderView () {
    const { node } = this.props
    if (!this.GuiComponent) { return }
    const GuiComponent = this.GuiComponent
    const gui = (<GuiComponent node={node} />)
    const useWindowPortal = node.state.get('useWindowPortal')
    return (
      <div className="view">
        {
          (useWindowPortal) ? (
            <div>
              <Button
                content="pop it back"
                onClick={() => node.state.set('useWindowPortal', false)}
              />
              <WindowPortal windowName={node.id}>{gui}</WindowPortal>
            </div>
          ) : (
            <div>
              <Button
                content="pop it out!"
                onClick={() => node.state.set('useWindowPortal', true)}
              />
              {gui}
            </div>
          )
        }
      </div>
    )
  }

  renderDebug () {
    return (<pre>{this.props.node.toString()}</pre>)
  }

  getPortView ({ioType, portId}) {
    return this.portViews[ioType][portId]
  }
}

export class DraggableNodeView extends React.Component {
  render () {
    const decoratedProps = {
      ...this.props,
      labelRef: this.props.dragHandleRef,
      rootRef: this.props.dragContainerRef,
    }
    return (<NodeView {...decoratedProps} />)
  }
}

export default NodeView
