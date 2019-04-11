import React from 'react'
import _ from 'lodash'
import { Button, Divider } from 'semantic-ui-react'

import GraphView from './GraphView.js'


class GraphEditor extends React.Component {
  render () {
    const { graph } = this.props
    if (! graph) { return null }
    const topSectionHeight = '60px'
    return (
      <div style={this.props.style}>
        <div
          style={{
            position: 'relative',
            height: '100%',
            width: '100%',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              width: '100%',
              height: topSectionHeight,
            }}
          >
            {this.renderTopSectionContent({graph})}
          </div>

          <div
            style={{
              position: 'absolute',
              top: topSectionHeight,
              width: '100%',
              bottom: 0,
            }}
          >
            {this.renderBottomSectionContent({graph})}
          </div>

        </div>
      </div>
    )
  }

  renderTopSectionContent ({graph}) {
    return (
      <div>
        <h3>{graph.id}</h3>
        {this.renderAddNodeButton({graph})}
        <Divider />
      </div>
    )
  }

  renderAddNodeButton ({graph}) {
    return (
      <Button
        content="add node"
        onClick={() => {
          this.addBlankNodeToGraph({graph})
        }}
      />
    )
  }

  addBlankNodeToGraph ({graph}) {
    const blankNodeSpec = {
      label: _.uniqueId('node:'),
    }
    graph.addNodeFromSpec({nodeSpec: blankNodeSpec})
  }

  renderBottomSectionContent ({graph}) {
    return (
      <GraphView
        style={{
          width: '100%',
          height: '100%',
        }}
        graph={graph}
      />
    )
  }
}

export default GraphEditor
