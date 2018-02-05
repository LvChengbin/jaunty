import is from '@lvchengbin/is';

const requestAnimationFrame = window.requestAnimationFrame || function( fn ){ window.setTimeout( fn, 30 ) }; /*jshint ignore:line*/

function nodePosition( node ) {
    let y = 0;
    let x = 0;
    while( node ) {
        y += node.offsetTop || 0;
        x += node.offsetLeft || 0;
        node = node.offsetParent;
    }
    return { x, y };
}

const easeInOutCubic = t => t < .5 ? 4 * t * t * t : ( t - 1 ) * ( 2 * t - 2 ) * ( 2 * t - 2 ) + 1;

function reposition( start, end, elapsed, duration ) {
    return elapsed > duration ? end : ( start + (end - start) * easeInOutCubic(elapsed / duration) );
}

//function scroll( dest = {}, duration = 500, callback = null, context = window ) {
function scroll( options ) {
    if( options.node ) {
        Object.assign( options, nodePosition( options.node ) );
    }
    let {
        x = 0,
        y = 0,
        offsetX = 0,
        offsetY = 0,
        duration = 500,
        context = window,
        callback
    } = options;

    y = y - offsetY;
    x = x - offsetX;

    const startX = context.scrollLeft || context.pageXOffset;
    const startY = context.scrollTop || context.pageYOffset;

    const time = Date.now();

    const step = () => {
        const elapsed = Date.now() - time;
        if( context !== window ) {
            context.scrollLeft = reposition( startX, x, elapsed, duration );
            context.scrollTop = reposition( startY, y, elapsed, duration ); 
        } else {
            window.scrollTo(
                reposition( startX, x, elapsed, duration ),
                reposition( startY, y, elapsed, duration )
            );
        }

        if( elapsed > duration ) {
            is.function( callback ) && callback();
        } else {
            requestAnimationFrame( step );
        }
    };

    step();
}

export {
    requestAnimationFrame, nodePosition, scroll
};
