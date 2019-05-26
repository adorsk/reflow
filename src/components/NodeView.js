import React from 'react'
import _ from 'lodash'
import { Button, Card, Message } from 'semantic-ui-react'

import CodeEditor from './CodeEditor.js'
import WindowPortal from './WindowPortal.js'
import PortView from './PortView.js'
import ErrorBoundary from './ErrorBoundary.js'


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
    return (
      <div
        className='node'
        ref={this.props.rootRef}
        style={Object.assign({zIndex: 1}, this.props.style)}
      >
        <div style={{position: 'relative'}}>
          {this.renderIORails()}
          {this.renderPanes()}
        </div>
      </div>
    )
  }

  renderIORails () {
    const offset = '1'
    return (
      <div
        style={{
          position: 'absolute',
          top: -offset,
          left: -offset,
        }}
      >
        {this.renderInputsRail()}
        {this.renderOutputsRail()}
      </div>
    )
  }

  renderInputsRail () {
    const { node } = this.props
    const ioType = 'inputs'
    const portViews = _.map(node.getPortsOfType({ioType}), (port) => {
      return (
        <PortView
          key={port.id}
          handleSide='left'
          port={port}
          ref={(el) => {
            this.portViews[ioType][port.id] = el
          }}
        />
      )
    })
    return (
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: '100%',
          borderRight: 'thin solid gray',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
        }}
      >
        {portViews}
      </div>
    )
  }

  renderOutputsRail () {
    const { node } = this.props
    const ioType = 'outputs'
    const portViews = _.map(node.getPortsOfType({ioType}), (port) => {
      return (
        <PortView
          key={port.id}
          handleSide='top'
          port={port}
          ref={(el) => {
            this.portViews[ioType][port.id] = el
          }}
        />
      )
    })
    return (
      <div
        style={{
          position: 'absolute',
          left: 0,
          bottom: '100%',
          borderBottom: 'thin solid gray',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-end',
        }}
      >
        {portViews}
      </div>
    )
  }

  renderPanes () {
    return (
      <div
        style={{
          display: 'flex',
        }}
      >
        {this.renderCodePane()}
        {this.renderGuiPane()}
      </div>
    )
  }

  renderCodePane () {
    const style = {
      width: '200px',
      borderRadius: '5px',
      border: 'thin solid hsl(0, 0%, 90%)',
    }
    return (
      <div style={style}>
        {this.renderLabel()}
        {this.renderCodeEditor()}
      </div>
    )
  }

  renderLabel () {
    const {node} = this.props
    return (
      <div
        ref={this.props.labelRef}
        style={{
          backgroundColor: '#333',
          color: '#ddd',
          padding: '.1em .5em',
        }}
      >
        {node.label || node.id}
      </div>
    )
  }

  renderCodeEditor () {
    const {node} = this.props
    return (
      <CodeEditor
        cmOpts={{keyMap: 'vim'}}
        style={{
          width: '100%',
          height: 'auto',
        }}
        defaultValue={node.srcCode || ''}
        onSave={async ({code}) => {
          await this.props.onChangeSrcCode({node, code})
        }}
      />
    )
  }

  renderGuiPane () {
    const style = {
      width: '200px',
      borderRadius: '5px',
      border: 'thin solid hsl(0, 0%, 90%)',
    }
    return (
      <div style={style}>
        {this.renderGui()}
      </div>
    )
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

  renderCodeEditorPortal () {
    const {node} = this.props
    return (
      <WindowPortal
        closeOnUnmount={false}
        windowName={[node.id, 'src'].join(':')}
        styles={[...Object.values(CodeEditor.styles)]}
        scripts={[...Object.values(CodeEditor.scripts)]}
        beforeUnload={() => node.state.set('srcIsOpen', false)}
      >
        {this.renderCodeEditor()}
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
        <ErrorBoundary key={Math.random()}>
          <GuiComponent node={node} />
        </ErrorBoundary>
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
