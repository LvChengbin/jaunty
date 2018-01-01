import { assign } from './variables';
import Config from  './core/config';
import J from './core/j';
import * as Utils from './core/utils';
import EventCenter from './core/eventcenter';
import Package from './core/package';
import extend from './core/extend';
import { request, ajax, xhr } from './core/http';
import Promise from './core/promise';
import Sequence from './core/sequence';
import Response from './core/response';
import Rule from './core/rule';
import Storage from './core/storage';
import Style from './core/style';
import Script from './core/script';
import Value from './core/value';
import * as UI from './extensions/ui';
import View from './extensions/view/index';
import Model from './extensions/model';
import Validate from './extensions/validate';
import URL from './extensions/url';

assign( J, {
    Config,
    EventCenter,
    Utils,
    Package,
    extend,
    request,
    ajax,
    xhr,
    Promise,
    Sequence,
    Response,
    Rule,
    Storage,
    Style,
    Script,
    Value,
    View,
    UI,
    Model,
    Validate,
    URL
} );
window.J = J;
