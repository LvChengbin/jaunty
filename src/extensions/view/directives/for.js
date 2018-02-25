import Observer from '@lvchengbin/observer';

import { Record } from '../../utils';
import { traverse as compile } from '../compile';
import { subscope } from '../../observer';
import { interpolation, createAnchor, wrapNode, replaceNode, cloneNode, removeNode } from '../utils';
import { getKeys, defineProperty, assign, slice, isArray } from '../../../variables';

const directiveCache = {};

function forIn( view, obj, func, anchor, key, value, index ) {
    const frag = document.createDocumentFragment();
    const node = anchor.$node;
    const anchorItems = anchor.$items;
    const ob = obj.__ob;
    const keys = getKeys( obj );
    for( let i = 0, l = keys.length; i < l; i += 1 ) {
        const attr = keys[ i ];
        const item = cloneNode( node );
        anchorItems[ ob[ attr ] ] = item;
        frag.appendChild( item );
        const v = {};
        value && ( v[ value ] = {
            data : func,
            path : attr,
            __var : true 
        } );
        index && ( v[ index ] = i );
        const nscope = Observer.create( v, node.$scope );
        key && defineProperty( nscope, key, {
            enumerable : true,
            writable : true,
            value : attr
        } );
        wrapNode( item, nscope, node.options, true );
        item.$index = i;
        item.$forAnchor = anchor;
    }
    compile( slice.call( frag.childNodes ), view );
    return frag;
}

function updateForIn( view, obj, func, anchor, key, value, index ) {
    const node = anchor.$node;
    const anchorItems = anchor.$items;
    const ob = obj.__ob;
    const scope = anchor.$scope;
    const options = anchor.$options;
    const keys = getKeys( obj );
    const newItems = assign( {}, anchorItems );
    const parentNode = anchor.parentNode;
    const style = parentNode.style;
    let visibility;
    if( style ) {
        visibility = style.visibility;
        style.visibility = 'hidden';
    }
    let sibling = anchor.nextSibling;

    const forItemKeys = getKeys( anchorItems );
    for( let i = 0, l = forItemKeys.length; i < l; i = i + 1 ) {
        delete anchorItems[ forItemKeys[ i ] ];
    }

    for( let i = 0, l = keys.length; i < l; i += 1 ) {
        const attr = keys[ i ];
        const path = ob[ attr ];
        const item = newItems[ path ];
        if( item ) {
            if( i !== item.$index ) {
                parentNode.insertBefore( item, sibling );
                item.$index = i;
                index && ( item.$scope[ index ] = i );
            }
            anchorItems[ path ] = item;
            delete newItems[ path ];
        } else {
            const nNode = node.cloneNode( true );
            const v = {};
            value && ( v[ value ] = {
                data : func,
                path : attr,
                __var : true 
            } );
            index && ( v[ index ] = i );
            const nscope = Observer.create( v, scope );
            key && defineProperty( nscope, key, {
                enumerable : true,
                writable : true,
                value : attr
            } );
            anchorItems[ path ] = nNode;
            wrapNode( nNode, nscope, options, true );
            nNode.$index = i;
            nNode.$forAnchor = anchor;
            parentNode.insertBefore( nNode, sibling );
            compile( [ nNode ], view );
        }
        sibling.$forEnd || ( sibling = sibling.nextSibling );
    }
    const ks = getKeys( newItems );
    for( let i = 0, l = ks.length; i < l; i = i + 1 ) {
        removeNode( newItems[ ks[ i ] ], parentNode );
    }
    style && ( style.visibility = visibility );
    if( node.tagName === 'OPTION' ) {
        parentNode.$$model && parentNode.onchange();
    }
}

