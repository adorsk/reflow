import Cryo from '../cryo.js'

describe('Complex', function() {
  it('should hydrate several objects referring to each other', function() {
    const user1 = {
      name: 'Hunter',
      destroy: function() {
        return 'destroyed ' + this.name;
      }
    }
    const user2 = { name: 'Jim' }
    const project = { maintainers: [user1, user2], title: 'Cryo' }
    const test = {
      subject: project,
      passing: true,
      hooks: { subscribed_users: [user1] }
    }
    const stringified = Cryo.stringify(test)
    const hydrated = Cryo.parse(stringified)
    const result1 = test.hooks.subscribed_users[0].destroy()
    const result2 = hydrated.hooks.subscribed_users[0].destroy()
    hydrated.hooks.subscribed_users[0].name = 'Newname'
    const result3 = hydrated.hooks.subscribed_users[0].destroy()
    expect(result1).toEqual(result2)
    expect(result3).toEqual('destroyed Newname')
    expect(test.passing).toEqual(hydrated.passing)
    expect(test.subject.title).toEqual(hydrated.subject.title)
  })

  it('should dereference objects that were originally the same into the same after hydration', function() {
    const userList = [{ name: 'Abe' }, { name: 'Bob' }, { name: 'Carl' }]
    const state = { users: userList, activeUser: userList[1] }
    const stringified = Cryo.stringify(state)
    const hydrated = Cryo.parse(stringified)
    expect(hydrated.activeUser).toBe(hydrated.users[1])
  })

  it.skip('should be able to hydrate itself', function() {
    const stringified = Cryo.stringify(Cryo)
    const hydrated = Cryo.parse(stringified)
    expect(typeof hydrated.parse).toEqual('function')
    expect(typeof hydrated.stringify).toEqual('function')
  })

  it('should be able to use callbacks to hydrate objects with types', function() {
    function CustomType() {}
    const test = new CustomType()
    test.sub = [new CustomType()]
    const types = { 'CustomType': CustomType }
    const stringified = Cryo.stringify(test, { prepare: function(obj) {
      if (types[obj.constructor.name]) {
        obj.__class__ = obj.constructor.name
      }
    }})
    const hydrated = Cryo.parse(stringified, { finalize: function(obj) {
      if (types[obj.__class__]) {
        obj.__proto__ = types[obj.__class__].prototype
        delete obj.__class__
      }
    }})
    expect(hydrated instanceof CustomType).toBe(true)
    expect(hydrated.sub[0] instanceof CustomType).toBe(true)
  })

  it('should hydrate object graphs with cycles', function() {
    function Cycle() {}
    const c1 = new Cycle()
    const c2 = new Cycle()
    c1.c = c2
    c2.c = c1
    const original = { c1: c1, c2: c2 }
    const stringified = Cryo.stringify(original)
    const hydrated = Cryo.parse(stringified)
    expect(hydrated).toEqual(original)
  })

  it('should be able to determine custom cloneable objects', function() {
    function Parent() {}
    Parent.prototype.__class__ = 'Parent'

    function Child() {}
    Child.prototype = Parent
    Child.prototype.constructor = Child
    Child.prototype.__class__ = 'Child'

    const original = new Child()

    const stringified = Cryo.stringify(original, {
      isSerializable: function(item, key) {
        return item.hasOwnProperty(key) || key === '__class__'
      }
    })
    const hydrated = Cryo.parse(stringified, {
      finalize: function(item) {
        if (item.__class__ === 'Child') {
          item.__proto__ = Child.prototype
        }
      }
    })
    expect(original.prototype).toBe(hydrated.prototype)
    expect(original.__class__).toBe(hydrated.__class__)
    expect(hydrated.__class__).toBe(Child.prototype.__class__)
  })
})
