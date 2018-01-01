import { checks } from '../../../core/utils';
// Time format rules same as the format rules of date function in PHP 
// @see http://php.net/manual/en/function.date.php
//
const get = ( timestamp ) => {
    const date = new Date( timestamp );
    return function( method, func ) {
        method = date[ 'get' + method ];
        if( !method || !checks.function( method ) ) return false;
        const val = method.call( date );
        return func ? func( val ) : val;
    };
};

const formats = {
    // ------- Day
    // A textual representation of a day, 3 characters
    // eg. Mon through Sun
    // support language settings. default language is (en)
    D : [ 'Day', day => {
        return [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ][ day ];
    } ],
    // Day of the month, 2 digits with leading zeros.
    // eg. 08, 09, 11
    d : [ 'Date', date => {
        return date < 10 ? ( '0' + date ) : date;
    } ],
    // Day of the month without leading zeros
    // eg. 8, 9, 11
    j : [ 'Date' ],
    // A full textual representation of the day of the week, Sunday through Saturday.
    // eg. Monday, Sunday
    l : [ 'Day', day => {
        return [ 
            'Sunday', 'Monday', 'Tuesday', 
            'Wednesday', 'Thursday', 'Friday', 'Saturday' 
        ][ day ];
    } ],
    // ISO-8601 numeric representation of the day of the week, 1 through 7
    // 1 for Monday and 7 for Sunday
    // different from "w"
    N : [ 'Day', day => ( day + 1 ) ],
    // Numeric representation of the day of the week. 0 through 6.
    // 0 for Sunday and 6 for Saturday
    // different from "N"
    w : [ 'Day' ],

    // ------------- Month
    // A full textual representation of a Month, such as January or March
    // January through December
    F : [ 'Month', month => {
        return [
            'January', 'February', 'March', 'April',
            'May', 'June', 'July', 'August',
            'September', 'October', 'November', 'December'
        ][ month ];
    } ],
    // A short textual representation of the month, three letters
    // Jan through Dec
    M : [ 'Month', month => {
        return [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ][ month ];
    } ],
    // Numeric representation of the month, with leading zeros.
    // 01 through 12
    m : [ 'Month', month => {
        return month < 9 ? '0' + ( month + 1 ) : ( month + 1 );
    } ],
    // Numeric representation of the month, without leading zeros.
    // 1 through 12
    n : [ 'Month', month => ( month + 1 ) ],

    // -------------- Year
    // A full numeric representation of a year, 4 digits.
    // eg. 1988, 1990
    Y : [ 'FullYear' ],
    // A two digit representation of a year
    // eg. 88, 90
    y : [ 'Year' ],

    // --------------- Time
    // Lowercase Ante Meridiem and Post Meridiem
    // eg. am or pm
    a : [ 'Hours', hour => hour < 12 ? 'am' : 'pm' ],
    // Uppercase Ante Meridiem and Post Meridiem
    // eg. AM or PM
    A : [ 'Hours', hour => hour < 12 ? 'AM' : 'PM' ],
    // 12-hour format of an hour without leading zeros.
    g : [ 'Hours', hour => hour > 12 ? hour % 12 : hour ],
    // 24-hour format of an hour without leading zeros.
    G : [ 'Hours' ],
    // 12-hour format of an hour with leading zeros.
    h : [ 'Hours', hour => {
        hour > 12 && ( hour = hour % 12 );
        return hour < 10 ? '0' + hour : hour;
    } ],
    // 24-hour format of an hour with leading zeros.
    H : [ 'Hours', hour => hour < 10 ? '0' + hour : hour ],
    // Minutes with leading zeros.
    // 00 to 59
    i : [ 'Minutes', minute => minute < 10 ? '0' + minute : minute ],
    // Seconds with leading zeros.
    // 00 to 59
    s : [ 'Seconds', second => second < 10 ? '0' + second : second ],
    // Millseconds
    // eg. 123
    v : [ 'Milliseconds' ]
};

export function time( timestamp, format = 'Y-m-d' ) {
    if( !timestamp ) return null;
    if( timestamp instanceof Date || typeof timestamp === 'number' || /^\d+$/.test( timestamp ) ) {
        const g = get( timestamp );
        return format.replace( /\w/g, m  => {
            if( formats[ m ] ) {
                return g.apply( null, formats[ m ] );
            }
            return m;
        } );
    }
    return +new Date( timestamp );
}
