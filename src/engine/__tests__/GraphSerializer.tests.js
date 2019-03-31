import Graph from '../Graph.js'
import GraphSerializer from '../GraphSerializer.js'
import Packet from '../Packet.js'

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

  describe('serializeState', () => {
    it('returns expected serialization', () => {
      const graph = new Graph()
      const packet1 = Packet.createDataPacket({
        timestamp: 1,
        data: 'packet1'
      })
      const packet2 = Packet.createDataPacket({
        timestamp: 2,
        data: 'packet2'
      })
      graph.addNodeFromSpec({nodeSpec: {
        id: 'node1',
        portSpecs: {
          inputs: {
            'in1': {
              packets: [packet1]
            }
          },
        },
        ctx: {
          serializeState ({node}) {
            return 'node1.state'
          },
        }
      }})
      graph.addNodeFromSpec({nodeSpec: {
        id: 'node2',
        portSpecs: {
          inputs: {
            'in1': {
              packets: [packet2]
            }
          },
        },
        ctx: {
          serializeState ({node}) {
            return 'node2.state'
          },
        },
      }})
      const serializer = new GraphSerializer()
      const serializedState = serializer.serializeGraphState({graph})
      const expectedSerializedState = {
        serializedNodeStates: {
          'node1': {
            serializedState: 'node1.state',
            serializedPortStates: {
              'inputs:in1': {
                serializedState: {
                  serializedPackets: [{
                    timestamp: packet1.timestamp,
                    data: packet1.data,
                    type: packet1.type,
                    ctx: packet1.ctx,
                  }],
                },
              },
            },
          },
          'node2': {
            serializedState: 'node2.state',
            serializedPortStates: {
              'inputs:in1': {
                serializedState: {
                  serializedPackets: [{
                    timestamp: packet2.timestamp,
                    data: packet2.data,
                    type: packet2.type,
                    ctx: packet2.ctx,
                  }],
                },
              },
            },
          }
        }
      }
      expect(serializedState).toEqual(expectedSerializedState)
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
