import * as workly from 'workly/index.js'

class Quilter {
  constructor () {
    this.ctx = null
  }

  setCanvas (canvas) {
    this.ctx = canvas.getRenderingContext('2d')
  }

  putImageData (imageData, x, y) {
    let resizeOpts = {}
    if ((x + imageData.width) > this.ctx.canvas.width) {
      resizeOpts.width = x + imageData.width
    }
    if ((y + imageData.height) > this.ctx.canvas.height) {
      resizeOpts.height = y + imageData.height
    }
    if (! _.isEmpty(resizeOpts)) {
      this.resize(resizeOpts)
    }
  }

  resize (opts = {}) {
    const imageData = this.ctx.getImageData(
      0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
    for (let dimension of Object.keys(opts)) {
      this.ctx.canvas[dimension] = opts[dimension]
    }
    this.ctx.putImageData(imageData, 0, 0)
  }
}

const quilter = new Quilter()


