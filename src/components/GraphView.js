import React from 'react'
import _ from 'lodash'

import DragContainer from './DragContainer.js'
import { DraggableNodeView } from './NodeView.js'
import WireView from './WireView.js'
import ObservableMapStore from '../engine/ObservableMapStore.js'


class GraphView extends React.Component {
  constructor (props) {
    super(props)
    this.nodeViews = {}
    this.wireViews = {}
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
          {this.renderNodeViews({nodes})}
          {this.renderWireViews({wires})}
        </div>
      </div>
    )
  }

  renderNodeViews ({nodes}) {
    return (
      <DragContainer
        className='nodes-container'
        style={{position: 'absolute', zIndex: 10}}
        onDragEnd={() => this.updateWireViews()}
      >
        {
          _.filter(nodes, (node) => !node.hidden).map((node) => {
            return this.renderDraggableNodeView(node)
          })
        }
      </DragContainer>
    )
  }

  renderDraggableNodeView (node) {
    const { store } = this.props
    const posKey = `${node.id}-pos`
    return (
      <DraggableNodeView
        showDebug={false}
        key={node.id}
        node={node}
        pos={store.getOrCreate({
          key: posKey,
          factoryFn: () => ({x: 0, y:0}),
        })}
        ref={(el) => { this.nodeViews[node.id] = el }}
        afterMount={(el) => { this.nodeViews[node.id] = el }}
        beforeUnmount={() => { delete this.nodeViews[node.id] }}
        onDragEnd={({pos}) => {
          store.set({key: posKey, value: pos})
        }}
      />
    )
  }

  renderWireViews ({wires}) {
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
              return this.renderWireView({wire, key})
            })
          }
        </svg>
      </div>
    )
  }

  renderWireView ({wire, key}) {
    return (
      <WireView
        key={key}
        wire={wire}
        ref={(el) => {
          this.wireViews[key] = el
        }}
      />
    )
  }

  componentDidMount () {
    this.updateWireViews()
  }

  componentWillUnmount () {
    this.props.graph.unmount()
  }

  componentDidUpdate () {
    this.updateWireViews()
  }

  updateWireViews () {
    for (let wireView of Object.values(this.wireViews)) {
      this.updateWireViewPos({wireView})
    }
  }

  updateWireViewPos ({wireView}) {
    const wire = wireView.getWire()
    const srcNodeView = this.nodeViews[wire.src.nodeId]
    const srcPortView = srcNodeView.getPortView({
      ioType: 'outputs',
      portId: wire.src.portId
    })
    const destNodeView = this.nodeViews[wire.dest.nodeId]
    const destPortView = destNodeView.getPortView({
      ioType: 'inputs',
      portId: wire.dest.portId,
    })
    wireView.setPositions({
      src: srcPortView.getHandlePagePos(),
      dest: destPortView.getHandlePagePos(),
    })
  }
}

export default GraphView
