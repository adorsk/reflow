import React from 'react'
import _ from 'lodash'
import { Dropdown } from 'semantic-ui-react'

import Graph from '../../engine/Graph.js'
import {
  NumberInput,
  ColorInput,
  ColorIcon,
  getInputValues,
} from '../../utils/graphFactory-utils.js'


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
        node.getPort('outputs:points').pushValue(points)
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
              renderPacketSummary: ({packet}) => {
                return (packet) ? (<ColorIcon color={packet.data} />) : null
              },
              renderPacketDetail: ({packet}) => {
                return (packet) ? (
                  <span>{packet.data} <ColorIcon color={packet.data} /></span>
                ) : null
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
        node.getPort('outputs:shapes').pushValue(shapes)
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
                        ['l', 5, 5],
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
            behaviors: {
              constant: {
                valueFn: () => {
                  function shapeFn ({point}) {
                    const shape = {
                      x: point.x,
                      y: point.y,
                      d: ([
                        ['M', point.x, point.y],
                        ['l', 5, 5],
                        ['l', 5, -5],
                        ['l', -5, -5],
                        ['z'],
                      ].map((cmd) => cmd.join(' ')).join(' ')),
                    }
                    return shape
                  }
                  return shapeFn
                }
              }
            },
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
        node.getPort('outputs:canvas').pushValue(canvas)
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
      behaviors: {
        drainIncomingHotWiresBeforeTick: false,
      },
      tickFn ({node}) {
        if (! node.state.get('selectedValue')) { return }
        const selectedWire = _.find(
          node.getPort('inputs:options').wires,
          {id: node.state.get('selectedValue')}
        )
        if (! selectedWire) { return }
        if (selectedWire.isHot()) {
          let mostRecentPacket = null
          while (selectedWire.hasPackets()) {
            mostRecentPacket = selectedWire.shiftPacket()
          }
          selectedWire.quench()
          node.state.set(selectedWire.id, mostRecentPacket.data)
          node.state.set('needsPush', true)
        }
        if (node.state.get('needsPush')) {
          node.getPort('outputs:selected').pushValue(
            node.state.get(selectedWire.id))
          node.state.set('needsPush', false)
        }
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
                    if (this.props.node.state.get('selectedValue') !== value) {
                      this.props.node.state.set('selectedValue', value)
                      this.props.node.state.set('needsPush', true)
                    }
                  }}
                />
              )
            }

            getOptions () {
              const optionsPort = this.props.node.getPort('inputs:options')
              const wireOptions = _.map(optionsPort.wires, (wire) => {
                return {
                  key: wire.id,
                  value: wire.id,
                  text: [wire.src.node.id, wire.src.port.id].join(':'),
                }
              })
              return [this.nullOption, ...wireOptions]
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
      behaviors: {drain: 'copy'},
    }
  })
  graph.addWireFromSpec({
    wireSpec: {
      src: {nodeId: 'diamondFn', portId: 'shapeFn'},
      dest: {nodeId: 'shapeFnSelect', portId: 'options'},
      behaviors: {drain: 'copy'},
    }
  })

  graph.addWireFromSpec({
    wireSpec: {
      src: { nodeId: 'shapeFnSelect', portId: 'selected' },
      dest: { nodeId: 'pointsToShapes', portId: 'shapeFn' },
    }
  })

  return graph
}

export default graphFactory
