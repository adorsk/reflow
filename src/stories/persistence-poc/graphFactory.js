import Graph from '../../engine/Graph.js'
import Node from '../../engine/Node.js'

const graphFactory = ({store} = {}) => {
  const graph = new Graph({
    id: 'my-graph',
    store,
  })
  graph.addNode(Node.fromSpec({
    id: 'counter',
    tickFn: (({node}) => {
      if (!node.state.get('active')) { return }
      if (node.state.get('sleeping')) { return }
      if (typeof node.state.get('counter') === 'undefined') {
        node.state.set('counter', 0)
      }
      node.state.set('sleeping', true)
      setTimeout(() => {
        node.state.set('counter',  node.state.get('counter') + 1)
        console.log('emitto', node.state.get('counter'))
        node.getPort('outputs:out').pushValues([node.state.get('counter')])
        node.state.set('sleeping', false)
      }, 1000)
    }),
    ports: {
      outputs: {
        'out': {}
      }
    },
    getViewComponent: ({node}) => {
      const ViewComponent = () => {
        return (
          <div>Foo</div>
        )
      }
      return ViewComponent
    },
  }))
  return graph
}

export default graphFactory
