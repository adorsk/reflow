import React from 'react'
import _ from 'lodash'

import { getPagePos } from '../utils/index.js'

import DragContainer from './DragContainer.js'
import { DraggableNodeWidget } from './NodeWidget.js'
// import Wire from './Wire.js'

class Wire extends React.Component {
  render () { return (<div>Wire</div>) }
}

class GraphEditor extends React.Component {
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
    const { graph } = this.props
    if (! graph) { return null }
    const nodes = graph.getNodes()
    const wires = graph.getWires()
    return (
      <div
        className='graph'
        style={this.props.style}
      >
        <div
          className='graph-content-container'
          style={{
            position: 'relative',
            height: '100%',
            width: '100%',
          }}
        >
          {this.renderNodeWidgets({nodes})}
          {this.renderWires({wires})}
        </div>
      </div>
    )
  }

  renderNodeWidgets ({nodes}) {
    return (
      <DragContainer
        className='nodes-container'
        style={{position: 'absolute'}}
      >
        {
          _.filter(nodes, (node) => !node.hidden).map((node) => {
            return this.renderNodeWidget(node)
          })
        }
      </DragContainer>
    )
  }

  renderNodeWidget (node) {
    return (
      <DraggableNodeWidget
        key={node.id}
        node={node}
        pos={node.state.pos}
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
            _.map(wires, (wire, key) => {
              return this.renderWire({wire, key})
            })
          }
        </svg>
      </div>
    )
  }

  renderWire ({wire, key}) {
    return (
      <Wire
        key={key}
        afterMount={(el) => { this.wireRefs[key] = el }}
        beforeUnmount={() => { delete this.wireRefs[key] }}
      />
    )
  }
}

export default GraphEditor
