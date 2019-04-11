function workerFn () {
  let ctx = null

  function setCanvas (canvas) {
    ctx = canvas.getContext('2d')
  }

  function clearCanvas () {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx.canvas.width = 1
    ctx.canvas.height = 1
  }

  function putImageData (imageData, x, y) {
    let resizeOpts = {}
    if ((x + imageData.width) > ctx.canvas.width) {
      resizeOpts.width = x + imageData.width
    }
    if ((y + imageData.height) > ctx.canvas.height) {
      resizeOpts.height = y + imageData.height
    }
    if (Object.keys(resizeOpts).length > 0) {
      resize(resizeOpts)
    }
    ctx.putImageData(imageData, x, y)
  }

  function resize (opts = {}) {
    const imageData = ctx.getImageData(
      0, 0, ctx.canvas.width, ctx.canvas.height)
    for (let dimension of Object.keys(opts)) {
      ctx.canvas[dimension] = opts[dimension]
    }
    ctx.putImageData(imageData, 0, 0)
  }

  self.addEventListener('message', (evt) => { // eslint-disable-line
    const { type, payload, key } = evt.data
    let result
    if (type === 'clearCanvas') {
      clearCanvas()
    } else if (type === 'setCanvas') {
      setCanvas(payload.canvas)
    } else if (type === 'putImageData') {
      putImageData(payload.imageData, payload.x, payload.y)
    } else if (type === 'getImageBitmap') {
      result = ctx.canvas.transferToImageBitmap()
    }
    self.postMessage({type, key, status: 'FULFILLED', result}) // eslint-disable-line
  })
}

const workerBlob = new Blob(
  [workerFn.toString().replace(/^function .+\{?|\}$/g, '')],
  { type:'text/javascript' }
)
const workerBlobUrl = URL.createObjectURL(workerBlob)

export function workerFactory () {
  return new Worker(workerBlobUrl)
}


