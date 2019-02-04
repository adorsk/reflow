import React from 'react'
import _ from 'lodash'

import { getPagePos } from '../utils/index.js'

import DragContainer from './DragContainer.js'
import { DraggableNodeWidget } from './NodeWidget.js'
import WireWidget from './WireWidget.js'


class GraphView extends React.Component {
  constructor (props) {
    super(props)
    this.nodeWidgets = {}
    this.wireWidgets = {}
    this._wiresFromNode = {}
    this._wiresToNode = {}
    this.wiresContainerRef = React.createRef()
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
          {this.renderWireWidgets({wires})}
        </div>
      </div>
    )
  }

  renderNodeWidgets ({nodes}) {
    return (
      <DragContainer
        className='nodes-container'
        style={{position: 'absolute'}}
        onDragEnd={() => this.updateWireWidgets()}
      >
        {
          _.filter(nodes, (node) => !node.hidden).map((node) => {
            return this.renderDraggableNodeWidget(node)
          })
        }
      </DragContainer>
    )
  }

  renderDraggableNodeWidget (node) {
    return (
      <DraggableNodeWidget
        showDebug={false}
        key={node.id}
        node={node}
        pos={node.state.pos}
        ref={(el) => {
          this.nodeWidgets[node.id] = el
        }}
        afterMount={(el) => { this.nodeWidgets[node.id] = el }}
        beforeUnmount={() => { delete this.nodeWidgets[node.id] }}
      />
    )
  }

  renderWireWidgets ({wires}) {
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
          {
            _.map(wires, (wire, key) => {
              return this.renderWireWidget({wire, key})
            })
          }
        </svg>
      </div>
    )
  }

  renderWireWidget ({wire, key}) {
    return (
      <WireWidget
        key={key}
        wire={wire}
        ref={(el) => {
          this.wireWidgets[key] = el
        }}
      />
    )
  }

  componentDidMount () {
    this.updateWireWidgets()
  }

  componentWillUnmount () {
    this.props.graph.unmount()
  }

  componentDidUpdate () {
    this.updateWireWidgets()
  }

  updateWireWidgets () {
    for (let wireWidget of Object.values(this.wireWidgets)) {
      this.updateWireWidgetPos({wireWidget})
    }
  }

  updateWireWidgetPos ({wireWidget}) {
    const wire = wireWidget.getWire()
    const srcNodeWidget = this.nodeWidgets[wire.src.nodeId]
    const srcPortWidget = srcNodeWidget.getPortWidget({
      ioType: 'outputs',
      portId: wire.src.portId
    })
    const destNodeWidget = this.nodeWidgets[wire.dest.nodeId]
    const destPortWidget = destNodeWidget.getPortWidget({
      ioType: 'inputs',
      portId: wire.dest.portId,
    })
    wireWidget.setPositions({
      src: getPagePos(srcPortWidget.getHandleEl()),
      dest: getPagePos(destPortWidget.getHandleEl()),
    })
  }
}

export default GraphView
