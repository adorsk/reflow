import React from 'react'
import { storiesOf } from '@storybook/react'

import DragContainer from '../components/DragContainer.js'

storiesOf('DragContainer', module)
  .add('testing', () => {
    class Foo extends React.Component {
      render () {
        const rgb = [128, 128, 128]
        rgb[this.props.idx % 3] = 0
        return (
          <div
            ref={this.props.dragContainerRef}
            style={{
              backgroundColor: `rgba(${rgb.join(',')}, .8)`,
              borderRadius: '5%',
              padding: 100,
              ...(this.props.style || {})
            }}
          >
            <span ref={this.props.dragHandleRef}>{this.props.children}</span>
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
                  idx={i}
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
