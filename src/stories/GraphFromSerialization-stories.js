import React from 'react'
import { storiesOf } from '@storybook/react'
import _ from 'lodash'

import Graph from '../engine/Graph.js'
import {
  memoizedCreateStores,
  PersistentGraphView,
} from '../utils/graphStory-utils.js'


storiesOf('GraphFromSpec', module)
  .add('default', () => {
    const genBasicGraph = () => {
      const graph = new Graph({id: 'graph-from-spec-graph'})
      const nodeSpecFactories = {
        node1: () => {
          const nodeSpec = {
            id: 'node1',
            portSpecs: {
              outputs: {
                'out1': {},
              }
            },
          }
          return nodeSpec
        },
        node2: () => {
          const nodeSpec = {
            id: 'node2',
            portSpecs: {
              inputs: {
                'in1': {},
              }
            }
          }
          return nodeSpec
        }
      }
      const nodeSpecs = _.mapValues(nodeSpecFactories, (factory, key) => {
        factory.srcCode = factory.toString()
        const nodeSpec = factory()
        nodeSpec.specFactoryFn = factory
        return nodeSpec
      })
      graph.addNodeFromSpec({nodeSpec: nodeSpecs.node1})
      graph.addNodeFromSpec({nodeSpec: nodeSpecs.node2})

      const wireSpecFactories = {
        'wire1': () => {
          const wireSpec = {
            id: 'wire1',
            src: 'node1:out1',
            dest: 'node2:in1',
            srcCode: 'wire1.srcCode',
          }
          return wireSpec
        }
      }
      const wireSpecs = _.mapValues(wireSpecFactories, (factory, key) => {
        factory.srcCode = factory.toString()
        const wireSpec = factory()
        wireSpec.specFactoryFn = factory
        wireSpec.srcCode = factory.toString()
        return wireSpec
      })
      graph.addWireFromSpec({wireSpec: wireSpecs.wire1})

      return graph
    }
    const origGraph = genBasicGraph()
    const serialization = origGraph.getSerialization()
    const graphFactory = async ({store}) => {
      const graph = await Graph.fromSerialization({serialization})
      return graph
    }
    return (
      <PersistentGraphView
        storesFactory={() => memoizedCreateStores({namespace: origGraph.id})}
        graphFactory={graphFactory}
      />
    )
  })

