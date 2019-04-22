import React from 'react'
import { storiesOf } from '@storybook/react'

import ReflowEditor from '../../components/ReflowEditor.js'


storiesOf('ReflowEditor', module)
  .add('default', () => {
    return (
      <ReflowEditor
        style={{
          height: '100vh',
          width: '100vw',
        }}
      />
    )
  })
