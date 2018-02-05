import is from '@lvchengbin/is';
import { eventcenter } from '../utils';
import escapeReg from '@lvchengbin/escape/src/regexp';
import EventEmitter from '@lvchengbin/event-emitter';
import { leftDelimiterReg, rightDelimiterReg } from './settings';
import { assign, defineProperty } from '../../variables';

let id = 0;

function wrapFilter( exp, filters ) {
    while( filters.length ) {
        const filter = filters.shift();
        const step = filter.trim().split( /[\s|,]+(?=(?:[^'"]*['"][^'"]*['"])*[^'"]*$)/g );
        const func = JSON.stringify( step.shift().trim() );
        step.unshift( exp );
        exp = `__e(${func},$filters,__f)(${step.join(',')})`;
    }
    return exp;
}

function getFilter( exp, f1, f2 ) {
    const fn = new Function( 's', 'with(s)return ' + exp );
    try { return fn( f1 ) } catch( e ) { return fn( f2 ) }
}

function parseFilter( str ) {
    if( str.indexOf( '#' ) < 0 ) {
        return str;
    }
    const filters = str.split( /(?:#)(?=(?:[^'"]*['"][^'"]*['"])*[^'"]*$)/g );

    if( filters.length === 1 ) {
        return str;
    }

    let exp = filters.shift();

    while( filters.length ) {
        const filter = filters.shift();
        const step = filter.trim().split( /[\s|,]+(?=(?:[^'"]*['"][^'"]*['"])*[^'"]*$)/g );
        const func = JSON.stringify( step.shift().trim() );
        step.unshift( exp );
        exp = `__e(${func},$filters,__f)(${step.join(',')})`;
    }
    return exp;
}

function evalString( exp ) {
    return `var __e=${getFilter.toString()};
        try{
            var __f=J.View.$filters;
            with(s)return ${parseFilter( exp )}
        }catch(e){
            window.console.warn("[J WARN] View Interpolation : " + e);
            return null
        }`;
}

const inCache = {};

// expression without {{ }}
function interpolation( str ) {
    if( inCache[ str ] ) return inCache[ str ];
    const args = [ 's', ...Array.prototype.splice.call( arguments, 1 ) ];
    return ( inCache[ str ] = new Function( ...args, evalString( str ) ) );
}

const reg = new RegExp( leftDelimiterReg + '((.|\\n)+?)' + rightDelimiterReg, 'g' );

const stringifyCache = {};
const fnCache = {};
// expression
function expression( str ) {
    if( fnCache[ str ] ) return fnCache[ str ];
    let match, index;
    let lastIndex = reg.lastIndex = 0;
    const tokens = [];
    const stringify = JSON.stringify;
    while( ( match = reg.exec( str ) ) ) {
        index = match.index;
        if( index > lastIndex ) {
            const t = str.slice( lastIndex, index );
            tokens.push( stringifyCache[ t ] || ( stringifyCache[ t ] = stringify( t ) ) );
        }
        tokens.push( '(' + parseFilter( match[ 1 ] ) + ')' );
        lastIndex = index + match[ 0 ].length;
    }
    if( lastIndex < str.length ) {
        const t = str.slice( lastIndex );
        tokens.push( stringifyCache[ t ] || ( stringifyCache[ t ] = stringify( t ) ) );
    }
    const exp = tokens.join( '+' + stringify( '' ) + '+' );
    return ( fnCache[ str ] = new Function( 's', evalString( exp ) ) );
}

function traverseNode( node, cb ) {
    cb( node );
    const nodes = node.childNodes;
    for( let i = 0, l = nodes.length; i < l; i = i + 1 ) {
        nodes[ i ].$id && traverseNode( nodes[ i ], cb );
    }
}

function purifyNode( node ) {
    traverseNode( node, item => {
        if( item.$package ) {
            item.$package.$parent.$unmount( item.$package.$name );
        }
        if( item.$id ) {
            const events = item.$events;
            for( let i = 0, l = events.length; i < l; i = i + 1 ) {
                eventcenter.$removeListener( events[ i ][ 0 ], events[ i ][ 1 ] );
            }
        }
        item.$relevant && purifyNode( item.$relevant );
        item.$ec.emit( 'remove' );
    } );
}

function removeNode( node, parentNode ) {
    purifyNode( node );
    parentNode || ( parentNode = node.parentNode );
    return parentNode && parentNode.removeChild( node );
}

function replaceNode( newNode, oldNode, parentNode, pure = false ) {
    pure || purifyNode( oldNode );
    parentNode || ( parentNode = oldNode.parentNode );
    return parentNode && parentNode.replaceChild( newNode, oldNode );
}

function createAnchor( text, scope, options ) {
    const anchor = wrapNode( document.createTextNode( text || '' ), scope, options );
    anchor.$isAnchor = true;
    return anchor;
}

function wrapNode( node, scope, options ){
    if( node.$id ) return node;
    assign( node, { 
        $events : [],
        $eventMarks : {},
        $ec : new EventEmitter(),
        $id : ++id,
        $scope : scope,
        $options : options ? assign( {}, options ) : {}
    } );
    return node;
}

function cloneNode( node ) {
    const n = node.cloneNode( true );
    n.$sign = node.$id;
    return n;
}


function copyDescripter( dest, src, keys ) {
    for( let i = 0, l = keys.length; i < l; i = i + 1 ) {
        const key = keys[ i ];
        const descriptor = Object.getOwnPropertyDescriptor( src, key );
        if( !descriptor ) continue;
        defineProperty( dest, key, descriptor );
    }
    return dest;
}

function convertPackage( str, pkg ) {
    return str.replace( 
        /(^|[^$_\w\d.])\$package\b(?=(?:[^'"]*['"][^'"]*['"])*[^'"]*$)/g,
        '$1 J.find("' + pkg.$path().join( '.' ).replace( /(\$)/g, '$$$$' ) + '")'
    );
}

function strConvert( str, key, variable ) {
    return str.replace(
        new RegExp( 
            '(^|[^$_\\w\\d.])' + 
            escapeReg( key ) + 
            '\\b(?=(?:[^\'"]*[\'"][^\'"]*[\'"])*[^\'"]*$)', 'g'
        ),
        '$1' + variable
    );
}

function findMethod( func, view ) {
    for( let method in view ) {
        if( view[ method ] === func ) {
            return func.bind( view );
        }
    }

    if( view.$package ) {
        for( let method in view.$package ) {
            if( view.$package[ method ] === func ) {
                return func.bind( view.$package );
            }
        }
    }
}

function unique( arr ) {
    const result = [];

    for( let item of arr ) {
        if( result.indexOf( item ) < 0 ) {
            result.push( item );
        }
    }

    return result;
}

function addClass( elem, className ) {
    is.array( className ) && ( className = className.join( ' ' ) );

    const result = elem.className + ' ' + className;
    const arr = result.split( /\s+/ );
    elem.className = unique( arr ).join( ' ' );
    return elem;
}

function removeClass( elem, className ) {

    is.array( className ) || ( className = className.split( /\s+/ ) );
    const exists = elem.className.split( /\s+/ );

    for( let i = 0, l = exists.length; i < l; i += 1 ) {
        if( className.indexOf( exists[ i ] ) > -1 ) {
            exists.splice( i--, 1 );
        }
    }

    elem.className = exists.join( ' ' );

    return elem;
}

export { 
    interpolation, expression, 
    traverseNode, removeNode,
    createAnchor, replaceNode, wrapNode, cloneNode,
    addClass, removeClass,
    copyDescripter, convertPackage, strConvert, findMethod, wrapFilter
};
