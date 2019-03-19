import React from 'react'

import { workerFactory } from './QuilterWorker.js'

export const nodeSpec = {
  id: 'asyncQuilter',
  // adds rendered to quilt as they arrive.
  portSpecs: {
    'inputs': {
      packet: {},
    },
    'outputs': {
      canvas: {},
    }
  },
  tickFn ({node}) {
    if (!node.state.get('initialized')) { return }
    if (!node.hasHotInputs()) { return }
    const inPacketPort = node.getPort('inputs:packet')
    while (inPacketPort.hasPackets()) {
      const inPacket = inPacketPort.shiftPacket()
      if (inPacket.isOpenBracket()) {
        node.state.set('promises', [])
        node.state.get('quilter').clear()
        continue
      }
      if (inPacket.isData()) {
        const cell = inPacket.value
        const promise = node.state.get('quilter').putImageData(
          cell.imageData, cell.shape.bRect.x, cell.shape.bRect.y)
        node.state.get('promises').push(promise)
        continue
      }
      if (inPacket.isCloseBracket()) {
        Promise.all(node.state.get('promises')).then(() => {
          node.state.delete('promises')
          node.state.get('quilter').getImageBitmap().then((imageBitmap) => {
            node.getPort('outputs:canvas').pushValue(imageBitmap)
          })
          //node.getPort('outputs:canvas').pushValue(node.state.get('canvas'))
        })
      }
    }
  },
  ctx: {
    async didMountFn ({node}) {
      if (!node.state.get('initialized')) {
        const canvas = document.createElement('canvas')
        canvas.width = 1
        canvas.height = 1
        node.state.set('canvas', canvas)

        class WorkerQuilter {
          constructor () {
            this.worker = workerFactory()
            // Hacky way to track requests.
            this.keyedPromises = {}
            this.worker.addEventListener('message', (evt) => {
              const { key, status, result } = evt.data
              if (this.keyedPromises[key]) {
                const { resolve, reject } = this.keyedPromises[key]
                if (status === 'FULFILLED') { resolve(result) }
                else { reject() }
              }
            })
          }

          clear () {
            this.keyedPromises = {}
            this.worker.postMessage({type: 'clearCanvas'})
          }

          setCanvas (canvas) {
            this.worker.postMessage({
              type: 'setCanvas',
              payload: {canvas}
            }, [canvas])
          }

          async putImageData (imageData, x, y) {
            return new Promise((resolve, reject) => {
              const key = [x, y].join(':')
              this.keyedPromises[key] = {resolve, reject}
              this.worker.postMessage({
                key,
                type: 'putImageData',
                payload: {imageData, x, y}
              })
            })
          }

          async getImageBitmap () {
            return new Promise((resolve, reject) => {
              const key = 'getImageBitmap'
              this.keyedPromises[key] = {resolve, reject}
              this.worker.postMessage({
                key,
                type: 'getImageBitmap',
                payload: {}
              })
            })
          }
        }

        const quilter = new WorkerQuilter()
        quilter.setCanvas(canvas.transferControlToOffscreen())
        node.state.set('quilter', quilter)
        node.state.set('initialized', true)
      }
    },
    getGuiComponent () {
      class GuiComponent extends React.Component {
        constructor (props) {
          super(props)
          this.containerRef = React.createRef()
        }
        render () { return (<div ref={this.containerRef}/>) }
        componentDidMount () {
          const canvas = this.props.node.state.get('canvas')
          this.containerRef.current.appendChild(canvas)
        }
      }
      return GuiComponent
    }
  }
}
