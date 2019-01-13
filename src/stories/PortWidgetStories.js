import React from 'react'
import { storiesOf } from '@storybook/react'

import { PortWidget } from '../components/PortWidget.js'
import Port from '../engine/Port.js'

storiesOf('PortWidget', module)
  .add('default', () => {
    const ports = ['inputs', 'outputs'].reduce((obj, key) => ({
      ...obj,
      [key]: {
        id: `${key}-id`,
        label: `${key}-label`,
        ioType: key,
      }
    }), {})
    return (
      <div>
        <hr/>
        <div>
          <h5>inputs</h5>
          <PortWidget port={ports.inputs}/>
        </div>
        <hr/>
        <div>
          <h5>outputs</h5>
          <PortWidget port={ports.outputs}/>
        </div>
        <hr/>
      </div>
    )
  })




