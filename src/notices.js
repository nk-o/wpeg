const chalk = require( 'chalk' );
const strftime = require( 'strftime' );

function run( ...args ) {
    // find non-empty args
    const resultArgs = args.filter( ( val ) => !! val );

    // eslint-disable-next-line
    console.log(
        `[${ chalk.gray( strftime( '%H:%M:%S' ) ) }]`,
        ...resultArgs
    );
}

module.exports = {
    log( prefix, text, more, namespace ) {
        run(
            chalk.cyan( `${ prefix }: ` ),
            namespace ? chalk.magenta( `[${ namespace }] ` ) : '',
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
