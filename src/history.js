import ec from './eventcenter';

window.addEventListener( 'popstate', e => {
    ec.$emit( 'routechange', e );
} );

const pushState = ( state, title, url ) => {
    window.history.pushState( state, title, url );
    ec.$emit( 'routechange', state );
};

const replaceState = ( state, title, url ) => {
    window.history( state, title, url );
    ec.$emit( 'routechange', state );
};

export { pushState, replaceState };
