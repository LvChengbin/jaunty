export const trim = str => ( str ).toString().trim();
export const cut = ( str, len, ext = '...' ) => str.substr( 0, len ) + ext;
export const uppercase =  str => str.toString().toUpperCase();
export const lowercase =  str => str.toString().toLowerCase();
export const ucfirst = str => str.charAt( 0 ).toUpperCase() + str.slice( 1 );
