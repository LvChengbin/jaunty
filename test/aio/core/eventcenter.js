/* global J:false, expect:false */

( function() {
describe( 'EventCenter', function() {

    describe( 'on', function() {
        it( 'Should return the eventCenter itselft', function( done ) {
            var ec = new J.EventCenter;
            expect( ec.$on( 'x', function() {} ) ).to.equal( ec );
            done();
        } );
    } );

    describe( 'trigger', function() {
        it( 'Should execute all methods bound to the event type', function( done ) {
            var ec = new J.EventCenter(),
                i = 0;
            ec.$on( 'increase', function() { i++; } ).$on( 'increase', function() { i++; } );
            ec.$trigger( 'increase' );
            expect( i ).to.equal( 2 );
            done();
        } );

        it( 'Should be called if there is a method of J.EventCenter\'s instance, which has a name with "on" +  triggered event type', function( done ) {
            var ec = new J.EventCenter,
                i = 0;
            ec.onready = function() { i++; };
            ec.$trigger( 'ready' );
            expect( i ).to.equal( 1 );
            done();
        } );
    } );

    describe( 'off', function() {
        it( 'Should return the eventCenter itself if an unbind event type is transfored', function( done ) {
            var ec = new J.EventCenter;
            expect( ec.$off( 'abc' ) ).to.equal( ec );
            done();
        } );

        it( 'Should not call hanlers if it was "off"', function( done ) {
            var ec = new J.EventCenter,
                i = 0;

            var handler = function() { i++ };

            ec.$on( 'increase', handler ).$trigger( 'increase' );
            ec.$off( 'increase', handler ).$trigger( 'increase' );

            expect( i ).to.equal( 1 );
            done();
        } );
    } );

    describe( 'once', function() {
        it( 'Should be unbound after event has been triggered', function( done ) {
            var i = 0;
            var ec = new J.EventCenter().$once( 'increase', function() { i++ } );
            ec.$trigger( 'increase' );
            ec.$trigger( 'increase' );
            expect( i ).to.equal( 1 );
            done();
        } );
    } );
} );
} )();
