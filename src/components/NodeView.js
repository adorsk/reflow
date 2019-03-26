import React from 'react'
import _ from 'lodash'
import { Button, Card, Message, Popup } from 'semantic-ui-react'

import WindowPortal from './WindowPortal.js'
import PortView from './PortView.js'

export class NodeView extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      nodeVersion: 0,
      srcPopupIsVisible: false,
    }
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
        {this.renderTopBar()}
        {this.renderPorts()}
        {this.renderErrors()}
        {this.renderView()}
        {this.props.showDebug ? this.renderDebug() : null}
      </div>
    )
  }

  renderTopBar () {
    const { node } = this.props
    const label = node.label || node.id
    const topBar = (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          padding: '.25em',
          background: 'gray',
          width: '100%',
          borderBottom: 'thin solid gray',
          borderRadius: '5px 5px 0 0',
        }}
      >
        <label
          style={{
            alignSelf: 'stretch',
            cursor: 'grab',
            flex: '1 0 auto',
            textAlign: 'center',
          }}
          ref={this.props.labelRef}
        >
          {label}
        </label>
        <span style={{alignSelf: 'end'}}>
          {this.renderSrcEditorFrob({node})}
        </span> 
      </div>
    )
    return topBar
  }

  renderSrcEditorFrob ({node}) {
    const trigger = (
      <Button
        size='mini'
        compact={true}
        onClick={() => {
          this.setState({srcPopupIsVisible: !this.state.srcPopupIsVisible})
        }}
        content='src'
      />
    )
    const frob = (
      <Popup
        trigger={trigger}
        content={this.renderSrcEditor({node})}
        on={null}
        open={this.state.srcPopupIsVisible}
        position='right center'
        style={{
          maxHeight: '300px',
          overflow: 'auto',
        }}
      />
    )
    return frob
  }

  renderSrcEditor ({node}) {
    return (
      <div>srcEditor</div>
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
    const renderGui = () => (
      <div
        style={{
          backgroundColor: 'hsl(0, 0%, 50%)',
        }}
      >
        <GuiComponent node={node} />
      </div>
    )
    const useWindowPortal = node.state.get('useWindowPortal')
    const showView = node.state.has('showView') ? node.state.get('showView') : true
    return (
      <div className="view">
        <Card>
          <Card.Content>
            <Card.Meta>
              <Button.Group size="mini" compact>
                <Button
                  icon="clone"
                  onClick={() => node.state.set('useWindowPortal', !useWindowPortal)}
                />
                <Button
                  icon={showView ? 'hide' : 'eye'}
                  onClick={() => node.state.set('showView', !showView)}
                />
              </Button.Group>
            </Card.Meta>
            <Card.Description>
              {
                (useWindowPortal) ? (
                  <WindowPortal
                    windowName={node.id}
                    onClose={() => node.state.set('useWindowPortal', false)}
                  >
                    {renderGui()}
                  </WindowPortal>
                ) : ( (showView) ? renderGui() : null )
              }
            </Card.Description>
          </Card.Content>
        </Card>
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
