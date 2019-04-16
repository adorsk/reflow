import React from 'react'
import { storiesOf } from '@storybook/react'

import CodeEditor from '../components/CodeEditor.js'


storiesOf('CodeEditor', module)
  .add('default', () => {
    return (<CodeEditor defaultValue={'some src'}/>)
  })
