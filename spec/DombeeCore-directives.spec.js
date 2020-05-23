const { getDombeeCoreInstance } = require('./helpers/helpers');
const Dombee = getDombeeCoreInstance();

describe("Dombee.directive", function() {


    // valid default-values for making the tests more clean
    function expressions() { return 'x' };

    function onChange() {};
    const bindTo = '.abc';


    beforeEach(() => {
        Dombee.reset();
    });

    it("should should exist as function in global Dombee Object", function() {
        expect(typeof Dombee.directive).toBe('function');
    });

    it("should throw an error if called with null", function() {
        Dombee.directive();
        expect(() => Dombee({})).toThrow();
    });
    it("should accept objects as parameter", function() {
        Dombee.directive({ onChange, expressions, bindTo })
        expect(() => Dombee({})).not.toThrow();
    });
    it("should accept functions as parameter", function() {
        Dombee.directive(function() { return { bindTo, onChange, expressions } });
        expect(() => Dombee({})).not.toThrow();
    });

    describe('with object as parameter', function() {
        it("should throw an error if property 'onChange' is null", function() {
            Dombee.directive({ expressions, bindTo });
        });
        it("should throw an error if property 'expressions' is null", function() {
            Dombee.directive({ onChange, bindTo });
        });
        it("should throw an error if property 'bindTo' is null", function() {
            Dombee.directive({ onChange, expressions });
        });
        afterEach(() => {
            expect(() => Dombee({}).toThrow());
        });
    });
    describe('property "onChange"', function() {
        it("should be valid if it is a function", function() {
            Dombee.directive({ onChange: function() {}, expressions, bindTo });
            expect(() => Dombee({}).not.toThrow());
        });
        it("should throw an error if it is not a function", function() {
            Dombee.directive({ onChange: 'abc', expressions, bindTo });
            expect(() => Dombee({}).toThrow());
        });
    });
    describe('property "expressions"', function() {
        it("should be valid if it is a function", function() {
            Dombee.directive({ bindTo, onChange, expressions: function() { return 'abc' } });
            expect(() => Dombee({})).not.toThrow();
        });
        it("should throw an error if it is an Array", function() {
            Dombee.directive({ bindTo, onChange, expressions: ['abc'] });
            expect(() => Dombee({})).toThrow();
        });
        it("should throw an error if it is a number", function() {
            Dombee.directive({ bindTo, onChange, expressions: 1 });

            expect(() => Dombee({})).toThrow();
        });
        it("should throw an error if it is a function but returns null", function() {
            Dombee.directive({ bindTo, onChange, expressions: function() {} });

            expect(() => Dombee({})).toThrow();
        });
        it("should be valid if it is a function returning an object having a key 'expression'", function() {
            Dombee.directive({
                bindTo,
                onChange,
                expressions: () => {
                    return {
                        expression: 'xyz'
                    }
                }
            });

            expect(() => Dombee({})).not.toThrow();
        });

        it("should throw an error if it is an object having a key 'expression'", function() {
            Dombee.directive({
                bindTo,
                onChange,
                expressions: {
                    expression: 'xyz'
                }
            });

            expect(() => Dombee({})).toThrow();
        });
    });

    describe('property "bindTo"', function() {
        it("should be valid if it is a function", function() {
            expect(() => Dombee.directive({ onChange, expressions, bindTo: function() { return bindTo } })).not.toThrow();
            Dombee({});
        });
        it("should throw an error if it is a function but returns nothing", function() {
            Dombee.directive({ onChange, expressions, bindTo: function() {} })
            expect(() => Dombee({})).toThrow();
        });
        it("should be valid if it is an empty Array", function() {
            expect(() => Dombee.directive({ onChange, expressions, bindTo: [] })).not.toThrow();
            Dombee({});
        });
        it("should throw an error if it is an Array of Strings", function() {
            Dombee.directive({ onChange, expressions, bindTo: ['.a', '.b'] })
            expect(() => Dombee({})).toThrow();
        });
        it("should throw an error if it is not a function, Array or String", function() {
            Dombee.directive({ onChange, expressions, bindTo: 3 });

            //Initialize Dombee-Object to make sure that no error happens during initialisation
            expect(() => Dombee({})).toThrow();
        });
        it("should throw an error if it is null", function() {
            Dombee.directive({
                onChange: function() {},
                expressions: {}
            });

            expect(() => Dombee({})).toThrow();
        });
    });
    /* describe("when song has been paused", function() {
       beforeEach(function() {
         player.play(song);
         player.pause();
       });

       it("should indicate that the song is currently paused", function() {
         expect(player.isPlaying).toBeFalsy();

         // demonstrates use of 'not' with a custom matcher
         expect(player).not.toBePlaying(song);
       });

       it("should be possible to resume", function() {
         player.resume();
         expect(player.isPlaying).toBeTruthy();
         expect(player.currentlyPlayingSong).toEqual(song);
       });
     });

     // demonstrates use of spies to intercept and test method calls
     it("tells the current song if the user has made it a favorite", function() {
       spyOn(song, 'persistFavoriteStatus');

       player.play(song);
       player.makeFavorite();

       expect(song.persistFavoriteStatus).toHaveBeenCalledWith(true);
     });

     //demonstrates use of expected exceptions
     describe("#resume", function() {
       it("should throw an exception if song is already playing", function() {
         player.play(song);

         expect(function() {
           player.resume();
         }).toThrowError("song is already playing");
       });
     });*/
});