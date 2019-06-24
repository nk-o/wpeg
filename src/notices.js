import chalk from 'chalk';
import strftime from 'strftime';

function run() {
    // eslint-disable-next-line
    console.log(
        `[${ chalk.gray( strftime( '%H:%M:%S' ) ) }]`,
        ...arguments
    );
}

export function log( prefix, text, more ) {
    run(
        chalk.cyan( `${ prefix }: ` ),
        text ? chalk.blue( text ) : '',
        more ? chalk.cyan( more ) : ''
    );
}

export function notice( text ) {
    run(
        chalk.cyan( 'Notice: ' ),
        chalk.blue( text )
    );
}

export function error( text ) {
    run(
        chalk.cyan( 'Error: ' ),
        chalk.red( text )
    );
}
