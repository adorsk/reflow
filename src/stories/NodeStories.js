import React from 'react'
import { storiesOf } from '@storybook/react'

import Node from '../Node.js'

storiesOf('Node', module)
  .add('testing', () => {
    const node = {
      id: 'a',
    }
    return (
      <div>
        <h5>Node</h5>
        <Node node={node} />
      </div>
    )
  })
