import React from 'react'
import { storiesOf } from '@storybook/react'

import { PortView } from '../components/PortView.js'
import Port from '../engine/Port.js'

storiesOf('PortView', module)
  .add('inputs', () => {
    const ioType = 'inputs'
    const ports = [
      new Port({
        id: 'p1',
        label: 'p1-label',
        ioType,
      })
    ]
    return (
      <div
        style={{
          width: '150px',
          marginLeft: '100px',
          border: 'thin solid gray',
          background: 'white',
        }}
      >
        {
          ports.map((port) => {
            port.renderView = ({port}) => {
              return (<div>view for {port.id}</div>)
            }
            return (<PortView port={port} />)
          })
        }
      </div>
    )
  })




