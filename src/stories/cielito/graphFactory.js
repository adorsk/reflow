import React from 'react'
import _ from 'lodash'
import { ChromePicker } from 'react-color'
import { Dropdown } from 'semantic-ui-react'

import Graph from '../../engine/Graph.js'




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

const ColorIcon = (props) => {
  return (
    <div style={{
      height: '1em',
      width: '1.4em',
      background: props.color,
    }}/>
  )
}

class InputsError extends Error {}

const getInputValues = ({node, inputKeys}) => {
  const inputValues = {}
  for (let inputKey of inputKeys) {
    const port = node.getPort('inputs:' + inputKey)
    inputValues[inputKey] = port.mostRecentValue
    if (_.isUndefined(inputValues[inputKey])) {
      throw new InputsError(`'${inputKey}' is undefined`)
    }
  }
  return inputValues
}

const graphFactory = ({store} = {}) => {
  const graph = new Graph({
    id: 'cielito',
    store,
  })

  // pointGen
  graph.addNodeFromSpec({
    nodeSpec: {
      id: 'pointGen',
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
          points: {},
        },
      },
      tickFn ({node}) {
        if (! node.hasHotInputs()) { return }
        const inputValues = getInputValues({
          node,
          inputKeys: Object.keys(node.getInputPorts())
        })
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
    }
  })

  // pointsToShapes
  graph.addNodeFromSpec({
    nodeSpec: {
      id: 'pointsToShapes',
      portSpecs: {
        'inputs': {
          points: {},
          fillStyle: {
            initialValues: ['blue'],
            ctx: {
              getGuiComponent: () => ColorInput,
              renderValueDetail: ({value}) => {
                return (value) ? (<ColorIcon color={value} />) : null
              }
            }
          },
          shapeFn: {},
        },
        'outputs': {
          shapes: {},
        },
      },
      tickFn ({node}) {
        if (!node.hasHotInputs()) { return }
        const inputValues = getInputValues({
          node,
          inputKeys: ['points', 'fillStyle', 'shapeFn']
        })
        const shapes = inputValues.points.map((point) => {
          const shape = inputValues.shapeFn({point})
          shape.fillStyle = inputValues.fillStyle
          return shape
        })
        node.getPort('outputs:shapes').pushValues([shapes])
      },
    }
  })

  graph.addWireFromSpec({
    wireSpec: {
      src: { nodeId: 'pointGen', portId: 'points' },
      dest: { nodeId: 'pointsToShapes', portId: 'points' }
    }
  })

  graph.addNodeFromSpec({
    nodeSpec: {
      id: 'triangleFn',
      portSpecs: {
        'outputs': {
          shapeFn: {
            behaviors: {
              constant: {
                valueFn: () => {
                  const value = (function shapeFn ({point}) {
                    const shape = {
                      x: point.x,
                      y: point.y,
                      d: ([
                        ['M', point.x, point.y],
                        ['l', 5, 4],
                        ['l', 5, -5],
                        ['z'],
                      ].map((cmd) => cmd.join(' ')).join(' ')),
                    }
                    return shape
                  })
                  return value
                },
              }
            },
          },
        },
      },
    }
  })

  graph.addNodeFromSpec({
    nodeSpec: {
      id: 'diamondFn',
      portSpecs: {
        'outputs': {
          shapeFn: {
            initialValues: [
              function shapeFn ({point}) {
                const shape = {
                  x: point.x,
                  y: point.y,
                  d: ([
                    ['M', point.x, point.y],
                    ['l', 5, 5],
                    ['l', 10, -5],
                    ['l', -5, -5],
                    ['z'],
                  ].map((cmd) => cmd.join(' ')).join(' ')),
                }
                return shape
              }
            ]
          },
        },
      },
    }
  })

  // renderer
  graph.addNodeFromSpec({
    nodeSpec: {
      id: 'shapesToCanvas',
      portSpecs: {
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
    }
  })
  graph.addWireFromSpec({
    wireSpec: {
      src: {nodeId: 'pointsToShapes', portId: 'shapes'},
      dest: {nodeId: 'shapesToCanvas', portId: 'shapes'},
    }
  })

  graph.addNodeFromSpec({
    nodeSpec: {
      id: 'shapeFnSelect',
      portSpecs: {
        inputs: {
          options: {},
        },
        outputs: {
          selected: {},
        },
      },
      tickFn ({node}) {
        if (! node.hasHotInputs()) { return }
      },
      ctx: {
        getGuiComponent () {
          class GuiComponent extends React.Component {
            constructor (props) {
              super(props)
              this.nullOption = {key: 'NULL', value: 'NULL', text: '---'}
              this.state = {
                selectedValue: (
                  props.node.state.get('selectedValue') || this.nullOption.value
                )
              }
            }

            render () {
              return (
                <Dropdown
                  options={this.getOptions()}
                  value={this.state.selectedValue}
                  onChange={(e, {value}) => {
                    this.setState({selectedValue: value})
                    this.props.node.state.set('selectedValue', value)
                    let valueToPush
                    if (value === this.nullOption.value) {
                      valueToPush = null
                    } else {
                      const selectedWire = this.optionsPort.wires[value]
                      valueToPush = selectedWire.src.port.mostRecentValue
                    }
                    this.outputPort.pushValues([valueToPush])
                  }}
                />
              )
            }

            getOptions () {
              const wireOptions = _.map(this.optionsPort.wires, (wire) => {
                return {
                  key: wire.id,
                  value: wire.id,
                  text: [wire.src.node.id, wire.src.port.id].join(':'),
                }
              })
              return [this.nullOption, ...wireOptions]
            }

            get optionsPort () {
              return this.props.node.getPort('inputs:options')
            }
            get outputPort () {
              return this.props.node.getPort('outputs:selected')
            }
          }

          return GuiComponent
        }
      }
    }
  })

  graph.addWireFromSpec({
    wireSpec: {
      src: {nodeId: 'triangleFn', portId: 'shapeFn'},
      dest: {nodeId: 'shapeFnSelect', portId: 'options'},
    }
  })
  graph.addWireFromSpec({
    wireSpec: {
      src: {nodeId: 'diamondFn', portId: 'shapeFn'},
      dest: {nodeId: 'shapeFnSelect', portId: 'options'},
    }
  })

  graph.addWireFromSpec({
    wireSpec: {
      src: { nodeId: 'shapeFnSelect', portId: 'selected' },
      dest: { nodeId: 'pointsToShapes', portId: 'shapeFn' }
    }
  })

  return graph
}

export default graphFactory