function updateForOf( view, list, func, anchor, endAnchor, value, index ) {
    const parentNode = anchor.parentNode;
    const style = parentNode.style;
    let visibility;
    if( style ) { 
        visibility = style.visibility;
        style.visibility = 'hidden!important';
    }

    const frag = forOfNodes( view, list, func, anchor, value, index );
    parentNode.insertBefore( frag, endAnchor );

    style && ( style.visibility = visibility );
    if( anchor.$node.tagName === 'OPTION' ) {
        parentNode.$$model && parentNode.onchange();
    }
}
function forOfNodes( view, list, func, anchor, value, index ) {
    const frag = document.createDocumentFragment();
    const node = anchor.$node;
    const items = anchor.$items;
    const anchorItems = anchor.$items = {};
    const options = anchor.$options;
    const scope = anchor.$scope;
    if( list === null ) list = [];
    if( isArray( list ) ) {
        const subs = ( list && list.__ob ) ? list.__ob.__subs : null;
        for( let i = 0, l = list.length; i < l; i = i + 1 ) {
            const id = subs ? subs[ i ] : i;
            if( items[ id ] ) {
                const item = frag.appendChild( items[ id ] );
                const scope = item.$scope;
                subscope( scope, value, {
                    data : func,
                    path : i,
                    arr : true,
                    __var : true
                } );
                index && ( scope[ index ] = i );
                anchorItems[ id ] = item;
                delete items[ id ];
            } else {
                const item = cloneNode( node );
                anchorItems[ id ] = item;
                frag.appendChild( item );
                const v = {};
                value && ( v[ value ] = {
                    data : func,
                    path : i,
                    arr : true,
                    __var : true
                } );
                index && ( v[ index ] = i );
                item.$forAnchor = anchor;
                wrapNode( item, Observer.create( v, scope ), options, true );
                compile( [ item ], view );
            }
        }

        for( let id in items ) {
            removeNode( items[ id ] );
        }
    }

    return frag;
}

function forOf() {
    return forOfNodes( ...arguments );
}

export default {
    compile( directive, node, view ) {
        let descriptor, f, frag, func;
        const value = directive.value;
        const parentNode = node.parentNode;
        node.removeAttribute( directive.name ); 
        let m = directiveCache[ value ];
        if( !m ) {
            m = value.match( /(?:(.*?)(?:,\s*(.*?))?(?:,\s*(.*?))?)\s+(of|in)\s+(.*)/ );
            directiveCache[ value ] = m;
        }
        const options = node.$options;
        const scope = node.$scope;
        const startAnchor = createAnchor( '', scope, options );
        startAnchor.$forStart = true;
        startAnchor.$node = node;
        //startAnchor.$$$hasIf = node.$$if;
        parentNode.insertBefore( startAnchor, node ); 
        const endAnchor = startAnchor.cloneNode( false ); 
        endAnchor.$forEnd = true;
        parentNode.insertBefore( endAnchor, node.nextSibling );
        startAnchor.$items = {};
        if( /^\d+$/.test( value.trim() ) ) {
            console.log( '' );
        } else {
            let obj, range, list;
            switch( m[ 4 ] ) {
                case 'in' :
                    descriptor = m[ 5 ];
                    f = interpolation( descriptor );
                    func = f.bind( null, scope );
                    if( !options.once ) {
                        Record.start( startAnchor, startAnchor.$eventMarks, function() {
                            updateForIn( view, f( scope ), func, startAnchor, m[ 1 ], m[ 2 ], m[ 3 ]);
                        } );
                    }
                    obj = f( scope );
                    Record.reset();
                    if( !obj ) {
                        throw new TypeError( '[ J.ERROR ]' + descriptor + ' is ' + obj );
                    }
                    frag = forIn( view, obj, func, startAnchor, m[ 1 ], m[ 2 ], m[ 3 ]);
                    break;
                case 'of':
                    descriptor = m[ 5 ];
                    range = descriptor.match( /(.*)\.{3}(.*)/ );
                    if( range ) {
                        const min = interpolation( range[ 1 ] );
                        const max = interpolation( range[ 2 ] );
                        f = ( s ) => {
                            const arr = [];
                            for( let i = min( s ), l = max( s ); i <= l; i += 1 ) {
                                arr.push( i );
                            }
                            return arr;
                        };
                    } else {
                        f = interpolation( descriptor );
                    }
                    func = f.bind( null, scope );

                    if( !options.once ) {
                        Record.start( startAnchor, startAnchor.$eventMarks, function() {
                            updateForOf( view, f( scope ), func, startAnchor, endAnchor, m[ 1 ], m[ 2 ] );
                        } );
                    }
                    list = f( scope );
                    Record.reset();
                    if( !list ) {
                        throw new TypeError( '[ J.ERROR ]' + descriptor + ' is ' + list );
                    }
                    frag = forOf( view, list, func, startAnchor, m[ 1 ], m[ 2 ] );
                    break;
                default :
                    break;
            }
        }
        replaceNode( frag, node, parentNode, true );
        options.removed = true;
        if( startAnchor.$node.tagName === 'OPTION' ) {
            const select = startAnchor.parentNode;
            select.$$model && select.onchange();
        }
    }
};
