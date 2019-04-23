import React from 'react'
import _ from 'lodash'
import 'codemirror/lib/codemirror.css'
import 'codemirror/addon/dialog/dialog.css'
import 'codemirror/addon/dialog/dialog.js'
import 'codemirror/mode/jsx/jsx'
import 'codemirror/keymap/vim.js'


/* eslint-disable */
import dialogCSS from '!!raw-loader!codemirror/addon/dialog/dialog.css'
import dialogJS from '!!raw-loader!codemirror/addon/dialog/dialog.js'
import cmCSS from '!!raw-loader!codemirror/lib/codemirror.css'
import cmJSX from '!!raw-loader!codemirror/mode/jsx/jsx'
import cmVimKeyMapJS from '!!raw-loader!codemirror/keymap/vim.js'
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
        options={Object.assign({
          mode: 'jsx',
          lineNumbers: true,
          matchBrackets: true,
          showCursorWhenSelecting: true,
          // inputStyle is important!
          // 'contenteditable' inputStyle can result in zombie polls.
          inputStyle: 'textarea',
          scrollbarStyle: 'native',
          extraKeys: {
            'Ctrl-S': () => this.onSave()
          }
        }, this.props.cmOpts)}
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
    let readyPromise = Promise.resolve()
    const autoRefreshOnMount = _.get(this.props, 'autoRefreshOnMount', true)
    if (autoRefreshOnMount) {
      readyPromise = new Promise((resolve, reject) => {
        const delay = 250
        const check = () => {
          if (this.cm.display.wrapper.offsetHeight) {
            this.cm.refresh()
            resolve()
          } else {
            this.cm.state.timeout = setTimeout(check, delay)
          }
        }
        check()
      })
    }
    if (_.get(this.props, 'autoFocusOnMount', true)) {
      readyPromise = readyPromise.then(() => {
        this.cm.onSave = this.onSave.bind(this)
        this.cm.focus()
      })
    }
    if (this.props.afterMount) {
      readyPromise.then(() => this.props.afterMount({cm: this.cm}))
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

CodeEditor.styles = { cmCSS, dialogCSS }
CodeEditor.scripts = { cmJSX, cmVimKeyMapJS, dialogJS }

export default CodeEditor
