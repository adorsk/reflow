import React from 'react'
import _ from 'lodash'
import interact from 'interactjs'

// onmount items, we interact-ify them.
// interact handler updates state in par


class DraggableItem extends React.Component {
  constructor (props) {
    super(props)
    this.rootRef = React.createRef()
    this.dragHandleRef = React.createRef()
    this.dragContainerRef = React.createRef()
  }

  render () {
    const child = React.Children.only(this.props.children)
    const pos = this.props.pos || child.props.pos || {x: 0, y: 0}
    return React.cloneElement(child, {
      ref: this.rootRef,
      dragHandleRef: this.dragHandleRef,
      dragContainerRef: this.dragContainerRef,
      style: {
        position: 'absolute',
        ...(child.props.style || {}),
        left: pos.x + 'px',
        top: pos.y + 'px',
        color: 'blue'
      },
    })
  }

  getDragHandleEl () {
    return this.dragHandleRef.current || this.rootRef.current
  }

  getDragContainerEl () {
    return this.dragContainerRef.current || this.rootRef.current
  }

  componentDidMount () {
    if (!this.props.afterMount) { return }
    this.props.afterMount(this)
  }

  componentWillUnmount () {
    if (!this.props.beforeUnmount) { return }
    try {
      this.props.beforeUnmount(this)
    }
    catch (e) {}
  }
}

class DragCanvas extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      draggableItemPositions: {}
    }
    this.counter = 0
    this.containerRef = React.createRef()
    this.avatarRef = React.createRef()
    this.childItems = {}

    // Set initial positions.
    for (let child of React.Children.toArray(this.props.children)) {
      if (child.props.pos) {
        this.state.draggableItemPositions[child.key] = child.props.pos
      }
    }
  }

  componentDidMount () {
    this.setupDragMgr()
  }

  setupDragMgr() {
    this._dragMgr = {
      avatar: {
        el: this.avatarRef.current,
        updateStyle: (style) => {
          _.each(style, (val, key) => {
            this._dragMgr.avatar.el.style[key] = val
          })
        },
        incrementPos: ({x, y}) => {
          const currentPos = this._dragMgr.avatar.pos
          const nextPos = {x: currentPos.x + x, y: currentPos.y + y}
          this._dragMgr.avatar.setPos(nextPos)
        },
        setPos: (pos) => {
          this._dragMgr.avatar.pos = pos
          this._dragMgr.avatar.updateStyle({
            left: pos.x + 'px',
            top: pos.y + 'px',
          })
        }
      },
      reset: () => {
        this._dragMgr = {
          ...this._dragMgr,
          avatar: {
            ...this._dragMgr.avatar,
            startPos: null,
            key: null,
            pos: null,
          },
          before: null,
          after: null,
        }
        this._dragMgr.avatar.updateStyle({visibility: 'hidden'})
      }
    }
    this._dragMgr.reset()
    //extra scroll handling per: https://github.com/taye/interact.js/issues/568
    interact(this.containerRef.current).on('scroll', () => {
      if (!(this._dragMgr.avatar.key)) { return }
      const currentScroll = {
        x: this.containerRef.current.scrollLeft,
        y: this.containerRef.current.scrollTop
      }
      this._dragMgr.before = this._dragMgr.after || currentScroll
      this._dragMgr.after = currentScroll
      this._dragMgr.avatar.incrementPos({
        x: (this._dragMgr.after.x - this._dragMgr.before.x),
        y: (this._dragMgr.after.y - this._dragMgr.before.y),
      })
    })
  }

  render () {
    return (
      <div
        ref={this.containerRef}
        style={Object.assign({}, this.props.style)}
      >
        {
          React.Children.toArray(this.props.children).map((child) => {
            return this.renderDraggableChild(child)
          })
        }
        <div
          key="avatar"
          ref={this.avatarRef}
          style={{
            position: 'absolute',
            border: 'thin solid orange'
          }}
        />
      </div>
    )
  }

  renderDraggableChild (child) {
    const key = child.key
    return (
      <DraggableItem
        key={key}
        pos={this.getChildPos(key)}
        afterMount={(draggableItem) => {
          this.childItems[key] = draggableItem
          this.dragifyDraggableItem({draggableItem, key})
        }}
        beforeUnmount={() => {
          interact(this.childItems[key].current).unset()
          delete this.childItems[key]
        }}
      >
        {child}
      </DraggableItem>
    )
  }

  dragifyDraggableItem ({draggableItem, key}) {
    const dragHandleEl = draggableItem.getDragHandleEl()
    const dragContainerEl = draggableItem.getDragContainerEl()
    interact(dragHandleEl).draggable({
      restrict: false,
      autoScroll: { container: this.containerRef.current },
      onstart: () => {
        this._dragMgr.avatar.key = key
        const boundingRect = dragContainerEl.getBoundingClientRect()
        this._dragMgr.avatar.updateStyle({
          visibility: 'visible',
          width: boundingRect.width + 'px',
          height: boundingRect.height + 'px',
        })
        const startPos = {
          x: parseFloat(dragContainerEl.style.left) || 0,
          y: parseFloat(dragContainerEl.style.top) || 0,
        }
        this._dragMgr.avatar.setPos(startPos)
        this._dragMgr.avatar.startPos = startPos
      },
      onend: () => {
        const currentPos = this.getChildPos(key) || {x: 0, y: 0}
        const avatar = this._dragMgr.avatar
        const nextPos = _.mapValues(currentPos, (curValue, xy) => {
          const delta = avatar.pos[xy] - avatar.startPos[xy]
          return curValue + delta
        })
        this.setChildPos({key, pos: nextPos})
        this._dragMgr.reset()
      },
      onmove: (event) => {
        this._dragMgr.avatar.incrementPos({x: event.dx, y: event.dy})
      }
    })
  }

  getChildPos (key) {
    return _.get(this.state.draggableItemPositions, key)
  }

  setChildPos ({key, pos}) {
    this.setState({
      draggableItemPositions: {
        ...this.state.draggableItemPositions,
        [key]: pos
      }
    })
  }
}

export default DragCanvas
