import EventCenter from '../../../src/core/eventcenter.js';
import J from '../../../src/core/j.js';

var expect = chai.expect;

describe( 'J ( Basic Part) ', function() {
    describe( 'constructor', function() {
        it( 'Should extends from EventCenter', function() {
            expect( new J ).be.an.instanceOf( EventCenter );
        } );

        it( 'Should inherit all properties from J.EventCenter which are defined in constructor', function() {
            expect( new J ).to.contain.all.keys( [ '__listeners', '__handlers' ] );
        } );

        it( 'Should inherit all methods from J.EventCenter', function() {
            expect( new J ).to.respondTo( '$on', '$off', '$once', '$trigger' );
        } );
    } );

    describe( '$root', function() {
        it( 'Should strictEqual itself', function() {
            var j;
            expect( j = new J ).to.equal( j.$root );
        } );
    } );

    describe( '$parent', function() {
        it( 'Should have property "$parent" as default value is null', function() {
            expect( new J() ).be.have.property( '$parent' ).and.equal( null );
        } );

        it( 'Should overwrite the $parent property if $parent is setted in arguments', function() {
            expect( new J( { $parent : window } ).$parent ).to.equal( window );
        } );
    } );

    describe( '$children', function() {
        it( 'Should have property "$children" as default value is an {}', function() {
            expect( new J() ).be.have.property( '$children' ).and.be.a( 'Object' );
        } );
    } );

    describe( '$sibling', function() {
        it( 'Shold have method "$sibling"', function() {
            expect( new J() ).be.have.property( '$sibling' ).and.be.a( 'Function' );
        } );
    } );

    describe( '$path', function() {
        it( 'Shold have method "$path"', function() {
            expect( new J() ).be.have.property( '$path' ).and.be.a( 'Function' );
        } );
    } );

    describe( '$find', function() {
        it( 'Shold have method "$find"', function() {
            expect( new J() ).be.have.property( '$find' ).and.be.a( 'Function' );
        } );
    } );

    describe( '$mount', function() {
        it( 'Shold have method "$mount"', function() {
            expect( new J() ).be.have.property( '$mount' ).and.be.a( 'Function' );
        } );
    } );

    describe( '$unmount', function() {
        it( 'Shold have method "$unmount"', function() {
            expect( new J() ).be.have.property( '$unmount' ).and.be.a( 'Function' );
        } );
    } );
} );
