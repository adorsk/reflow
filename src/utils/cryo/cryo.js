// Modified from: https://raw.githubusercontent.com/hunterloftis/cryo/master/lib/cryo.jsconst

// bc 'AsyncFunction' can be mangled during transpilation.
const AsyncFunction_ = (async function() {}).constructor

const CONTAINER_TYPES = 'object array date function'.split(' ')
const FLAGS = {
  REF: 'REF',
  INF: 'INF',
  FN: 'FN',
  UNDEF: 'UNDEF',
  DATE: 'DATE',
  OBJ: 'OBJ',
  ARRAY: 'ARRAY',
}
for (let key of Object.keys(FLAGS)) { FLAGS[key] = '_CRYO:' + FLAGS[key] }

function typeOf(item) {
  if (typeof item === 'object') {
    if (item === null) return 'null'
    if (item && item.nodeType === 1) return 'dom'
    if (item instanceof Array) return 'array'
    if (item instanceof Date) return 'date'
    return 'object'
  }
  return typeof item
}

function stringify(item, options) {
  options = Object.assign({
    prepare: null,
    isSerializable: function(item, key) {
      return item.hasOwnProperty(key)
    }
  }, options)
  const references = [];
  const root = cloneWithReferences(item, references, options)
  return JSON.stringify({root, references})
}

function cloneWithReferences(item, references, options, savedItems = []) {
  if (options.prepare) { options.prepare(item) }
  const type = typeOf(item)
  // can this object contain its own properties?
  if (CONTAINER_TYPES.indexOf(type) !== -1) {
    let referenceIndex = savedItems.indexOf(item)
    // do we need to store a new reference to this object?
    if (referenceIndex === -1) {
      const clone = {}
      referenceIndex = (references.push({
        contents: clone,
        value: wrapConstructor(item)
      }) - 1)
      savedItems[referenceIndex] = item
      for (let key in item) {
        if (options.isSerializable(item, key)) {
          clone[key] = cloneWithReferences(item[key], references, options, savedItems)
        }
      }
    }
    return FLAGS.REF + referenceIndex
  }
  return wrap(item)
}

function parse(string, options) {
  const json = JSON.parse(string)
  options = Object.assign({ finalize: null }, options)
  return rebuildFromReferences(json.root, json.references, options)
}

function rebuildFromReferences(item, references, options, restoredItems = []) {
  if (starts(item, FLAGS.REF)) {
    const referenceIndex = parseInt(item.slice(FLAGS.REF.length), 10)
    if (!restoredItems.hasOwnProperty(referenceIndex)) {
      const ref = references[referenceIndex]
      const container = unwrapConstructor(ref.value)
      const contents = ref.contents
      restoredItems[referenceIndex] = container
      for (let key in contents) {
        container[key] = rebuildFromReferences(contents[key], references, options, restoredItems)
      }
    }
    if (options.finalize) { options.finalize(restoredItems[referenceIndex]) }
    return restoredItems[referenceIndex]
  }
  if (options.finalize) { options.finalize(item) }
  return unwrap(item)
}

function wrap(item) {
  var type = typeOf(item)
  if (type === 'undefined') return FLAGS.UNDEF
  if (type === 'function') return FLAGS.FN + item.toString()
  if (type === 'date') return FLAGS.DATE + item.getTime()
  if (item === Infinity) return FLAGS.INF
  if (type === 'dom') return undefined
  return item
}

function wrapConstructor(item) {
  var type = typeOf(item)
  if (type === 'function' || type === 'date') return wrap(item)
  if (type === 'object') return FLAGS.OBJ
  if (type === 'array') return FLAGS.ARRAY
  return item
}

function unwrapConstructor(val) {
  if (typeOf(val) === 'string') {
    if (val === FLAGS.UNDEF) { return undefined }
    if (starts(val, FLAGS.FN)) {
      return deserializeFnVal(val)
    }
    if (starts(val, FLAGS.DATE)) {
      return new Date(parseInt(val.slice(FLAGS.DATE.length), 10))
    }
    if (starts(val, FLAGS.OBJ)) { return {} }
    if (starts(val, FLAGS.ARRAY)) { return [] }
    if (val === FLAGS.INF) return Infinity
  }
  return val
}

function deserializeFnVal (val) {
  const fn = val.slice(FLAGS.FN.length)
  const isAsync = fn.startsWith('async')
  const argStart = fn.indexOf('(') + 1
  const argEnd = fn.indexOf(')', argStart)
  const args = fn.slice(argStart, argEnd)
  const bodyStart = fn.indexOf('{') + 1
  const bodyEnd = fn.lastIndexOf('}')
  const body = fn.slice(bodyStart, bodyEnd)
  const ctor = (isAsync) ? AsyncFunction_ : Function // eslint-disable-line
  return new ctor(args, body)
}

function unwrap(val) {
  if (typeOf(val) === 'string') {
    if (val === FLAGS.UNDEF) { return undefined }
    if (starts(val, FLAGS.FN)) {
      return deserializeFnVal(val)
    }
    if (starts(val, FLAGS.DATE)) {
      var dateNum = parseInt(val.slice(FLAGS.DATE.length), 10)
      return new Date(dateNum);
    }
    if (val === FLAGS.INF) return Infinity
  }
  return val;
}

function starts(string, prefix) {
  return ((typeOf(string) === 'string') && string.startsWith(prefix))
}

export const Cryo = { FLAGS, stringify, parse }
export default Cryo
