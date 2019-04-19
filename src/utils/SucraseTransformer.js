import { transform } from 'sucrase'


class Transformer {
  transform (code) {
    const beginComment = '//BEGIN'
    const markedCode = [beginComment, code].join("\n")
    let transformed = transform(
      markedCode,
      {
        transforms: ['jsx'],
        production: true,
      }
    )
    return transformed
  }
}

export default Transformer
