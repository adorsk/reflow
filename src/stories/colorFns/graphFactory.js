import React from 'react'
import chroma from 'chroma-js'

import Graph from '../../engine/Graph.js'
import {
  NumberInput,
  generateColorPortSpec,
} from '../../utils/graphFactory-utils.js'

const graphFactory = ({store} = {}) => {
  const graph = new Graph({
    id: 'color-fns',
    store,
  })

  graph.addNodeFromSpec({
    nodeSpec: {
      id: 'fill',
      portSpecs: {
        'inputs': {
          height: {
            initialValues: [100],
            ctx: { getGuiComponent: () => NumberInput }
          },
          width: {
            initialValues: [150],
            ctx: { getGuiComponent: () => NumberInput }
          },
          fillStyle: generateColorPortSpec(),
        },
      },
      tickFn ({node}) {
        let srcChanged = false
        const tickFnSrc = node.tickFn.toString()
        if (node.state.get('tickFnSrc') !== tickFnSrc) {
          node.state.set('tickFnSrc', tickFnSrc)
          srcChanged = true
        }
        if (!node.hasHotInputs() && !srcChanged) { return }
        const ctx = node.state.get('canvas').getContext('2d')
        for (let dimension of ['width', 'height']) {
          const port = node.getPort('inputs:' + dimension)
          if (port.isHot()) { 
            ctx.canvas[dimension] = port.mostRecentValue
          }
        }
        const fillStyle = node.getPort('inputs:fillStyle').mostRecentValue
        const imgData = ctx.createImageData(1,1)
        const setPixel = ({x, y, rgba}) => {
          for (let i = 0; i < 4; i++) {
            imgData.data[i] = rgba[i]
          }
          ctx.putImageData(imgData, x, y)     
        }
        const ts = {y: 0, x: 0}
        for (let y = 0; y < ctx.canvas.height; y++) {
          ts.y = y / ctx.canvas.height
          const color = chroma(fillStyle).set(
            'lch.c',
            ((ts.y * 100) + 5 * (-1 + Math.random() * 2)),
          )
          const rgba = [...color.rgb(), 255]
          for (let x = 0; x < ctx.canvas.width; x++) {
            ts.x = x / ctx.canvas.width
            setPixel({x, y, rgba})
          }
        }
      },
      ctx: {
        didMountFn ({node}) {
          if (!node.state.get('initialized')) {
            const canvas = document.createElement('canvas')
            node.state.set('canvas', canvas)
            node.state.set('initialized', true)
          }
        },
        getGuiComponent () {
          class GuiComponent extends React.Component {
            constructor (props) {
              super(props)
              this.rootRef = React.createRef()
            }
            render () { return (<div ref={this.rootRef}/>) }
            componentDidMount () { this.updateCanvas() }
            componentDidUpdate () { this.updateCanvas() }
            updateCanvas () {
              const { node } = this.props
              const rootEl = this.rootRef.current
              rootEl.innerHTML = ''
              const canvas = node.state.get('canvas')
              if (canvas) { rootEl.appendChild(canvas) }
            }
          }
          return GuiComponent
        }
      },
    }
  })

  return graph
}

export default graphFactory
