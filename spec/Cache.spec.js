const { Cache } = require('../src/helpers/Cache');

describe("Cache()", function() {
    it("should be a function", function() {
        expect(typeof Cache).toBe('function');
    });

    it("should return an instance which is also a function", function() {
        const cache = new Cache();
        expect(typeof cache).toBe('function');
    });

    it("instance without parameter should return whole cache as object", function() {
        const cache = new Cache();
        const internalCache = cache();
        expect(internalCache).toEqual({});
    });

    it("({abc:'def'}) should initialize the internal Cache with {abc:'def'}", function() {
        const cache = new Cache({ abc: 'def' });
        const internalCache = cache();
        expect(internalCache).toEqual({ abc: 'def' });
    });

    it("should have different internal caches for (Cache({abc:'def'}) and Cache({ghi:'jkl'})", function() {
        const cache1 = new Cache({ abc: 'def' });
        const cache2 = new Cache({ ghi: 'jkl' });

        expect(cache1()).toEqual({ abc: 'def' });
        expect(cache2()).toEqual({ ghi: 'jkl' });
    });

    it("should return 'def' for cache('abc') of Cache({abc:'def'})", function() {
        const cache = new Cache({ abc: 'def' });

        expect(cache('abc')).toBe('def');
    });

    it("should add {abc: 'def'} to cache for cache('abc','def')", function() {
        const cache = new Cache();
        cache('abc', 'def')
        expect(cache()).toEqual({ abc: 'def' });
    });

    it("should return 'def' for cache('abc','def') of Cache()", function() {
        const cache = new Cache({});
        cache('abc', 'def');

        expect(cache('abc')).toBe('def');
        expect(cache()).toEqual({ abc: 'def' });
    });

    it("should return 'def' for cache('abc',()=>'def') of Cache()", function() {
        const cache = new Cache({});
        cache('abc', () => 'def');

        expect(cache('abc')).toBe('def');
        expect(cache()).toEqual({ abc: 'def' });
    });

    it("should throw an error for cache(null,'def')", function() {
        const cache = new Cache();

        expect(() => cache(null, 'def')).toThrow();
    });

    it("should have a function called reset", function() {
        const cache = new Cache();

        expect(typeof cache.reset).toBe('function');
    });

    it("with cache.reset() should leave the internal cache empty", function() {
        const cache = new Cache();

        expect(typeof cache.reset).toBe('function');
    });

    it("with cache.reset() should leave the internal cache empty", function() {
        const cache = new Cache({ abc: 'def' });
        cache.reset();
        expect(cache()).toEqual({});
    });

    it("should not call spyfunction if key exists in cache", function() {
        const spyFunction = jasmine.createSpy('plugin')

        const cache = new Cache({ abc: 'def' });
        cache('abc', spyFunction);
        expect(spyFunction).not.toHaveBeenCalled();
    });
})