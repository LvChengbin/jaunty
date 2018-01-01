import Sequence from '../../../src/core/sequence.js';
import Promise from '../../../src/core/promise.js';

var expect = chai.expect;

describe( 'Sequence', function() {
    describe( 'Sequence.all', function() {
        it( 'Should return a promise object', function( done ) {
            expect( Sequence.all( [] ) ).to.be.an.instanceof( Promise );
            done(); 
        } );

        it( 'Should resolve the promise, which was returned, after all promise in sequence were resolved', function( done ) {
            Sequence.all([
                function() {
                    return Promise.resolve( 'a' );
                },
                function() {
                    return Promise.resolve( 'b' );
                }
            ] ).then( function() {
                done();
            } );
        } );

        it( 'Should reject the promise, which was returned, if one promise in sequence rejected', function( done ) {
            Sequence.all([
                function() {
                    return Promise.resolve( 'a' );
                },
                function() {
                    return Promise.reject( 'b' );
                }
            ] ).then( function() {
            } ).catch( function() {
                done();
            } );
        } );

        it( 'Should get arguments as an array filled with return values of promises in sequence', function( done ) {
            Sequence.all( [
                function() {
                    return Promise.resolve( 'a' );
                },
                function() {
                    return Promise.resolve( 'b' );
                }
            ] ).then( function( values ) {
                expect( values[ 0 ] ).to.equal( 'a' );
                expect( values[ 1 ] ).to.equal( 'b' );
                done();
            } );
        } );

        it( 'Should execute promises one by one', function( done ) {
            var x = 0;
            Sequence.all( [
                function() {
                    expect( x ).to.equal( 0 );
                    x++;
                    return Promise.resolve();
                },
                function() {
                    expect( x ).to.equal( 1 );
                    x++;
                    return Promise.resolve();
                },
                function() {
                    expect( x ).to.equal( 2 );
                    x++;
                    return Promise.resolve();
                }
            ] ).then( function() {
                done();
            } );
        } );
    } );

    describe( 'Sequence.race', function() {
        it( 'Should return a promise', function() {
            expect( Sequence.race([]) ).to.be.an.instanceOf( Promise );
        } );

        it( 'Should resolve the promise, which was returned, after one of all promises in arguments be resolved', function( done ) {
            var x = 0;
            Sequence.race( [
                function() {
                    expect( x ).to.equal( 0 );
                    x++;
                    return Promise.reject();
                },
                function() {
                    expect( x ).to.equal( 1 );
                    x++;
                    return Promise.resolve();
                },
                function() {
                    x++;
                    return Promise.resolve();
                }
            ] ).then( function(){
                expect( x ).to.equal( 2 );
                done();
            } );
        } );

        it( 'Should', function( done ) {
            Sequence.race( [
                function() {
                    return Promise.reject();
                },
                function() {
                    return Promise.reject();
                },
                function() {
                    return Promise.resolve();
                }
            ] ).then( function(){
                done();
            } );
        } );
    } );
} );
