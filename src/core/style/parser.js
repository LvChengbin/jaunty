
// http://www.w3.org/TR/CSS21/grammar.html
// https://github.com/visionmedia/css-parse/pull/49#issuecomment-30088027
var commentre = /\/\*[^*]*\*+([^/*][^*]*\*+)*\//g;

function parser( css ) {

    function error(msg) {
        console.warn( msg );
    }

    /**
     * Opening brace.
     */

    function open() {
        return match(/^{\s*/);
    }

    /**
     * Closing brace.
     */

    function close() {
        return match(/^}/);
    }

    /**
     * Parse ruleset.
     */

    function rules() {
        var node;
        var rules = [];
        whitespace();
        comments(rules);
        while (css.length && css.charAt(0) != '}' && (node = atrule() || rule())) {
            if (node !== false) {
                rules.push(node);
                comments(rules);
            }
        }
        return rules;
    }

    /**
     * Match `re` and return captures.
     */

    function match(re) {
        var m = re.exec(css);
        if (!m) return;
        var str = m[0];
        css = css.slice(str.length).trim();
        return m;
    }

    /**
     * Parse whitespace.
     */

    function whitespace() {
        match(/^\s*/);
    }

    /**
     * Parse comments;
     * @see http://blog.ostermiller.org/find-comment
     */

    function comments(rules) {
        var c;
        rules = rules || [];
        while ( ( c = comment() ) ) {
            if (c !== false) {
                rules.push(c);
            }
        }
        return rules;
    }

    /**
     * Parse comment.
     */

    function comment() {
        if ('/' != css.charAt(0) || '*' != css.charAt(1)) return;

        var i = 2;
        while ("" != css.charAt(i) && ('*' != css.charAt(i) || '/' != css.charAt(i + 1))) ++i;
        i += 2;

        if ("" === css.charAt(i-1)) {
            return error('End of comment missing');
        }

        var str = css.slice(2, i - 2);
        css = css.slice(i);

        return {
            type: 'comment',
            comment: str
        };
    }

    /**
     * Parse selectors.
	 * you can see all type of selectors that defiened in CSS3 spec 
     * https://www.w3.org/TR/css3-selectors/
     */

    function selector() {
        var m = match(/^([^{]+)/);
        if (!m) return;
        /* @fix Remove all comments from selectors
         * http://ostermiller.org/findcomment.html */
        return m[ 0 ].trim().replace(/\/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*\/+/g, '')
            .replace(/"(?:\\"|[^"])*"|'(?:\\'|[^'])*'/g, function(m) {
                return m.replace(/,/g, '\u200C');
            } )
            .split(/\s*(?![^(]*\)),\s*/)
            .map(function(s) {
                return s.replace(/\u200C/g, ',');
            });
    }

    /**
     * Parse declaration.
     */

    function declaration() {

        // prop
        let prop = match(/^(\*?[-#/*\\\w]+(\[[0-9a-z_-]+\])?)\s*/);

        if( !prop ) return;

        prop = prop[ 0 ].trim().replace( commentre, '' );

        // :
        if( !match( /^:\s*/ ) ) return error( 'property missing ":"' );

        // val
        let value = match( /^((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\([^)]*?\)|[^};])+)/ );

        value = value ? value[ 0 ].trim().replace( commentre, '' ) : '';

        let ret;

        /**
         * to check if this declaration is for defining a css variable.
         */
        if( prop.charAt( 0 ) === '-' && prop.charAt( 1 ) === '-' ) {
            ret = {
                type : 'variable',
                name : prop,
                value
            };
        } else {
            ret = {
                type: 'declaration',
                property: prop,
                value
            };
        }

        // ;
        match( /^[;\s]*/ );

        return ret;
    }

    /**
     * Parse declarations.
     */

    function declarations() {
        var decls = [];

        if (!open()) return error("missing '{'");
        comments(decls);

        // declarations
        var decl;
        while ( ( decl = declaration() ) ) {
            if (decl !== false) {
                decls.push(decl);
                comments(decls);
            }
        }

        if (!close()) return error("missing '}'");
        return decls;
    }

    /**
     * Parse keyframe.
     */

    function keyframe() {
        var m;
        var vals = [];

        while ( ( m = match(/^((\d+\.\d+|\.\d+|\d+)%?|[a-z]+)\s*/) ) ) {
            vals.push(m[1]);
            match(/^,\s*/);
        }

        if (!vals.length) return;

        return {
            type: 'keyframe',
            values: vals,
            declarations: declarations()
        };
    }

    /**
     * Parse keyframes.
     */

    function atkeyframes() {
        var m = match( /^@([-\w]+)?keyframes\s*/ );

        if( !m ) return;
        var vendor = m[ 1 ];

        // identifier
        m = match(/^([-\w]+)\s*/);
        if (!m) return error("@keyframes missing name");
        var name = m[1];

        if (!open()) return error("@keyframes missing '{'");

        var frame;
        var frames = comments();
        while( ( frame = keyframe() ) ) {
            frames.push(frame);
            frames = frames.concat(comments());
        }

        if (!close()) return error("@keyframes missing '}'");

        return {
            type: '@keyframes',
            name: name,
            vendor: vendor,
            keyframes: frames
        };
    }

    /**
     * Parse supports.
     */

    function atsupports() {
        var m = match(/^@supports *([^{]+)/);

        if (!m) return;
        var supports = m[ 1 ].trim();

        if (!open()) return error("@supports missing '{'");

        var style = comments().concat(rules());

        if (!close()) return error("@supports missing '}'");

        return {
            type: '@supports',
            supports: supports,
            rules: style
        };
    }

    /**
     * Parse media.
     */

    function atmedia() {
        var m = match(/^@media *([^{]+)/);

        if (!m) return;
        var media = m[ 1 ].trim();

        if (!open()) return error("@media missing '{'");

        var style = comments().concat(rules());

        if (!close()) return error("@media missing '}'");

        return {
            type: '@media',
            media: media,
            rules: style
        };
    }


    /**
     * Parse paged media.
     */

    function atpage() {
        var m = match(/^@page */);
        if (!m) return;

        var sel = selector() || [];

        if (!open()) return error("@page missing '{'");
        var decls = comments();

        // declarations
        var decl;
        while( ( decl = declaration() ) ) {
            decls.push(decl);
            decls = decls.concat(comments());
        }

        if (!close()) return error("@page missing '}'");

        return {
            type: '@page',
            selectors: sel,
            declarations: decls
        };
    }

    /**
     * Parse document.

	 * format : 
		@document [ <url> | url-prefix(<string>) | domain(<string>) | regexp(<string>) ]# {
			<group-rule-body>
	 	}
	 * for some implementations, there might be a vender prefix before the "document" rule, such as @-moz-document or @-webkit-document
     *
     */


    function atdocument() {
        const m = match(/^@([-\w]+)?document *([^{]+)/);
        if (!m) return;

        const vendor = m[ 1 ] ? m[ 1 ].trim() : '';
        const doc = m[ 2 ].trim();

        if (!open()) return error("@document missing '{'");

        var style = comments().concat(rules());

        if (!close()) return error("@document missing '}'");

        return {
            type: '@document',
            document: doc,
            vendor,
            rules: style
        };
    }

    /**
     * Parse @viewport
     */
    function atviewport() {
        const m = match(/^@viewport\s*/);
        if (!m) return;

        if (!open()) return error("@viewport missing '{'");
        let decls = comments();

        // declarations
        let decl;
        
        while( ( decl = declaration() ) ) {
            decls.push(decl);
            decls = decls.concat(comments());
        }


        if (!close()) return error("@viewport missing '}'");

        return {
            type: '@viewport',
            declarations: decls
        };
    }

    /**
     * Parse @counter-style
     */

    function atcounterstyle() {
        const m = match( /^@counter-style\s+([-\w]+)\s*/ );
        if( !m ) return;

        const name = m[ 1 ];

        if( !name ) {
            return error( '@count-style missing name' );
        }

        if( !open() ) return error( '@counter-style missing "{"' );

        let declarations = comments();

        let decl;

        while( ( decl = declaration() ) ) {
            declarations.push( decl );
            declarations= declarations.concat( comments() );
        }

        if( !close() ) return error( '@counter-style misssing "}"' );

        return {
            type : '@counter-style',
            name,
            declarations
        };
    }

    /**
     * Parse font-face.
     */

    function atfontface() {
        var m = match(/^@font-face\s*/);
        if (!m) return;

        if (!open()) return error("@font-face missing '{'");
        var decls = comments();

        // declarations
        var decl;
        
        while( ( decl = declaration() ) ) {
            decls.push(decl);
            decls = decls.concat(comments());
        }


        if (!close()) return error("@font-face missing '}'");

        return {
            type: '@font-face',
            declarations: decls
        };
    }

    /**
     * Parse import
     */

    var atimport = _compileAtrule('import');

    /**
     * Parse charset
     */

    var atcharset = _compileAtrule('charset');

    /**
     * Parse namespace
     */

    var atnamespace = _compileAtrule('namespace');

    /**
     * Parse non-block at-rules
     */


    function _compileAtrule(name) {
        var re = new RegExp('^@' + name + '\\s*([^;]+);');
        return function() {
            var m = match(re);
            if (!m) return;
            var ret = { type: '@' + name };
            ret[name] = m[1].trim();
            return ret;
        };
    }

    /**
     * Parse at rule.
     */

    function atrule() {
        if (css[0] != '@') return;

        return atkeyframes()
            || atmedia()
            || atsupports()
            || atimport()
            || atcharset()
            || atnamespace()
            || atdocument()
            || atpage()
            || atfontface()
            || atviewport()
            || atcounterstyle();
    }

    /**
     * Parse rule.
     */

    function rule() {
        var sel = selector();

        if (!sel) return error('selector missing');
        comments();

        return {
            type: 'rule',
            selectors: sel,
            declarations: declarations()
        };
    }

    return rules();
}

export default parser;
