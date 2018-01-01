import CSS from '../../../../src/core/style/index';
import log from './log';

describe( 'Constructor', () => {
    it( 'Should have thrown an error if the "source" string is empty', () => {
        expect( () => {
            new CSS();
        } ).toThrow( new TypeError( 'The source cannot be empty.' ) );
    } );

    const source = 'body{}';
    const css = new CSS( source );

    it( 'Should has a property named source which should be same as the original CSS string', () => {
        expect( css.source ).toEqual( source );
    } );

    it( 'Should has a property named "rules" as an object', () => {
        expect( typeof css.rules ).toBe( 'object' );
    } );
} );

describe( 'Parser', () => {

    it( 'rules', () => {
        let css, rules, rule;

        css = new CSS( `
            body {
                background : red;
                color : #FFFFFF;
            }
        ` );

        rules = css.rules;
        rule = rules[ 0 ];

        expect( rules.length ).toBe( 1 );
        expect( rule.type ).toBe( 'rule' );
        expect( rule.declarations.length ).toBe( 2 );
        expect( rule.selectors.length ).toBe( 1 );

    } );

    /**
     * Test cases for CSS3 selectors
     * @see https://www.w3.org/TR/css3-selectors/
     */
    describe( 'selector', () => {

        it( '*', () => {
            expect( new CSS( '*{}' ).rules[ 0 ].selectors ).toEqual( [ '*' ] ); 
        } );

        it( 'E', () => {
            expect( new CSS( 'E{}' ).rules[ 0 ].selectors ).toEqual( [ 'E' ] ); 
            expect( new CSS( 'div{}' ).rules[ 0 ].selectors ).toEqual( [ 'div' ] ); 
        } );


        it( 'E[foo]', () => {
            expect( new CSS( 'E[foo]{}' ).rules[ 0 ].selectors ).toEqual( [ 'E[foo]' ] ); 
            expect( new CSS( 'input[disabled]{}' ).rules[ 0 ].selectors ).toEqual( [ 'input[disabled]' ] ); 
        } );

        it( 'E[foo="bar"]', () => {
            expect( new CSS( 'E[foo="bar"]{}' ).rules[ 0 ].selectors ).toEqual( [ 'E[foo="bar"]' ] ); 
            expect( new CSS( 'input[type="password"]{}' ).rules[ 0 ].selectors ).toEqual( [ 'input[type="password"]' ] ); 
        } );
            
        it( 'E[foo~="bar"]', () => {
            expect( new CSS( 'E[foo~="bar"]{}' ).rules[ 0 ].selectors ).toEqual( [ 'E[foo~="bar"]' ] ); 
            expect( new CSS( 'input[data-name~="x"]{}' ).rules[ 0 ].selectors ).toEqual( [ 'input[data-name~="x"]' ] ); 
        } );

        it( 'E[foo^="bar"]', () => {
            expect( new CSS( 'E[foo^="bar"]{}' ).rules[ 0 ].selectors ).toEqual( [ 'E[foo^="bar"]' ] ); 
            expect( new CSS( 'input[data-name^="x"]{}' ).rules[ 0 ].selectors ).toEqual( [ 'input[data-name^="x"]' ] ); 
        } );
        
        it( 'E[foo$="bar"]', () => {
            expect( new CSS( 'E[foo$="bar"]{}' ).rules[ 0 ].selectors ).toEqual( [ 'E[foo$="bar"]' ] ); 
            expect( new CSS( 'input[data-name$="x"]{}' ).rules[ 0 ].selectors ).toEqual( [ 'input[data-name$="x"]' ] ); 
        } );
            
        it( 'E[foo*="bar"]', () => {
            expect( new CSS( 'E[foo*="bar"]{}' ).rules[ 0 ].selectors ).toEqual( [ 'E[foo*="bar"]' ] ); 
            expect( new CSS( 'input[data-name*="x"]{}' ).rules[ 0 ].selectors ).toEqual( [ 'input[data-name*="x"]' ] ); 
        } );

        it( 'E[foo|="en"]', () => {
            expect( new CSS( 'E[foo|="en"]{}' ).rules[ 0 ].selectors ).toEqual( [ 'E[foo|="en"]' ] ); 
            expect( new CSS( 'input[data-name|="x"]{}' ).rules[ 0 ].selectors ).toEqual( [ 'input[data-name|="x"]' ] ); 
        } );

        /**
         * for normal pseudo classes
         */
        it( 'E:root', () => {
            expect( new CSS( 'E:root{}' ).rules[ 0 ].selectors ).toEqual( [ 'E:root' ] ); 
            expect( new CSS( 'a:link{}' ).rules[ 0 ].selectors ).toEqual( [ 'a:link' ] ); 
        } );

        /**
         * for pseduo classes with a dash("-")
         */
        it( 'E:first-child', () => {
            expect( new CSS( 'E:first-child{}' ).rules[ 0 ].selectors ).toEqual( [ 'E:first-child' ] ); 
            expect( new CSS( 'li:first-child{}' ).rules[ 0 ].selectors ).toEqual( [ 'li:first-child' ] ); 
        } );


        /**
         * for psedo classes with a paramater
         */
        it( 'E:nth-child(n)', () => {
            expect( new CSS( 'E:nth-child(n){}' ).rules[ 0 ].selectors ).toEqual( [ 'E:nth-child(n)' ] ); 
            expect( new CSS( 'li:nth-child(2n+1){}' ).rules[ 0 ].selectors ).toEqual( [ 'li:nth-child(2n+1)' ] ); 
        } );

        /**
         * for normal psedo element
         */
        it( 'E::first-line', () => {
            expect( new CSS( 'E::first-line{}' ).rules[ 0 ].selectors ).toEqual( [ 'E::first-line' ] ); 
        } );

        it( '.warning', () => {
            expect( new CSS( '.warning{}' ).rules[ 0 ].selectors ).toEqual( [ '.warning' ] ); 
        } );

        it( '#myid', () => {
            expect( new CSS( '#myid{}' ).rules[ 0 ].selectors ).toEqual( [ '#myid' ] ); 
        } );

        it( ':not(s)', () => {
            expect( new CSS( ':not(s){}' ).rules[ 0 ].selectors ).toEqual( [ ':not(s)' ] ); 
            expect( new CSS( ':not(div){}' ).rules[ 0 ].selectors ).toEqual( [ ':not(div)' ] ); 
            expect( new CSS( ':not(#id){}' ).rules[ 0 ].selectors ).toEqual( [ ':not(#id)' ] ); 
            expect( new CSS( ':not(.class){}' ).rules[ 0 ].selectors ).toEqual( [ ':not(.class)' ] ); 
            expect( new CSS( ':not([attr]){}' ).rules[ 0 ].selectors ).toEqual( [ ':not([attr])' ] ); 
            expect( new CSS( ':not(::--webkit-xx-x){}' ).rules[ 0 ].selectors ).toEqual( [ ':not(::--webkit-xx-x)' ] ); 
        } );


        it( 'E F', () => {
            expect( new CSS( 'E F{}' ).rules[ 0 ].selectors ).toEqual( [ 'E F' ] ); 
            expect( new CSS( 'body div{}' ).rules[ 0 ].selectors ).toEqual( [ 'body div' ] ); 
        } );

        it( 'E > F', () => {
            expect( new CSS( 'E > F{}' ).rules[ 0 ].selectors ).toEqual( [ 'E > F' ] ); 
            expect( new CSS( 'body > div{}' ).rules[ 0 ].selectors ).toEqual( [ 'body > div' ] ); 
        } );

        it( 'E + F', () => {
            expect( new CSS( 'E + F{}' ).rules[ 0 ].selectors ).toEqual( [ 'E + F' ] ); 
            expect( new CSS( 'body + div{}' ).rules[ 0 ].selectors ).toEqual( [ 'body + div' ] ); 
        } );

        it( 'E ~ F', () => {
            expect( new CSS( 'E ~ F{}' ).rules[ 0 ].selectors ).toEqual( [ 'E ~ F' ] ); 
            expect( new CSS( 'body ~ div{}' ).rules[ 0 ].selectors ).toEqual( [ 'body ~ div' ] ); 
        } );

        it( 'body > header div#id.class + nav ~ a:link:nth-child( 2n-1 ):not( .ignore ) b[attr="abc"]', () => {
            expect( new CSS( 'body > header div#id.class + nav ~ a:link:nth-child( 2n-1 ):not( .ignore ) b[attr="abc"]{}' ).rules[ 0 ].selectors ).toEqual( [ 'body > header div#id.class + nav ~ a:link:nth-child( 2n-1 ):not( .ignore ) b[attr="abc"]' ] ); 
        } );

    } );

    describe( 'comment', () => {

        it( 'single line comment between "/* */"', () => {
            const css = new CSS( '/* this is a comment */' );
            const rule = css.rules[ 0 ];
            expect( rule.type ).toBe( 'comment' );
            expect( rule.comment ).toBe( ' this is a comment ' );
        } );

        it( 'single line comment between "/* */"', () => {
            const css = new CSS( [
                '/**',
                ' * this is a comment',
                ' */'
            ].join( '\n' ) );
            const rule = css.rules[ 0 ];
            expect( rule.type ).toBe( 'comment' );
            expect( rule.comment ).toBe( [
                '*',
                ' * this is a comment',
                ' '
            ].join( '\n' ) );
        } );
    } );

    describe( 'at-rules', () => {

        it( '@charset', () => {
            let css, rule;

            css = new CSS( '@charset "utf-8";' );
            rule = css.rules[ 0 ];
            expect( rule.type ).toBe( '@charset' );
            expect( rule.charset ).toBe( '"utf-8"' );

            css = new CSS( '@charset \'utf-8\';' );
            rule = css.rules[ 0 ];
            expect( rule.type ).toBe( '@charset' );
            expect( rule.charset ).toBe( '\'utf-8\'' );
        } );

        it( '@import stylesheet with a relative path', () => {
            const css = new CSS( '@import "./extra.css";' );
            const rule = css.rules[ 0 ];
            expect( rule.type ).toBe( '@import' );
            expect( rule.import ).toBe( '"./extra.css"' );
        } );

        it( '@import stylesheet with a URL', () => {
            const css = new CSS( '@import "https://www.topions.com/another.css";' );
            const rule = css.rules[ 0 ];
            expect( rule.type ).toBe( '@import' );
            expect( rule.import ).toBe( '"https://www.topions.com/another.css"' );
        } );

        it( '@namespace', () => {
            let css, rule;
            css = new CSS( '@namespace url(http://www.w3.org/1999/xhtml);' );
            rule = css.rules[ 0 ];
            expect( rule.type ).toBe( '@namespace' );
            expect( rule.namespace ).toBe( 'url(http://www.w3.org/1999/xhtml)' ); 

            css = new CSS( '@namespace svg url(http://www.w3.org/2000/svg);' );
            rule = css.rules[ 0 ];
            expect( rule.type ).toBe( '@namespace' );
            expect( rule.namespace ).toBe( 'svg url(http://www.w3.org/2000/svg)' ); 

            css = new CSS( '@namespace "XML-namespace-URL";' );
            rule = css.rules[ 0 ];
            expect( rule.type ).toBe( '@namespace' );
            expect( rule.namespace ).toBe( '"XML-namespace-URL"' ); 
        } );

        it( '@media in a single line', () => {
            const css = new CSS( '@media screen and (min-width: 900px) { body { width : 100%; } }' );
            const rule = css.rules[ 0 ];
            expect( rule.type ).toBe( '@media' );
            expect( rule.media ).toBe( 'screen and (min-width: 900px)' );
        } );

        it( '@media in multiple lines', () => {

            const css = new CSS( `
                @media screen and (min-width: 900px) {
                    article {
                        padding: 1rem 3rem;
                    }
                }
            ` );

            const rule = css.rules[ 0 ];
            expect( rule.type ).toBe( '@media' );
            expect( rule.media ).toBe( 'screen and (min-width: 900px)' );
        } );

        it( '@media with multiple complex conditions', () => {

            const css = new CSS( [
                '@media only screen ',
                'and (min-device-width: 320px) ',
                'and (max-device-width: 480px) ',
                'and (resolution: 150dpi) {',
                'body { line-height: 1.4; }',
                '}'
            ].join( '\n' ) );

            const rule = css.rules[ 0 ];
            expect( rule.type ).toBe( '@media' );
            expect( rule.media ).toBe( [
                'only screen ',
                'and (min-device-width: 320px) ',
                'and (max-device-width: 480px) ',
                'and (resolution: 150dpi)'
            ].join( '\n' ) );
        } );

        it( 'rules inside @media', () => {
            const css = new CSS( `
                @media screen and (min-width: 900px) {
                    body {
                        background : indigo;
                    }
                    .article {
                        padding: 1rem 3rem;
                    }
                }
            ` );

            let rules = css.rules[ 0 ].rules;

            expect( rules.length ).toBe( 2 );

            let rule = rules[ 0 ];
            expect( rule.type ).toBe( 'rule' );
            expect( rule.selectors ).toEqual( [ 'body' ] );
            expect( rule.declarations.length ).toBe( 1 );
            expect( rule.declarations[ 0 ] ).toEqual( {
                type : 'declaration',
                property : 'background',
                value : 'indigo'
            } );

            rule = rules[ 1 ];
            expect( rule.type ).toBe( 'rule' );
            expect( rule.selectors ).toEqual( [ '.article' ] );
            expect( rule.declarations.length ).toBe( 1 );
            expect( rule.declarations[ 0 ] ).toEqual( {
                type : 'declaration',
                property : 'padding',
                value : '1rem 3rem'
            } );
            
        } );

        it( '@supports', () => {
            const css = new CSS( `
                @supports (display: flex) {
                    div {
                        display: flex;
                    }
                }
            ` );

            const rule = css.rules[ 0 ];
            expect( rule.type ).toBe( '@supports' );
            expect( rule.supports ).toBe( '(display: flex)' );
        } );

        it( '@supports with not condition', () => {

            let css, rule;
            
            css = new CSS( `
                @supports not (display: flex) {
                    div {
                        float: right;
                    }
                }
            ` );

            rule = css.rules[ 0 ];

            expect( rule.type ).toBe( '@supports' );
            expect( rule.supports ).toBe( 'not (display: flex)' );

            css = new CSS( `
                @supports not ( not ( transform-origin: 2px ) ) {
                    :root, div {
                        position : absolute;  
                    }
                }
            ` );

            rule = css.rules[ 0 ];

            expect( rule.type ).toBe( '@supports' );
            expect( rule.supports ).toBe( 'not ( not ( transform-origin: 2px ) )' );

            css = new CSS( `
                @supports (display: flexbox) and (not (display: inline-grid)) {
                    div > p > a:link {
                        color : rgba( 255, 255, 244, .3 );
                    }
                }
            ` );

            rule = css.rules[ 0 ];

            expect( rule.type ).toBe( '@supports' );
            expect( rule.supports ).toBe( '(display: flexbox) and (not (display: inline-grid))' );

            css = new CSS( `
                @supports (display: table-cell) and (display: list-item) and (display:run-in) {
                    * {
                        margin : 0;
                        padding : 0;
                    }
                }
            ` );

            rule = css.rules[ 0 ];

            expect( rule.type ).toBe( '@supports' );
            expect( rule.supports ).toBe( '(display: table-cell) and (display: list-item) and (display:run-in)' );

            css = new CSS( `
                @supports (transform-style: preserve) or (-moz-transform-style: preserve) {
                    body {
                        font: italic bold 12px/30px Georgia, serif;
                    }
                }
            ` );

            rule = css.rules[ 0 ];

            expect( rule.type ).toBe( '@supports' );
            expect( rule.supports ).toBe( '(transform-style: preserve) or (-moz-transform-style: preserve)' );

        } );

        it( 'rules inside @supports', () => {
            const css = new CSS( `
                @supports (transform-style: preserve) or (-moz-transform-style: preserve) {
                    :root {
                        --var-brand-color : rgba( 0, 0, 0, .45 );
                    }
                    body {
                        font: italic bold 12px/30px Georgia, serif;
                    }
                }
            ` );

            const rule = css.rules[ 0 ];

            expect( rule.type ).toBe( '@supports' );
            expect( rule.supports ).toBe( '(transform-style: preserve) or (-moz-transform-style: preserve)' );
            expect( rule.rules.length ).toBe( 2 );
            expect( rule.rules[ 0 ].type ).toBe( 'rule' );
            expect( rule.rules[ 0 ].selectors ).toEqual( [ ':root' ] );
            expect( rule.rules[ 0 ].declarations[ 0 ].name ).toBe( '--var-brand-color' );
            expect( rule.rules[ 0 ].declarations[ 0 ].value ).toBe( 'rgba( 0, 0, 0, .45 )' );

            expect( rule.rules[ 1 ].type ).toBe( 'rule' );
            expect( rule.rules[ 1 ].selectors ).toEqual( [ 'body' ] );
            expect( rule.rules[ 1 ].declarations[ 0 ].property ).toBe( 'font' );
            expect( rule.rules[ 1 ].declarations[ 0 ].value ).toBe( 'italic bold 12px/30px Georgia, serif' );

        } );

        it( '@document rule with an URL', () => {
            const css = new CSS( `
                @document url("https://www.example.com/") {
                    h1 {
                        color: green;
                    }
                }
            ` );

            const rule = css.rules[ 0 ];

            expect( rule.type ).toBe( '@document' );
            expect( rule.document ).toBe( 'url("https://www.example.com/")' );
            expect( rule.vendor ).toBe( '' );
        } );

        it( '@document rule with complex value', () => {
            /* CSS rules here apply to:
             - The page "http://www.w3.org/"
             - Any page whose URL begins with "http://www.w3.org/Style/"
             - Any page whose URL's host is "mozilla.org" or ends with ".mozilla.org"
             - Any page whose URL starts with "https:" */

            /* Make the above-mentioned pages really ugly */
            const css = new CSS( [
                '@document url(http://www.w3.org/),',
                'url-prefix(http://www.w3.org/Style/),',
                'domain(mozilla.org),',
                'regexp("https:.*") {',
                'body {',
                'color: purple;',
                'background: yellow;',
                '}',
                '}'
            ].join( '\n' ) );

            const rule = css.rules[ 0 ];

            expect( rule.type ).toBe( '@document' );
            expect( rule.document ).toBe( [
                'url(http://www.w3.org/),',
                'url-prefix(http://www.w3.org/Style/),',
                'domain(mozilla.org),',
                'regexp("https:.*")',
            ].join( '\n' ) );
        } );

        it( '@document rule with vendor prefix', () => {
            const css = new CSS( '@-webkit-document url("https://www.example.com/") {}' );
            const rule = css.rules[ 0 ];
            expect( rule.type ).toBe( '@document' );
            expect( rule.document ).toBe( 'url("https://www.example.com/")' );
            expect( rule.vendor ).toBe( '-webkit-' );
        } );

        it( 'rules after @document rule', () => {
            const css = new CSS( '@-moz-document url("https://www.example.com/") {body{background:url(./x.png) repeat-x;}}' );
            const rule = css.rules[ 0 ];
            expect( rule.rules[ 0 ].selectors ).toEqual( [ 'body' ] );
            expect( rule.rules[ 0 ].declarations.length ).toBe( 1 );
            expect( rule.rules[ 0 ].declarations[ 0 ].property ).toBe( 'background' );
            expect( rule.rules[ 0 ].declarations[ 0 ].value ).toBe( 'url(./x.png) repeat-x' );
        } );

        it( '@page', () => {
            const css = new CSS( `
                @page { margin: 2cm } /* All margins set to 2cm */
            ` );

            const rule = css.rules[ 0 ];

            expect( rule.type ).toBe( '@page' );
            expect( rule.selectors ).toEqual( [] );
            expect( rule.declarations ).toEqual( [ {
                type : 'declaration',
                property : 'margin',
                value : '2cm'
            } ] );

        } );

        it( '@page rule with pseudo-class', () => {

            const css = new CSS( `
                @page :first {
                    margin-top: 10cm
                }
            ` );

            const rule = css.rules[ 0 ];

            expect( rule.type ).toBe( '@page' );
            expect( rule.selectors ).toEqual( [ ':first' ] );
            expect( rule.declarations ).toEqual( [ {
                type : 'declaration',
                property : 'margin-top',
                value : '10cm'
            } ] );
        } );

        it( '@font-face', () => {
            const css = new CSS( [
                '@font-face {',
                'font-family: "Open Sans";',
                'src: local("HelveticaNeue-Bold"),',
                'url("/fonts/OpenSans-Regular-webfont.woff2") format("woff2"),',
                'url("/fonts/OpenSans-Regular-webfont.woff") format("woff");',
                'font-weight: bold;',
                '}'
            ].join( '\n' ) );

            const rule = css.rules[ 0 ];

            expect( rule.type ).toBe( '@font-face' );
            expect( rule.declarations ).toEqual( [ {
                type : 'declaration',
                property : 'font-family',
                value : '"Open Sans"'
            }, {
                type : 'declaration',
                property : 'src',
                value : [
                    'local("HelveticaNeue-Bold"),',
                    'url("/fonts/OpenSans-Regular-webfont.woff2") format("woff2"),',
                    'url("/fonts/OpenSans-Regular-webfont.woff") format("woff")'
                ].join( '\n' )
            }, {
                type : 'declaration',
                property : 'font-weight',
                value : 'bold'
            } ] );

        } );


        it( '@keyframes rule simple', () => {
            const css = new CSS( `
                @keyframes slidein {
                    from {
                        margin-left: 100%;
                        width: 300%;
                    }
                    to {
                        margin-left: 0%;
                        width: 100%;
                    }
                }
            ` );

            const rule = css.rules[ 0 ];

            expect( rule.type ).toBe( '@keyframes' );
            expect( rule.name ).toBe( 'slidein' );
            expect( rule.keyframes.length ).toBe( 2 );

            const r1 = rule.keyframes[ 0 ];
            expect( r1.type ).toBe( 'keyframe' ); 
            expect( r1.values ).toEqual( [ 'from' ] );
            expect( r1.declarations ).toEqual( [ {
                type : 'declaration',
                property : 'margin-left',
                value : '100%'
            }, {
                type : 'declaration',
                property : 'width',
                value : '300%'
            } ] );

            const r2 = rule.keyframes[ 1 ];
            expect( r2.type ).toBe( 'keyframe' );
            expect( r2.values ).toEqual( [ 'to' ] );
            expect( r2.declarations ).toEqual( [ {
                type : 'declaration',
                property : 'margin-left',
                value : '0%'
            }, {
                type : 'declaration',
                property : 'width',
                value : '100%'
            } ] );

        } );

        it( '@keyframes with percentage frames', () => {

            const css = new CSS( `
                @keyframes identifier {
                    0% { top: 0; left: 0; }
                    30% { top: 50px; }
                    68%, 72% { left: 50px; }
                    100% { top: 100px; left: 100%; }
                }
            ` );

            const rule = css.rules[ 0 ];

            expect( rule.type ).toBe( '@keyframes' );
            expect( rule.name ).toBe( 'identifier' );
            expect( rule.keyframes.length ).toBe( 4 );

            const r1 = rule.keyframes[ 0 ];
            expect( r1.type ).toBe( 'keyframe' ); 
            expect( r1.values ).toEqual( [ '0%' ] );
            expect( r1.declarations ).toEqual( [ {
                type : 'declaration',
                property : 'top',
                value : '0'
            }, {
                type : 'declaration',
                property : 'left',
                value : '0'
            } ] );

            const r2 = rule.keyframes[ 1 ];
            expect( r2.type ).toBe( 'keyframe' );
            expect( r2.values ).toEqual( [ '30%' ] );
            expect( r2.declarations ).toEqual( [ {
                type : 'declaration',
                property : 'top',
                value : '50px'
            } ] );
        } );

        it( '@viewport', () => {
            const css = new CSS( `
                @viewport {
                    max-width: 800px;
                    zoom: 0.75;
                    orientation: landscape;
                }
            ` );

            const rule = css.rules[ 0 ];

            expect( rule.type ).toBe( '@viewport' );
            expect( rule.declarations ).toEqual( [ {
                type : 'declaration',
                property : 'max-width',
                value : '800px'
            }, {
                type : 'declaration',
                property : 'zoom',
                value : '0.75'
            }, {
                type : 'declaration',
                property : 'orientation',
                value : 'landscape'
            } ]);
        } );

        it( '@counter-style', () => {
            const css = new CSS( `
                @counter-style thumbs {
                    system: cyclic;
                    symbols: "\\1F44D";
                    suffix: " ";
                }
            ` );

            const rule = css.rules[ 0 ];

            expect( rule.type ).toBe( '@counter-style' );
            expect( rule.name ).toBe( 'thumbs' );
            expect( rule.declarations ).toEqual( [ {
                type : 'declaration',
                property : 'system',
                value : 'cyclic'
            }, {
                type : 'declaration',
                property : 'symbols',
                value : '"\\1F44D"'
            }, {
                type : 'declaration',
                property : 'suffix',
                value : '" "'
            } ] );
        } );

        it( '@counter-style with mutiple special symbols', () => {

            const css = new CSS( `
                @counter-style circled-alpha {
                    system: fixed;
                    symbols: Ⓐ Ⓑ Ⓒ Ⓓ Ⓔ Ⓕ Ⓖ Ⓗ Ⓘ Ⓙ Ⓚ Ⓛ Ⓜ Ⓝ Ⓞ Ⓟ Ⓠ Ⓡ Ⓢ Ⓣ Ⓤ Ⓥ Ⓦ Ⓧ Ⓨ Ⓩ;
                    suffix: " ";
                }
            ` );

            const rule = css.rules[ 0 ];

            expect( rule.type ).toBe( '@counter-style' );
            expect( rule.name ).toBe( 'circled-alpha' );
            expect( rule.declarations ).toEqual( [ {
                type : 'declaration',
                property : 'system',
                value : 'fixed'
            }, {
                type : 'declaration',
                property : 'symbols',
                value : 'Ⓐ Ⓑ Ⓒ Ⓓ Ⓔ Ⓕ Ⓖ Ⓗ Ⓘ Ⓙ Ⓚ Ⓛ Ⓜ Ⓝ Ⓞ Ⓟ Ⓠ Ⓡ Ⓢ Ⓣ Ⓤ Ⓥ Ⓦ Ⓧ Ⓨ Ⓩ'
            }, {
                type : 'declaration',
                property : 'suffix',
                value : '" "'
            } ] );
        } );
    } );

    describe( 'custom properties(variables)', () => {
        it( 'variables defination in :root', () => {
            const css = new CSS( `
                :root {
                    --j-global-background-color : rgba( 223, 223, 223, .4 );
                    --j-header-content : "J";
                }
            ` );


            const rule = css.rules[ 0 ];

            expect( rule.declarations ).toEqual( [ {
                type : 'variable',
                name : '--j-global-background-color',
                value : 'rgba( 223, 223, 223, .4 )'
            }, {
                type : 'variable',
                name : '--j-header-content',
                value : '"J"'
            } ] );

        } );

        it( 'using variables', () => {
            const css = new CSS( `
                body {
                    background : var( --j-global-background-color );
                    width : calc( var( --width ) + 10px );
                    height : calc( var( --height ) + var( --x-y ) );
                }
                :after {
                    content : "var(--j-global-background-color)";
                }
            ` );

            const rule = css.rules[ 0 ];

            log.string( rule );
        } );

    } );

} );
