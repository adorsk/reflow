import _ from 'lodash'

import Port from './Port.js'

export class Node {
  constructor (opts = {}) {
    this.id = opts.id || ''
    this.state = opts.state || {}
    this.tickFn = opts.tickFn
    this.ports = {
      inputs: {},
      outputs: {},
    }
    for (let ioType of ['inputs', 'outputs']) {
      const portsForIoType = (opts.ports && opts.ports[ioType]) || {}
      _.map(portsForIoType, (port) => {
        this.addPort({port, ioType})
      })
    }
    this.tickCount = 0
    this.versions = {
      inputs: 0,
      outputs: 0,
      state: 0,
      tickFn: 0,
    }
    this.changeListeners = []
    this.debouncedTick = _.debounce(this.tick.bind(this), 0)
  }

  addChangeListener ({key, listener}) {
    this.changeListeners.push({key, fn: listener})
  }

  addPort ({port, ioType}) {
    this.ports[ioType][port.id] = port
    if (ioType === 'inputs') {
      port.registerListener({
        key: this.id,
        listener: (() => this.handleChange({changed: 'inputs'})),
      })
    } else if (ioType === 'outputs') {
      port.registerListener({
        key: this.id,
        listener: (() => this.handleChange({changed: 'outputs'})),
      })
    }
  }

  handleChange ({changed = ''} = {}) {
    const versions = {
      prev: {...this.versions},
      current: {...this.versions, [changed]: this.versions[changed] + 1}
    }
    this.versions = versions.current
    for (let listener of this.changeListeners) {
      listener.fn({node: this, versions})
    }
    const shouldTick = _.some(['inputs', 'state', 'tickFn'], (key) => {
      return (versions.current[key] !== versions.prev[key])
    })
    if (shouldTick) { this.debouncedTick() }
  }

  tick() {
    const node = this.state.node
    if (this.tickFn) {
      this.tickFn({node: this})
    }
    this.setTickCount(this.tickCount + 1)
  }

  setTickCount (tickCount) {
    this.tickCount = tickCount
    this.handleChange({changed: 'tickCount'})
  }

  getPort ({portId, ioType}) {
    return this.ports[ioType][portId]
  }

  updateState (updates) {
    this.state = {...this.state, ...updates}
    this.handleChange({changed: 'state'})
  }

  setTickFn (tickFn) {
    this.tickFn = tickFn
    this.handleChange({changed: 'tickFn'})
  }

  toJson () {
    return {
      id: this.id,
      tickCount: this.tickCount,
      state: this.state,
      ports: this.ports,
      tickFn: (
        (this.tickFn && this.tickFn.toString && this.tickFn.toString())
        || this.tickFn
      )
    }
  }
}

Node.fromSpec = (spec) => {
  const nodeOpts = {...spec}
  if (spec.ports) {
    let ports = {}
    for (let ioType of Object.keys(spec.ports)) {
      ports[ioType] = []
      const portSpecsForIoTypes = spec.ports[ioType]
      for (let key of Object.keys(portSpecsForIoTypes)) {
        const portOpts = {id: key, ...portSpecsForIoTypes[key]}
        ports[ioType].push(new Port(portOpts))
      }
    }
    nodeOpts.ports = ports
  }
  const node = new Node(nodeOpts)
  return node
}

export default Node
