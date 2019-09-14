const chalk = require( 'chalk' );
const strftime = require( 'strftime' );

function run() {
    // eslint-disable-next-line
    console.log(
        `[${ chalk.gray( strftime( '%H:%M:%S' ) ) }]`,
        ...arguments
    );
}

module.exports = {
    log( prefix, text, more ) {
        run(
            chalk.cyan( `${ prefix }: ` ),
            text ? chalk.blue( text ) : '',
            more ? chalk.cyan( more ) : ''
        );
    },
    notice( text ) {
        run(
            chalk.cyan( 'Notice: ' ),
            chalk.blue( text )
        );
    },
    error( text ) {
        run(
            chalk.cyan( 'Error: ' ),
            chalk.red( text )
        );
    },
};
