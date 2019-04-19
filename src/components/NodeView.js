import React from 'react'
import _ from 'lodash'
import { Button, Card, Message } from 'semantic-ui-react'

import CodeEditor from './CodeEditor.js'
import WindowPortal from './WindowPortal.js'
import PortView from './PortView.js'


export class NodeView extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      nodeVersion: 0,
      srcPopupIsVisible: false,
    }
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
        {this.renderGui()}
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
    const frob = (
      <React.Fragment>
        <Button
          size='mini'
          compact={true}
          onClick={() => {
            node.state.set('srcIsOpen', !(node.state.get('srcIsOpen')))
          }}
          content='src'
        />
        {node.state.get('srcIsOpen') ? this.renderCodeEditorPortal(node) : null}
      </React.Fragment>
    )
    return frob
  }

  renderCodeEditorPortal (node) {
    return (
      <WindowPortal
        closeOnUnmount={false}
        windowName={[node.id, 'src'].join(':')}
        styles={[...CodeEditor.styles]}
        beforeUnload={() => node.state.set('srcIsOpen', false)}
      >
        <CodeEditor
          style={{
            width: '100%',
            height: 'auto',
          }}
          defaultValue={node.srcCode || ''}
          onSave={async ({code}) => {
            await this.props.onChangeSrcCode({node, code})
          }}
        />
      </WindowPortal>
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

  renderGui () {
    const { node } = this.props
    const GuiComponent = this.getGuiComponent({node})
    if (! GuiComponent) { return null }
    const renderGui = () => (
      <div
        style={{
          backgroundColor: 'hsl(0, 0%, 50%)',
        }}
      >
        <GuiComponent node={node} />
      </div>
    )
    const usePortalForGui = node.state.get('usePortalForGui')
    const showView = node.state.has('showView') ? node.state.get('showView') : true
    return (
      <div className="view">
        <Card>
          <Card.Content>
            <Card.Meta>
              <Button.Group size="mini" compact>
                <Button
                  icon="clone"
                  onClick={() => node.state.set('usePortalForGui', !usePortalForGui)}
                />
                <Button
                  icon={showView ? 'hide' : 'eye'}
                  onClick={() => node.state.set('showView', !showView)}
                />
              </Button.Group>
            </Card.Meta>
            <Card.Description>
              {
                (usePortalForGui) ? (
                  <WindowPortal
                    windowName={node.id}
                    beforeUnload={() => node.state.set('usePortalForGui', false)}
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

  getGuiComponent ({node}) {
    if (node.ctx && node.ctx.getGuiComponent) {
      return node.ctx.getGuiComponent({node, React})
    }
    return null
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
