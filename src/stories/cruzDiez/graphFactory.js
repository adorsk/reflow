import React from 'react'
import _ from 'lodash'
import chroma from 'chroma-js'

import Graph from '../../engine/Graph.js'
import {
  getInputValues,
  NumberInput,
} from '../../utils/graphFactory-utils.js'
import { nodeSpec as asyncQuilterNodeSpec } from './nodes/asyncQuilter.js'

const graphFactory = ({store} = {}) => {
  const graph = new Graph({
    id: 'asyncStream',
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

  graph.addNodeFromSpec({
    nodeSpec: {
      id: 'asyncMap',
      // releases closing bracket only after all content packets
      // have resolved.
      portSpecs: {
        'inputs': {
          packet: {},
          fn: {},
        },
        'outputs': {
          packet: {},
        }
      },
      tickFn ({node}) {
        if (!node.hasHotInputs()) { return }
        const inPacketPort = node.getPort('inputs:packet')
        const outPacketPort = node.getPort('outputs:packet')
        const fn = node.getPort('inputs:fn').mostRecentValue
        if (!fn) { return }
        while (inPacketPort.hasPackets()) {
          const inPacket = inPacketPort.shiftPacket()
          if (inPacket.isOpenBracket()) {
            node.state.set('promises', [])
            outPacketPort.pushPacket(inPacket)
            continue
          }
          if (inPacket.isData()) {
            const promise = Promise.resolve(fn(inPacket.value)).then((result) => {
              outPacketPort.pushValue(result)
            })
            node.state.get('promises').push(promise)
            continue
          }
          if (inPacket.isCloseBracket()) {
            Promise.all(node.state.get('promises')).then(() => {
              node.state.delete('promises')
              outPacketPort.pushPacket(inPacket)
            })
          }
        }
      },
    },
  })

  graph.addNodeFromSpec({
    nodeSpec: {
      id: 'asyncFn',
      portSpecs: {
        'outputs': {
          fn: {
            behaviors: {
              constant: {
                valueFn: () => {
                  async function fn (cell) {
                    const { shape } = cell
                    const imageData = new ImageData(
                      shape.bRect.width,
                      shape.bRect.height
                    )
                    const color = ((cell.idx % 2) === 0) ? 'blue' : 'red'
                    const rgba = chroma(color).rgba()
                    rgba[3] = ~~(rgba[3] * 255)
                    for (let y = 0; y < imageData.height; y++) {
                      const rowStartIdx = y * imageData.width * 4
                      for (let x = 0; x < imageData.width; x++) {
                        const pixelStartIdx = rowStartIdx + x * 4
                        for (let i = 0; i < 4; i++) {
                          imageData.data[pixelStartIdx + i] = rgba[i]
                        }
                      }
                    }
                    const decoratedCell = {...cell, imageData}
                    return new Promise((resolve, reject) => {
                      setTimeout(
                        () => resolve(decoratedCell),
                        ~~(500 + 500 * Math.random())
                      )
                    })
                  }
                  return fn
                },
              }
            },
          },
        },
      },
    },
  })

  graph.addNodeFromSpec({nodeSpec: asyncQuilterNodeSpec})

  graph.addNodeFromSpec({
    nodeSpec: {
      id: 'addDiagonals',
      portSpecs: {
        'inputs': {
          image: {},
        },
        'outputs': {
          canvas: {},
        }
      },
      tickFn ({node}) {
        if (!node.hasHotInputs()) { return }
        const image = node.getPort('inputs:image').mostRecentValue
        if (! image) { return }
        // get dimensions.
        const width = image.width
        const height = image.height
        // create new new canvas
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(image, 0, 0)
        const angle = (45 * Math.PI / 180)
        const dx = width / 10
        const centerPoints = []
        const y = height / 2
        for (let x = 0; x < width; x += dx) {
          centerPoints.push({x, y})
        }
        console.log("cps: ", centerPoints)
        const diagLength = 0.65 * height 
        const diagWidth = .1 * dx
        const deltas = {
          y: (diagLength / 2) * Math.sin(angle), 
          x: (diagLength / 2) * Math.cos(angle)
        }
        for (let point of centerPoints) {
          const start = {
            x: (point.x - deltas.x),
            y: (point.y - deltas.y)
          }
          const end = {
            x: (point.x + deltas.x),
            y: (point.y + deltas.y)
          }
          const d = [
            ['M', start.x, start.y],
            ['L', end.x, end.y],
          ].map((cmd) => cmd.join(' ')).join(' ')
          const path = new Path2D(d)
          ctx.strokeStyle = 'black'
          ctx.strokeWidth = diagWidth
          ctx.stroke(path)
        }
        node.getPort('outputs:canvas').pushValue(canvas)
      },
      ctx: {
        getGuiComponent () {
          class GuiComponent extends React.Component {
            constructor (props) {
              super(props)
              this.containerRef = React.createRef()
            }
            render () { return (<div ref={this.containerRef}/>) }
            componentDidMount () { this.updateCanvas() }
            componentDidUpdate () { this.updateCanvas() }
            updateCanvas () {
              this.containerRef.current.innerHTML = ''
              const canvas = this.props.node.getPort('outputs:canvas').mostRecentValue
              if (! canvas) { return }
              this.containerRef.current.appendChild(canvas)
            }
          }
          return GuiComponent
        }
      }
    }
  })

  graph.addWireFromSpec({
    wireSpec: { src: 'grid:cells', dest: 'splitter:array' }
  })
  graph.addWireFromSpec({
    wireSpec: { src: 'splitter:packet', dest: 'asyncMap:packet' }
  })
  graph.addWireFromSpec({
    wireSpec: { src: 'asyncFn:fn', dest: 'asyncMap:fn' }
  })
  graph.addWireFromSpec({
    wireSpec: { src: 'asyncMap:packet', dest: 'asyncQuilter:packet' }
  })

  graph.addWireFromSpec({
    wireSpec: {
      src: 'asyncQuilter:canvas',
      dest: 'addDiagonals:image',
      /*
      behaviors: {
        transform: ({packet}) => {
          console.log("p: ", packet)
          if (! packet.isData()) { return packet }
          if (! packet.value) { return packet }
          if (packet.value instanceof HTMLCanvasElement) {
            const ctx = packet.value.getContext('2d')
            const imageData = ctx.getImageData(
              0, 0, ctx.canvas.width, ctx.canvas.height)
            return packet.clone({data: imageData})
          }
        }
      }
      */
    }
  })
  return graph
}

export default graphFactory
