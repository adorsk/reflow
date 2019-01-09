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
