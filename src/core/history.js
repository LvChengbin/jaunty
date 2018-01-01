import ec from './ec';

window.addEventListener( 'popstate', e => {
    ec.$trigger( 'routechange', e );
} );

const pushState = ( state, title, url ) => {
    window.history.pushState( state, title, url );
    ec.$trigger( 'routechange', state );
};

const replaceState = ( state, title, url ) => {
    window.history( state, title, url );
    ec.$trigger( 'routechange', state );
};

export { pushState, replaceState };
