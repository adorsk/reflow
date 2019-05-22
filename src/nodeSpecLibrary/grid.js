async ({reflowCtx}) => {
  const {NumberInput, getInputValues} = reflowCtx.utils
  const nodeSpec = {
    key: 'grid',
    label: 'grid',
    portSpecs: {
      'inputs': {
        kick: {},
        x0: {
          initialValues: [0],
          ctx: { getGuiComponent: () => NumberInput }
        },
        x1: {
          initialValues: [100],
          ctx: { getGuiComponent: () => NumberInput }
        },
        dx: {
          initialValues: [10],
          ctx: { getGuiComponent: () => NumberInput }
        },
        y0: {
          initialValues: [0],
          ctx: { getGuiComponent: () => NumberInput }
        },
        y1: {
          initialValues: [100],
          ctx: { getGuiComponent: () => NumberInput }
        },
        dy: {
          initialValues: [10],
          ctx: { getGuiComponent: () => NumberInput }
        },
      },
      'outputs': {
        cells: {},
      },
    },
    tickFn ({node}) {
      if (! node.hasHotInputs()) { return }
      const inputValues = getInputValues({
        node,
        inputKeys: Object.keys(node.getInputPorts()).filter(key => key !== 'kick')
      })
      const { x0, x1, dx, y0, y1, dy } = inputValues
      const cells = []
      let idx = 0
      for (let x = x0; x < x1; x += dx) {
        for (let y = y0; y < y1; y += dy) {
          const cell = {
            idx,
            shape: {
              bRect: {
                x,
                y,
                top: y + dy,
                right: x + dx,
                bottom: y,
                left: x,
                width: dx,
                height: dy,
              }
            }
          }
          cell.toString = () => JSON.stringify(cell)
          cells.push(cell)
          idx += 1
        }
      }
      node.getPort('outputs:cells').pushValue(cells)
    },
  }
  return nodeSpec
}

