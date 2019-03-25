import React from 'react'
import { storiesOf } from '@storybook/react'
import _ from 'lodash'

import Transformer from '../utils/Transformer.js'
import dedent from  '../utils/dedent.js'

import Graph from '../engine/Graph.js'
import {
  memoizedCreateStores,
  PersistentGraphView,
} from '../utils/graphStory-utils.js'


storiesOf('Compiler', module)
  .add('default', () => {
    const serializedGraphSpec = {
      id: 'graph-from-src',
      nodeSpecs: {
        foo: dedent(
          `
          () => {
            const nodeSpec = {
              id: 'foo',
            }
            return nodeSpec
          }
          `
        ),
        bar: dedent(
          `
          () => {
            const nodeSpec = {
              id: 'bar',
            }
            return nodeSpec
          }
          `
        ),
      },
    }
    const transformer = new Transformer()
    function compile (src) {
      const transpiledSrc = transformer.transform(src).code
      const fn = eval(transpiledSrc) // eslint-disable-line
      return fn
    }
    const graphSpec = {
      id: serializedGraphSpec.id,
      nodeSpecs: _.map(serializedGraphSpec.nodeSpecs, compile),
      wireSpecs: _.map(serializedGraphSpec.wireSpecs, compile),
    }
    const graphFactory = async ({store}) => {
      return await Graph.fromSpec({graphSpec, store})
    }
    return (
      <PersistentGraphView
        storesFactory={() => memoizedCreateStores({namespace: graphSpec.id})}
        graphFactory={graphFactory}
      />
    )
  })

