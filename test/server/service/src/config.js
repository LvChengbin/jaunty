module.exports = {
    port : 8999,
    stc : {
        root : `${__dirname}/../dist`
    },
    settings : {
        views : [ `${__dirname}/../dist` ],
        'view engine' : 'html'
    }
};
