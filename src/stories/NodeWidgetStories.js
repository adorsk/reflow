import React from 'react'
import { storiesOf } from '@storybook/react'

import NodeWidget from '../components/NodeWidget.js'

storiesOf('NodeWidget', module)
  .add('testing', () => {
    const node = {
      id: 'a',
    }
    return (
      <div>
        <h5>NodeWidget</h5>
        <NodeWidget node={node} />
      </div>
    )
  })
