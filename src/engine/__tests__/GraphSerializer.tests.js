import Graph from '../Graph.js'
import GraphSerializer from '../GraphSerializer.js'

describe('GraphSerializer', () => {

  beforeEach(() => {
    jest.useFakeTimers()
  })

  describe('deriveSpecFromGraph', () => {
    it('derives expected nodeSpecs', () => {
      const graph = new Graph()
      graph.addNodeFromSpec({nodeSpec: {
        id: 'node1',
        srcCode: 'node1.srcCode',
      }})
      graph.addNodeFromSpec({nodeSpec: {
        id: 'node2',
        srcCode: 'node2.srcCode',
      }})
      const serializer = new GraphSerializer()
      const graphSpec = serializer.deriveSpecFromGraph({graph})
      const expectedGraphSpec = {
        wireSpecs: {},
        nodeSpecs: {
          'node1': 'node1.srcCode',
          'node2': 'node2.srcCode',
        }
      }
      expect(graphSpec).toEqual(expectedGraphSpec)
    })

    it('derives expected wireSpecs', () => {
      const graph = new Graph()
      graph.addNodeFromSpec({nodeSpec: {
        id: 'node1',
        srcCode: 'node1.srcCode',
        portSpecs: {
          outputs: {
            'out1': {},
          }
        },
      }})
      graph.addNodeFromSpec({nodeSpec: {
        id: 'node2',
        srcCode: 'node2.srcCode',
        portSpecs: {
          inputs: {
            'in1': {},
          }
        },
      }})
      graph.addWireFromSpec({wireSpec: {
        id: 'wire1',
        src: 'node1:out1',
        dest: 'node2:in1',
        srcCode: 'wire1.srcCode',
      }})
      const serializer = new GraphSerializer()
      const graphSpec = serializer.deriveSpecFromGraph({graph})
      const expectedGraphSpec = {
        wireSpecs: {
          'wire1': 'wire1.srcCode',
        },
        nodeSpecs: {
          'node1': 'node1.srcCode',
          'node2': 'node2.srcCode',
        }
      }
      expect(graphSpec).toEqual(expectedGraphSpec)
    })
  })

})
