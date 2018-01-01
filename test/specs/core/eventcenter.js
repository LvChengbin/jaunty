import EventCenter from '../../../src/core/eventcenter.js';

var expect = chai.expect;

describe( 'EventCenter', function() {

    describe( 'on', function() {
        it( 'Should return the eventCenter itselft', function() {
            var ec = new EventCenter;
            expect( ec.$on( 'x', function() {} ) ).to.equal( ec );
        } );
    } );

    describe( 'trigger', function() {
        it( 'Should execute all methods bound to the event type', function() {
            var ec = new EventCenter(),
                i = 0;
            ec.$on( 'increase', function() { i++; } ).$on( 'increase', function() { i++; } );
            ec.$trigger( 'increase' );
            expect( i ).to.equal( 2 );
        } );

        it( 'Should be called if there is a method of EventCenter\'s instance, which has a name with "on" +  triggered event type', function() {
            var ec = new EventCenter,
                i = 0;
            ec.onready = function() { i++; };
            ec.$trigger( 'ready' );
            expect( i ).to.equal( 1 );
        } );
    } );

    describe( 'off', function() {
        it( 'Should return the eventCenter itself if an unbind event type is transfored', function() {
            var ec = new EventCenter;
            expect( ec.$off( 'abc' ) ).to.equal( ec );
        } );

        it( 'Should not call hanlers if it was "off"', function() {
            var ec = new EventCenter,
                i = 0;

            var handler = function() { i++ };

            ec.$on( 'increase', handler ).$trigger( 'increase' );
            ec.$off( 'increase', handler ).$trigger( 'increase' );

            expect( i ).to.equal( 1 );
        } );
    } );

    describe( 'once', function() {
        it( 'Should be unbound after event has been triggered', function() {
            var i = 0;
            var ec = new EventCenter().$once( 'increase', function() { i++ } );
            ec.$trigger( 'increase' );
            ec.$trigger( 'increase' );
            expect( i ).to.equal( 1 );
        } );
    } );
} );
