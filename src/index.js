import Promise from '@lvchengbin/promise';
import EventEmitter from '@lvchengbin/event-emitter';
import LocalCache from '@lvchengbin/localcache';
import Sequence from '@lvchengbin/sequence';
import biu from '@lvchengbin/biu';
import { URL, URLSearchParams } from '@lvchengbin/url';

import Config from  './core/config';
import J from './core/j';
import * as Utils from './core/utils';
import Package from './core/package';
import extend from './core/extend';
import Rule from './core/rule';
import Style from './core/style';
import Script from './core/script';
import Value from './core/value';
import * as UI from './extensions/ui';
import View from './extensions/view/index';
import Model from './extensions/model';
import Validate from './extensions/validate';

Object.assign( J, {
    Config,
    EventEmitter,
    Utils,
    Package,
    extend,
    biu,
    Promise,
    Sequence,
    Rule,
    LocalCache,
    Style,
    Script,
    Value,
    View,
    UI,
    Model,
    Validate,
    URL,
    URLSearchParams
} );
window.J = J;
