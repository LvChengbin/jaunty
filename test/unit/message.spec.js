import Promise from '@lvchengbin/promise';
import is from '@lvchengbin/is';
import J from '../../src/j';
import Package from '../../src/package';
import Rule from '../../src/rule';
import '../../src/messages/index';
import config from './config';

describe( 'Message', () => {
    const j = new J( {
        messages : {}
    } );

    beforeAll( done => {
        J.Package = Package;
        J.Promise = Promise;
        window.J = J;
        j.$mount( 'sub', config.packages + '/test-1' ).then( done );
    } );

    it( 'Should have a method "$message"', () => {
        expect( is.function( j.$message ) ).toBeTruthy();
    } );

    it( 'Should return a Promise', () => {
        expect( is.promise( j.$message( j ) ) ).toBeTruthy();
    } );

    it( 'Should throw a TypeError if the recipient is empty', () => {
        expect( () => j.$message() ).toThrowError( TypeError );
    } );

    it( 'Matched the rule with it\'s action is a function', done => {
        j.rules.push(
            new Rule( /message\/func/, function( body, message ) {
                expect( body ).toEqual( body );
                expect( message.from ).toEqual( j );
                expect( this ).toEqual( j );
                done();
            } )
        );
        j.$message( j, 'func', 'body' );
    } );

    it( 'Should execute the correct action', done => {
        j.rules.push(
            new Rule( 'message/alert', 'modal.alert' )
        );

        j.modal = {
            alert( body, message ) {
                expect( this ).toEqual( j );
                expect( message.from ).toEqual( j )
                expect( body ).toEqual( 'body' );
                done();
            }
        };

        j.$message( j, 'alert', 'body' );
    } );

    it( 'Should execute the method has correct name if messages property if there is not any rules match the message', done => {
        j.messages.group = {
            func( body, message ) {
                expect( this ).toEqual( j );
                expect( message.from ).toEqual( j )
                expect( body ).toEqual( 'body' );
                done();
            }
        };

        j.$message( j, 'group/func', 'body' );
    } );

    it( 'Using sub matches in regexp', done => {
        j.rules.push(
            new Rule( /message\/(error|warn)/, '$1' )
        );

        j.error = function( body, message ) {
            expect( this ).toEqual( j );
            expect( message.from ).toEqual( j )
            expect( body ).toEqual( 'body' );
            done();
        };

        j.$message( j, 'error', 'body' );
    } );

    it( 'Forwarding to another package with pre-process', done => {
        j.$find( 'sub' ).func = function( body, message ) {
            expect( this ).toEqual( j.$find( 'sub' ) );
            expect( message.from ).toEqual( j )
            expect( body ).toEqual( 'new body' );
            done();
        }

        j.$find( 'sub' ).rules.push( 
            new Rule( 'message/forward-to-sub', 'func' ) 
        );

        j.rules.push( 
            new Rule( 'message/forward-to-sub', {
                forward : 'sub',
                preprocess( message ) {
                    message.body = 'new body';
                }
            } )
        );

        j.$message( j, 'forward-to-sub', 'body' )
    } );

    it( 'To reply a message', done => {
        j.$find( 'sub' ).receiver = function( body, message ) {
            message.reply( 'reply' );
        };

        j.$find( 'sub' ).rules.push(
            new Rule( 'message/need-to-reply', 'receiver' )
        );

        j.$message( 'sub', 'need-to-reply', 'body' ).then( data => {
            expect( data ).toEqual( 'reply' );
            done();
        } );
    } );
} );

