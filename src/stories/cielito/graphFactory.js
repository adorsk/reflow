import React from 'react'
import _ from 'lodash'
import { ChromePicker } from 'react-color'

import Graph from '../../engine/Graph.js'
import Node from '../../engine/Node.js'


const NumberInput = (props) => {
  const { port } = props
  return (
    <input onBlur={(evt) => {
      let value
      try { 
        value = parseFloat(evt.target.value)
      } catch (err) {}
      port.pushValues([value])
    }} />
  )
}

class ColorInput extends React.Component {
  state = { color: {h: 0, s: 0, l: 0} }
  render () {
    const { port } = this.props
    return (
      <ChromePicker
        color={this.state.color}
        onChange={(color) => this.setState({color})}
        onChangeComplete={(color) => { port.pushValues([color.hex]) }}
      />
    )
  }
}

class InputsError extends Error {}

const getInputValues = ({node, inputKeys}) => {
  const inputValues = {}
  for (let inputKey of inputKeys) {
    const port = node.getPort('inputs:' + inputKey)
    inputValues[inputKey] = port.mostRecentValue
  }
  if (_.some(inputValues, _.isUndefined)) {
    throw new InputsError()
  }
  return inputValues
}

const graphFactory = ({store} = {}) => {
  const graph = new Graph({
    id: 'cielito',
    store,
  })

  // pointGen
  graph.addNode(Node.fromSpec({
    id: 'pointGen',
    ports: {
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
        points: {},
      },
    },
    tickFn ({node}) {
      if (! node.hasHotInputs()) { return }
      let inputValues
      try {
        inputValues = getInputValues({
          node,
          inputKeys: Object.keys(node.getInputPorts())
        })
      } catch (err) { return }
      const points = []
      for (let x = inputValues.x0; x < inputValues.x1; x += inputValues.dx) {
        for (let y = inputValues.y0; y < inputValues.y1; y += inputValues.dy) {
          const point = {x, y}
          point.toString = () => JSON.stringify(point)
          points.push(point)
        }
      }
      node.getPort('outputs:points').pushValues([points])
    },
  }))

  // pointsToShapes
  graph.addNode(Node.fromSpec({
    id: 'pointsToShapes',
    ports: {
      'inputs': {
        points: {},
        fillStyle: {
          initialValues: ['blue'],
          ctx: { getGuiComponent: () => ColorInput }
        },
      },
      'outputs': {
        shapes: {},
      },
    },
    tickFn ({node}) {
      if (!node.hasHotInputs()) { return }
      let inputValues
      try { 
        inputValues = getInputValues({
          node,
          inputKeys: ['points', 'fillStyle']
        })
      } catch (err) { return }
      const shapes = inputValues.points.map((point) => {
        const shape = {
          x: point.x,
          y: point.y,
          d: ([
            ['M', point.x, point.y],
            ['l', 5, 5],
            ['l', 5, -5],
            ['z'],
          ].map((cmd) => cmd.join(' ')).join(' ')),
          fillStyle: inputValues.fillStyle,
        }
        return shape
      })
      node.getPort('outputs:shapes').pushValues([shapes])
    },
  }))

  graph.addWire({
    src: { nodeId: 'pointGen', portId: 'points' },
    dest: { nodeId: 'pointsToShapes', portId: 'points' }
  })

  // renderer
  graph.addNode(Node.fromSpec({
    id: 'shapesToCanvas',
    ports: {
      'inputs': {
        shapes: {},
      },
      'outputs': {
        canvas: {},
      },
    },
    tickFn ({node}) {
      if (! node.hasHotInputs()) { return }
      const inputValues = getInputValues({node, inputKeys: ['shapes']})
      const shapes = inputValues['shapes']
      const canvas = document.createElement('canvas')
      const bounds = {
        x: {min: _.minBy(shapes, 'x').x, max: _.maxBy(shapes, 'x').x},
        y: {min: _.minBy(shapes, 'y').y, max: _.maxBy(shapes, 'y').y},
      }
      canvas.width = bounds.x.max - bounds.x.min
      canvas.height  = bounds.y.max - bounds.y.min
      const ctx = canvas.getContext('2d')
      for (let shape of shapes) {
        const shapePath = new Path2D(shape.d)
        ctx.fillStyle = shape.fillStyle
        ctx.fill(shapePath)
      }
      node.getPort('outputs:canvas').pushValues([canvas])
    },
    ctx: {
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
            const canvas = node.getPort('outputs:canvas').mostRecentValue
            if (canvas) { rootEl.appendChild(canvas) }
          }
        }
        return GuiComponent
      }
    }
  }))
  graph.addWire({
    src: {nodeId: 'pointsToShapes', portId: 'shapes'},
    dest: {nodeId: 'shapesToCanvas', portId: 'shapes'},
  })

  return graph
}

export default graphFactory
