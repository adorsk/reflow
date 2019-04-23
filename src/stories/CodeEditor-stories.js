import React from 'react'
import { storiesOf } from '@storybook/react'
import { Modal } from 'semantic-ui-react'

import CodeEditor from '../components/CodeEditor.js'
import WindowPortal from '../components/WindowPortal.js'


storiesOf('CodeEditor', module)
  .add('default', () => {
    return (<CodeEditor defaultValue={'some src'}/>)
  })
  .add('vim', () => {
    return (
      <CodeEditor
        defaultValue={'some src'}
        cmOpts={{keyMap: 'vim'}}
        onSave={({code}) => {
          console.log('onSave', code)
        }}
      />
    )
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
            styles={[...Object.values(CodeEditor.styles)]}
            scripts={[...Object.values(CodeEditor.scripts)]}
            beforeUnload={() => this.setState({visible: false})}
          >
            <CodeEditor
              cmOpts={{keyMap: 'vim'}}
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
  .add('in modal', () => {
    class ModalLauncher extends React.Component {
      constructor (props) {
        super(props)
        this.state = {
          visible: false,
        }
      }

      render () {
        return (
          <div>
            {this.state.visible ? this.renderModal() : null}
            <button
              onClick={() => {
                this.setState({visible: !this.state.visible})
              }}
            >
              toggle
              { '' + this.state.visible }
            </button>
          </div>
        )
      }

      renderModal () {
        return (
          <Modal
            open={true}
            closeOnEscape={false}
            onClose={() => {
              this.setState({visible: false})
            }}
          >
            <Modal.Content>
              <CodeEditor
                cmOpts={{keyMap: 'vim'}}
                style={{
                  width: '100%',
                  height: '200px',
                }}
                defaultValue={'some code'}
                onSave={async ({code}) => {
                  console.log('yo', code)
                }}
              />
            </Modal.Content>
          </Modal>
        )
      }
    }

    return (<ModalLauncher />)
  })
