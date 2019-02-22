import React from 'react'
import _ from 'lodash'
import 'semantic-ui-css/semantic.min.css'
import { Label, Popup } from 'semantic-ui-react'

import { getPagePos } from '../utils/index.js'


export class PortView extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      popupIsOpen: false,
      portVersion: 0,
    }
    this.handleRef = React.createRef()
    this.labelRef = React.createRef()
    const port = props.port
    if (port && port.ctx && port.ctx.getGuiComponent) {
      this.GuiComponent = port.ctx.getGuiComponent({port})
    }
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
    const trigger = (
      <Label
        as="a"
        onClick={() => {
          this.setState({popupIsVisible: !this.state.popupIsVisible})
        }}
      >
        {port.label || port.id}
        <Label.Detail>{this.renderValueDetail({port})}</Label.Detail>
      </Label>
    )
    const leftRight = (port.ioType === 'inputs') ? 'left' : 'right'
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
        <Popup
          trigger={trigger}
          content={this.renderPopupContent({port})}
          on={null}
          open={this.state.popupIsVisible}
          position={`${leftRight} center`}
          style={{
            maxHeight: '300px',
            overflow: 'auto',
          }}
          onMount={() => {
            this.escFn = (evt) => {
              if (evt.keyCode === 27) {
                this.setState({popupIsVisible: false})
              }
            }
            document.addEventListener("keydown", this.escFn)
          }}
          onUnmount={() => {
            document.removeEventListener("keydown", this.escFn)
          }}
        />
      </span>
    )
  }

  renderPopupContent ({port}) {
    return (
      <div>
        {this.renderPortGui({port})}
        <div>
          values
          <ul>
            {
              port.values.map((value) => {
                return (<li key={_.uniqueId()}>{'' + value}</li>)
              })
            }
          </ul>
        </div>
      </div>
    )
  }

  renderValueDetail ({port}) {
    const value = port.mostRecentValue
    if (port.ctx && port.ctx.renderValueDetail) {
      return port.ctx.renderValueDetail({value, port})
    }
    return this.defaultRenderValueDetail({value, port})
  }

  defaultRenderValueDetail ({value, port}) {
    if (_.isUndefined(value)) { return null }
    return _.truncate('' + value, {length: 3})
  }

  renderPortGui ({port}) {
    const GuiComponent = this.GuiComponent
    if (!GuiComponent) { return null }
    return (<GuiComponent port={port} />)
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
        <span ref={this.handleRef}>{symbol}</span>
      </span>
    )
  }

  componentDidMount () {
    if (this.props.afterMount) { this.props.afterMount(this) }
    const { port } = this.props
    const onPortChange = _.debounce(() => {
      this.setState({portVersion: this.state.portVersion + 1})
    }, 0)
    port.changed.add(onPortChange)
    this.portObserverDisposer = () => {
      port.changed.remove(onPortChange)
    }
  }

  componentWillUnmount () {
    if (this.props.beforeUnmount) { this.props.beforeUnmount(this) }
    this.portObserverDisposer()
  }

  getHandleEl () { return this.handleRef.current }

  getHandlePagePos () {
    const handleEl = this.getHandleEl()
    let pagePos = getPagePos(handleEl)
    const bBox = handleEl.getBoundingClientRect()
    pagePos.y += bBox.height / 2
    pagePos.x += bBox.width / 2
    return pagePos
  }
}

export default PortView
