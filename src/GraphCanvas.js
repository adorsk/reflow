import React from 'react'
import _ from 'lodash'

import { getPagePos } from './utils/index.js'

import DragContainer from './DragContainer.js'
import { DraggableNode } from './Node.js'
// import Wire from './Wire.js'

class Wire extends React.Component {
  render () { return (<div>Wire</div>) }
}

class GraphCanvas extends React.Component {
  constructor (props) {
    super(props)
    this.nodeRefs = {}
    this.wireRefs = {}
    this._wiresFromNode = {}
    this._wiresToNode = {}
    this.wiresContainerRef = React.createRef()
    this.wireAvatarRef = React.createRef()
  }

  render () {
    const { style, nodes } = this.props
    const wires = {}
    return (
      <div
        className='graph' style={style || {}}
      >
        <div
          className='graph-content-container'
          style={{
            position: 'relative',
            height: '100%',
            width: '100%',
          }}
        >
          {this.renderNodes({nodes})}
          {this.renderWires({wires})}
        </div>
      </div>
    )
  }

  renderNodes ({nodes}) {
    return (
      <DragContainer
        className='nodes-container'
        style={{position: 'absolute'}}
      >
        {
          _.filter(nodes, (node) => !node.hidden).map((node) => {
            return this.renderNode(node)
          })
        }
      </DragContainer>
    )
  }

  renderNode (node) {
    return (
      <DraggableNode
        key={node.id}
        node={node}
        pos={node.pos}
        afterMount={(el) => { this.nodeRefs[node.id] = el }}
        beforeUnmount={() => { delete this.nodeRefs[node.id] }}
      />
    )
  }

  renderWires ({wires}) {
    return (
      <div
        className='wires-container'
        ref={this.wiresContainerRef}
        style={{
          position: 'absolute',
          overflow: 'visible',
          left: 0,
          right: 0,
          top: 0,
          pointerEvents: 'none',
        }}
      >
        <svg
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            overflow: 'visible'
          }}
        >
          <Wire
            ref={this.wireAvatarRef}
            style={{stroke: 'orange'}}
          />
          {
            _.map(wires, (wire) => {
              return this.renderWire({wire})
            })
          }
        </svg>
      </div>
    )
  }

  renderWire ({wire}) {
    return (
      <Wire
        key={wire.id}
        afterMount={(el) => { this.wireRefs[wire.id] = el }}
        beforeUnmount={() => { delete this.wireRefs[wire.id] }}
      />
    )
  }
}

export default GraphCanvas
