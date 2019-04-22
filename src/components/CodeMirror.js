// Adapted from react-codemirror by JedWatson.
import React from 'react'
import codemirror from 'codemirror'
import { debounce, isEqual } from 'lodash'
import PropTypes from 'prop-types'
import classNames from 'classnames'

function normalizeLineEndings (str) {
	if (!str) { return str }
	return str.replace(/\r\n|\r/g, '\n')
}

class CodeMirror extends React.Component {
	static propTypes = {
		autoFocus: PropTypes.bool,
		className: PropTypes.any,
		codeMirrorInstance: PropTypes.func,
		defaultValue: PropTypes.string,
		name: PropTypes.string,
		onChange: PropTypes.func,
		onCursorActivity: PropTypes.func,
		onFocusChange: PropTypes.func,
		onScroll: PropTypes.func,
		options: PropTypes.object,
		path: PropTypes.string,
		value: PropTypes.string,
		preserveScrollPosition: PropTypes.bool,
	}

	static defaultProps = {
		preserveScrollPosition: false
  }

  constructor (props) {
    super(props)
    this.containerRef = React.createRef()
    this.textareaRef = React.createRef()
    this.state = { isFocused: false}
  }

	getCodeMirrorInstance () {
		return this.props.codeMirrorInstance || codemirror
	}

	componentWillMount () {
		this.UNSAFE_componentWillReceiveProps = debounce(this.UNSAFE_componentWillReceiveProps, 0)
	}

	componentDidMount () {
		const cmInstance = this.getCodeMirrorInstance()
    cmInstance.commands.save = function (cm) {
      console.log('saveo')
      if (cm.onSave) { cm.onSave() }
    }
    this.cm = cmInstance.fromTextArea(
      this.textareaRef.current,
      Object.assign({}, this.getDefaultOptions(), this.props.options)
    )

    // Some extra logic for setting height for 
    // .CodeMirror & .CodeMirror-Scroller elements.
    if (this.props.style) { 
      if (this.props.style.height) {
        let height = this.props.style.height
        if (typeof height === 'number') {
          height = height + 'px'
        }
        this.cm.getWrapperElement().style.height = height
      }
      if (this.props.style.maxHeight) {
        let maxHeight = `${this.props.style.maxHeight}`
        if (typeof maxHeight === 'number') {
          maxHeight = maxHeight + 'px'
        }
        if (maxHeight.endsWith('%')) {
          if (window && window.getComputedStyle) {
            const parentHeight = window.getComputedStyle(
              this.containerRef.current.parentNode).height
            maxHeight = (
              (parseFloat(maxHeight, 10) / 100)
              * parseFloat(parentHeight, 10)
            ) + 'px'
          }
        }
        this.cm.getScrollerElement().style.maxHeight = maxHeight
      }
    }
		this.cm.on('change', this.codemirrorValueChanged.bind(this))
		this.cm.on('cursorActivity', this.cursorActivity.bind(this))
		this.cm.on('focus', this.focusChanged.bind(this, true))
		this.cm.on('blur', this.focusChanged.bind(this, false))
		this.cm.on('scroll', this.scrollChanged.bind(this))
		this.cm.setValue(this.props.defaultValue || this.props.value || '')
	}

  getDefaultOptions () {
    return {
      keyMap: 'default',
      viewportMargin: Infinity,
      scrollbarStyle: 'overlay',
    }
  }

	componentWillUnmount () {
		// is there a lighter-weight way to remove the cm instance?
		if (this.cm) {
      this.cm.toTextArea()
		}
	}

	UNSAFE_componentWillReceiveProps (nextProps) {
		if (this.cm && nextProps.value !== undefined && nextProps.value !== this.props.value && normalizeLineEndings(this.cm.getValue()) !== normalizeLineEndings(nextProps.value)) {
			if (this.props.preserveScrollPosition) {
				const prevScrollPosition = this.cm.getScrollInfo()
				this.cm.setValue(nextProps.value)
				this.cm.scrollTo(prevScrollPosition.left, prevScrollPosition.top)
			} else {
				this.cm.setValue(nextProps.value)
			}
		}
		if (typeof nextProps.options === 'object') {
			for (let optionName in nextProps.options) {
				if (nextProps.options.hasOwnProperty(optionName)) {
					this.setOptionIfChanged(optionName, nextProps.options[optionName])
				}
			}
		}
	}

	setOptionIfChanged (optionName, newValue) {
 		const oldValue = this.cm.getOption(optionName)
 		if (!isEqual(oldValue, newValue)) {
 			this.cm.setOption(optionName, newValue)
 		}
 	}

	getCodeMirror () {
		return this.cm
	}

	focus () {
		if (this.cm) { this.cm.focus() }
	}

	focusChanged (focused) {
		this.setState({isFocused: focused})
		this.props.onFocusChange && this.props.onFocusChange(focused)
	}

	cursorActivity (cm) {
		this.props.onCursorActivity && this.props.onCursorActivity(cm)
	}

	scrollChanged (cm) {
		this.props.onScroll && this.props.onScroll(cm.getScrollInfo())
	}

	codemirrorValueChanged (doc, change) {
		if (this.props.onChange && change.origin !== 'setValue') {
			this.props.onChange(doc.getValue(), change)
		}
	}

	render () {
		const editorClassName = classNames(
			'ReactCodeMirror',
			this.state.isFocused ? 'ReactCodeMirror--focused' : null,
			this.props.className
		)
		return (
      <div
        ref={this.containerRef}
        className={editorClassName}
        style={this.props.style}
      >
				<textarea
					ref={this.textareaRef}
					name={this.props.name || this.props.path}
					defaultValue={this.props.value}
					autoComplete="off"
					autoFocus={this.props.autoFocus}
				/>
			</div>
		)
	}
}

export default CodeMirror
