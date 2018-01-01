import { Record } from '../../utils';
import { expression, interpolation, createAnchor, findMethod } from '../utils';
import Value from '../../../core/value';
import Promise from '../../../core/promise';
import { checks } from '../../../core/utils';

let id = 0;

export default {
    compile( directive, node, view ) {
        const frag = document.createDocumentFragment();
        const value = directive.value;
        const scope = node.$scope;
        let url = node.getAttribute( 'mount-url' ) || node.getAttribute( '*url' );

        if( !url ) return false;

        url = expression( url )( scope );

        const model = node.hasAttribute( ':model' ) ? node.getAttribute( ':model' ) : null;
        const attrs = node.attributes; 
        const init = { container : frag };
        const anchor = createAnchor();
        const pkgName = value.trim() ? expression( value )( scope ) : '#anonymous-directive-mount' + id++;

        let pkg;

        anchor.$relevant = node;

        node.parentNode.insertBefore( anchor, node );

        function onmatch( f, name ) {
            if( !node.$options.once ) {
                Record.start( node, node.$eventMarks[ ':mount' ], function() {
                    pkg && view.$package.$unicast( pkgName, 'paramchange', { 
                        name, 
                        value : new Value( f( scope ), { from : 'paramchange' } )
                    } );
                } );
            }
            init[ name ] = f( scope );
            Record.reset();
        }

        const events = [];

        for( let i = attrs.length - 1; i >= 0; i-- ) {
            const item = attrs[ i ];
            const name = item.name;
            const match = name.match( /^(?:mount-param-|\*\*)(.*)$/ );
            if( match ) {
                if( !item.value ) {
                    init[ match[ 1 ] ] = null;
                    continue;
                }
                const f = expression( item.value );
                onmatch( f, match[ 1 ] );
            }
            if( name.charAt( 0 ) === '@' ) {
                events.push( { 
                    name : name.substr( 1 ),
                    handler : item.value
                } );
                node.removeAttribute( name );
            }
        }

        let r;

        view.$resources( new Promise( resolve => { r = resolve } ), `Mounting package from a :mount directive in view ${url}` );

        init.beforeinit = function() {
            if( model ) {
                const $set = /\[[\s\d+]+\]$/.test( model );
                const stringify = JSON.stringify;
                this.$on( 'input', ( value, ov, path, special ) => {
                    if( special instanceof Value && special.from === 'paramchange' ) return;
                    if( $set ) {
                        const exp = model.replace( /\[([\s\d+]+)\]$/, '.$$set($1, new Value(' + stringify( value ) + ', { from : "paramchange" } )' );
                        new Function( 'scope', 'with(scope)' + exp )( scope );
                    } else {
                        new Function( 'scope', 'with(scope)' + model + '=new J.Value(' + stringify( value ) + ', { form : "paramchange" } )' )( scope );
                    }
                } );
            }
        };

        view.$mount( pkgName, url, init ).then( p => {
            pkg = p;
            anchor.$package = p;
            p.$ready( () => { 
                /**
                 * the target node might not be still there in the dom tree
                 * cuz that the loading of package is async
                 * so check if node.$options.skip is true and unmount the package
                 */
                if( node.$options.skip ) {
                    view.$package.$unmount( pkgName );
                    return;
                }
                /**
                 * all events was bound to the original node
                 * so can't remove the original node here
                 * @todo 
                 */
                node.parentNode.replaceChild( frag, node );
                //replaceNode( frag, node );
                r();

                const h = ( f, value ) => {
                    const func = f( scope );
                    checks.function( func ) && findMethod( func, view )( value );
                };

                for( let ev of events ) {
                    p.$on( ev.name, h.bind( this, interpolation(
                        ev.handler.replace( 
                            /(^|[^$_\w\d.])package\b(?=(?:[^'"]*['"][^'"]*['"])*[^'"]*$)/g,
                            '$1 J.find("' + view.$package.$path().join( '.' ).replace( /(\$)/g, '$$$$' ) + '")'
                        )
                    ) ) );
                }
            } );
        } ).catch( ( e ) => {
            console.error( e );
        } );
    }
};
