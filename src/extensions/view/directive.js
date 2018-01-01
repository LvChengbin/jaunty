import $skip from './directives/skip';
import $once from './directives/once';
import $if from './directives/if';
import $show from './directives/show';
import $for from './directives/for';
import $prevent from './directives/prevent';
import $stop from './directives/stop';
import $model from './directives/model';
import $pre from './directives/pre';
import $mount from './directives/mount';
import $html from './directives/html';
import $text from './directives/text';
import $els from './directives/els';
import $fixed from './directives/fixed';
import $var from './directives/var';
import $data from './directives/data';
import $lazy from './directives/lazy';
import $validate from './directives/validate';
import $submit from './directives/submit';
import $checked from './directives/checked';
import $state from './directives/state';
import $router from './directives/router';
import $exec from './directives/exec';

const priorities = {
    ':skip' : 100,
    ':router' : 200,
    ':once' : 300,
    ':for' : 400,
    ':var' : 500,
    ':lazy' : 600,
    ':if' : 600, //:else
    ':data' : 700,
    ':show' : 800,
    ':mount' : 1000,
    ':prevent' : 1100,
    ':stop' : 1200,
    ':model' : 1300,
    ':pre' : 1400,
    ':html' : 1500,
    ':text' : 1600,
    ':els' : 1700,
    ':fixed' : 1800,
    ':validate' : 1900,
    ':submit' : 2000,
    ':checked' : 2100,
    ':state' : 2200,
    ':exec' : 2300
};

const directives = {
    ':skip' : $skip,
    ':once' : $once,
    ':router' : $router,
    ':for' : $for,
    ':var' : $var,
    ':lazy' : $lazy,
    ':if' : $if, // :else, :elseif
    ':data' : $data,
    ':show' : $show, // :showelse, :elseshow
    ':mount' : $mount,
    ':prevent' : $prevent,
    ':stop' : $stop,
    ':model' : $model,
    ':pre' : $pre,
    ':html' : $html,
    ':text' : $text,
    ':els' : $els,
    ':fixed' : $fixed,
    ':validate' : $validate,
    ':submit' : $submit,
    ':checked' : $checked,
    ':state' : $state,
    ':exec' : $exec
};

const sort = ( arr ) => {
    return arr.sort( ( a, b ) => priorities[ a.name ] > priorities[ b.name ] ? 1 : -1 );
};

const bindDirective = ( directive, node, view ) => {
    if( !directives[ directive.name ] ) {
        console.warn( '[J WARNING] Directive "' + directive.name + '" not exists.');
        return;
    }
    const bind = directives[ directive.name ].bind;
    return bind && bind( directive, node, view );
};

const compileDirective = ( directive, node, view ) => {
    if( !directives[ directive.name ] ) {
        console.warn( '[J WARNING] Directive "' + directive.name + '" not exists.');
        return;
    }
    const compile = directives[ directive.name ].compile;
    return compile && compile( directive, node, view );
};

export{ sort, compileDirective, bindDirective };
