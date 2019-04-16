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
    this.externalWindow.document.title = this.props.windowName
    if (this.props.styles) {
      for (let style of this.props.styles) {
        const styleEl = this.externalWindow.document.createElement('style')
        styleEl.setAttribute('type', 'text/css')
        styleEl.innerHTML = style
        this.externalWindow.document.head.appendChild(styleEl)
      }
    }
    if (this.props.scripts) {
      for (let script of this.props.scripts) {
        const scriptEl = this.externalWindow.document.createElement('script')
        scriptEl.innerHTML = script
        this.externalWindow.document.head.appendChild(scriptEl)
      }
    }
    this.externalWindow.document.body.appendChild(this.containerEl)
    if (this.props.beforeUnload) {
      this.externalWindow.addEventListener('beforeunload', this.props.beforeUnload)
    }
  }

  componentWillUnmount() {
    if (this.props.beforeUnmount) { this.props.beforeUnmount() }
    if (this.props.closeOnUnmount) { this.externalWindow.close() }
  }
}

export default WindowPortal
