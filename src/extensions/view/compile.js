import is from '@lvchengbin/is';
import { Record } from '../utils';
import { wrapNode, expression, interpolation, convertPackage, strConvert, findMethod, addClass, removeClass } from './utils';
import { sort, bindDirective, compileDirective } from './directive';
import { leftDelimiterReg, rightDelimiterReg } from './settings';
import events from './events';
import { slice } from '../../variables';

const regTag = new RegExp(
    leftDelimiterReg + '((.|\\n)+?)' + rightDelimiterReg
);

function compileTextNode( node ) {
    const f = expression( node.data );
    const scope = node.$scope;

    function value() {
        Record.start( node, node.$eventMarks, function() {
            node.data = value();
        } );
        const res = f( scope );
        Record.reset();
        return res;
    }
    if( !node.$options.once ) {
        node.data = value();
    } else {
        node.data = f( scope );
    }
}

function setAttr( node, name, value ) {
    let tag, nodeType;
    switch( name ) {
        case 'value' :
            tag = node.tagName;
            if( tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' ) {
                if( node.value === value ) return;
                node.value = value;
                node.onchange && node.onchange( true );
                /*if( !node.$$$modelChanged ) {
                    node.onchange && node.onchange( true );
                }*/
            } else {
                node.setAttribute( name, value );
            }
            break;
        case 'checked' :
            nodeType = node.type;
            tag = node.tagName;
            if( tag === 'INPUT' && ( nodeType === 'radio' || nodeType === 'checkbox' ) ) {
                node.checked = !!value;
            } else {
                node.setAttribute( name, value );
            }
            break;
        default : 
            node.setAttribute( name, value );
            break;
    }
}

function compileAttribute( node, attr ) {
    const name = attr.name.slice( 1 );
    const f = interpolation( attr.value );
    const scope = node.$scope;

    function value() {
        Record.start( node, node.$eventMarks[ attr.name ], function() {
            setAttr( node, name, value() );
        } );
        const res = f( scope );
        Record.reset();
        return res;
    }
    if( !node.$options.once ) {
        setAttr( node, name, value() );
    } else {
        setAttr( node, name, f( scope ) );
    }
    node.removeAttribute( attr.name );
}

function compileStyle( node, attr ) {
    const name = attr.name.slice( 1 );
    const f = interpolation( attr.value );
    const scope = node.$scope;
    
    function value() {
        Record.start( node, node.$eventMarks[ attr.name ], function() {
            node.style[ name ] = value();
        } );
        const res = f( scope );
        Record.reset();
        return res;
    }

    if( !node.$options.once ) {
        node.style[ name ] = value();
    }  else {
        node.style[ name ] = f( scope );
    }
    node.removeAttribute( attr.name );
}

function compileClass( node, attr ) {
    const name = attr.name.slice( 1 );
    const f = interpolation( attr.value );
    const scope = node.$scope;

    function value() {
        Record.start( node, node.$eventMarks[ attr.name ], function() {
            const present = value();
            present ? addClass( node, name ) : removeClass( node, name );
        } );
        const res = f( scope );
        Record.reset();
        return res;
    }

    let present;

    if( !node.$options.once ) {
        present = value();
    } else {
        present = f( scope );
    }

    present ? addClass( node, name ) : removeClass( node, name );
}

function compileEvent( node, attr, view ) {
    const name = attr.name.slice( 1 );
    let value = attr.value;

    if( view.$package ) {
        value = convertPackage( value, view.$package );
    }

    value = strConvert( value, 'this', '__n' );

    const f = interpolation( value, '__n' );
    const scope = node.$scope;

    const handler = function( e ) {
        const func = f( scope, node );
        is.function( func ) && findMethod( func, view )( e );
    };

    events[ name ] ? events[ name ]( node, handler ) : node.addEventListener( name, handler );
    node.removeAttribute( attr.name );
}

const compileElementCache = {};

function compileElement( node, view ) {
    let directives, events, attributes, cache, styles, classes;
    const sign = node.$sign;
    if( sign && ( cache = compileElementCache[ sign ] ) ) {
        directives = cache.directives;
        events = cache.events;
        attributes = cache.attributes;
        styles = cache.styles;
        classes = cache.classes;
    } else {
        directives = [];
        events = [];
        attributes = [];
        styles = [];
        classes = [];
        const attrs = node.attributes;
        for( let i = attrs.length - 1; i >= 0; i-- ) {
            const item = attrs[ i ];
            const name = item.name;
            switch( name.charAt( 0 ) ) {
                case ':' :
                    directives.push( { name, value : item.value } );
                    break;
                case '@' :
                    events.push( { name, value : item.value } );
                    break;
                case '$' :
                    attributes.push( { name, value : item.value });
                    break;
                case '!' :
                    styles.push( { name, value : item.value } );
                    break;
                case '.' :
                    classes.push( { name, value : item.value } );
                    break;
            }
        }
        sort( directives );
        sign && ( compileElementCache[ sign ] = {
            directives,
            events,
            attributes,
            styles,
            classes
        } );
    }
    for( let i = 0, l = directives.length; i < l; i = i + 1 ) {
        bindDirective( directives[ i ], node );
    }
    const options = node.$options;
    for( let i = 0, l = directives.length; i < l; i = i + 1 ) {
        node.$eventMarks[ directives[ i ].name ] = {};
        compileDirective( directives[ i ], node, view );
        if( options.skip || options.removed ) {
            return {
                scope : node.$scope,
                options
            };
        }
    }

    if( !options.skip && !options.removed ) {
        for( let i = 0, l = events.length; i < l; i = i + 1 ) {
            compileEvent( node, events[ i ], view );
        }
        for( let i = 0, l = attributes.length; i < l; i = i + 1 ) {
            node.$eventMarks[ attributes[ i ].name ] = {};
            compileAttribute( node, attributes[ i ] );
        }

        for( let i = 0, l = styles.length; i < l; i += 1 ) {
            node.$eventMarks[ styles[ i ].name ] = {};
            compileStyle( node, styles[ i ] );
        }

        for( let i = 0, l = classes.length; i < l; i += 1 ) {
            node.$eventMarks[ classes[ i ].name ] = {};
            compileClass( node, classes[ i ] );
        }
    }

    return {
        scope : node.$scope,
        options
    };
}

function traverse( nodes, view, scope, options ) {
    for( let i = 0, l = nodes.length; i < l; i = i + 1 ) {
        const node = nodes[ i ];
        let res;
        node.$id || wrapNode( node, scope, options, true );
        const type = node.nodeType;
        if( type === 1 ) {
            res = compileElement( node, view );
            let o;
            if( !res || !( o = res.options ) ) continue;
            if( !o.removed && !o.skip && !o.pre && node.tagName !== 'SCRIPT' ) {
                traverse( slice.call( node.childNodes ), view, res.scope, o );
            }
        } else if( type === 3 ) {
            node.data.trim() && regTag.test( node.data ) && compileTextNode( node );
        }
    }
}

export { traverse };
