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
    const { pos } = this.props
    return React.cloneElement(child, {
      ref: this.rootRef,
      dragHandleRef: this.dragHandleRef,
      dragContainerRef: this.dragContainerRef,
      style: Object.assign(
        {},
        this.props.style,
        {
          position: 'absolute',
          ...(child.props.style || {}),
          left: pos.x + 'px',
          top: pos.y + 'px',
        }
      ),
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
    try { this.props.beforeUnmount(this) }
    catch (e) {}
  }
}

class DragContainer extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      modified: 0,
      childItemPositions: {}
    }
    this.counter = 0
    this.containerRef = React.createRef()
    this.avatarRef = React.createRef()
    this.childItems = {}
    this.childPositions = {}
    this.topZIndex = 0
    this.childZIndexes = {}
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
        className='drag-container'
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
    const pos = this.getChildPos(key) || child.props.pos || {x: 0, y: 0}
    return (
      <DraggableItem
        key={key}
        pos={pos}
        afterMount={(draggableItem) => {
          this.childItems[key] = draggableItem
          this.setChildPos({key, pos})
          this.dragifyDraggableItem({draggableItem, key})
        }}
        beforeUnmount={() => {
          interact(this.childItems[key].current).unset()
          this.deleteChildPos(key)
          delete this.childItems[key]
        }}
        onDragEnd={child && child.props.onDragEnd}
        style={{
          zIndex: (this.getChildZIndex({key}) || 0)
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
        const currentPos = this.getChildPos(key)
        const avatar = this._dragMgr.avatar
        const nextPos = _.mapValues(currentPos, (curValue, xy) => {
          const delta = avatar.pos[xy] - avatar.startPos[xy]
          return curValue + delta
        })
        this.setChildPos({key, pos: nextPos})
        this.sendChildToTop({key})
        this._dragMgr.reset()
        this.onDragEnd({draggableItem, key, pos: nextPos})
      },
      onmove: (event) => {
        this._dragMgr.avatar.incrementPos({x: event.dx, y: event.dy})
      }
    })
  }

  getChildPos (key) {
    return this.childPositions[key]
  }

  setChildPos ({key, pos}) {
    const changed = (this.childPositions[key] !== pos)
    if (changed) {
      this.childPositions[key] = pos
      this.setState({modified: Date.now()})
    }
  }

  deleteChildPos (key) {
    delete this.childPositions[key]
  }

  getChildZIndex ({key}) {
    return this.childZIndexes[key]
  }

  sendChildToTop ({key}) {
    this.topZIndex += 1
    this.setChildZIndex({key, zIndex: this.topZIndex})
  }

  setChildZIndex ({key, zIndex}) {
    this.childZIndexes[key] = zIndex
    this.setState({modified: Date.now()})
  }

  onDragEnd ({draggableItem, key, pos}) {
    if (draggableItem.props.onDragEnd) {
      draggableItem.props.onDragEnd({pos})
    }
    if (this.props.onDragEnd) {
      this.props.onDragEnd({pos})
    }
  }
}

export default DragContainer
