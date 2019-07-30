import Transformer from './Transformer.js'


// eslint-disable-next-line
export const AsyncFunction = eval(`Object.getPrototypeOf(async function(){}).constructor`)

const transformer = new Transformer()

export const getPagePos = (el) => {
  let x = 0
  let y = 0
  while(el.offsetParent) {
    x += el.offsetLeft
    y += el.offsetTop
    el = el.offsetParent
  } 
  return {x, y}
}
export function stringToHashCode (s) {
  let hash = 0, i, chr
  if (s.length === 0) { return hash }
  for (i = 0; i < s.length; i++) {
    chr = s.charCodeAt(i)
    hash = ((hash << 5) - hash) + chr
    hash |= 0 // Convert to 32bit integer
  }
  return hash
}

export function compileFn (fnString) {
  try {
    const fn = eval(fnString) // eslint-disable-line
    return fn
  } catch (err) {
    throw new Error([err, "fnString:\n" + fnString].join("\n"))
  }
}

export function transformCode (code) {
  return transformer.transform(code).code
}

export function transformAndCompileCode (code) {
  try {
    const transformed = transformCode(code)
    const compiled = eval(transformed) // eslint-disable-line
    return compiled
  } catch (err) {
    throw new Error([err, "code:\n" + code].join("\n"))
  }
}

// from:
// https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
export function uuid4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16) // eslint-disable-line
  )
}
