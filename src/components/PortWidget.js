import React from 'react'

export class PortWidget extends React.Component {
  render () {
    const { port } = this.props
    return (
      <div>{port.id}</div>
    )
  }
}

export default PortWidget
