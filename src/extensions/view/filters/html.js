import { encodeHTML } from '../../../core/utils';
export const escape = str => encodeHTML( str );
export const highlight = ( str, query, classname = '', escape = true ) => {
    if( escape ) str = encodeHTML( str );
    if( !query || !query.length ) return str;
    const reg = new RegExp( '(' + query.join( '|' ) + ')', 'ig' );
    return str.replace( reg, '<em class="' + ( classname || '' ) + '">$1</em>' );
};
