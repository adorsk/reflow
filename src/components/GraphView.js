import React from 'react'
import _ from 'lodash'

import DragContainer from './DragContainer.js'
import { DraggableNodeView } from './NodeView.js'
import WireView from './WireView.js'
import Transformer from '../utils/Transformer.js'


class GraphView extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      graphVersion: 0,
    }
    this.nodeViews = {}
    this.wireViews = {}
    this._wiresFromNode = {}
    this._wiresToNode = {}
    this.wiresContainerRef = React.createRef()
    this.transformer = new Transformer()
  }

  render () {
    const { graph } = this.props
    if (! graph) { return null }
    const nodes = graph.getNodes()
    const wires = graph.getWires()
    const style = {
      position: 'absolute',
      width: '100%',
      height: '100%',
      ...this.props.style,
    }
    return (
      <div className='graph' style={style}>
        <div
          className='graph-content-container'
          style={{
            position: 'relative',
            height: '100%',
            width: '100%',
            overflow: 'scroll',
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
    const { graph, store } = this.props
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
        onChangeSrcCode={async ({node, code}) => {
          const transpiledCode = this.transformer.transform(code).code
          const fn = eval(transpiledCode) // eslint-disable-line
          const nodeSpec = await fn()
          graph.replaceNodeFromSpec({node, nodeSpec})
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
    const { graph } = this.props
    if (! graph ) { return }
    this.onGraphChanged = _.debounce(() => {
      this.setState({graphVersion: this.state.graphVersion + 1})
    }, 0)
    graph.changed.add(this.onGraphChanged)
    this.updateWireViews()
  }

  componentWillUnmount () {
    const { graph } = this.props
    if (! graph) { return }
    if (this.onGraphChange) {
      graph.changed.remove(this.onGraphChanged)
    }
    graph.unmount()
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
    const srcNodeView = this.nodeViews[wire.src.node.id]
    const srcPortView = srcNodeView.getPortView({
      ioType: 'outputs',
      portId: wire.src.port.id
    })
    const destNodeView = this.nodeViews[wire.dest.node.id]
    const destPortView = destNodeView.getPortView({
      ioType: 'inputs',
      portId: wire.dest.port.id,
    })
    wireView.setPositions({
      src: srcPortView.getHandlePagePos(),
      dest: destPortView.getHandlePagePos(),
    })
  }
}

export default GraphView
