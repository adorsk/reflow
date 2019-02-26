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

export class InputsError extends Error {}

export const getInputValues = ({node, inputKeys}) => {
  const inputValues = {}
  for (let inputKey of inputKeys) {
    const port = node.getPort('inputs:' + inputKey)
    inputValues[inputKey] = port.mostRecentValue
    if (_.isUndefined(inputValues[inputKey])) {
      throw new InputsError(`'${inputKey}' is undefined`)
    }
  }
  return inputValues
}
