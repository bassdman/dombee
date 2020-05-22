const { getDombeeCoreInstance } = require('./helpers/helpers');
const Dombee = getDombeeCoreInstance();

describe("Dombee.directive", function() {


    // valid default-values for making the tests more clean
    function expressions() {};

    function onChange() {};
    const bindTo = '.abc';


    beforeEach(() => {
        Dombee.reset();
    });

    it("should should exist as function in global Dombee Object", function() {
        expect(typeof Dombee.directive).toBe('function');
        Dombee({});
    });

    it("should throw an error if called with null", function() {
        expect(() => Dombee.directive()).toThrow();
        Dombee({});
    });
    it("should accept objects as parameter", function() {
        expect(() => Dombee.directive({ onChange, expressions, bindTo })).not.toThrow();
        Dombee({});
    });
    it("should accept functions as parameter", function() {
        expect(() => Dombee.directive(function() { return { bindTo } })).not.toThrow();
        Dombee({});
    });

    describe('with object as parameter', function() {
        it("should throw an error if property 'onChange' is null", function() {
            expect(() => Dombee.directive({ expressions, bindTo })).toThrow();
        });
        it("should throw an error if property 'expressions' is null", function() {
            expect(() => Dombee.directive({ onChange, bindTo })).toThrow();
        });
        it("should throw an error if property 'bindTo' is null", function() {
            expect(() => Dombee.directive({ onChange, expressions })).toThrow();
        });
    });
    describe('property "onChange"', function() {
        it("should be valid if it is a function", function() {
            expect(() => Dombee.directive({ onChange: function() {}, expressions, bindTo })).not.toThrow();
            //Initialize Dombee-Object to make sure that no error happens during initialisation
            //        Dombee({});
        });
        it("should throw an error if it is not a function", function() {
            expect(() => Dombee.directive({ onChange: 'abc', expressions, bindTo })).toThrow();
            //Initialize Dombee-Object to make sure that no error happens during initialisation
            //        Dombee({});
        });
    });
    describe('property "expressions"', function() {
        it("should be valid if it is a function", function() {
            expect(() => Dombee.directive({ bindTo, onChange, expressions: function() { return 'abc' } })).not.toThrow();
            //Initialize Dombee-Object to make sure that no error happens during initialisation
            expect(() => Dombee({})).not.toThrow();
        });
        it("should be valid if it is an Array of Strings", function() {
            expect(() => Dombee.directive({ bindTo, onChange, expressions: ['abc'] })).not.toThrow();
            //Initialize Dombee-Object to make sure that no error happens during initialisation
            expect(() => Dombee({})).not.toThrow();
        });
        it("should throw an error if it is not a function, Array or String", function() {
            expect(() => Dombee.directive({ bindTo, onChange, expressions: 1 })).toThrow();
            expect(() => Dombee.directive({
                onChange,
                expressions: {}
            })).toThrow();

            //Initialize Dombee-Object to make sure that no error happens during initialisation
            //      Dombee({});
        });
        it("should be valid if it is an object having a key 'expression'", function() {
            expect(() => Dombee.directive({
                bindTo,
                onChange,
                expressions: {
                    expression: 'xyz'
                }
            })).not.toThrow();


            expect(() => Dombee({})).not.toThrow();
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
            expect(() => Dombee.directive({ onChange, expressions, bindTo: 3 })).toThrow();
            expect(() => Dombee.directive({
                onChange: function() {},
                expressions: {}
            })).toThrow();

            //Initialize Dombee-Object to make sure that no error happens during initialisation
            Dombee({});
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