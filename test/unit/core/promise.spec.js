import Promise from '../../../src/core/promise';

describe( 'J/Core/Promise', () => {
    describe( 'Promise', function() {
        it( 'Should have thrown an error if using the promise object itself as a paramter of the resolve function', function() {
            var func;
            var p = new Promise( function( resolve ) {
                func = resolve;
            } );

            expect( function() {
                func( p );
            } ).toThrow( new TypeError( 'Chaining cycle detected for promise #<Promise>' ) );
        } );
    } );

    describe( 'Promise.resolve', function() {
        it( 'Should have returned an instance of Promise', function() {
            expect( Promise.resolve() instanceof Promise ).toBeTruthy();
        } );

        it( 'Should have returned a resolved Promise object', function() {
            expect( Promise.resolve()[ '[[PromiseStatus]]' ] ).toBe( 'resolved' );
        } );

        it( 'Should have thrown a TypeError if using the Promise.resolve as a constructor', function() {
            expect( function() {
                new Promise.resolve();
            } ).toThrow( new TypeError( 'Promise.resolve is not a constructor' ) );
        } );
    } );

    describe( 'Promise.reject', function() {
        it( 'Should have returned an instance of Promise object', function() {
            expect( Promise.reject() instanceof Promise ) .toBeTruthy();
        } );

        it( 'Should have returned a rejected Promise object', function() {
            expect( Promise.reject()[ '[[PromiseStatus]]' ] ).toBe( 'rejected' );
        } );

        it( 'Should have thrown a TypeError if using the Promise.reject as a constructor', function() {
            expect( function() {
                new Promise.reject();
            } ).toThrow( new TypeError( 'Promise.reject is not a constructor' ) );
        } );
    } );

    describe( 'Promise.prototype.catch', function() {
        it( 'Should have called the "catch" after the Promise object was rejected', function( done ) {
            new Promise( function( resolve, reject ) {
                setTimeout( function() {
                    reject( 'reject' );
                }, 10 );
            } ).catch( function( value ) {
                expect( value ).toBe( 'reject' );
                done();
            } );
        } );

        it( 'Should have called the "catch" method immediately if adding a "catch" method to a rejected Promise', function( done ) {
            Promise.reject( 'reject' ).catch( function( value ) {
                expect( value ).toBe( 'reject' );
                done();
            } );
        } );

    } );

    describe( 'Promise.prototype.then', function() {
        it( 'Should have been executed while Promise was resolved in async', function( done ) {
            new Promise( function( resolve ) {
                setTimeout( function() {
                    resolve( 'resolve' );
                }, 10 );
            } ).then( function( value ) {
                expect( value ).toBe( 'resolve' );
                done();
            } );
        } );

        it( 'Should have executed the "reject" method after Promise was rejected in async', function( done ) {
            new Promise( function( resolve, reject ) {
                setTimeout( function() {
                    reject( 'reject' );
                }, 10 );
            } ).then( null, function( value ) {
                expect( value ).toBe( 'reject' );
                done();
            } );
        } );

        it( 'If method "resolve" in the "then" method returned another Promise, the outer Promise should wait for the inner Promise untill the inner Promise been resolved, the the outer Promise should be resolved', function( done ) {
            Promise.resolve( 1 ).then( function() {
                return new Promise( function( resolve ) {
                    setTimeout( function() {
                        resolve( 'resolve' );
                    }, 10 );
                } );
            } ).then( function( value ) {
                expect( value ).toBe( 'resolve' );
                done();
            } );
        } );

        it( 'If method "resolve" in the "then" method returned another Promise, the outer Promise should wait for the inner Promise untill the inner Promise been rejected, then the outer Promise should be rejected', function( done ) {
            Promise.resolve( 1 ).then( function() {
                return new Promise( function( resolve, reject ) {
                    setTimeout( function() {
                        reject( 'reject' );
                    }, 10 );
                } );
            } ).catch( function( value ) {
                expect( value ).toBe( 'reject' );
                done();
            } );
        } );

        it( 'Should have transfered the value of the Promise to the following "resolve" methods in "then"', function( done ) {
            Promise.resolve( 'resolve' ).catch( function() {} ).then( function( value ) {
                expect( value ).toBe( 'resolve' );
                done();
            } );
        } );

        it( 'The "resolved" status should have been transfered to all of the Promise objects which were following the current Promise object', function( done ) {
            Promise.resolve( 'resolve' )
                .then( function() {} )
                .then( function() {
                    expect( true ).toBe( true );
                    done();
                } );
        } );

        it( 'If the returned value from "resolve" method should have been transfered to the next "then" method', function() {
            Promise.resolve( 1 ).then( function() {
                return 'resolve';
            } ).then( function( value ) {
                expect( value ).toBe( 'resolve' );
            } );
        } );

        it( 'If the "resolve" method has returned another Promise object, the "then" method should get transfered value from the inner Promise object', function( done ) {
            Promise.resolve( 1 ).then( function() {
                return Promise.resolve( 2 );
            } ).then( function( value ) {
                expect( value ).toBe( 2 );
                done();
            } );
        } );

        it( 'Should have called the "resolve" method in "then" even if the previous Promise object returned an resolved Promise object in it\'s "reject" method', function( done ) {
            Promise.reject( 1 ).then( null, function() {
                return Promise.resolve( 'resolve' );
            } ).then( function( value ) {
                expect( value ).toBe( 'resolve' );
                done();
            } );
        } );

        it( 'Should have gone well even if the method "resolve" returned a native Promise object', function( done ) {
            window.Promise || ( window.Promise = Promise );

            Promise.resolve( 1 ).then( function() {
                return new window.Promise( function( resolve ) {
                    setTimeout( function() {
                        resolve( 'resolve' );
                    }, 10 );
                } );
            } ).then( function( value ) {
                expect( value ).toBe( 'resolve' );
                done();
            } );
        } );

        it( 'Should have gone well even if the method "reject" returned a native Promise object', function( done ) {
            window.Promise || ( window.Promise = Promise );

            Promise.reject( 1 ).catch( function(){ 
                return new window.Promise( function( resolve, reject ) {
                    setTimeout( function() {
                        reject( 'reject' );
                    }, 10 );
                } );
            } ).catch( function( value ) {
                expect( value ).toBe( 'reject' );
                done();
            } );
        } );


        it( 'If the paramater of "resolve" method is another Promise object, the current Promise object should wait for the Promise, as the paramater, untill it had been resolved, then the current Promise object should have been resolved', function( done ) {
            new Promise( function( resolve ) {
                resolve( new Promise( function( resolve ) {
                    resolve( 'resolve' );
                } ) );
            } ).then( function( value ) {
                expect( value ).toBe( 'resolve' );
                done();
            } );
        } );

        it( 'Should have gone well if the paramater of "resolve" method was a native Promise object', function( done ) {
            window.Promise || ( window.Promise = Promise );

            new Promise( function( resolve ) {
                resolve( window.Promise.resolve( 'resolve' ) );
            } ).then( function( value ) {
                expect( value ).toBe( 'resolve' );
                done();
            } );
        } );

        it( 'If the param of "resolve" method was a native Promise object, the "catch" method can catch the reason thrown from the native Promise object', function( done ) {
            new Promise( function( resolve ) {
                resolve( window.Promise.reject( 'reject' ) );
            } ).catch( function( reason ) {
                expect( reason ).toBe( 'reject' );
                done();
            } );
        } );

        it( 'Should have been executed well even if the paramater of "resolve" method is null', function( done ) {
            new Promise( function( resolve ) {
                setTimeout( function() {
                    resolve( null );
                }, 10 );
            } ).then( function( value ) {
                expect( value ).toBe( null );
                done();
            } );
        } );

        it( 'Should have caught the exception in the "catch" method if an error was thrown from the previous Promise object', function( done ) {
            new Promise( function() {
                throw 'Error';
            } ).catch( function( reason ) {
                expect( reason ).toBe( 'Error' );
                done();
            } );
        } );

        it( 'Should have caught the exception in the "catch" method if an error was thrown from the previous Promise object', function( done ) {
            Promise.resolve().then( function() {
                throw 'x';
            } ).catch( function( reason ) {
                expect( reason ).toBe( 'x' );
                done();
            } );
        } );

        it( 'The "then" method should have returned a resolved Promise object no matter the "onResolved" or "onRejected" was called', function( done ) {
            Promise.resolve().then( function() {
                throw 1;
            } ).then( null, function( e ) {
                return ++e;
            } ).then( function( v ) {
                expect( v ).toBe( 2 );
                done();
            } );
        } );

        it( 'The second Promise object should be resolved with the value of the first Promise object if the first "onResolved" is not a function', function( done ) {
            Promise.resolve( 1 ).then().then( function( value ) {
                expect( value ).toBe( 1 );
                done();
            } );
        } );

        it( 'The second Promise object shoule be rejected with the reason of the first Promise  object if the first "onRejected" is not a function', function( done ) {
            Promise.reject( 1 ).then().catch( function( reason ) {
                expect( reason ).toBe( 1 );
                done();
            } );
        } );

        it( 'Should have ignored the thrown exception if the Promise object\'s resolved has already been called', function( done ) {
            new Promise( function( resolve ) {
                resolve( 'resolve' );
                throw 'x';
            } ).then( function( value ) {
                expect( value ).toBe( 'resolve' );
                done();
            } );
        } );

        it( 'This is a special case, I don\'t know how to describe it', function( done ) {
            new Promise( function( resolve ) {
                resolve( new Promise( function( r ) {
                    setTimeout( function() { r( false ) }, 10 );
                } ) );
            } ).then( function( value ) {
                if( !value ) throw 'x';
                return true;
            } ).catch( function( reason ) {
                expect( reason ).toBe( 'x' );
                done();
            } );
        } );
    } );

    describe( 'Promise.all', function() {
        it( 'The Promise object should have been resolved after all Promise objects in the argument list resolved', function( done ) {
            Promise.all( [ Promise.resolve(), Promise.resolve() ] ).then( function() {
                expect( true ).toBe( true );
                done();
            } );
        } );

        it( 'The value of the Promise should be an array that filled with all Promise objects\' values in the arguments list', function( done ) {
            Promise.all( [ 
                Promise.resolve( 1 ),
                Promise.resolve( 2 )
            ] ).then( function( values ) {
                expect( values ).toEqual( [ 1, 2 ] );
                done();
            } );
        } );

        it( 'The Promise object should have been rejected as long as one Promise object in the argument list has been rejected', function( done ) {
            Promise.all( [ Promise.reject(), Promise.resolve() ] ).catch( function() {
                expect( true ).toBeTruthy();
                done();
            } );
        } );

        it( 'Should have transfered the rejected reason, that generated from the first rejected Promise object in the argument list, to the "catch" method', function( done ) {
            Promise.all( [
                Promise.reject( 'reject' ),
                Promise.resolve( 'resolve' ),
                Promise.reject( 'reject2' )
            ] ).catch( function( reason ) {
                expect( reason ).toBe( 'reject' );
                done();
            } );
        } );

    } );
    
    describe( 'Promise.race', function() {
        it( 'The Promise object should have been resolved as long as any Promise object in the argument list was resolved firstly', function( done ) {
            Promise.race( [
                Promise.resolve( 'one' ),
                Promise.resolve( 'two' ),
                Promise.reject( 'reject' )
            ] ).then( function( value ) {
                expect( value ).toBe( 'one' );
                done();
            } );
        } );

        it( 'The Promise object should have been rejected as long as any Promise object in the argument list was rejected firstly', function( done ) {
            Promise.race( [
                Promise.reject( 'reject' ),
                Promise.resolve( 'one' ),
                Promise.resolve( 'two' )
            ] ).catch( function( value ) {
                expect( value ).toBe( 'reject' );
                done();
            } );
        } );

    } );
} );
