import { getKeys, isArray } from '../variables';

const cookie = {

    set(key, value, options = {} ) {

        // @todo to do a testing about if IE9/10 support max-age property in a cookie

        document.cookie = encodeURIComponent( key ) + "=" + encodeURIComponent( value )
            + ( options.path ? '; path=' + options.path : '' )
            + ( options.maxAge ? '; max-age=' + options.maxAge : '' )
            + ( options.domain ? '; domain=' + options.domain : '' )
            + ( options.secure ? '; secure' : '' );

        return this; // Return the `cookie` object to make chaining possible.
    },

    remove( keys ) {
        keys = isArray( keys ) ? keys : [ keys ];

        for (var i = 0, l = keys.length; i < l; i++) {
            this.set(keys[i], '', -1);
        }

        return this; // Return the `cookie` object to make chaining possible.
    },

    empty() {
        return this.remove( getKeys( this.all() ));
    },

    get(key ) {
        return this.all()[ key ];
    },

    all() {
        if (document.cookie === '') return {};

        var cookies = document.cookie.split('; '),
            result = {};

        for (var i = 0, l = cookies.length; i < l; i++) {
            var item = cookies[i].split('=');
            var key = decodeURIComponent(item.shift());
            var value = decodeURIComponent(item.join('='));
            result[key] = value;
        }

        return result;
    },

    enabled() {
        if (navigator.cookieEnabled) return true;
        const ret = cookie.set('_', '_').get('_') === '_';
        cookie.remove('_');
        return ret;
    }
};

export default cookie;