describe( 'Event', () => {
    const j = new J( {
        events : {}
    } );

    beforeAll( done => {
        J.Package = Package;
        J.Promise = Promise;
        window.J = J;
        Promise.all( [
            j.$mount( 'sub', config.packages + '/test-1' ),
            j.$mount( 'sub2', config.packages + '/test-2', {
                packages : config.packages
            } )
        ] ).then( done );
    } );

    it( 'Should have method: "$unicast", "$broadcast", "$multicast", "$bubble"', () => {
        expect( is.function( j.$unicast ) ).toBeTruthy();
        expect( is.function( j.$broadcast ) ).toBeTruthy();
        expect( is.function( j.$multicast ) ).toBeTruthy();
        expect( is.function( j.$bubble ) ).toBeTruthy();
    } );

    it( 'Should throw a TypeError if the recipient is empty', () => {
        expect( () => j.$unicast() ).toThrowError( TypeError );
        expect( () => j.$unicast( [] ) ).toThrowError( TypeError );
    } );

    it( 'Matched the rule with it\'s action is a function', done => {
        j.rules.push(
            new Rule( /event\/func/, function( body, message ) {
                expect( body ).toEqual( body );
                expect( message.from ).toEqual( j );
                expect( this ).toEqual( j );
                done();
            } )
        );
        j.$unicast( j, 'func', 'body' );
    } );

    it( 'Should execute the correct action', done => {
        j.rules.push(
            new Rule( 'event/alert', 'modal.alert' )
        );

        j.modal = {
            alert( body, message ) {
                expect( this ).toEqual( j );
                expect( message.from ).toEqual( j )
                expect( body ).toEqual( 'body' );
                done();
            }
        };

        j.$unicast( j, 'alert', 'body' );
    } );

    it( 'Should execute the method has correct name if events property if there is not any rules match the message', done => {
        j.events.group = {
            func( body, message ) {
                expect( this ).toEqual( j );
                expect( message.from ).toEqual( j )
                expect( body ).toEqual( 'body' );
                done();
            }
        };

        j.$unicast( j, 'group/func', 'body' );
    } );

    it( 'Using sub matches in regexp', done => {
        j.rules.push(
            new Rule( /event\/(error|warn)/, '$1' )
        );

        j.error = function( body, message ) {
            expect( this ).toEqual( j );
            expect( message.from ).toEqual( j )
            expect( body ).toEqual( 'body' );
            done();
        };

        j.$unicast( j, 'error', 'body' );
    } );

    it( 'Forwarding to another package with pre-process', done => {
        j.$find( 'sub' ).func = function( body, message ) {
            expect( this ).toEqual( j.$find( 'sub' ) );
            expect( message.from ).toEqual( j )
            expect( body ).toEqual( 'new body' );
            done();
        }

        j.$find( 'sub' ).rules.push( 
            new Rule( 'event/forward-to-sub', 'func' ) 
        );

        j.rules.push( 
            new Rule( 'event/forward-to-sub', {
                forward : 'sub',
                preprocess( message ) {
                    message.body = 'new body';
                }
            } )
        );

        j.$unicast( j, 'forward-to-sub', 'body' )
    } );

    it( 'Send event to multiple packages once with "$unicast"', done => {
        let r1, r2;

        Promise.all( [
            new Promise( resolve => { r1 = resolve } ),
            new Promise( resolve => { r2 = resolve } )
        ] ).then( done );

        j.$find( 'sub' ).rules.push( new Rule( 'event/x', r1 ) );
        j.$find( 'sub2' ).rules.push( new Rule( 'event/x', r2 ) );

        j.$unicast( [ 'sub', 'sub2' ], 'x', 'body' );
    } );

    it( 'Using "$broadcast"', done => {
        let r1, r2, r3, r4;

        Promise.all( [
            new Promise( resolve => { r1 = resolve } ),
            new Promise( resolve => { r2 = resolve } ),
            new Promise( resolve => { r3 = resolve } ),
            new Promise( resolve => { r4 = resolve } )
        ] ).then( done );

        j.rules.push( new Rule( 'event/broadcast-event', r1 ) );
        j.$find( 'sub' ).rules.push( new Rule( 'event/broadcast-event', r2 ) );
        j.$find( 'sub2' ).rules.push( new Rule( 'event/broadcast-event', r4 ) );
        j.$find( 'sub2.test-1' ).rules.push( new Rule( 'event/broadcast-event', r3 ) );

        j.$find( 'sub2' ).$broadcast( 'broadcast-event', 'body' );
    } );

    it( 'Using "$broadcast" from root package', done => {
        let r1, r2, r3, r4;

        Promise.all( [
            new Promise( resolve => { r1 = resolve } ),
            new Promise( resolve => { r2 = resolve } ),
            new Promise( resolve => { r3 = resolve } ),
            new Promise( resolve => { r4 = resolve } )
        ] ).then( done );

        j.rules.push( new Rule( 'event/broadcast-event-from-root', r1 ) );
        j.$find( 'sub' ).rules.push( new Rule( 'event/broadcast-event-from-root', r2 ) );
        j.$find( 'sub2' ).rules.push( new Rule( 'event/broadcast-event-from-root', r3 ) );
        j.$find( 'sub2.test-1' ).rules.push( new Rule( 'event/broadcast-event-from-root', r4 ) );

        j.$broadcast( 'broadcast-event-from-root', 'body' );
    } );

    it( 'Using "$multicast" to send message to children but descendants', done => {
        let i = 0;
        let r1, r2;

        const p1 = new Promise( resolve => { r1 = resolve } ).then( () => i++ );
        const p2 = new Promise( resolve => { r2 = resolve } ).then( () => i++ );

        Promise.all( [ p1, p2 ] ).then( () => {
            setTimeout( () => {
                expect( i ).toEqual( 2 );
                done();
            }, 40 );
        } );

        j.$find( 'sub' ).rules.push( new Rule( 'event/multicast-event', r1 ) ); 
        j.$find( 'sub2' ).rules.push( new Rule( 'event/multicast-event', r2 ) );
        j.$find( 'sub2.test-1' ).rules.push( new Rule( 'event/multicalst-event', () => i++ ) );

        j.$multicast( 'multicast-event', 'body', false );
    } );

    it( 'Using "$multicast" to send message to children and descendants', done => {
        let i = 0;
        let r1, r2, r3;

        const p1 = new Promise( resolve => { r1 = resolve } ).then( () => i++ );
        const p2 = new Promise( resolve => { r2 = resolve } ).then( () => i++ );
        const p3 = new Promise( resolve => { r3 = resolve } ).then( () => i++ );

        Promise.all( [ p1, p2, p3 ] ).then( done );

        j.$find( 'sub' ).rules.push( new Rule( 'event/multicast-event', r1 ) );
        j.$find( 'sub2' ).rules.push( new Rule( 'event/multicast-event', r2 ) );
        j.$find( 'sub2.test-1' ).rules.push( new Rule( 'event/multicast-event', r3 ) );

        j.$multicast( 'multicast-event', 'body', true );
    } );

    it( 'Using "$bubble"', done => {

        let r1, r2;

        const p1 = new Promise( resolve => { r1 = resolve } );
        const p2 = new Promise( resolve => { r2 = resolve } );

        j.rules.push( new Rule( 'event/bubbling-event', r1 ) );
        j.$find( 'sub2' ).rules.push( new Rule( 'event/bubbling-event', r2 ) );

        Promise.all( [ p1, p2 ] ).then( done );

        j.$find( 'sub2.test-1' ).$bubble( 'bubbling-event', 'body' );    
    } );

    it( 'Should have been stopped by calling "message.stop()"', done => {
        let i = 0;
        let r1;

        new Promise( resolve => { r1 = resolve } ).then( () => {
            setTimeout( () => {
                expect( i ).toEqual( 0 );
                done();
            }, 40 );
        } );

        j.rules.push( new Rule( 'event/bubbling-stopped-event', () => i++ ) );

        j.$find( 'sub2' ).rules.push(
            new Rule( 'event/bubbling-stopped-event', function( body, message ) {
                expect( body ).toEqual( 'body' );
                expect( message.from ).toEqual( j.$find( 'sub2.test-1' ) );
                message.stop();
                r1();
            } )
        );

        j.$find( 'sub2.test-1' ).$bubble( 'bubbling-stopped-event', 'body' );    
    } );

} );

