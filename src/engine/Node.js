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
    this.changeListeners = {}
    this.debouncedTick = _.debounce(this.tick.bind(this), 0)
    this.addChangeListener({
      key: 'tickOnChange',
      listener: (({versions}) => this.tickOnChange({versions})),
    })
  }

  addChangeListener ({key, listener}) {
    this.changeListeners[key] = listener
  }

  tickOnChange ({versions}) {
    const shouldTick = _.some(['inputs', 'state', 'tickFn'], (key) => {
      return (versions.current[key] !== versions.prev[key])
    })
    if (shouldTick) { this.debouncedTick() }
  }

  addPort ({port, ioType}) {
    this.ports[ioType][port.id] = port
    if (ioType === 'inputs') {
      port.registerListener({
        key: this.id,
        listener: (() => this.dispatchChangeEvent({changed: 'inputs'})),
      })
    } else if (ioType === 'outputs') {
      port.registerListener({
        key: this.id,
        listener: (() => this.dispatchChangeEvent({changed: 'outputs'})),
      })
    }
  }

  dispatchChangeEvent ({changed = ''} = {}) {
    const versions = {
      prev: {...this.versions},
      current: {...this.versions, [changed]: this.versions[changed] + 1}
    }
    this.versions = versions.current
    for (let listener of Object.values(this.changeListeners)) {
      listener({versions})
    }
  }

  tick({prevState = {}} = {}) {
    const node = this.state.node
    if (this.tickFn) {
      this.tickFn({node: this})
    }
    this.tickCount += 1
  }

  getPort ({portId, ioType}) {
    return this.ports[ioType][portId]
  }

  updateState (updates) {
    this.state = {...this.state, ...updates}
    this.dispatchChangeEvent({changed: 'state'})
  }

  setTickFn ({tickFn}) {
    this.tickFn = tickFn
    this.dispatchChangeEvent({changed: 'tickFn'})
  }

  toJson () {
    return {
      id: this.id,
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
