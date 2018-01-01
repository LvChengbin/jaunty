import J from '../../../src/core/j';
import Package from '../../../src/core/package';
import extend from '../../../src/core/extend';
import Promise from '../../../src/core/promise';
import View from '../../../src/extensions/view/index';

var expect = chai.expect;

window.J || ( window.J = J );
window.J.Package || ( window.J.Package = Package );
window.J.View || ( window.J.View = View );
window.J.extend || ( window.J.extend = extend );


var j = window.j1 = new J( 'j' );
var main;

var p1 = Promise.all( [
    j.$mount(
        'main', 
        '/ns/jolin/test/extra/packages/main/main.js'
    ),

    j.$mount( 
        'main2',
        '/ns/jolin/test/extra/packages/main/main.js'
    )
] ).then( function() {
    main = j.$find( 'main' );
    return Promise.all( [
        main.$mount(
            'sub',
            '/ns/jolin/test/extra/packages/sub/sub.js'
        ),
        main.$mount(
            'sub2',
            '/ns/jolin/test/extra/packages/sub/sub.js'
        )
    ] );
} );

describe( 'Package', function() {
    describe( 'mount', function() {

        it( 'Shoulda added a child into $children property', function( done ) {
            p1.then( function() {
                expect( j.$children ).to.have.property( 'main' );
                expect( j.$children ).to.have.property( 'main2' );
                done();
            } );
        } );

        it( 'Shouldna been the same object if added a package twice with different name', function( done ) {
            p1.then( function() {
                expect( j.$children.main ).to.not.equal( j.$children.main2 );
                done();
            } );
        } );

        it( 'Shoulda been executed initialize method in package automaticly', function( done ) {
            p1.then( function() {
                expect( j.$children.main.haveBeenMounted ).to.be.ok;
                expect( j.$children.main2.haveBeenMounted ).to.be.ok;
                done();
            } );
        } );

        it( 'Shoulda had a $parent property pointed to correct object', function( done ) {
            p1.then( function() {
                expect( j.$children.main.$parent ).to.equal( j );
                done();
            } );
        } );

        it( 'Shoulda had a $root property pointed to correct object', function( done ) {
            p1.then( function() {
                expect( j.$children.main.$root ).to.equal( j );
                done();
            } );
        } );

        it( 'Shoulda been enabled to find package with $find method', function( done ) {
            p1.then( function() {
                expect( j.$find( 'main' ) ).to.equal( j.$children.main );
                done();
            } );
        } );

        it( 'Shoulda been enabled to find package from root', function( done ) {
            p1.then( function() {
                expect( J.find( 'j.main' ) ).to.equal( j.$find( 'main' ) );
                expect( J.find( 'j.main2' ) ).to.equal( j.$find( 'main2' ) );
                done();
            } );
        } );

        it( 'Package can find sibling package with $find method', function( done ) {
            p1.then( function() {
                expect( J.find( 'j.main' ).$sibling( 'main2' ) ).to.equal( J.find( 'j.main2' ) );
                done();
            } );
        } );
    } );


    describe( 'nested mount', function() {
        it( 'Shoulda added a child into $children property', function( done ) {
            p1.then( function() {
                expect( main.$children ).to.have.property( 'sub' );
                expect( main.$children ).to.have.property( 'sub2' );
                done();
            } );
        } );

        it( 'Shouldna been the same object if added a package twice with different name', function( done ) {
            p1.then( function() {
                expect( main.$children.sub ).to.not.equal( main.$children.sub2 );
                done();
            } );
        } );

        it( 'Shoulda been executed initialize method in package automaticly', function( done ) {
            p1.then( function() {
                expect( main.$children.sub.haveBeenMounted ).to.be.ok;
                expect( main.$children.sub2.haveBeenMounted ).to.be.ok;
                done();
            } );
        } );

        it( 'Shoulda had a $parent property pointed to correct object', function( done ) {
            p1.then( function() {
                expect( main.$children.sub.$parent ).to.equal( main );
                done();
            } );
        } );

        it( 'Shoulda had a $root property pointed to correct object', function( done ) {
            p1.then( function() {
                expect( main.$children.sub.$root ).to.equal( j );
                done();
            } );
        } );

        it( 'Shoulda been enabled to find package with $find method', function( done ) {
            p1.then( function() {
                expect( main.$find( 'sub' ) ).to.equal( main.$children.sub );
                done();
            } );
        } );

        it( 'Shoulda been enabled to find package from root', function( done ) {
            p1.then( function() {
                expect( J.find( 'j.main.sub' ) ).to.equal( main.$find( 'sub' ) );
                expect( J.find( 'j.main.sub2' ) ).to.equal( main.$find( 'sub2' ) );
                done();
            } );
        } );

        it( 'Package can find sibling package with $find method', function( done ) {
            p1.then( function() {
                expect( main.$find( 'sub' ).$sibling( 'sub2' ) ).to.equal( main.$find( 'sub2' ) );
                done();
            } );
        } );
    } );

    describe( 'unmount', function() {
        it( 'Shoulda remove package from $children ', function( done ) {
            p1.then( function() {
                j.$unmount( 'main2' );
                expect( j.$children.main2 ).to.be.not.ok;
                done();
            } );
        } );
    } );
} );
