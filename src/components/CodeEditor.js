import React from 'react'
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/jsx/jsx'


/* eslint-disable */
import cmCSS from '!!raw-loader!codemirror/lib/codemirror.css'
import cmJSX from '!!raw-loader!codemirror/mode/jsx/jsx'
import cmJS from '!!raw-loader!codemirror/lib/codemirror.js'
/* eslint-enable */

import CodeMirror from './CodeMirror'


class CodeEditor extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      errorFromSave: null,
    }
    this.cmRef = React.createRef()
    this.cm = null
  }

  render () {
    const codeMirror = (
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
    const errors = []
    if (this.state.errorFromSave) {
      errors.push(this.state.errorFromSave)
    }
    return (
      <div>
        {
          errors.length > 0 ? (
            <div>{'' + errors}</div>
          ) : null
        }
        {codeMirror}
      </div>
    )
  }

  componentDidMount () {
    this.cm = this.cmRef.current.getCodeMirror()
    if (this.props.afterMount) {
      this.props.afterMount({cm: this.cm})
    }
  }

  async onSave () {
    this.setState({errorFromSave: null})
    if (this.props.onSave) {
      try {
        await this.props.onSave({code: this.cm.getValue()})
      } catch (err) {
        console.error(err)
        this.setState({errorFromSave: 'Could not save: ' + err})
      }
    }
  }
}

CodeEditor.styles = [ cmCSS ]
CodeEditor.scripts = [ cmJSX, cmJS ]

export default CodeEditor
