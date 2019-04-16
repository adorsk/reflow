import React from 'react'
import { storiesOf } from '@storybook/react'

import CodeEditor from '../components/CodeEditor.js'
import WindowPortal from '../components/WindowPortal.js'


storiesOf('CodeEditor', module)
  .add('default', () => {
    return (<CodeEditor defaultValue={'some src'}/>)
  })
  .add('portal', () => {

    class PortalLauncher extends React.Component {
      constructor (props) {
        super(props)
        this.state = {
          visible: false,
        }
      }

      render () {
        return (
          <div>
            <button
              onClick={() => {
                this.setState({visible: !this.state.visible})
              }}
            >
              toggle
              {this.state.visible ? this.renderPortal() : null}
            </button>
          </div>
        )
      }

      renderPortal () {
        return (
          <WindowPortal
            closeOnUnmount={true}
            windowName={'figgies'}
            styles={[...CodeEditor.styles]}
            beforeUnload={() => this.setState({visible: false})}
          >
            <CodeEditor
              style={{
                width: '100%',
                height: 'auto',
              }}
              defaultValue={"yo here some code\nfish pie"}
              autoRefreshAfterMount={true}
              onSave={({code}) => {
                console.log('saveo', code)
              }}
            />
          </WindowPortal>
        )
      }
    }

    return (<PortalLauncher />)
  })
