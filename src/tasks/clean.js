const del = require( 'del' );

module.exports = {
    label: 'Clean Dist',
    isAllowed( cfg ) {
        return !! cfg.clean_files;
    },
    fn: () => ( cfg ) => (
        del( cfg.clean_files )
    ),
};
