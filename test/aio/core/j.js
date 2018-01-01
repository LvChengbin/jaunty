/* global J:false, expect:false */

( function() {

describe( 'J ( Basic Part) ', function() {
    describe( 'constructor', function() {
        it( 'Should extends from EventCenter', function( done ) {
            expect( new J ).be.an.instanceOf( J.EventCenter );
            done();
        } );

        it( 'Should inherit all properties from J.EventCenter which are defined in constructor', function( done ) {
            expect( new J ).to.contain.all.keys( [ '__listeners', '__handlers' ] );
            done();
        } );

        it( 'Should inherit all methods from J.EventCenter', function( done ) {
            expect( new J ).to.respondTo( '$on', '$off', '$once', '$trigger' );
            done();
        } );
    } );

    describe( '$root', function() {
        it( 'Should strictEqual itself', function( done ) {
            var j;
            expect( j = new J ).to.equal( j.$root );
            done();
        } );
    } );

    describe( '$parent', function() {
        it( 'Should have property "$parent" as default value is null', function( done ) {
            expect( new J() ).be.have.property( '$parent' ).and.equal( null );
            done();
        } );

        it( 'Should overwrite the $parent property if $parent is setted in arguments', function( done ) {
            expect( new J( { $parent : window } ).$parent ).to.equal( window );
            done();
        } );
    } );

    describe( '$children', function() {
        it( 'Should have property "$children" as default value is an {}', function( done ) {
            expect( new J() ).be.have.property( '$children' ).and.be.a( 'Object' );
            done();
        } );
    } );

    describe( '$sibling', function() {
        it( 'Shold have method "$sibling"', function( done ) {
            expect( new J() ).be.have.property( '$sibling' ).and.be.a( 'Function' );
            done();
        } );
    } );

    describe( '$path', function() {
        it( 'Shold have method "$path"', function( done ) {
            expect( new J() ).be.have.property( '$path' ).and.be.a( 'Function' );
            done();
        } );
    } );

    describe( '$find', function() {
        it( 'Shold have method "$find"', function( done ) {
            expect( new J() ).be.have.property( '$find' ).and.be.a( 'Function' );
            done();
        } );
    } );

    describe( '$mount', function() {
        it( 'Shold have method "$mount"', function( done ) {
            expect( new J() ).be.have.property( '$mount' ).and.be.a( 'Function' );
            done();
        } );
    } );

    describe( '$unmount', function() {
        it( 'Shold have method "$unmount"', function( done ) {
            expect( new J() ).be.have.property( '$unmount' ).and.be.a( 'Function' );
            done();
        } );
    } );
} );
} )();
