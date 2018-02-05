import biu from '@lvchengbin/biu';
import config from './config';
import Script from '../../src/script';

const server = config.server;
const api = server + '/javascript';
const str = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$';
let i = 0;

describe( 'J/Core/Script', () => {

    const now = +new Date;
    it( 'create an external script', done => {
        const v = str.charAt( i++ ) + now;
        const url = `${api}?t=${v}=${now}`;
        Script.create( url, { external : true } ).then( node => {
            expect( node.src ).toEqual( url );
            expect( node.getAttribute( 'data-src' ) ).toEqual( url );
            expect( window[ v ] ).toEqual( now );
            done();
        } );
    } );

    it( 'should only load once even though to create script tag with same url multiple times', done => {
        const v = str.charAt( i++ ) + now;
        const url = `${api}?t=${v}=${now}`;
        const promise = Script.create( url, { external : true } );
        
        promise.then( () => {
            expect( Script.create( url ) ).toEqual( promise );
            done();
        } );
    } );

    it( 'load script with ajax', done => {
        const v = str.charAt( i++ ) + now;
        const url = `${api}?t=${v}=${now}`;
        Script.create( url ).then( node => {
            expect( node.src ).toEqual( '' );
            expect( node.getAttribute( 'data-src' ) ).toEqual( url );
            expect( window[ v ] ).toEqual( now );
            done();
        } );
    } );

    it( 'should use LocalCache for storing content persistently', done => {
        const v = str.charAt( i++ ) + now;
        const url = `${api}?t=${v}=${now}`;
        Script.create( url, {
            localcache : {
                persistent : true
            }
        } ).then( () => {
            biu.get( url, {
                fullResponse : true,
                localcache : {
                    persistent : true
                }
            } ).then( response => {
                expect( response.statusText ).toEqual( 'From LocalCache' );
                done();
            } );
        } );
    } );

    it( 'validate data with incorrect md5', done => {
        const v = str.charAt( i++ ) + now;
        const url = `${api}?t=${v}=${now}`;
        Script.create( url, {
            localcache : {
                persistent : {
                    md5 : true
                }
            }
        } ).then( () => {
            biu.get( url, {
                fullResponse : true,
                localcache : {
                    persistent : true,
                    md5 : 'abcdefg'
                }
            } ).then( response => {
                expect( response.statusText ).toEqual( 'OK' );
                done();
            } );
        } );

    } );

    it( 'get loaded script with url', done => {
        const v = str.charAt( i++ ) + now;
        const url = `${api}?t=${v}=${now}`;
        Script.create( url );
        expect( !!Script.get( url ) ).toBeTruthy();
        done();
    } );

    it( 'scripts should be loaded in correct order', done => {
        const v = str.charAt( i++ ) + now;

        Script.create( `${api}?t=${v}=1&delay=100` );
        Script.create( `${api}?t=${v}=2` ).then( () => {
            expect( window[ v ] ).toEqual( 2 );
            done();
        } );
    } );
    
} );
