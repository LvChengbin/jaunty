import { uniqueId } from '../core/utils';
import Promise from '../core/promise';

const listeners = {};

class Message {
    construct( data ) {
        this.subject = data.$$__subject;
        this.id = data.$$__id;
    }

    reply( data ) {
        postMessage( data );
    }
}

window.addEventListener( 'message', function( e ) {
    const message = new Message( e.data );
    const args = [].splice.apply( arguments );
} );

/**
 * to get the content window with a window object/selector/iframe
 */
const getContentWindow =  obj => {
    /**
     * if obj is an object of window, return the obj directly
     * eg. top, parent, window
     */
    if( '[object global]' === ({}).toString.call( obj ) || obj.toString() === '[object Window]' ) return obj;

    /**
     * if the obj is a css selector, get the first node that matched the selector
     */
    typeof obj === 'string' && ( obj = document.querySelector( obj ) );

    /**
     * if the obj is an iframe, get it's contentWindow
     */
    return obj.nodeName && obj.nodeName === 'IFRAME' ? obj.contentWindow : null;
};

/**
 * @function postMessage do communication between frames with window.postMessage
 * @param Mixed 接收message的对象，可以为iframe element 或 window，或选择器
 * @param Object message对象，必须为对象，且需要有type值，addMessageListener根据type类进行监听
 * @param Object 其他参数，包含origin，callback等以及后续扩展参数
 */
const postMessage = ( target, message, options = {} ) => {
    const contentWindow = getContentWindow( target );

    if( !contentWindow ) return false;

    const targetOrigin = options.targetOrigin || '*';
    const args = [];
	
    options.transfer && args.push( options.transfer );

    contentWindow.postMessage( message, targetOrigin, ...args );
};

export default {
    post( subject, target, message, options ) {
        message.$$__subject = subject;
        message.$$__id = uniqueId();
        message.$$__promise = new Promise();
        postMessage();

    },
    on( type, handler ) {
        listeners[ type ] || ( listeners[ type ] = [] );
        listeners[ type ].push( handler );
        return this;
    },
    off( type, handler ) {
        if( !listeners[ type ] ) return this;

        for( let i = 0, l = listeners[ type ]; i < l; i += 1 ) {
            listeners[ type ][ i ] === handler && listeners[ type ].splice( i--, 1 );
        }
    }
};
