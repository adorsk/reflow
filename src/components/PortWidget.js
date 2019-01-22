import React from 'react'

import 'semantic-ui-css/semantic.min.css'
import { Popup } from 'semantic-ui-react'


export class PortWidget extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      showPopup: true,
    }
    this.handleRef = React.createRef()
    this.labelRef = React.createRef()
  }

  render () {
    const { port } = this.props
    const style = Object.assign({
      position: 'relative',
    }, this.props.style)
    return (
      <div
        className='port'
        style={style}
      >
        {this.renderHandle({port})}
        {this.renderLabel({port})}
      </div>
    )
  }

  renderLabel ({port}) {
    let labelText = (<span>{port.label || port.id}</span>)
    if (port.renderView) {
      labelText = (
        <Popup
          trigger={labelText}
          content={this.renderView({port})}
          on='click'
          position='left center'
        />
      )
    }
    return (
      <span
        key="label"
        style={{
          padding: '2px .3em',
          display: 'inline-block',
          verticalAlign: 'middle',
          width: '100%',
        }}
      >
        {labelText}
      </span>
    )
  }

  renderView ({port}) {
    console.log('yo')
    return port.renderView({port})
  }

  renderHandle ({port}) {
    const leftRight = (port.ioType === 'inputs') ? 'left' : 'right'
    let offset = '-0.35em'
    let symbol = '■'
    symbol = '▶'
    symbol = '▮'
    symbol = '▪'
    symbol = '▯'
    offset = '-0.42em'
    symbol = '◉'
    symbol = '●'
    symbol = '◍'
      /*
    offset = '-0.4em'
    symbol = '▤'
    symbol = '▦'
    */
    return (
      <span
        key="handle"
        ref={this.handleRef}
        data-portid={port.id}
        data-nodeid={port.node && port.node.id}
        className='port-handle'
        style={{
          position: 'absolute',
          verticalAlign: 'middle',
          zIndex: '-1',
          [leftRight]: offset,
          color: 'hsl(0, 0%, 30%)',
        }}
      >
        {symbol}
      </span>
    )
  }

  componentDidMount () {
    if (this.props.afterMount) { this.props.afterMount(this) }
  }

  componentWillUnmount () {
    if (this.props.beforeUnmount) { this.props.beforeUnmount(this) }
  }

  getHandleEl () { return this.handleRef.current }
}

export default PortWidget
