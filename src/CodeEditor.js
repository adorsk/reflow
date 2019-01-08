import React from 'react'
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/jsx/jsx'

import CodeMirror from './CodeMirror'

class CodeEditor extends React.Component {
  constructor (props) {
    super(props)
    this.cmRef = React.createRef()
    this.cm = null
  }

  render () {
    return (
      <CodeMirror
        ref={this.cmRef}
        defaultValue={this.props.defaultValue}
        style={this.props.style}
        options={{
          mode: 'jsx',
          lineNumbers: true,
          matchBrackets: true,
          showCursorWhenSelecting: true,
          inputStyle: 'contenteditable',
          scrollbarStyle: 'native',
          extraKeys: {
            'Ctrl-S': () => this.onSave()
          }
        }}
      />
    )
  }

  componentDidMount () {
    this.cm = this.cmRef.current.getCodeMirror()
  }

  onSave () {
    if (this.props.onSave) {
      this.props.onSave({code: this.cm.getValue()})
    }
  }
}

export default CodeEditor