describe( 'Param', () => {
    const j = new J( {
        params : {}
    } );

    beforeAll( done => {
        J.Package = Package;
        J.Promise = Promise;
        window.J = J;
        Promise.all( [
            j.$mount( 'sub', config.packages + '/test-1' ),
            j.$mount( 'sub2', config.packages + '/test-2', {
                packages : config.packages
            } )
        ] ).then( done );
    } );

    it( 'Should have method: "$unicast", "$broadcast", "$multicast", "$bubble"', () => {
        expect( is.function( j.$param ) ).toBeTruthy();
    } );

    it( 'Should throw a TypeError if the recipient is empty', () => {
        expect( () => j.$param() ).toThrowError( TypeError );
        expect( () => j.$param( [] ) ).toThrowError( TypeError );
    } );

    it( 'Matched the rule with it\'s action is a function', done => {
        j.rules.push(
            new Rule( /param\/func/, function( body, message ) {
                expect( body ).toEqual( body );
                expect( message.from ).toEqual( j );
                expect( this ).toEqual( j );
                done();
            } )
        );
        j.$param( j, 'func', 'body' );
    } );

    it( 'Should execute the correct action', done => {
        j.rules.push(
            new Rule( 'param/topicid', 'topic.id' )
        );

        j.topic = {
            id( body, message ) {
                expect( this ).toEqual( j );
                expect( message.from ).toEqual( j )
                expect( body ).toEqual( 1 );
                done();
            }
        };

        j.$param( j, 'topicid', 1 );
    } );

    it( 'Should execute the method has correct name if events property if there is not any rules match the message', done => {
        j.params.group = {
            func( body, message ) {
                expect( this ).toEqual( j );
                expect( message.from ).toEqual( j )
                expect( body ).toEqual( 'body' );
                done();
            }
        };

        j.$param( j, 'group/func', 'body' );
    } );

    it( 'Using sub matches in regexp', done => {
        j.rules.push( new Rule( /param\/(name|nickname)/, '$1' ) );

        j.name = function( body, message ) {
            expect( this ).toEqual( j );
            expect( message.from ).toEqual( j )
            expect( body ).toEqual( 'jaunty' );
            done();
        };

        j.$param( j, 'name', 'jaunty' );
    } );

    it( 'Forwarding to another package with pre-process', done => {
        j.$find( 'sub' ).func = function( body, message ) {
            expect( this ).toEqual( j.$find( 'sub' ) );
            expect( message.from ).toEqual( j )
            expect( body ).toEqual( 'new value' );
            done();
        }

        j.$find( 'sub' ).rules.push( new Rule( 'param/forward-to-sub', 'func' ) );

        j.rules.push( 
            new Rule( 'param/forward-to-sub', {
                forward : 'sub',
                preprocess( message ) {
                    message.value = 'new value';
                }
            } )
        );

        j.$param( j, 'forward-to-sub', 'value' )
    } );

    it( 'Send event to multiple packages once with "$unicast"', done => {
        let r1, r2;

        Promise.all( [
            new Promise( resolve => { r1 = resolve } ),
            new Promise( resolve => { r2 = resolve } )
        ] ).then( done );

        j.$find( 'sub' ).rules.push( new Rule( 'param/x', r1 ) );
        j.$find( 'sub2' ).rules.push( new Rule( 'param/x', r2 ) );

        j.$param( [ 'sub', 'sub2' ], 'x', 'body' );
    } );
} );
