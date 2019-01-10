import React from 'react'
import { storiesOf } from '@storybook/react'

import DragContainer from '../DragContainer.js'

storiesOf('DragContainer', module)
  .add('testing', () => {
    class Foo extends React.Component {
      render () {
        return (
          <div
            ref={this.props.dragContainerRef}
            style={{
              border: 'thin solid green',
              padding: 100,
              ...(this.props.style || {})
            }}
          >
            <span ref={this.props.dragHandleRef}>Foo</span>
          </div>
        )
      }
    }
    return (
      <div>
        yo
        <DragContainer
          style={{position: 'relative'}}
        >
          {
            [1,2,3].map((i) => {
              return (
                <Foo
                  key={i}
                  pos={{x : i * 50, y: i * 50}}
                >
                  {i}
                </Foo>
              )
            })
          }
        </DragContainer>
      </div>
    )
  })
