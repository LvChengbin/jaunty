/* global J:false, expect:false */

( function() {
describe( 'J.Sequence', function() {
    describe( 'J.Sequence.all', function() {
        it( 'Should return a promise object', function( done ) {
            expect( J.Sequence.all( [] ) ).to.be.an.instanceof( J.Promise );
            done(); 
        } );

        it( 'Should resolve the promise, which was returned, after all promise in sequence were resolved', function( done ) {
            J.Sequence.all([
                function() {
                    return J.Promise.resolve( 'a' );
                },
                function() {
                    return J.Promise.resolve( 'b' );
                }
            ] ).then( function() {
                done();
            } );
        } );

        it( 'Should reject the promise, which was returned, if one promise in sequence rejected', function( done ) {
            J.Sequence.all([
                function() {
                    return J.Promise.resolve( 'a' );
                },
                function() {
                    return J.Promise.reject( 'b' );
                }
            ] ).then( function() {
            } ).catch( function() {
                done();
            } );
        } );

        it( 'Should get arguments as an array filled with return values of promises in sequence', function( done ) {
            J.Sequence.all( [
                function() {
                    return J.Promise.resolve( 'a' );
                },
                function() {
                    return J.Promise.resolve( 'b' );
                }
            ] ).then( function( values ) {
                expect( values[ 0 ] ).to.equal( 'a' );
                expect( values[ 1 ] ).to.equal( 'b' );
                done();
            } );
        } );

        it( 'Should execute promises one by one', function( done ) {
            var x = 0;
            J.Sequence.all( [
                function() {
                    expect( x ).to.equal( 0 );
                    x++;
                    return J.Promise.resolve();
                },
                function() {
                    expect( x ).to.equal( 1 );
                    x++;
                    return J.Promise.resolve();
                },
                function() {
                    expect( x ).to.equal( 2 );
                    x++;
                    return J.Promise.resolve();
                }
            ] ).then( function() {
                done();
            } );
        } );
    } );

    describe( 'J.Sequence.race', function() {
        it( 'Should return a promise', function( done ) {
            expect( J.Sequence.race([]) ).to.be.an.instanceOf( J.Promise );
            done();
        } );

        it( 'Should resolve the promise, which was returned, after one of all promises in arguments be resolved', function( done ) {
            var x = 0;
            J.Sequence.race( [
                function() {
                    expect( x ).to.equal( 0 );
                    x++;
                    return J.Promise.reject();
                },
                function() {
                    expect( x ).to.equal( 1 );
                    x++;
                    return J.Promise.resolve();
                },
                function() {
                    x++;
                    return J.Promise.resolve();
                }
            ] ).then( function(){
                expect( x ).to.equal( 2 );
                done();
            } );
        } );

        it( 'Should', function( done ) {
            J.Sequence.race( [
                function() {
                    return J.Promise.reject();
                },
                function() {
                    return J.Promise.reject();
                },
                function() {
                    return J.Promise.resolve();
                }
            ] ).then( function(){
                done();
            } );
        } );
    } );
} );
} )();
