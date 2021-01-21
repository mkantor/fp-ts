import * as assert from 'assert'
import { separated } from '../src/Compactable'
import * as _ from '../src/Either'
import { eqNumber, eqString } from '../src/Eq'
import { identity, pipe } from '../src/function'
import { monoidString } from '../src/Monoid'
import * as O from '../src/Option'
import * as A from '../src/ReadonlyArray'
import { semigroupSum } from '../src/Semigroup'
import { showString } from '../src/Show'
import * as T from '../src/Task'

describe('Either', () => {
  describe('pipeables', () => {
    it('mapLeft', () => {
      const double = (n: number): number => n * 2
      assert.deepStrictEqual(pipe(_.right('bar'), _.mapLeft(double)), _.right('bar'))
      assert.deepStrictEqual(pipe(_.left(2), _.mapLeft(double)), _.left(4))
    })

    it('alt', () => {
      assert.deepStrictEqual(
        pipe(
          _.right(1),
          _.alt(() => _.right(2))
        ),
        _.right(1)
      )
      assert.deepStrictEqual(
        pipe(
          _.right(1),
          _.alt(() => _.left('a'))
        ),
        _.right(1)
      )
      assert.deepStrictEqual(
        pipe(
          _.left('a'),
          _.alt(() => _.right(2))
        ),
        _.right(2)
      )
      assert.deepStrictEqual(
        pipe(
          _.left('a'),
          _.alt(() => _.left('b'))
        ),
        _.left('b')
      )
    })

    it('map', () => {
      const f = (s: string): number => s.length
      assert.deepStrictEqual(pipe(_.right('abc'), _.map(f)), _.right(3))
      assert.deepStrictEqual(pipe(_.left('s'), _.map(f)), _.left('s'))
    })

    it('ap', () => {
      const f = (s: string): number => s.length
      assert.deepStrictEqual(pipe(_.right(f), _.ap(_.right('abc'))), _.right(3))
      assert.deepStrictEqual(pipe(_.right(f), _.ap(_.left('maError'))), _.left('maError'))
      assert.deepStrictEqual(
        pipe(_.left<string, (s: string) => number>('mabError'), _.ap(_.right('abc'))),
        _.left('mabError')
      )
      assert.deepStrictEqual(pipe(_.left('mabError'), _.ap(_.left('maError'))), _.left('mabError'))
    })

    it('apSecond', () => {
      assert.deepStrictEqual(pipe(_.right('a'), _.apSecond(_.right(1))), _.right(1))
    })

    it('chain', () => {
      const f = (s: string): _.Either<string, number> => _.right(s.length)
      assert.deepStrictEqual(pipe(_.right('abc'), _.chain(f)), _.right(3))
      assert.deepStrictEqual(pipe(_.left<string, string>('maError'), _.chain(f)), _.left('maError'))
    })

    it('chainFirst', () => {
      const f = (s: string): _.Either<string, number> => _.right(s.length)
      assert.deepStrictEqual(pipe(_.right('abc'), _.chainFirst(f)), _.right('abc'))
      assert.deepStrictEqual(pipe(_.left<string, string>('maError'), _.chainFirst(f)), _.left('maError'))
    })

    it('chainFirstW', () => {
      const f = (s: string): _.Either<boolean, number> => _.right(s.length)
      assert.deepStrictEqual(pipe(_.right('abc'), _.chainFirstW(f)), _.right('abc'))
      assert.deepStrictEqual(pipe(_.left<string, string>('maError'), _.chainFirstW(f)), _.left('maError'))
    })

    it('duplicate', () => {
      assert.deepStrictEqual(pipe(_.right('a'), _.duplicate), _.right(_.right('a')))
    })

    it('extend', () => {
      assert.deepStrictEqual(
        pipe(
          _.right(1),
          _.extend(() => 2)
        ),
        _.right(2)
      )
      assert.deepStrictEqual(
        pipe(
          _.left('err'),
          _.extend(() => 2)
        ),
        _.left('err')
      )
    })

    it('flatten', () => {
      assert.deepStrictEqual(pipe(_.right(_.right('a')), _.flatten), _.right('a'))
    })

    it('bimap', () => {
      const f = (s: string): number => s.length
      const g = (n: number): boolean => n > 2
      assert.deepStrictEqual(pipe(_.right(1), _.bimap(f, g)), _.right(false))
    })

    it('foldMap', () => {
      assert.deepStrictEqual(pipe(_.right('a'), _.foldMap(monoidString)(identity)), 'a')
      assert.deepStrictEqual(pipe(_.left(1), _.foldMap(monoidString)(identity)), '')
    })

    it('reduce', () => {
      assert.deepStrictEqual(
        pipe(
          _.right('bar'),
          _.reduce('foo', (b, a) => b + a)
        ),
        'foobar'
      )
      assert.deepStrictEqual(
        pipe(
          _.left('bar'),
          _.reduce('foo', (b, a) => b + a)
        ),
        'foo'
      )
    })

    it('reduceRight', () => {
      const f = (a: string, acc: string) => acc + a
      assert.deepStrictEqual(pipe(_.right('a'), _.reduceRight('', f)), 'a')
      assert.deepStrictEqual(pipe(_.left(1), _.reduceRight('', f)), '')
    })

    it('traverse', () => {
      const traverse = _.traverse(O.Applicative)((n: number) => (n >= 2 ? O.some(n) : O.none))
      assert.deepStrictEqual(pipe(_.left('a'), traverse), O.some(_.left('a')))
      assert.deepStrictEqual(pipe(_.right(1), traverse), O.none)
      assert.deepStrictEqual(pipe(_.right(3), traverse), O.some(_.right(3)))
    })

    it('sequence', () => {
      const sequence = _.sequence(O.Applicative)
      assert.deepStrictEqual(sequence(_.right(O.some(1))), O.some(_.right(1)))
      assert.deepStrictEqual(sequence(_.left('a')), O.some(_.left('a')))
      assert.deepStrictEqual(sequence(_.right(O.none)), O.none)
    })
  })

  it('fold', () => {
    const f = (s: string) => `left${s.length}`
    const g = (s: string) => `right${s.length}`
    const fold = _.fold(f, g)
    assert.deepStrictEqual(fold(_.left('abc')), 'left3')
    assert.deepStrictEqual(fold(_.right('abc')), 'right3')
  })

  it('getOrElse', () => {
    assert.deepStrictEqual(
      pipe(
        _.right(12),
        _.getOrElse(() => 17)
      ),
      12
    )
    assert.deepStrictEqual(
      pipe(
        _.left('a'),
        _.getOrElse(() => 17)
      ),
      17
    )
    assert.deepStrictEqual(
      pipe(
        _.left('a'),
        _.getOrElse((l: string) => l.length + 1)
      ),
      2
    )
  })

  it('elem', () => {
    assert.deepStrictEqual(pipe(_.left('a'), _.elem(eqNumber)(2)), false)
    assert.deepStrictEqual(pipe(_.right(2), _.elem(eqNumber)(2)), true)
    assert.deepStrictEqual(pipe(_.right(2), _.elem(eqNumber)(1)), false)
  })

  it('filterOrElse', () => {
    const f = (n: number): boolean => n > 10
    assert.deepStrictEqual(
      pipe(
        _.right(12),
        _.filterOrElse(f, () => -1)
      ),
      _.right(12)
    )
    assert.deepStrictEqual(
      pipe(
        _.right(7),
        _.filterOrElse(f, () => -1)
      ),
      _.left(-1)
    )
    assert.deepStrictEqual(
      pipe(
        _.left(12),
        _.filterOrElse(f, () => -1)
      ),
      _.left(12)
    )
    assert.deepStrictEqual(
      pipe(
        _.right(7),
        _.filterOrElse(f, (n) => `invalid ${n}`)
      ),
      _.left('invalid 7')
    )

    type Color = 'red' | 'blue'
    const isColor = (s: string): s is Color => s === 'red' || s === 'blue'
    const errorHandler = (s: string) => `invalid color ${s}`

    assert.deepStrictEqual(pipe(_.right('red'), _.filterOrElse(isColor, errorHandler)), _.right('red'))
    assert.deepStrictEqual(pipe(_.right('foo'), _.filterOrElse(isColor, errorHandler)), _.left('invalid color foo'))
    assert.deepStrictEqual(pipe(_.left('err'), _.filterOrElse(isColor, errorHandler)), _.left('err'))
  })

  it('isLeft', () => {
    assert.deepStrictEqual(_.isLeft(_.right(1)), false)
    assert.deepStrictEqual(_.isLeft(_.left(1)), true)
  })

  it('isRight', () => {
    assert.deepStrictEqual(_.isRight(_.right(1)), true)
    assert.deepStrictEqual(_.isRight(_.left(1)), false)
  })

  it('orElse', () => {
    assert.deepStrictEqual(
      pipe(
        _.right(1),
        _.orElse(() => _.right(2))
      ),
      _.right(1)
    )
    assert.deepStrictEqual(
      pipe(
        _.right(1),
        _.orElse(() => _.left('foo'))
      ),
      _.right(1)
    )
    assert.deepStrictEqual(
      pipe(
        _.left('a'),
        _.orElse(() => _.right(1))
      ),
      _.right(1)
    )
    assert.deepStrictEqual(
      pipe(
        _.left('a'),
        _.orElse(() => _.left('b'))
      ),
      _.left('b')
    )
  })

  it('swap', () => {
    assert.deepStrictEqual(_.swap(_.right('a')), _.left('a'))
    assert.deepStrictEqual(_.swap(_.left('b')), _.right('b'))
  })

  it('parseJSON', () => {
    assert.deepStrictEqual(pipe('{"a":1}', _.parseJSON), _.right({ a: 1 }))
    assert.deepStrictEqual(
      pipe('{"a":}', _.parseJSON),
      _.left(new SyntaxError('Unexpected token } in JSON at position 5'))
    )
  })

  it('stringifyJSON', () => {
    assert.deepStrictEqual(pipe({ a: 1 }, _.stringifyJSON), _.right('{"a":1}'))
    const circular: any = { ref: null }
    circular.ref = circular
    assert.deepStrictEqual(
      pipe(
        circular,
        _.stringifyJSON,
        _.mapLeft((e) => (e as Error).message.includes('Converting circular structure to JSON'))
      ),
      _.left(true)
    )
    interface Person {
      readonly name: string
      readonly age: number
    }
    const person: Person = { name: 'Giulio', age: 45 }
    assert.deepStrictEqual(pipe(person, _.stringifyJSON), _.right('{"name":"Giulio","age":45}'))
  })

  it('fromPredicate', () => {
    const f = _.fromPredicate((n: number) => n >= 2)
    assert.deepStrictEqual(f(3), _.right(3))
    assert.deepStrictEqual(f(1), _.left(1))
  })

  it('fromNullable', () => {
    assert.deepStrictEqual(_.fromNullable(() => 'default')(null), _.left('default'))
    assert.deepStrictEqual(_.fromNullable(() => 'default')(undefined), _.left('default'))
    assert.deepStrictEqual(_.fromNullable(() => 'default')(1), _.right(1))
  })

  it('tryCatch', () => {
    assert.deepStrictEqual(
      _.tryCatch(() => {
        return 1
      }),
      _.right(1)
    )

    assert.deepStrictEqual(
      _.tryCatch(() => {
        // tslint:disable-next-line: no-string-throw
        throw 'string error'
      }),
      _.left('string error')
    )
  })

  describe('getEq', () => {
    it('equals', () => {
      const equals = _.getEq(eqString, eqNumber).equals
      assert.deepStrictEqual(equals(_.right(1))(_.right(1)), true)
      assert.deepStrictEqual(equals(_.right(1))(_.right(2)), false)
      assert.deepStrictEqual(equals(_.right(1))(_.left('foo')), false)
      assert.deepStrictEqual(equals(_.left('foo'))(_.left('foo')), true)
      assert.deepStrictEqual(equals(_.left('foo'))(_.left('bar')), false)
      assert.deepStrictEqual(equals(_.left('foo'))(_.right(1)), false)
    })
  })

  describe('getCompactable', () => {
    const C = _.getCompactable(monoidString)
    it('compact', () => {
      assert.deepStrictEqual(C.compact(_.left('1')), _.left('1'))
      assert.deepStrictEqual(C.compact(_.right(O.none)), _.left(monoidString.empty))
      assert.deepStrictEqual(C.compact(_.right(O.some(123))), _.right(123))
    })

    it('separate', () => {
      assert.deepStrictEqual(C.separate(_.left('123')), separated(_.left('123'), _.left('123')))
      assert.deepStrictEqual(C.separate(_.right(_.left('123'))), {
        left: _.right('123'),
        right: _.left(monoidString.empty)
      })
      assert.deepStrictEqual(C.separate(_.right(_.right('123'))), {
        left: _.left(monoidString.empty),
        right: _.right('123')
      })
    })
  })

  describe('getFilterable', () => {
    const F = _.getFilterable(monoidString)
    const p = (n: number) => n > 2

    it('partition', () => {
      assert.deepStrictEqual(pipe(_.left('123'), F.partition(p)), {
        left: _.left('123'),
        right: _.left('123')
      })
      assert.deepStrictEqual(pipe(_.right(1), F.partition(p)), {
        left: _.right(1),
        right: _.left(monoidString.empty)
      })
      assert.deepStrictEqual(pipe(_.right(3), F.partition(p)), {
        left: _.left(monoidString.empty),
        right: _.right(3)
      })
    })

    it('partitionMap', () => {
      const f = (n: number) => (p(n) ? _.right(n + 1) : _.left(n - 1))
      assert.deepStrictEqual(pipe(_.left('123'), F.partitionMap(f)), {
        left: _.left('123'),
        right: _.left('123')
      })
      assert.deepStrictEqual(pipe(_.right(1), F.partitionMap(f)), {
        left: _.right(0),
        right: _.left(monoidString.empty)
      })
      assert.deepStrictEqual(pipe(_.right(3), F.partitionMap(f)), {
        left: _.left(monoidString.empty),
        right: _.right(4)
      })
    })

    it('filter', () => {
      assert.deepStrictEqual(pipe(_.left('123'), F.filter(p)), _.left('123'))
      assert.deepStrictEqual(pipe(_.right(1), F.filter(p)), _.left(monoidString.empty))
      assert.deepStrictEqual(pipe(_.right(3), F.filter(p)), _.right(3))
    })

    it('filterMap', () => {
      const f = (n: number) => (p(n) ? O.some(n + 1) : O.none)
      assert.deepStrictEqual(pipe(_.left('123'), F.filterMap(f)), _.left('123'))
      assert.deepStrictEqual(pipe(_.right(1), F.filterMap(f)), _.left(monoidString.empty))
      assert.deepStrictEqual(pipe(_.right(3), F.filterMap(f)), _.right(4))
    })
  })

  describe('getWitherable', () => {
    const W = _.getWitherable(monoidString)
    const p = (n: number) => n > 2

    it('wither', async () => {
      const wither = W.wither(T.ApplicativePar)
      const f = (n: number) => T.of(p(n) ? O.some(n + 1) : O.none)
      assert.deepStrictEqual(await pipe(_.left('foo'), wither(f))(), _.left('foo'))
      assert.deepStrictEqual(await pipe(_.right(1), wither(f))(), _.left(monoidString.empty))
      assert.deepStrictEqual(await pipe(_.right(3), wither(f))(), _.right(4))
    })

    it('wilt', async () => {
      const wilt = W.wilt(T.ApplicativePar)
      const f = (n: number) => T.of(p(n) ? _.right(n + 1) : _.left(n - 1))
      assert.deepStrictEqual(await pipe(_.left('foo'), wilt(f))(), {
        left: _.left('foo'),
        right: _.left('foo')
      })
      assert.deepStrictEqual(await pipe(_.right(1), wilt(f))(), {
        left: _.right(0),
        right: _.left(monoidString.empty)
      })
      assert.deepStrictEqual(await pipe(_.right(3), wilt(f))(), {
        left: _.left(monoidString.empty),
        right: _.right(4)
      })
    })
  })

  it('getSemigroup', () => {
    const S = _.getSemigroup(semigroupSum)
    assert.deepStrictEqual(pipe(_.left('a'), S.concat(_.left('b'))), _.left('a'))
    assert.deepStrictEqual(pipe(_.left('a'), S.concat(_.right(2))), _.right(2))
    assert.deepStrictEqual(pipe(_.right(1), S.concat(_.left('b'))), _.right(1))
    assert.deepStrictEqual(pipe(_.right(1), S.concat(_.right(2))), _.right(3))
  })

  describe('getShow', () => {
    it('show', () => {
      const S = _.getShow(showString, showString)
      assert.deepStrictEqual(S.show(_.left('a')), `left("a")`)
      assert.deepStrictEqual(S.show(_.right('a')), `right("a")`)
    })
  })

  it('getApplicativeValidation', () => {
    const A = _.getApplicativeValidation(monoidString)

    const apT = <B>(fb: _.Either<string, B>) => <A extends ReadonlyArray<unknown>>(
      fas: _.Either<string, A>
    ): _.Either<string, readonly [...A, B]> =>
      pipe(
        fas,
        _.map((a) => (b: B): readonly [...A, B] => [...a, b]),
        A.ap(fb)
      )

    assert.deepStrictEqual(pipe(_.left('a'), apT(_.left('b'))), _.left('ab'))
    assert.deepStrictEqual(pipe(_.right([1]), apT(_.left('b'))), _.left('b'))
    assert.deepStrictEqual(pipe(_.right([1]), apT(_.right(2))), _.right([1, 2]))
  })

  it('getAltValidation', () => {
    const A = _.getAltValidation(monoidString)
    assert.deepStrictEqual(
      pipe(
        _.left('a'),
        A.alt(() => _.left('b'))
      ),
      _.left('ab')
    )
    assert.deepStrictEqual(
      pipe(
        _.right(1),
        A.alt(() => _.left('b'))
      ),
      _.right(1)
    )
    assert.deepStrictEqual(
      pipe(
        _.left('a'),
        A.alt(() => _.right(2))
      ),
      _.right(2)
    )
  })

  it('fromOption', () => {
    assert.deepStrictEqual(_.fromOption(() => 'none')(O.none), _.left('none'))
    assert.deepStrictEqual(_.fromOption(() => 'none')(O.some(1)), _.right(1))
  })

  it('exists', () => {
    const gt2 = _.exists((n: number) => n > 2)
    assert.deepStrictEqual(gt2(_.left('a')), false)
    assert.deepStrictEqual(gt2(_.right(1)), false)
    assert.deepStrictEqual(gt2(_.right(3)), true)
  })

  it('do notation', () => {
    assert.deepStrictEqual(
      pipe(
        _.right<number, string>(1),
        _.bindTo('a'),
        _.bind('b', () => _.right('b'))
      ),
      _.right({ a: 1, b: 'b' })
    )
  })

  it('apS', () => {
    assert.deepStrictEqual(
      pipe(_.right<number, string>(1), _.bindTo('a'), _.apS('b', _.right('b'))),
      _.right({ a: 1, b: 'b' })
    )
  })

  it('apT', () => {
    assert.deepStrictEqual(pipe(_.right<number, string>(1), _.tupled, _.apT(_.right('b'))), _.right([1, 'b']))
  })

  it('fromNullableK', () => {
    const f = _.fromNullableK(() => 'error')((n: number) => (n > 0 ? n : null))
    assert.deepStrictEqual(f(1), _.right(1))
    assert.deepStrictEqual(f(-1), _.left('error'))
  })

  it('chainNullableK', () => {
    const f = _.chainNullableK(() => 'error')((n: number) => (n > 0 ? n : null))
    assert.deepStrictEqual(f(_.right(1)), _.right(1))
    assert.deepStrictEqual(f(_.right(-1)), _.left('error'))
    assert.deepStrictEqual(f(_.left('a')), _.left('a'))
  })

  describe('array utils', () => {
    it('sequenceReadonlyArray', () => {
      const arr = A.range(0, 10)
      assert.deepStrictEqual(pipe(arr, A.map(_.right), _.sequenceReadonlyArray), _.right(arr))
      assert.deepStrictEqual(pipe(arr, A.map(_.right), A.cons(_.left('a')), _.sequenceReadonlyArray), _.left('a'))
    })

    it('traverseReadonlyArrayWithIndex', () => {
      const arr = A.range(0, 10)
      assert.deepStrictEqual(
        pipe(
          arr,
          _.traverseReadonlyArrayWithIndex((index, _data) => _.right(index))
        ),
        _.right(arr)
      )
      assert.deepStrictEqual(pipe(arr, _.traverseReadonlyArrayWithIndex(_.fromPredicate((x) => x > 5))), _.left(0))
    })

    it('traverseReadonlyArray', () => {
      const arr = A.range(0, 10)
      assert.deepStrictEqual(
        pipe(
          arr,
          _.traverseReadonlyArray((x) => _.right(x))
        ),
        _.right(arr)
      )
      assert.deepStrictEqual(pipe(arr, _.traverseReadonlyArray(_.fromPredicate((x) => x > 5))), _.left(0))
    })
  })

  it('toUnion', () => {
    assert.deepStrictEqual(_.toUnion(_.right(1)), 1)
    assert.deepStrictEqual(_.toUnion(_.left('a')), 'a')
  })
})
