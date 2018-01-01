const css = require( 'css' );

const obj = css.parse( `
    @import "index.css";
    :root {
        background : red;
        --custom-property : fuck;
    }

	@keyframes xxx {
        0%, 80%, 100% {
            --webkit-transform : scale(0);
            transform : scale(0);
			x : var( --custom-property );
        }
        40% {
            --webkit-transform : scale(1);
            transform : scale(1);
        }
    }


` );

console.log( JSON.stringify( obj, undefined, '\t' ) );
