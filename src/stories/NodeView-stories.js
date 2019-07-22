import React from 'react'
import { storiesOf } from '@storybook/react'

import Node from '../engine/Node.js'
import NodeView from '../components/NodeView.js'


class StatefulNodeView extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      version: Math.random(),
    }
  }

  render () {
    return (
      <NodeView
        node={this.props.node}
        onChangeSrcCode={({node, code}) => {
          node.srcCode = code
          this.setState({version: Math.random()})
        }}
        style={{
          position: 'absolute',
          left: 200,
          top: 100
        }}
      />
    )
  }
}

storiesOf('NodeView', module)
  .add('default', () => {
    const node = new Node()
    node.id = 'node1'
    node.srcCode = 'here is some src yo'
    node.addInput('in1')
    node.addInput('longishName')
    node.addInput('in3')
    node.addOutput('out1')
    node.addOutput('another name')
    node.addOutput('out3')
    node.getGuiComponent = () => {
      return (() => (<div>a gui!</div>))
    }
    return (<StatefulNodeView node={node} />)
  })
