import { transform } from '@babel/core'
import presetReact from '@babel/preset-react'
import presetEnv from '@babel/preset-env'

const transformOpts = {
  babelrc: false,
  presets: [presetReact, presetEnv],
  parserOpts: {
    allowReturnOutsideFunction: true
  },
}

class Transformer {
  transform (code) {
    const beginComment = '//BEGIN'
    const markedCode = [beginComment, code].join("\n")
    let transformed = transform(markedCode, transformOpts)
    return transformed
  }
}

export default Transformer
