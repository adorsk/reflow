import React from 'react'

import dedent from './utils/dedent.js'
import Node from './components/Node.js'
import Port from'./engine/Port.js'

class App extends React.Component {
  constructor (props) {
    super(props)
    this.wires = {}
    this.nodeRefs = {}
    this.registerNodeRef = ((el) => {
      this.nodeRefs[el.props.id] = el
    })
  }

  componentDidMount () {
    this.addWire({
      src: {nodeId: 'emitter', portId: 'out'},
      dest: {nodeId: 'receiver', portId: 'in'},
    })
    this.nodeRefs['emitter'].actions.updateNodeState({n: 3})
  }

  addWire (wire) {
    const { src, dest } = wire
    const wireKey = (
      [src, dest].map((terminal) => {
        return [terminal.nodeId, terminal.portId].join(':')
      }).join(' => ')
    )
    this.wires[wireKey] = wire
    // add listener on source port.
    const srcPort = this.nodeRefs[src.nodeId].getPort({
      ioType: 'outputs',
      portId: src.portId
    })
    srcPort.registerListener({
      key: wireKey,
      listener: (evt) => {
        if (evt.type !== 'push') { return }
        // later consider going through a central router.
        // but for now just push to dest's input port.
        const destPort = this.nodeRefs[dest.nodeId].getPort({
          ioType: 'inputs',
          portId: dest.portId
        })
        destPort.pushValue(evt.data)
        srcPort.shiftValue()
      }
    })
  }

  render() {
    const tdStyle = {verticalAlign: 'top'}
    return (
      <div className="App">
        <table>
          <tbody>
            <tr>
              <td style={tdStyle}>
                <Node
                  id={'emitter'}
                  tickFn={(opts) => {
                    const { nodeState, actions } = opts
                    console.log('emitter.tick')
                    if (!(nodeState.n > 0)) { return }
                    setTimeout(() => {
                      actions.pushOutputs({'out': nodeState.n})
                      actions.updateNodeState({n: nodeState.n - 1})
                    }, 1000)
                  }}
                  ref={this.registerNodeRef}
                  ports={{
                    outputs: {
                      'out': (new Port({id: 'out'}))
                    }
                  }}
                  viewComponent={() => {
                    return (<div>a view</div>)
                  }}
                  getViewComponentCode={dedent(`
                  const viewComponent = (() => {
                    return (<div>some view, eh?</div>)
                  })
                  return viewComponent
                  `)}
                />
              </td>
              <td style={tdStyle}>
                <Node
                  id={'receiver'}
                  tickFn={(opts) => {
                    console.log('receiver.tick')
                  }}
                  ref={this.registerNodeRef}
                  ports={{
                    inputs: {
                      'in': (new Port({id: 'in'}))
                    }
                  }}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }
}

export default App
