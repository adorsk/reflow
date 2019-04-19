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
  const fn = eval(fnString) // eslint-disable-line
  return fn
}
