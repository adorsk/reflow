import React from 'react'

import ReflowEditor from '../../components/ReflowEditor.js'


class ReflowEditorContainer extends React.Component {
  constructor (opts) {
    super(opts)
    this.graphStore = opts.graphStore
    this.state = {
      version: this.graphStore.getVersion()
    }
  }

  componentDidMount () {
    this.onGraphStoreChanged = () => {
      this.setState({version: this.graphStore.getVersion()})
    }
    this.graphStore.changed.add(this.onGraphStoreChanged)
  }

  componentWillUnmount () {
    if (this.onGraphStoreChanged) {
      this.graphStore.changed.remove(this.onGraphStoreChanged)
    }
  }

  render () {
    const graphStore = this.graphStore
    return (
      <ReflowEditor
        style={{
          height: '100vh',
          width: '100vw',
        }}
        graphRecords={graphStore.getGraphRecords()}
        actions={graphStore.getActions()}
      />
    )
  }
}

export default ReflowEditorContainer
