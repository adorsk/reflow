import React from 'react'
import _ from 'lodash'

import DragContainer from './DragContainer.js'
import { DraggableNodeView } from './NodeView.js'
import { DraggableWireView } from './WireView.js'
import WireLineView from './WireLineView.js'

import ObservableMapStore from '../engine/ObservableMapStore.js'
import Graph from '../engine/Graph.js'
import Node from '../engine/Node.js'
import Wire from '../engine/Wire.js'


class GraphView extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      graphVersion: 0,
    }
    this.nodeViews = {}
    this.wireViews = {}
    this.wireLineViews = {}
    this._wiresFromNode = {}
    this._wiresToNode = {}
    this.wiresContainerRef = React.createRef()
  }

  render () {
    const { graph } = this.props
    if (! graph) { return null }
    const gridColor = '#eee'
    const style = {
      position: 'absolute',
      width: '100%',
      height: '100%',
      backgroundSize: '40px 40px',
      backgroundImage: `linear-gradient(to right, ${gridColor} 1px, transparent 1px), linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)`,
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
          {this.renderCells()}
        </div>
      </div>
    )
  }

  renderCells () {
    const {graph} = this.props
    return (
      <DragContainer
        className='cells-container'
        style={{position: 'absolute', zIndex: 10}}
        onDragEnd={() => this.updateWireLineViews()}
      >
        {
          _.filter(graph.getNodes(), (node) => !node.hidden).map((node) => {
            return this.renderDraggableNodeView(node)
          })
        }
        {
          _.filter(graph.getWires(), (wire) => !wire.hidden).map((wire) => {
            return this.renderDraggableWireView(wire)
          })
        }
      </DragContainer>
    )
  }

  renderDraggableNodeView (node) {
    const { graph } = this.props
    const store = this.getStore()
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
          const nextNode = new Node({id: node.id})
          await this.compileAndEvalNodeBuilderFnCode({node: nextNode, code})
          graph.replaceNode({node: nextNode})
        }}
      />
    )
  }

  async compileAndEvalNodeBuilderFnCode ({node, code}) {
    return this.props.compileAndEvalNodeBuilderFnCode({node, code})
  }

  getStore () {
    let { store } = this.props
    if (! store) {
      if (! this.store) {
        this.store = new ObservableMapStore() // dis is hacky :/
      }
      store = this.store
    }
    return store
  }

  renderDraggableWireView (wire) {
    const { graph } = this.props
    const store = this.getStore()
    const posKey = `${wire.id}-pos`
    return (
      <DraggableWireView
        showDebug={false}
        key={wire.id}
        wire={wire}
        pos={store.getOrCreate({
          key: posKey,
          factoryFn: () => ({x: 0, y:0}),
        })}
        ref={(el) => { this.wireViews[wire.id] = el }}
        afterMount={(el) => { this.wireViews[wire.id] = el }}
        beforeUnmount={() => { delete this.wireViews[wire.id] }}
        onDragEnd={({pos}) => {
          store.set({key: posKey, value: pos})
        }}
        onChangeSrcCode={async ({wire, code}) => {
          const nextWire = new Wire({id: wire.id})
          await this.compileAndEvalWireBuilderFnCode({wire: nextWire, code})
          graph.replaceWire({wire: nextWire})
        }}
      />
    )
  }

  async compileAndEvalWireBuilderFnCode ({wire, code}) {
    return this.props.compileAndEvalWireBuilderFnCode({wire, code})
  }

  renderWireLineViews ({wires}) {
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
              return (<text key={wire.id}>{wire.id}</text>)
            })
          }
        </svg>
      </div>
    )
  }

  renderWireLineView ({wire, key}) {
    return (
      <WireLineView
        key={key}
        wire={wire}
        ref={(el) => {
          this.wireLineViews[key] = el
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
    this.updateWireLineViews()
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
    this.updateWireLineViews()
  }

  updateWireLineViews () {
    console.warn('TK')
    return
    const containerPagePos = _.pick(
      this.wiresContainerRef.current.getBoundingClientRect(),
      ['x', 'y']
    )
    for (let wireLineView of Object.values(this.wireLineViews)) {
      this.updateWireLineViewPos({wireLineView, containerPagePos})
    }
  }

  updateWireLineViewPos ({wireLineView, containerPagePos}) {
    const wire = wireLineView.getWire()
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
    wireLineView.setPositions({
      src: this.getOffsetPos({
        absPos: srcPortView.getHandlePagePos(),
        refPos: containerPagePos
      }),
      dest: this.getOffsetPos({
        absPos: destPortView.getHandlePagePos(),
        refPos: containerPagePos
      }),
    })
  }

  getOffsetPos ({absPos, refPos}) {
    const offsetPos = {
      x: absPos.x - refPos.x,
      y: absPos.y - refPos.y,
    }
    return offsetPos
  }

  getSerialization () {
    const { graph } = this.props
    return {
      key: graph.id,
      graphSerialization: graph.getSerialization(),
      storeSerialization: this.getStoreSerialization(),
    }
  }

  getStoreSerialization () {
    let serialization = {}
    const store = this.getStore()
    if (store) { serialization = store.toJSON() }
    return serialization
  }
}

GraphView.deserializeSerialization = async ({serialization}) => {
  const graphViewProps = {
    graph: await Graph.fromSerialization({
      serialization: serialization.graphSerialization
    }),
    store: new ObservableMapStore({
      initialValues: serialization.storeSerialization
    }),
  }
  return graphViewProps
}

export default GraphView
