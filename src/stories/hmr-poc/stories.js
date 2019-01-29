import React from 'react'
import { storiesOf } from '@storybook/react'

import store from './store.js'
import Parent from './Parent.js'


storiesOf('hmr-poc', module)
  .add('example', () => {
    return (
      <Parent store={store}/>
    )
  })
