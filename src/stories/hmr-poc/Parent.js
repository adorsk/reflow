import React from 'react'

import MyComponent from './MyComponent'
import MyOtherComponent from './MyOtherComponent'

export default class Parent extends React.Component {
  render () {
    const { store } = this.props
    return (
      <div>
        <MyOtherComponent store={store} />
        <MyComponent store={store} />
      </div>
    )
  }
}
