export default {
    debugging : false,
    script : {
        external : false,
        storage : {
            level : 'persistent',
            lifetime : 0,
            priority : 6
        }
    },
    style : {
        external : false,
        storage : {
            level : 'persistent',
            lifetime : 0,
            priority : 6
        }
    },
    request : {
        storage : {
            level : 'page',
            lifetime : 6000,
            priority : 5
        },
    },
    csrf : {
        name : 'csrf-token',
        token : null
    }
};
