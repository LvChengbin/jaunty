import Observer from '@lvchengbin/observer';
import is from '@lvchengbin/is';
import { Record } from '../../utils';
import { expression, interpolation, convertPackage, findMethod, traverseNode } from '../utils';
import Validate from '../../validate';

function getForm( node ) {
    while( node && node.nodeName !== 'FORM' ) {
        node = node.parentNode;
    }
    return node;
}

function defaultValue() {
    return {
        $valid : false,
        $checked : false,
        $touched : false,
        $modified : false,
        $dirty : false,
        $pristine : false,
        $error : false,
        $errors : {}
    };
}

export default {
    compile( directive, node, view ) {
        const value = directive.value;
        const scope = node.$scope;
        const nodeName = node.nodeName;
        const options = node.$options;

        if( nodeName === 'FORM' ) {
            const subscope = {};
            const variable = value || '$validation';
            subscope[ variable ] = {};
            node.$scope = Observer.create( subscope, scope );
            node.$$$validation = node.$scope[ variable ];

            node.addEventListener( 'submit', ( e ) => {
                let res = true;
                traverseNode( node, item => {
                    if( item === node ) return;
                    if( item.$$$validateCheck && !item.$$$validateCheck() ) res = false;
                } ); 
                if( node.hasAttribute( 'validate-method' ) ) {
                    const func = interpolation( convertPackage( node.getAttribute( 'validate-method', view.$package ) ) )( scope );
                    if( is.function( func ) && !findMethod( func, view )() ) {
                        res = false;
                    } else {
                        res = !!func;
                    }
                }
                if( !res ) {
                    e.preventDefault(); 
                    e.stopImmediatePropagation();
                }
            } );
            return;
        }

        if( !value ) {
            throw new TypeError( 'Directive :validate must have a value' );
        }

        const form = getForm( node );
        if( !form ) {
            console.error( '[J ERROR] VIEW:VALIDATE' );
        }
        const validation = form.$$$validation;
        const data = defaultValue();
        let oldValue = null;

        const f = expression( value );
        const bound = {};
        const attrs = node.attributes;

        for( let i = attrs.length - 1; i >= 0; i-- ) {
            const item = attrs[ i ];
            const name = item.name;
            const match = name.match( /^validate-(.*)$/ );

            if( match && match[ 1 ] !== 'on' ) {
                bound[ match[ 1 ] ] = item.value;
            }
        }

        const trim = /^true|on$/i.test( node.getAttribute( 'validate-trim' ) || 'true' );

        function check() {
            let res = true;
            const val = trim ? node.value.trim() : node.value;
            for( let item in Validate ) {
                if( !bound.hasOwnProperty( item ) ) continue;
                const error = !Validate[ item ]( val, bound[ item ] ? expression( bound[ item ] )( scope ) : true );
                error && ( res = false );
                view.$set( data.$errors, item, error );
            }

            if( bound.hasOwnProperty( 'method' ) ) {
                const value = convertPackage( bound.method, view.$package );
                let func = interpolation( value )( scope ); 
                if( is.function( func ) ) {
                    if( !findMethod( func, view )( val ) ) {
                        res = true;
                    }
                }
                if( !func ) {
                    res = true;
                }
            }
            return !( data.$error = !res );
        }

        function set() {
            Record.start( node, node.$eventMarks[ ':validate' ], function() {
                set();
            } );
            view.$set( validation, f( scope ), data );
            Record.reset();
        }

        options.once ? view.$assign( validation, { [ f( scope ) ] : data } ) : set();

        node.$$$validateCheck = check;

        if( node.hasAttribute( 'validate-on' ) ) {
            const events = node.getAttribute( 'validate-on' ).split( ',' );

            for( let evt of events ) {
                node.addEventListener( evt, check, false );
            }
            node.removeAttribute( 'validate-on' );
        }

        node.addEventListener( 'focus', () => {
            if( data.$touched ) return;
            data.$touched = true;
            oldValue = node.value;
        } );

        node.addEventListener( 'input', () => {
            data.$dirty = true;
            data.$touched = true;
            data.$modified = ( node.value !== oldValue );
        } );

        node.addEventListener( 'change', () => {
            data.$touched = true;
            data.$dirty = true;
            data.$modified = ( node.value !== oldValue );
        } );
    }
};
