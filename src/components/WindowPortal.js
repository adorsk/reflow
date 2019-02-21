import React from 'react'
import ReactDOM from 'react-dom'

class WindowPortal extends React.PureComponent {
  constructor(props) {
    super(props)
    this.containerEl = document.createElement('div')
    this.externalWindow = null
  }
  
  render() {
    return ReactDOM.createPortal(this.props.children, this.containerEl)
  }

  componentDidMount() {
    this.externalWindow = window.open(
      '',
      (this.props.windowName || ''),
      'width=600,height=400,left=200,top=200'
    )
    this.externalWindow.document.body.appendChild(this.containerEl)
  }

  componentWillUnmount() {
    // this.externalWindow.close()
  }
}

export default WindowPortal
