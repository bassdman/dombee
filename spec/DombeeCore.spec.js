describe("Dombee", function() {

    const Dombee = require('../dest/dombee-cjs.js');
    beforeEach(function() {
        // player = new Player();
        // song = new Song();
    });

    it("should return a function", function() {
        expect(typeof Dombee).toEqual('function');
    });
    it("should have a global property called 'directive'", function() {
        expect(Dombee.directive).toBeDefined();
    });
    it("should have a global property called 'directive'", function() {
        expect(Dombee.directive).toBeDefined();
    });
    it("should have a global property called 'dependencyEvaluationStrategy'", function() {
        expect(Dombee.dependencyEvaluationStrategy).toBeDefined();
    });
    it("should have a global property called 'dependencyEvaluationStrategyDefault'", function() {
        expect(Dombee.dependencyEvaluationStrategyDefault).toBeDefined();
    });
    it("should have a global property called 'addExpressionType'", function() {
        expect(Dombee.addExpressionType).toBeDefined();
    });
    it("should have a global property called 'expressionTypeJs'", function() {
        expect(Dombee.expressionTypeJs).toBeDefined();
    });
    it("should have a global property called 'expressionTypeJsTemplateString'", function() {
        expect(Dombee.expressionTypeJsTemplateString).toBeDefined();
    });
    it("should have a global property called '_id'", function() {
        expect(Dombee._id).toBeDefined();
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