const mocha = require('mocha')
const chai = require('chai')
const should = chai.should()
const sinon = require('sinon')
const s = require('./index')

describe('_resolve', () => {

  it('returns with event if not there', () => {
    s._resolve(['foo', 'bar'], 'baz').should.deep.equal(['foo', 'bar', 'baz'])
  })

  it('returns with store if no event', () => {
    s._resolve(['foo', 'bar'], undefined).should.deep.equal(['foo', 'bar'])
  })

  it('returns with event if there', () => {
    s._resolve(['foo', 'bar', 'baz'], 'baz').should.deep.equal(['foo', 'bar', 'baz'])
  })

  it('returns with event if there but not the last', () => {
    s._resolve(['foo', 'baz', 'bar'], 'baz').should.deep.equal(['foo', 'baz'])
    s._resolve(['foo', 'baz', 'bar'], 'foo').should.deep.equal(['foo'])
  })


  it('returns with event if empty or undefined', () => {
    s._resolve([], 'baz').should.deep.equal(['baz'])
    s._resolve(undefined, 'baz').should.deep.equal(['baz'])
  })
})

describe('EventStore', () => {

  const dat = (s) => JSON.stringify({ messaging: [{[s]: s}]})

  it('returns just the event when db returns nothing', async () => {
    const db = { get: sinon.fake.returns(undefined) }
    const e = new s.EventStore(db)
    const events = await e.getEvents('foo', dat('baz'))
    events.should.deep.equal([ { baz: 'baz' }])
  })

  it('throws if not given a db', async () => {
    const f = () => new s.EventStore()
    f.should.throw(TypeError)
  })

  it('puts an event in the cache which is later retrieved', async () => {

    // needs a db
    const db = { get: sinon.fake.returns(undefined) }
    const e = new s.EventStore(db)
    await e.put('foo', dat('bar'))
    const events = await e.getEvents('foo', dat('baz'))
    events.should.deep.equal([ {bar: 'bar'}, { baz: 'baz' }])

    // puts into the same user
    await e.put('foo', dat('baz'))
    const events2 = await e.getEvents('foo')
    events2.should.deep.equal(events)
  })

  it('updates database when db returns something', async () => {
    const db = { get: sinon.fake.returns([dat('bar'),
                                          dat('baz')]) }
    const e = new s.EventStore(db)
    const events = await e.getEvents('foo', dat('baz'))
    events.should.deep.equal([{ bar: 'bar' },  { baz: 'baz' }])
  })

  it('works with old v1 database format mixed with current format', async () => {
    const db = { get: sinon.fake.returns([JSON.stringify({ bar: 'bar'})]) }
    const e = new s.EventStore(db)
    const events = await e.getEvents('foo', dat('baz'))
    events.should.deep.equal([{ bar: 'bar' },  { baz: 'baz' }])
  })
})
