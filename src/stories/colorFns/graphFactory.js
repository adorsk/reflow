import React from 'react'
import _ from 'lodash'
import chroma from 'chroma-js'

import Graph from '../../engine/Graph.js'
import {
  getInputValues,
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
      id: 'grid',
      portSpecs: {
        'inputs': {
          x0: {
            initialValues: [0],
            ctx: { getGuiComponent: () => NumberInput }
          },
          x1: {
            initialValues: [100],
            ctx: { getGuiComponent: () => NumberInput }
          },
          dx: {
            initialValues: [10],
            ctx: { getGuiComponent: () => NumberInput }
          },
          y0: {
            initialValues: [0],
            ctx: { getGuiComponent: () => NumberInput }
          },
          y1: {
            initialValues: [100],
            ctx: { getGuiComponent: () => NumberInput }
          },
          dy: {
            initialValues: [10],
            ctx: { getGuiComponent: () => NumberInput }
          },
        },
        'outputs': {
          cells: {},
        },
      },
      tickFn ({node}) {
        if (! node.hasHotInputs()) { return }
        const inputValues = getInputValues({
          node,
          inputKeys: Object.keys(node.getInputPorts())
        })
        const { x0, x1, dx, y0, y1, dy } = inputValues
        const cells = []
        let idx = 0
        for (let x = x0; x < x1; x += dx) {
          for (let y = y0; y < y1; y += dy) {
            const cell = {
              idx,
              shape: {
                bRect: {
                  x,
                  y,
                  top: y + dy,
                  right: x + dx,
                  bottom: y,
                  left: x,
                  width: dx,
                  height: dy,
                }
              }
            }
            cell.toString = () => JSON.stringify(cell)
            cells.push(cell)
            idx += 1
          }
        }
        node.getPort('outputs:cells').pushValue(cells)
      },
    }
  })

  graph.addNodeFromSpec({
    nodeSpec: {
      id: 'decorator',
      portSpecs: {
        'inputs': {
          decoratee: {},
          decorators: {},
        },
        'outputs': {
          decorated: {},
        }
      },
      tickFn ({node}) {
        if (!node.hasHotInputs()) { return }
        const decorateePort = node.getPort('inputs:decoratee')
        const decoratedPort = node.getPort('outputs:decorated')
        const decoratorsPort = node.getPort('inputs:decorators')
        if (! decoratorsPort.hasPackets()) { return }
        const decorators = decoratorsPort.mostRecentValue
        while (decorateePort.hasPackets()) {
          const decorateePacket = node.getPort('inputs:decoratee').shiftPacket()
          if (decorateePacket.isData()) {
            let decoratee = decorateePacket.value
            const decorations = _.mapValues(decorators, (decorator) => {
              return decorator(decoratee)
            })
            const decorated = {...decoratee, ...decorations}
            decoratedPort.pushValue(decorated)
          }
          else {
            decoratedPort.pushPacket(decorateePacket)
          }
        }
      },
    }
  })

  graph.addNodeFromSpec({
    nodeSpec: {
      id: 'decorators',
      portSpecs: {
        'inputs': {
          decorators: {
            behaviors: {
              constant: {
                valueFn: () => {
                  const decorators = {
                    imageData (decoratee) {
                      const { shape } = decoratee
                      const imageData = new ImageData(
                        shape.bRect.width,
                        shape.bRect.height
                      )
                      const rgba = [
                        ...(_.times(3, () => (~~(Math.random() * 255)))),
                        255
                      ]
                      for (let y = 0; y < imageData.height; y++) {
                        const rowStartIdx = y * imageData.width * 4
                        for (let x = 0; x < imageData.width; x++) {
                          const pixelStartIdx = rowStartIdx + x * 4
                          for (let i = 0; i < 4; i++) {
                            imageData.data[pixelStartIdx + i] = rgba[i]
                          }
                        }
                      }
                      return imageData
                    },
                  }
                  return decorators
                },
              }
            },
          },
        },
        'outputs': {
          decorators: {},
        }
      },
      tickFn ({node}) {
        if (!node.hasHotInputs()) { return }
        node.getPort('outputs:decorators')
          .pushValue(node.getPort('inputs:decorators').shiftValue())
      },
    }
  })

  graph.addNodeFromSpec({
    nodeSpec: {
      id: 'splitter',
      portSpecs: {
        inputs: { array: {} },
        outputs: { packet: {} },
      },
      tickFn: ({node}) => {
        if (!node.hasHotInputs()) { return }
        const { array } = getInputValues({node, inputKeys: ['array']})
        if (_.isEmpty(array)) { return }
        const packetPort = node.getPort('outputs:packet')
        packetPort.pushOpenBracket()
        array.forEach((item) => packetPort.pushValue(item))
        packetPort.pushCloseBracket()
      },
    }
  })

  // merger
  graph.addNodeFromSpec({
    nodeSpec: {
      id: 'merger',
      portSpecs: {
        inputs: { packet: {} },
        outputs: { array: {} },
      },
      tickFn: ({node}) => {
        const packetPort = node.getPort('inputs:packet')
        const arrayPort = node.getPort('outputs:array')
        while (packetPort.packets.length > 0) {
          const packet = packetPort.shiftPacket()
          if (packet.isOpenBracket()) {
            node.state.set('array', [])
          } else if (packet.isCloseBracket()) {
            arrayPort.pushValue(node.state.get('array'))
            node.state.delete('array')
          } else {
            node.state.get('array').push(packet.data)
          }
        }
      },
    }
  })

  // quilter
  graph.addNodeFromSpec({
    nodeSpec: {
      id: 'quilter',
      portSpecs: {
        inputs: { cells: {} },
        outputs: { canvas: {} },
      },
      tickFn ({node}) {
        let srcChanged = false
        const tickFnSrc = node.tickFn.toString()
        if (node.state.get('tickFnSrc') !== tickFnSrc) {
          node.state.set('tickFnSrc', tickFnSrc)
          srcChanged = true
        }
        if (!node.hasHotInputs() && !srcChanged) { return }
        const cells = node.getPort('inputs:cells').mostRecentValue
        if (! cells) {
          node.getPort('outputs:canvas').pushValue(undefined)
          return
        }
        const bRect = {
          x: 0,
          y: 0,
          top: -Infinity,
          right: -Infinity,
          bottom: Infinity,
          left: Infinity,
          width: null,
          height: null,
        }
        for (let cell of cells) {
          const cellBRect = cell.shape.bRect
          if (cellBRect.top > bRect.top) { bRect.top = cellBRect.top }
          if (cellBRect.right > bRect.right) { bRect.right = cellBRect.right }
          if (cellBRect.bottom < bRect.bottom) { bRect.bottom = cellBRect.bottom }
          if (cellBRect.left < bRect.left) { bRect.left = cellBRect.left }
        }
        bRect.width = bRect.right - bRect.left
        bRect.height = bRect.top - bRect.bottom
        const ctx = new OffscreenCanvas(bRect.width, bRect.height).getContext('2d')
        ctx.canvas.width = bRect.width
        ctx.canvas.height = bRect.height
        for (let cell of cells) {
          const ctxForCell = new OffscreenCanvas(
            cell.shape.bRect.width, cell.shape.bRect.height
          ).getContext('2d')
          ctxForCell.putImageData(cell.imageData, 0, 0)
          ctx.drawImage(ctxForCell.canvas, cell.shape.bRect.x, cell.shape.bRect.y)
        }
        node.getPort('outputs:canvas').pushValue(ctx.canvas)
      },
    }
  })

  graph.addNodeFromSpec({
    nodeSpec: {
      id: 'displayImage',
      portSpecs: {
        'inputs': {
          image: {},
        },
      },
      tickFn ({node}) {
        if (!node.hasHotInputs()) { return }
        const image = node.getPort('inputs:image').mostRecentValue
        node.state.set('image', image)
      },
      ctx: {
        getGuiComponent () {
          class GuiComponent extends React.Component {
            constructor (props) {
              super(props)
              this.canvasRef = React.createRef()
            }
            render () { return (<canvas ref={this.canvasRef}/>) }
            componentDidMount () { this.updateCanvas() }
            componentDidUpdate () { this.updateCanvas() }
            updateCanvas () {
              const { node } = this.props
              const ctx = this.canvasRef.current.getContext('2d')
              ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
              const image = node.state.get('image')
              if (! image) { return }
              ctx.canvas.width = image.width
              ctx.canvas.height = image.height
              ctx.drawImage(image, 0, 0)
            }
          }
          return GuiComponent
        }
      },
    }
  })

  graph.addWireFromSpec({
    wireSpec: { src: 'grid:cells', dest: 'splitter:array' }
  })
  graph.addWireFromSpec({
    wireSpec: { src: 'splitter:packet', dest: 'decorator:decoratee' }
  })
  graph.addWireFromSpec({
    wireSpec: { src: 'decorators:decorators', dest: 'decorator:decorators' }
  })
  graph.addWireFromSpec({
    wireSpec: { src: 'decorator:decorated', dest: 'merger:packet' }
  })
  graph.addWireFromSpec({
    wireSpec: { src: 'merger:array', dest: 'quilter:cells' }
  })
  graph.addWireFromSpec({
    wireSpec: { src: 'quilter:canvas', dest: 'displayImage:image' }
  })

  return graph
}

export default graphFactory
