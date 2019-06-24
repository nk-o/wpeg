import meow from 'meow';

import { getWPEGConfig } from './config';
import runTasks from './tasks';
import { error } from './notices.js';

export function run() {
    const {
        flags,
        help,
    } = getWPEGConfig();

    const cli = meow(
        help,
        {
            booleanDefault: undefined,
            flags,
        }
    );

    // prepare tasks list.
    const currentTasks = [];
    Object.keys( flags ).forEach( ( flag ) => {
        if ( cli.flags && cli.flags[ flag ] ) {
            currentTasks.push( flag );
        }
    } );

    // no tasks.
    if ( ! currentTasks.length ) {
        cli.showHelp();
        return;
    }

    // node errors.
    process.on( 'uncaughtException', ( err ) => {
        error( 'UncaughtException: ' + err.message );
        error( err.stack );
        process.exit( 1 );
    } );

    // run tasks.
    runTasks( currentTasks );
}
