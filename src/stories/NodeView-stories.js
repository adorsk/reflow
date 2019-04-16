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
      />
    )
  }
}

storiesOf('NodeView', module)
  .add('default', () => {
    const node = Node.fromSpec({
      id: 'node1',
      srcCode: 'here is some src yo',
      portSpecs: {
        inputs: {
          in1: {},
        },
        outputs: {
          out1: {},
        },
      },
      ctx: {
        getGuiComponent: () => {
          return (() => (<div>a gui!</div>))
        }
      }
    })
    return (<StatefulNodeView node={node} />)
  })
