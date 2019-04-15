import React from 'react'
import { storiesOf } from '@storybook/react'

import { observable } from 'mobx'

storiesOf('scratch', module)
  .add('mobx.toJS', () => {
    window.obs = observable
    return (
      <div>
      </div>
    )
  })
