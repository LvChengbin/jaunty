import config from '../../core/config';

const view = {
    leftDelimiter : '{{',
    rightDelimiter : '}}',
    storage : {
        level : 'persistent',
        priority : 6,
        lifetime : 0
    }
};

config.view = view;

export default view;
