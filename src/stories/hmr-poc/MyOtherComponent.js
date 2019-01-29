import React from 'react'

export default class MyOtherComponent extends React.Component {
  render () {
    return (
      <div>
        chorbuluus
        CounterCulture: {this.props.store.counter}
      </div>
    )
  }
}
