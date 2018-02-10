import config from './config';
import { uniqueId, currentScript, extract } from '../../src/utils';

describe( 'J/Core/Utils', () => {
    describe( 'uniqueId', () => {
        const ids = [];
        for( let i = 0; i < 100; i += 1 ) {
            ids.push( uniqueId() );
        }
        const nids = [];

        for( let i = 0, l = ids.length; i < l; i += 1 ) {
            const id = ids[ i ];
            if( nids.indexOf( id ) < 0 ) {
                nids.push( id );
            }
        }
        it( 'All the generated ids should be unique.', () => {
            expect( nids ).toEqual( ids );
        } );

    } );

    describe( 'currentScript', () => {
        it( 'Should have gotten the correct script node with inline scripts', done => {

            const func = 'utils-currentScript-test-case-function' + uniqueId();
            const id = 'the-script-node';

            window[ func ] = function() {
                const script = currentScript();
                expect( script.id ).toBe( id )
                done();
            };
            const node = document.createElement( 'script' );
            node.type = 'text/javascript';
            node.charset = 'utf-8';
            node.async = true;
            node.id = id;
            node.text = `window['${func}']()`;

            document.head.appendChild( node );
        } );

        it( 'Should have gotten the corrent script node with an extrnal script file', done => {
            const func = 'test-utils-currentscript';
            const id = 'another-script-node';

            window[ func ] = function() {
                const script = currentScript();
                expect( script.id ).toBe( id )
                done();
            };
            const node = document.createElement( 'script' );
            node.type = 'text/javascript';
            node.charset = 'utf-8';
            node.async = true;
            node.id = id;
            node.src = config.server + '/static/js/test-utils-currentscript.js';

            document.head.appendChild( node );
        } );
    } );

    describe( 'extract', () => {
        it( 'Should have gotten correct output', () => {
            const data = {
                a : {
                    b : {
                        c : 'Jaunty'
                    }
                }
            };
            expect( extract( 'a.b.c', data ) ).toEqual( 'Jaunty' );
            expect( extract( 'd', data ) ).toEqual( undefined );
            expect( extract( 'a-b-c', data, '-' ) ).toEqual( 'Jaunty' );
        } );
    } );
} );
