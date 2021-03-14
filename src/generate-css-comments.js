/**
 * Generate CSS Comments TOC.
 * @param cont
 * @returns {*}
 */
function generateCSSComments( cont ) {
    const templateStart = '{{table_of_contents}}';
    const isset = cont.indexOf( templateStart );
    if ( -1 < isset ) {
        const rest = cont.substring( isset );
        const reg = /\/\*[ -]-[-]*?\n([\s\S]*?)\n[ -]*?-[ -]\*\//g;
        let titles = reg.exec( rest );
        let i = 1;
        let result = '';
        while ( null !== titles ) {
            if ( titles[ 1 ] ) {
                const isSub = ! /\n/.test( titles[ 1 ] );
                const str = titles[ 1 ].replace( /^\s+|\s+$/g, '' );
                if ( ! isSub ) {
                    result += `\n  ${ i }. `;
                    i += 1;
                } else {
                    result += '\n    - ';
                }
                result += str;
            }
            titles = reg.exec( rest );
        }

        cont = cont.replace( templateStart, result );
    }
    return cont;
}

module.exports = generateCSSComments;
