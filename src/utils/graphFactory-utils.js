import React from 'react'
import _ from 'lodash'
import { ChromePicker } from 'react-color'


export const NumberInput = (props) => {
  const { port } = props
  return (
    <input onBlur={(evt) => {
      let value
      try { 
        value = parseFloat(evt.target.value)
      } catch (err) {}
      port.pushValue(value)
    }} />
  )
}

export class ColorInput extends React.Component {
  state = { color: {h: 0, s: 0, l: 0} }
  render () {
    const { port } = this.props
    return (
      <ChromePicker
        color={this.state.color}
        onChange={(color) => this.setState({color})}
        onChangeComplete={(color) => { port.pushValue(color.hex) }}
      />
    )
  }
}

export const ColorIcon = (props) => {
  return (
    <div style={{
      height: '1em',
      width: '1.4em',
      background: props.color,
    }}/>
  )
}

export const createColorPortSpec = (opts) => {
  const portSpec = {
    initialValues: (opts.initialValues || ['blue']),
    ctx: {
      getGuiComponent: () => ColorInput,
      renderPacketSummary: ({packet}) => {
        return (packet) ? (<ColorIcon color={packet.data} />) : null
      },
      renderPacketDetail: ({packet}) => {
        return (packet) ? (
          <span>{packet.data} <ColorIcon color={packet.data} /></span>
        ) : null
      }
    }
  }
  return portSpec
}

export class InputsError extends Error {}

export const getInputValues = ({node, inputKeys}) => {
  const inputValues = {}
  for (let inputKey of inputKeys) {
    const port = node.getPort('inputs:' + inputKey)
    const value = _.get(port.mostRecentPacket, 'data')
    if (_.isUndefined(value)) {
      throw new InputsError(`'${inputKey}' is undefined`)
    }
    inputValues[inputKey] = value
  }
  return inputValues
}

export function generateColorPortSpec () {
  const colorPortSpec = {
    initialValues: ['blue'],
      ctx: {
        getGuiComponent: () => ColorInput,
          renderPacketSummary: ({packet}) => {
            return (packet) ? (<ColorIcon color={packet.data} />) : null
          },
          renderPacketDetail: ({packet}) => {
            return (packet) ? (
              <span>{packet.data} <ColorIcon color={packet.data} /></span>
            ) : null
          }
      }
  }
  return colorPortSpec
}
