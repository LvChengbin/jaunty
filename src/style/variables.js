const FUNC_IDENTIFIER = 'var';

function singleQuote() {

}

function doubleQuotes() {

}

function variable() {

}



function parser( value ) {
    if( value.indexOf( FUNC_IDENTIFIER ) < 0 ) {
        return value;
    }
     
}

export default parser;
