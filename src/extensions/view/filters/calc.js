export const numberFormat = ( n, f = 2 ) => n.toFixed( f );
export const sum = arr => arr.reduce( ( a, b ) => a + b, 0 );

export const add = ( n, ...addends ) => {
    let res = +n;
    for( let i = 0, l = addends.length; i < l; i += 1 ) {
        const addend = addends[ i ];
        res += Array.isArray( addend ) ?sum( addend ) : +addend;
    }
    return res;
};
