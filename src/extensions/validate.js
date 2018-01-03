import { checks } from '../core/utils';
import { isArray } from '../variables';

const emailReg = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const urlReg = /^(?:(?:https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/i;

export default {
    required : ( value ) => isArray( value ) ? !!value.length : ( value === 0 || !!value ),
    email : email => emailReg.test( email ),
    phone : num => { return /^\d{1,14}$/.test( num ) },
    url : text => urlReg.test( text ),
    numeric : n => !isNaN( parseFloat( n ) ) && isFinite( n ),
    int : n => !isNaN( n ) && parseInt( Number( n ) ) == n && !isNaN( parseInt( n, 10 ) ),
    min : ( value, min ) => value >= min,
    max : ( value, max ) => value <= max,
    minlength : ( value, min ) => value && value.length >= min,
    maxlength : ( value, max ) => !value || !value.length || value.length <= max,
    minlengthIfNotEmpty: ( value, min ) => !value || !value.length || value.length >= min,
    pattern : ( value, reg ) => ( checks.regexp( reg ) ? reg : new RegExp( reg ) ).test( value ),
    in : ( value, haystack ) => haystack.indexOf( value ) > -1,
    date( str ) {
        if( !str ) return false;
        const match = str.match( /^(\d+)-(\d{1,2})-(\d{1,2})$/ );
        if( !match ) return false;
        const y = +match[ 1 ];
        const m = +match[ 2 ];
        const d = +match[ 3 ];
        if( !( y && m && d ) ) return false;
        if( m > 12 || d > 31 ) return false;
        if( [ 4, 6, 9, 11 ].indexOf( m ) > -1 && d > 30 ) return false;
        if( m === 2 ) {
            if( d > 29 ) return false;
            if( y % 4 && d > 28 ) return false;
        }
        return true;
    },
    minDate() {
    },
    maxDate() {
    },
    time() {
    },
    minTime() {
    },
    maxTime() {
    }
};