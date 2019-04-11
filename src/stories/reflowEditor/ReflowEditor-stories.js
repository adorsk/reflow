import React from 'react'
import { storiesOf } from '@storybook/react'

import ReflowEditorContainer from './ReflowEditorContainer.js'
import graphStore from './graphStore.js'


storiesOf('ReflowEditor', module)
  .add('default', () => {
    return (
      <ReflowEditorContainer graphStore={graphStore} />
    )
  })
