const chalk = require( 'chalk' );
const strftime = require( 'strftime' );

function time() {
    return `[${ chalk.gray( strftime( '%H:%M:%S' ) ) }]`;
}

function run( text, showTime = true ) {
    // eslint-disable-next-line
    console.log(
        showTime ? time() : '',
        text
    );
}

module.exports = {
    time,
    log( text, showTime = true ) {
        run( text, showTime );
    },
    error( text ) {
        run( chalk.cyan( 'Error: ' ) + chalk.red( text ) );
    },
};
