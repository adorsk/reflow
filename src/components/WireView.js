import React from 'react'
import _ from 'lodash'
import { Button } from 'semantic-ui-react'

import CodeEditor from './CodeEditor.js'
import WindowPortal from './WindowPortal.js'


export class WireView extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      wireVersion: 0,
      srcPopupIsVisible: false,
    }
    this.portViews = {
      inputs: {},
      outputs: {},
    }
  }

  componentDidMount () {
    const { wire } = this.props
    if (! wire ) { return }
    this.onWireChanged = _.debounce(() => {
      this.setState({wireVersion: this.state.wireVersion + 1})
    }, 0)
    wire.changed.add(this.onWireChanged)
    if (this.props.afterMount) { this.props.afterMount(this) }
  }

  componentWillUnmount () {
    const { wire } = this.props
    if (! wire) { return }
    if (this.onWireChange) {
      wire.changed.remove(this.onWireChanged)
    }
    if (this.props.beforeUnmount) { this.props.beforeUnmount(this) }
  }

  render () {
    return (
      <div
        className='wire'
        ref={this.props.rootRef}
        style={Object.assign(
          {
            pointerEvents: 'none',
          },
          this.props.style
        )}
      >
        <div style={{position: 'relative'}}>
          {this.renderPanes()}
        </div>
      </div>
    )
  }

  renderPanes () {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          pointerEvents: 'none',
        }}
      >
        {this.renderLabel()}
        {this.renderCodePane()}
      </div>
    )
  }

  renderCodePane () {
    const style = {
      borderRadius: '5px',
      border: 'thin solid hsl(0, 0%, 90%)',
      pointerEvents: 'all',
    }
    return (
      <div style={style}>
        {this.renderCodeEditor()}
      </div>
    )
  }

  renderLabel () {
    const {wire} = this.props
    return (
      <div
        ref={this.props.labelRef}
        style={{
          alignSelf: 'stretch',
          backgroundColor: '#333',
          color: '#ddd',
          padding: '.1em .5em',
          pointerEvents: 'all',
        }}
      >
        {wire.label || wire.id}
      </div>
    )
  }

  renderCodeEditor () {
    const {wire} = this.props
    return (
      <CodeEditor
        cmOpts={{keyMap: 'vim'}}
        style={{
          fontSize: '8px',
        }}
        defaultValue={wire.srcCode || ''}
        onSave={async ({code}) => {
          await this.props.onChangeSrcCode({wire, code})
        }}
      />
    )
  }

  renderSrcEditorFrob ({wire}) {
    const frob = (
      <React.Fragment>
        <Button
          size='mini'
          compact={true}
          onClick={() => {
            wire.state.set('srcIsOpen', !(wire.state.get('srcIsOpen')))
          }}
          content='src'
        />
        {wire.state.get('srcIsOpen') ? this.renderCodeEditorPortal(wire) : null}
      </React.Fragment>
    )
    return frob
  }

  renderCodeEditorPortal () {
    const {wire} = this.props
    return (
      <WindowPortal
        closeOnUnmount={false}
        windowName={[wire.id, 'src'].join(':')}
        styles={[...Object.values(CodeEditor.styles)]}
        scripts={[...Object.values(CodeEditor.scripts)]}
        beforeUnload={() => wire.state.set('srcIsOpen', false)}
      >
        {this.renderCodeEditor()}
      </WindowPortal>
    )
  }
}

export class DraggableWireView extends React.Component {
  render () {
    const decoratedProps = {
      ...this.props,
      labelRef: this.props.dragHandleRef,
      rootRef: this.props.dragContainerRef,
    }
    return (<WireView {...decoratedProps} />)
  }
}

export default WireView
