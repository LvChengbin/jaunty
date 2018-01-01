# Jolin

<!-- vim-markdown-toc GFM -->

* [Introduction](#introduction)
* [Get Started](#get-started)
* [Package](#package)
    * [Creating a package instance](#creating-a-package-instance)
    * [Mount a package](#mount-a-package)
    * [Visible Packages](#visible-packages)
    * [Status of Packages](#status-of-packages)
    * [Properties of a package](#properties-of-a-package)
    * [Resources of Package](#resources-of-package)
    * [Communicating between packages.](#communicating-between-packages)
    * [Pseudo Protocol Messages](#pseudo-protocol-messages)
    * [Methods](#methods)
    * [Rules](#rules)
    * [Routing](#routing)
    * [Signals](#signals)
* [Load resources](#load-resources)
    * [Load script files](#load-script-files)
    * [Load CSS files](#load-css-files)
* [Extensions](#extensions)
    * [Status of Extensions](#status-of-extensions)
    * [Resources of Extensions](#resources-of-extensions)
    * [J.Extension](#jextension)
    * [Creating an Extension](#creating-an-extension)
    * [Using An Extension](#using-an-extension)
    * [Properties of J.Extension](#properties-of-jextension)
    * [Methods of J.Extension](#methods-of-jextension)
* [J.View](#jview)
    * [Creating a J.View instance](#creating-a-jview-instance)
    * [Installing a J.View instance](#installing-a-jview-instance)
    * [Properties of J.View instance](#properties-of-jview-instance)
    * [Methods of J.View](#methods-of-jview)
    * [Directives of template](#directives-of-template)
    * [Filters](#filters-1)
* [J.Model](#jmodel)
    * [Creating a J.Model instance](#creating-a-jmodel-instance)
    * [Installing a Model](#installing-a-model)
    * [Special Properties of J.Model](#special-properties-of-jmodel)
    * [Properties of J.Model instance](#properties-of-jmodel-instance)
    * [Methods of J.Model instance](#methods-of-jmodel-instance)
    * [Filter Package](#filter-package)
    * [Model Package](#model-package)
    * [Language](#language)
    * [J.Storage](#jstorage)
* [J.EventCenter](#jeventcenter)
* [J.Promise](#jpromise)
* [Browser Support](#browser-support)

<!-- vim-markdown-toc -->

## Introduction

Jolin is a frontend framework which let you make every part in your page to be managed as a package. A package in Jolin could have it's own files and it should always have a file named `index.js` as the main file of th package. After loading a package, the `index.js` in the package would execut and the package would be mounted under the it's parent package (the pacakge mounted current package).

While you are using Jolin to create your page, every part in your page would be a package, all the packages would be like a tree with a root package, you can load anything in each package such as script file, CSS file, and so on, and you can also manage the files inside the package, the framework would help you to load your files asnycronous and manage the order of each type of files.

You aslo can send messages from one package to others or do communication with the event center. As well, you can reply a message or forward messages to other package easily. For these, what you need to do is just set some listening rules inside of the package.

You can do anything you want to do inside a package, you can load any resouces for implementing what you want to, but we provide a wonderful `Model` and `View` for you to make your job easier. With the `Model` and `View` you can implement your page easily, and you can also separate a `Model` into a sigle pakcage, so, you would be able to bind the `Model` to different views.

The `View` we are providing supports a series of directives, such as `:for...in`, `:for...of`, `:if`, `:show`, `:mount`, `:validate`, etc. The `View` would help you to listen to the change of it's `scope` or the change of the `Model`s which were bound to it. You can mount another package in the template of the view using `:mount` directive, and the sub package would be mounted under the package which the `View` belongs to.

## Get Started

At the beginning of you are going to create your page with Jolin, you have to create the root package in the page, and all of the other packages would be it's child packages or grand child packages. 

> Actually, you can create multiple root packages in a single page if you really want to do that.

Creating root package, you just need to `new` an instance of Jolin, such as:


~~~js
new J( 'package name', {
    rules : [
        new J.Rule( /^(message|event)\/(alert|confirm|prompt)/i, {
            forward : 'common'
        } )
    ],
    init() {
        return this.$mount( 'common', 'http://xxx.xx/packages/common' ).then( () => {
            this.$style( 'home.css' );
            tihs.$install( 'view', 'view.js' );
        } )
    },
    action() {
    }
} );
~~~

The first param should be the name of the root package, and the second one should be the methods and properties you want to bind to the package.

> Because the root package is also a package of Jolin, and it is just a little special, so, for more information, you can see [Package](#package).


## Package

The `Package` is the main part of Jolin. 

### Creating a package instance

To create a package, you need to create a dir with a file named `index.js` inside. Then you can create a package with `new J.Package` or `J.Package` in `index.js`. For example:

~~~js
new J.Package( {
    // options
} );
~~~

**Options**

When you create a `J.Package` instance, you need to pass in an **options object**, here is the full list of options:

- **init** | `Function`

    While initializing a package, the `init` method would be called before the status of the package changes to `LOADING`.
    You can load resources of the package inside of `init` method and all the resources you had appeneded inside of init would be seemed as the resources of the package, and the package's status would change to `READY` till its resources loaded. For example:

    ~~~js
    new J.Package( {
        init( options ) {
            this.$resources( new J.Promise( resolve => {
                setTimeout( () => {
                    resolve();
                }, 2000 );
            } ) );

            this.$mount( 'sub', 'package path' );
            this.$style( 'a.css' );
            this.$install( 'install something, such as a view or a model' );
        }
    } );
    ~~~

    In the code above, the package would be `READY` after the all the `promise` objects resolved. If the `init` method returns a `promise` object, the package will be ready till the `promise` object being resolved.

    > For more information of the methods using above, see [$resources](#resources), [$mount](#mount), [$style](#style), [$install](#install)

- **action** | `Function`

    The `action` method would be called after the status of the package became `READY`;

### Mount a package

It's very easy to mount another package inside of a package, and a package could be mounted multiple times even in one package.

For example:

~~~js
new J.Package( {
    init() {
        this.$mount( 'name', 'http://xxxx.xx/package1', {
            //options of the package
        } );
    }
} );
~~~

By the code above, a package was mounted with a name "name", the package would be load asynchronous, it would not block the status change of current package. If you want current package would be set as `READY` after its sub packages `READY`, you can add the sub package in to resource list, or make the `init` method to return a promise object.

For example, if I want to load a package named `common` before other packages, you can do as below:

~~~js
new J( 'root', {
    return this.$mount( 'common', 'http://xxx.xx/common' ).then( () => {
        return this.$mount( 'another-package', 'http://xxx.xx/another' );
    } );
} );

new J( 'root', {
    init() {
        this.$resources( this.$mount( 'common', 'http://xxx.xx/common' );
    }
} );
~~~

> For more information, please view [Hooks](#hooks) and `$resources` method of package.


### Visible Packages

Every package has to be mounted by another package, expect the first one which is an instance of `J`, and all of these packages would constitute a tree, every package would be a `NODE` of the tree. We defined some different relations between different packages in the tree, and there is one of them, we called `Visible Packages`, need some explanations.

Using `Jolin`, we can develope independent package without considering other package, you only need to manage resources and features of the package you are developing, to listen to messages from other packages, and also to manage its child packages. So, for this package, it cannot know what package are existing in the package tree except some packages we call it `Visible Packages` of this package.

`Visible Packages` of a package including `Root Package`, `Parent Package`, and all of its `Child Packages`, so even though you actually know some information of other packages, in order to make your package can be reused in different package tree, you should not do communication with other packages except `Visible Package`.


### Status of Packages

| Value | State     | Description                              |
| :---- | :-------- | :--------------------------------------- |
| `0`   | `CREATED` | The package has been created, means the main file of the package has already been loaded and executing. |
| `1`   | `LOADING` | The package is loading its own resources which were added into the resource list. |
| `2`   | `READY`   | The package has already loaded all the of resources in its resource list |


### Properties of a package

> All of the native properties of a package would be named as a string start with a `$`.

| Property      | Value     | Description                              |
| :------------ | :-------- | :--------------------------------------- |
| `$name`       | `String`  | the name of the package, the package can be found by its name (path), see [$find](#find). The value of name could be any characters except ".", because the path of the package would use "." as a seperator. If the package is root package, the name could be set while creating the the package by `new J( 'package name' )`, and if the package is a normal package, the name could be set while mounting the package by `this.$mount( 'name', 'path' )`, so if one package is using in a same page multiple times, every instance of the package could have different names. If the `name` was emitted while mounting a package, the package would be an anonymous package and the system would generate an unique string as the name of the package. |
| `$path`       | `Array`   | The path of current package, it is an `Array` which consists of the names of all the parent packages of this package. For example: `[ 'root', 'parent', 'package' ]`. |
| `$root`       | `Package` | The root package of current package, if current package is the root package, the value would be the current package itself. |
| `$parent`     | `Package` | The parent packege of current package, if current package is the root package, this value will be `null`. |
| `$children`   | `Object`  | A map of the children packages of current package, the `key` of every item is the name of the package. |
| `$extensions` | !!        |                                          |
| `$status`     | `Number`  | The status of current package. see [Package status](#status-of-a-package). |

### Resources of Package

In the package directory, there could be multiple files in different types, such as `.css`, `.js`, `.html` or images. But we would only regard the resources which were loaded by the package and added to its resources by calling `$resources` as the resources of the package no matter if the resource is a real one or just a ordinary `Promise` object.

Before a package is ready, each resource would block the changes of the package to be `READY`, it means the package would wait for all the Promise object till they are resolved, then change its status to `READY`.

You can still add resources into "Resources of Package", but it would not change the status of the package.

For more information about the status of packages, please read [`Status of Packages`](#status-of-packages).
For more information about the `$resources` method, please read [`$resources`](#resources).

### Communicating between packages.

We provide different ways for doing communication between packages, and we recommend you only to do communicate with the [`Visible Packages`](#visible-packages), so that you the package could be reused in different projects.

#### Using package as an event center.

The class `J` extends from an `EventCenter`, for more information of `EventCenter` you can view the [EventCenter](#jeventcenter) part. With the `EventCenter`, you can add listeners to it, for example, if there is a sub package named "sub" in current package.

~~~js
this.$find( 'sub' )
    .$on( 'eventname', handler )
    .$off( 'eventname', handler )
    .$once( 'eventname', handler );
~~~

#### Using the root package as an event center.

Listening to the events from root package, we can make a global way for communication, and also can use this way for communicating between two root packages. For example:

> We don't recommend to use this method in a package, it might make the package to be difficult for reuse.

~~~js
this.$root.$on( 'eventname', handler )
    .$off( 'eventname', handler )
    .$once( 'eventname', handler );
~~~

#### Using event rules

The recommended way for doing communication is is `rules`. The `rules` is a kind of thing which looks like `routers`, we can add some `rules` for listening to the messages from other packages. Using this way, you can specify a method for dealing with the message, or forward the message to another package.

There are four types of message now you can listen to, they are `j://message`, `j://event`, `j://signal` and `j://router`. You can also add your own type with a `j://` pseudo protocol. 

You can specify the type of message that you want to listen to, or listen to both of them.

There is a default map for each kind of message, it means if you don't add `rules` for messages or the subject doesn't match any `rules` you added, the frameword would seek the message in the corresponding objects.

| Message Type | Corresponding Object |
| :----------- | :------------------- |
| message      | messages             |
| event        | events               |
| signal       | signals              |
| router       | routers              |

Here are some simple examples, for more details of `J.Rule`, please read the [`J.Rule`](#jrule) part.

~~~js
new J.Package( {
    rules : [
        new J.Rule( 'events/success', {
            action : 'success'
        } ),
        new J.Rule( 'events/failed', {
            action : 'status/failed'
        } ),
        new J.Rule( /^events\/(alert|confirm|prompt)/i, {
            process( ...args ) {
                args[ 0 ].title = 'New Title';
                return args;
            }
            forward : 'modal'         
        } )
    ],
    success() {
    },
    status : {
        failed() {
        }
    },
    messages : {
        msg() {
        }
    }
} );
~~~

### Pseudo Protocol Messages

We defined some rules for different kind of messages. It's a type of format which is like a pseudo protocol that start with `j://`. Different type of messages has different features. Reading [`rules`](#rules) to get more details of using `rules`;

#### j://message

The `j://message` is an ordinary message type which could be sent between different packages and be listened with adding [`rules`](#rules) or `messages` object .

#### j://event

The main difference between `j://event` and `j://message` is that a `j://event` message is just a kind of notice, you can not reply the message as what you can do to a `j://message` message. You can listen to `j://event` by adding [`rules`](#rules) or `events` object.

#### j://signal

The `j://signal` message is used to be sent from extensions of a package to the package. That means it is a kind of internal message of packages. 

#### j://router

The `j://router` message is a kind of message which would be send to every package while the URL changed or after the package loaded. It can be listened by adding [`rules`](#rules) and [`routers`](#routing).

#### j://param

The `j://param` message is used to tell sub package that the params which were passed in to it was changed.

### Methods

#### $url

The `$url()` method returns the full path of a relative path of the current package.

__Syntax__

~~~js
package.$url( path )
~~~

__Parameters__

- **path** | `String`

    The relative path of the file, eg. "index.css".

__Return value__

A full path of the file.

__Examples__

~~~js
// The path of current package is "http://xxx.xx/package"
J.Package( {
    init() {
       this.$url( 'index.css' ); // returns http://xxx.xx/package/index.css
    }
} ); 
~~~

#### $find

The `$find()` method returns a `package` which matched the path.

__Syntax__

~~~js
package.$find( path );
~~~

__Parameters__

- **path** | `String` | `Array`

    The path of package, the value should be an `Array` or a `String` joined by ".". eg. `['root', 'common', 'modal' ]`, or `root.common.modal`.

__Return value__

A `J.Package` instance, or a `null` if the package doesn't exist.

__Examples__

~~~js
J.Package( {
    init() {
        return this.$mount( 'sub1', 'http://xxx.xx/sub1' );
    },
    action() {
        this.$find( 'sub1' ); // this would get the sub1 package
        this.$find( 'sub1.sub2' ); // if the sub1 package has a sub package named sub2
    }
} );
~~~

#### $sibling

To get a sibling package with its name. A sibling package means a package which has the same parent package with current package.

__Syntax__

~~~js
package.$sibling( name );
~~~

__Parameters__

- **name** | `String`

    A `String` of the name of the sibling package.

__Return value__

A `J.Package` instance.

__Examples__

~~~js
J.Package( {
    init() {
        // the two lines below has the same meaning.
        this.$parent.$find( 'package2' );
        this.$sibling( 'package2' );
    }
} );
~~~

#### $siblings

To get all of the siblings ort siblings' path.

__Syntax__

~~~js
package.$siblings( return_path = false );
~~~

__Parameters__

- **return_path** | `Boolean`

    If this param is `TRUE`, the method would return the list of path of sibling packages instead of real instances.

__Return value__

An `Array` filled with instance or path of packages.

__Examples__

~~~js
J.Package( {
    init() {
        this.$siblings(); // would return an Array filled of siblings
    }
} );
~~~

#### $mount

To mount a sub package to current package. The resource would be add to the [`Resources of the package`](#resources-of-package).

__Syntax__

~~~js
package.$mount( name, url[, options] );
package.$mount( url[, options] );
~~~

__Parameters__

- **name** | `String` | `Optional`

    A `String`, of the name for the package, which can including any characters except dot (`.`). A package could be anonymous, and a random string would be set as its name if this param is not given.

    > A package can be mounted multiple times even though a same name is given, and a new instance of the package would overwrite the old one, so please check whether the sub package is existing or not before mounting it if it might be mounted multiple times, or may be you prefer to use the [`$touch`](#touch) method.

- **url** | `String`

    The url or the path of the package you want to load which has a file named `index.js` in it.

- **options** | `Object` | `Optional`

    An config `Object` for this package.

__Return value__

Returns a `Promise` or [`J.Promise`](#jpromise) object. The `Promise` object would be resolved after the sub package's status became `READY`.

__Examples__

~~~js
J.Package( {
    init() {
        this.$mount( 'sub1', 'http://xxx.xx/sub', {
            id : '123456'
        } ).then( sub1 => {
            // do something after the package ready.
        } );

        if( !this.$find( 'sub2' ) ) {
            this.$mount( 'sub2', 'http://xxx.xx/sub2' );
        }
    }
} );
~~~

#### $touch

To mount a sub package if it cannot be found with the name. The resource would be add to the [`Resources of the package`](#resources-of-package).

__Syntax__

~~~js
package.$touch( name, url[, options ] );
~~~

__Parameters__

- **name** | `String`

    The name of the package.

- **url** | `String`

    The url or path of the package.

- **options** | `Object` | `Optional`

    The config object for the package.

__Return value__

Returns a `Promise` object.

__Examples__

~~~js
J.Package( {
    init() {
        this.$touch( 'sub', 'http://xxx.xx/sub' ).then( sub => {
            // do something after the sub package ready
            // this function would execute immediately if the sub package has already mounted.
        } );
    }
} );
~~~

#### $install

The method is used to install an `Extension` to the package. For more information about `J.Extension` you can view [`Extensions`]
(#extensions).

__Syntax__

~~~js
package.$install( name, url[, params ] );
package.$install( name, Extension[, params ] );
~~~

__Parameters__

- **name** | `String`

    The name you want to set for the `Extension`, and then you can get the `Extension` with its name. If you want to use a namespace, you can separate the namespace string and the name with a dot (`.`), then a method would be generated for the namespace and the method's name would be the string of the namespace.

- **url** | `String`

    The url of the extension, if a relative path is given, the framework would load the path in current package.

- **Extension** | `J.Extension`

    An instance of `J.Extension`.

- **params** | `Object` | `Optional`

    Config object for the extension.

__Return value__

A `Promise` object that would be resolved after the status of the extension becomes `READY`;

__Examples__

~~~js
J.Package( {
    init() {
        this.$install( 'view', 'view.js', {
            id : '12345'
        } );

        this.$install( 'ext', new J.Extension( {}, {
            package : this,
            name : 'view'
        } ) );

        this.$install( 'models.user', new J.Model( {
            data : {
            }
        }, {
            package : this,
            name : 'models.user'
        } ) );
    },
    action() {
        // to get the three extensions installed
        console.log( this.view );
        console.log( this.ext );
        console.log( this.$models( 'user' ) );
    }
} );
~~~

> For more information of extensions, please view [`Extensions`](#extension), [`J.View`](#jview), [`J.Model`](#jmodel).

#### $ready

Specify a function to execute when the status of the package becomes `READY`, or using it to get a `Promise` object which would be resolved after the package is ready.

__Syntax__

~~~js
package.$ready( [ handler ] );
~~~

__Parameters__

- **handler** | `Function` | `Optional`

    A function to execute after the package is ready.

__Return value__

Returns a `Promise` object.

__Examples__

~~~js
J.Package( {
    init() {
        this.$ready( () => {
            // this package is ready
        } );

        this.$mount( 'sub', 'http://xxx.xx/sub' );

        this.$find( 'sub' ).$ready().then( () => {
            // the sub package is ready
        } );
    }
        } );
~~~

#### $unicast

Send a [`j://event`](#using-event-rules) type message to another package. Before sending message, please view the part [Communicating between packages](#communicating-between-packages).

__Syntax__

~~~js
package.$unicast( to, subject, body[, from = current package ] );
~~~

__Parameters__

- **to** | `J.Package` | `String` | `Array`

    The recipient of the package, you can also use the path of a package here, or an `Array` filled with a series of package. If you are using a path string for a package, the method would look for the package based on current package, so you cannot sent message with specified path to other packages except parent package and sub packages.

    The method will not throw any exceptions if the specified package is not existing or it is not ready for receiving message, so you need make sure that the package is ready.

- **subject** | `String`

    The subject of the message.

- **body** | `Object`

    The body of the message.

- **form** | `J.Package` | `Optional`

    The package which is sending the message.

__Examples__

~~~js
J.Package( {
    init() {
        return this.$mount( 'sub', 'http://xxx.xx/sub' );
    },
    action() {
        this.$unicast( 'sub', 'change-color', {
            color : 'red'
        } );

        this.$unicast( this.$parent, 'submit/successful', {
        } );
    }
} );
~~~

#### $multicast

The method `$multicast` could send [`j://event`](#using-event-rules) message to all child packages or descendant packages of current package.

__Syntax__

~~~js
package.$multicast( subject, body[, deep, from = current package] );
~~~

__Parameters__

- **subject** | `String`
    The subject of the message.

- **body** | `Object`

    The body of the message.

- **deep** | `Boolean`

    If set `deep` to `TRUE`, the message would also be sent to descendant packages or not. Default value is `FALSE`.

- **from**

    The package which is sending the message.

__Examples__

~~~js
J.Package( {
    init() {
        this.$mount( 'sub1', 'http://xxx.xx/sub1' );
        this.$mount( 'sub2', 'http://xxx.xx/sub2' );
        this.$mount( 'sub3', 'http://xxx.xx/sub3' );
    },
    action() {
        this.$multicast( 'hello', {
        } );
    }
} );
~~~

#### $broadcast

__Syntax__

    To send a [`j://event`](#using-event-rules) message to all of the packages in the package tree.

~~~js
package.$broadcast( subject, body );
~~~

__Parameters__

- **subject** | `String`

    The subject of the message.

- **body** | `Object`

    The body of the message.

__Examples__

~~~js
J.Package( {
    init() {
        this.$broadcast( 'hello-world', {} );
    }
} );
~~~

#### $message

Send [`j://message`](#using-event-rules) to another package. Before sending message to another package, please read [Communicating between packages](#commucating-between-packages).

__Syntax__

~~~js
package.$message( to, subject, body[, from = current package ] );
~~~

__Parameters__

- **to** | `J` | `String`

    The recipient of the message, should be an instance of a package or a path of a package.

- **subject** | `String`

    The subject of the message.

- **body** | `Object`

    The body of the message.

- **from** | `Package`

    The package which sends this message.

__Return value__

A `Promise` object which would be resolved after the recipient reply the message.

__Examples__

~~~js
J.Package( {
    delete() {
        this.$message( 'modal', 'confirm', {
            content : 'Confirm to delete this item.'
        } ).then( res => {
            if( res ) {
                // to do deletion
            }
        } );
    }
} );
~~~

Code of package `modal`:

~~~js
J.Package( {
    rules : [
        new J.Rule( 'messages/confirm', {
            action : 'confirm'
        } )
    ],
    confirm( data, e ) {
        // to show the view of confirm modal

        // if the confirm button was clicked
        e.reply && e.reply( true )
    }
} );
~~~

#### $bubble

Bubble a `j://event` message from parent package through every level of grand parent package till root package.

A package always need to tell its parent package something, or ask its parent package to do something, but sometimes, the package doesn't know if its parent package would response its message, may be the parent package has to forward the message to its parent. This method helps us to resolve this problem, the message would bubble from the parent package of message sender, and would stop till meed the root package, or there is a package stopped the bubble by `event.stop()`.

__Syntax__

~~~js
package.$bubble( subject, body[, from ] );
~~~

__Parameters__

- **subject** | `String`

    The subject of the message.

- **body** | `Object`

    The body of the message.

- **from** | `Package` | `Optional`

    The package which is the message sender.

__Examples__

~~~js
J.Package( {
    init() {
        this.$message( this.$root, 'account' ).then( account => {
            this.$bubble( 'login' );
        } );
    }
} );
~~~

In the code above, the package sends a message to root package for asking for account information, if the account information is not existing, to bubble a message for telling its higher level packages that it needs to run `login` process.

If we need the root package to deal with the login event, wo have to listen to the event in root package, and specify a method for doing login, or just forward the message to another package.:

~~~js
new J( {
    rules : [
        new J.Rule( /^(message|event)\/login/i, {
            forward : 'login'
        } )
    ],
    init() {
        this.$mount( 'login', 'http://xxx.xx/package/login' )
    }
} );
~~~

Sometimes, maybe the parent package want to do something while a `login` message being triggered from its child package, so the parent package can also listen to the `login` message. If the parent package want to stop the bubbling of the message to its parent package, it can use `event.stop()` for cancelling the bubble, or the message would be sent to its parent package till root package.

~~~js
J.Package( {
    rules : [
        new J.Rule( /^(message|event)\/login/, {
            action : 'login'
        } )
    ],
    login( data, e ) {
        // do something
        e.stop();
    }
} );
~~~

#### $resources

To bind a resource to the package. For more information, you can read [Resources of package](#resources-of-package).

Using [`$mount`](#mount), [`$touch`](#touch), [`$install`](#install), [`$style`](#style) and [`$script`](#script), the `$resources` method would be called automatically if the package is not reaady.

__Syntax__

~~~js
package.$resources( resource[, describe = null ] );
~~~

__Parameters__

- **resource** | `Object` | `Promise`

    The instance of the resource, it could be a `Promise` object, or an object which has a `$ready` method, such [`Package`](#package), [`J.View`](#jview), [`J.Model`](#jmodel), etc.

- **describe** | `Mixed`

    The description of the resource, it is used for debugging to make you could check your resources easily.

__Return value__

If the resource has a `$ready` method, return `resource.$ready()`, or return the resource.

__Examples__

~~~js
J.Package( {
    init() {
        this.$resources( new Promise( resolve => {
            setTimeout( () => {
                resolve();
            }, 1000 )
        } ), 'An empty resourcs' );

        this.$resource( J.Script.create( {
            url : 'http://xxx.xx/static/js/home.js'
        } ), 'The script file: home.js' );

        this.$resource( J.Style.create( {
            url : 'http://xxx.xx/static/css/home.css'
        } ) );
    }
} );
~~~

#### $script

To load a script file in the package. This method called [`J.Script.create`](#jscript) for loading and processing javascript files.
The `$resources` method would be called if the package is not ready. 

__Syntax__

~~~js
package.$script( path );
~~~

__Parameters__

- **path**

    The path of the script file.

__Return value__

A `Promise` object.

__Examples__

~~~js
J.Package( {
    init() {
        this.$script( 'test.js' ).then( () => {
        } );
    }
} );
~~~

#### $style

To load a css file in the package, The method will call [`J.Style.create`](#jstyle) for loading and rendering css files.
The `$resources` method would be called if the package is not ready.

__Syntax__

~~~js
package.$style( path[, options ] );
~~~

__Parameters__

- **path** | `String`

    The path of the css file.

- **options** | `Object` | `Optional`

    The options for loading css files, for more information, read [`J.Style.create`](#jstyle).

__Return value__

A `Promise` object.

__Examples__

~~~js
J.Package( {
    init() {
        this.$style( 'test.css' ).then( () => {
        } );
    }
} );
~~~

#### $destruct

__Syntax__

~~~js
package.$destruct();
~~~

__Parameters__

__Return value__


### Rules

`Rules` in Jolin is used to route the messages from other packages. You can create rules by `new J.Rule`, and add them to the `rules` properties of package.

__Syntax__

~~~js
new J.Rule( path, params );
~~~

__Parameters__

- **path** | `String` | `RegExp`

    The path should be a `String` or a `RegExp` for matching the message subject.

- **params** | `Object`

    The options for the rule if it matches the message's subject. the supporting properties of params are:

    | Name      | Type                  | Description                              |
    | :-------- | :-------------------- | :--------------------------------------- |
    | `action`  | `String`              | the specified method which would execute for the message. Using slash(/) for separating the path of the method. Using `$n` for matching the submatch string of the `RegExp`. |
    | `forward` | `Package` \| `String` | forwarding the message to another package. |
    | `process` | `Function`            |                                          |

For example:

Adding a simple rule to route a message, which has a subject "messages/login", to a method "login".

~~~js
J.Package( {
    rules : [
        new J.Rule( 'messages/login', {
            action : 'login'
        } ),
    ],
    login() {
    }
} );
~~~

In another package, we should use [`$message`](#message) to send the message:

~~~js
this.$message( package, 'login' );
~~~

Using simple `RegExp`, to route messages, which has a subject "login" and either its type is [`j://event`](#jevent) or [`j://message`](#jmessage), to `package.account.login`:

~~~js
J.Package( {
    rules : {
        new J.Rule( /^(events|messages)\/login/, {
            action : 'account/login'
        } )
    },
    account : {
        login() {
        }
    }
} );
~~~

Using `$n` for matching the submatch string of the `RegExp`.

~~~js
J.Package( {
    rules : {
        new J.Rule( /^(?:events|messages)\/(login|logout|signup)/i, {
            action : 'account/$1'
        } )
    },
    account : {
        login() {
        },
        logout() {
        },
        signup() {
        }
    }
} );
~~~

In another package, you can send message like this:

~~~js
this.$message( package, 'events/login' );
this.$unicast( package, 'events/logout' );
~~~

Forwarding the message to another package, for example, if we want to deal with all operations for account inside a individual package named "account", we can use the root package for forwarding the message to the "account" package, because the "account" package is not a [`Visible Package`](#visible-packages) for other packages.

In a `forward` rule, you can set a function named `process` for doing something before forwarding, and the return value would overwrite the arguments from the sender, if the return value is `FALSE`, the forwarding would be prevented.

Code in root package:

~~~js
new J( {
    rules : [
        new J.Rule( /^(event|message)\/(login|logout|signup)/i, {
            forward : 'account',
            process( ...args ) {
                if( !args[ 0 ].type ) {
                    // return false means prevent the event forwards to another package.
                    return false;
                } 
                // you have to return a new arguments for the forwarding message.
                return args;
            }
        } )
    ],
    init() {
        this.$mount( 'account', 'htt://xxx.xx/package/account' );
    }
} );
~~~

### Routing

Every package could get the detail of URL and also the changes of URL by adding `routers`.

A router item can include two properties, `rule` and `action`.

The `rule` property is the rule for matching the `URL`, its value could be a `String`, a `RegExp`, or a `Function`. If a `Function` is set, return `TRUE`means match the URL.

For example:

~~~js
J.Package( {
    routers : [ {
        rule : '/',
        action() {

        }
    }, {
        rule : /^user\/.*/,
        action() {
        }
    }, {
        rule( url ) {
            return url.indexOf( 'user' ) >-1;
        },
        action() {
        }
    } ],
} );
~~~

### Signals

## Load resources

Jolin supports some ways for loading different types of resources, such as scripts, CSS files, and HTML files, etc. With Jolin, Every package would have it's own resources, a package would be considered as a loaded package after all of its resources loaded. So if you want to load something as a resource of a package, you have to add a promise object, which is of loading the resource, to the package with method `$resources` inside the `init` method.

> If the `init` method returns a `promise`, the package would wait for the promise to be resolved and then it would be ready.

For example:

~~~js
new J.Package( {
    init() {
        const promise = J.Script.create( {
            url : 'a.js'
        } );

        this.$resources( promise, 'the description of this resources.' );
    }

    action() {
    }
} );
~~~

In the code above, the `action` method would execute after the `a.js` loaded.

### Load script files

~~~js
new J( 'package
~~~

### Load CSS files

You can load CSS files use `J.Style.create` function or using `$style` method of the package instance, but there are some differences between these two way for loading CSS files.

    - While using `J.Style.create` method, the path of the CSS file can be either a full URL or a relative URL based on the location of the page, but in `$style` method of the package, the path of the CSS file should be a relative URL based on the path of current package.

    - While using

For example:

> Variables and scripts can be used in the CSS files, if you want to use template syntax, you have to set the param `extrnal` to false, and the CSS file would be loaded with ajax. 
> The format of the template would be intrduced in the part of `J.Utils.template`

~~~js
new J( 'root', {
    init() {
        J.Style.create( {
            url : 'path of the CSS file'
        } );

        this.$style( 'path of the CSS file' );
    },
    action() {
    }
} );
~~~

## Extensions

`Extensions` are used to extend more features for Jolin, then you can invoke an `Extension` by using the [`$install`](#install) method in the package.

We have built some extensions, such as [`J.View`](#jview), [`J.Model`](#jmodel), and so on.

### Status of Extensions

In the same way as a `Package`, an `Extension` also has different status:

| Value | State     | Description                              |
| :---- | :-------- | :--------------------------------------- |
| `0`   | `CREATED` | The instance of the extension has been created. |
| `1`   | `LOADING` | The extension is loading its resources.  |
| `2`   | `READY`   | The extension has already loaded all resources. see [Resources of Extensions](#resources-of-extensions) |

### Resources of Extensions

An extension also has its own resources, the same as `Package`, the resources must be added by calling `$resources` method. The status of an extension would become `READY` after all the resources loaded.


### J.Extension

All of the `Extensions` should extend from `J.Extension` and there are some rules you have to follow while creating an extension.

### Creating an Extension

This is a simple example of creating the `J.Model` extension.

~~~js
class Model extends J.Extension {
    constructor( option, init ) {
        super( options, Object.assign( init, { $type : 'model' } ) )
        this.loadData().then( () => {
            this.$init();
        } );
    },
    loadData() {
        return Promise.resolve();
    }
}
~~~

### Using An Extension

We can use the extension by calling `$install` method and pass an instance of the extension as the second param.

~~~js
J.Package( {
    init() {
        this.$install( 'model', new J.Model( {
            init() {
            },
            action() {
            }
        }, {
            name : 'model',
            package : this
        } ) );
    }
} );
~~~

Or, we can create the extension in an individual file, and wrap the instance by `J.extend` method. for example, create a file named "model.js":

~~~js
J.extend( ( init, options ) => {
    new J.Model( {
        init() {
        },
        action() {
        }
    }, init )
} );
~~~

In the package code, we can still use `$install` method for loading the extension:

~~~js
J.Package( {
    init() {
        this.$install( 'model', 'model.js', options ).then( () => {
            // will execute after the extension is ready.
        } );
    }
} );
~~~

### Properties of J.Extension

#### $status

The status of current extension, see [Status of Extensions](#status-of-extensions)

#### $name

The name of current extension.

#### $package

The package which was current extension bound to.

#### $type

The type of current extension.

### Methods of J.Extension

#### $init

If you want to create an extension extends from `J.Extension`, you have to call this method after dealing with the initialization of the extension, this method would help you to manage the status of extension and call `init` hook and `action` hook automatically.

__Syntax__

~~~js
extension.$init()
~~~

#### $mount

To mount a child package to the package bound to current extension.

__Syntax__

~~~js
extension.$mount( name[, ...args ] )
~~~

__Parameters__

- **name** | `String`

    The name of the package, a random sting would be set if `NULL` be set.

- **args** | `Optional`

    Arguments for mounting packages.

__Return value__

The new mounted package.

#### $ready

Specify a function to execute when the status of the extension becomes `READY`, or using it to get a `Promise` object which would be resolved after the extension is ready.


__Syntax__

~~~js
extension.$ready( [ handler ] )
~~~

__Parameters__

- **handler** | `Function` | `Optional`

    A function to execute after the extension is ready.

__Return value__

A `Promise` object which woule resolve after the extension is ready.

__Examples__

~~~js
J.Package( {
    init() {
        const model = new J.Model( {
            data : {
            }
        }, {
            name : 'model',
            package : this
        } )

        model.$ready().then( model => {
            // to do something
        } );

        model.$ready( model => {
            // to do something
        } );
    }
} );
~~~


#### $resources

To bind a resource to the extension. also see [Resources of Extensions](#resources-of-extensions)

__Syntax__

~~~js
extension.$resources( resource[, describe = null ] )
~~~

__Parameters__

- **resource** | `Object` | `Promise`

- **describe** | `String` | `Optional`

__Return value__

If the resource has a `$ready` method, return `resource.$ready()`, or return the resource.

#### $signal

To send a [`j://signal`](#jsignal) message to the package of current extension. 

__Syntax__

~~~js
extension.$signal( subject[, params ] )
~~~

__Parameters__

- **subject** | `String`

The subject of the message.

- **params** | `Object` | `Optional`

Parameters for the message.

__Return value__

The return value of the action method which matches the subject of the message.

__Examples__

In the code below, a `j://signal` message would be sent if an error occured in `J.Model` while loading data from server.

~~~js

J.Package( {
    signals : {
        error() {
            this.$unicast( this.$root, 'error', e );
        }
    },
    init() {
        this.$install( 'model', new J.Model( {
            data() {
                this.$request( 'http://xxx.xx/data' ).catch( e => {
                    this.$signal( 'error', e );
                } );
            }
        }, {
            name : 'model',
            package : this
        } ) );
    }
} );
~~~


## J.View

The `J.View` is a built-in `Extension` of Jolin, it helps you to build the user interfaces easier. `J.View` provides some solutions for development, such as resource management, template, two-way binding, etc. It also can be combined with other extensions of Jolin such as [`J.Model`](#jmodel), `J.Language` and so on.

### Creating a J.View instance

You can use `J.View` by creating a new `J.View` instance:

~~~js
new J.View( {
    // options
}, {
    // init properties
} );
~~~

**Options**

When you create a `J.View` instance, you need to pass in an **options object**, here is the full list of options:

- **container** | `String` | HTMLElement

    Provide the J.View instance a DOM element as the container. If a string is provided it would be used as a CSS selector, the first element which matches the selector would be the container element.

- **url** | `String`

    The URL of the template file if you are using an individual template file instead of an inline template string. Usually, you should better to use `$url` method for creating the full URL, of the file, with its path in the package direcory.

- **template**

    A string templte for the J.View instance. We recommend you to use individual template file.

    For example:

    ~~~js
    new J.View( {
        container : document.body,
        template : '<h1>{{title}}</h1>'
    } );
    ~~~

- **scope** | `Object`

    The data object for the J.View instance. J.View will convert its properties into getter/setters. The object must be plain, prototype properties and properties start with `$$` are ignored.

    The data will be bound to the J.View instance, it means if you set the value of scope as `{a:1}`, then you can get/set `a` with `view.a` or `view.a = 0`.

    For example:

    ~~~js
    const view = new J.View( {
        scope : {
            a : 1
        }
    } );

    view.a = 0;
    ~~~

- **models**

    Bind models to the J.View instance. You can bind a `J.Model` instance or [`Model Package`](#model-package), or some other Promise instances, if you want to bind a J.Model instance which is in an individual file of current package, you can just do that by using a file path.

    Because the [`$message`](#message) mesthod of [`J.View`](#jview) returns a Promise object, so you can ask for data from other package and bind the data to the J.View instance.

    For some reasons of architecting, we don't recommend to use something like J.Model instance or other inside a J.View instance, because the view part doesn't need to know thing of the package, even if we provide the way for doing that.

    The code for the J.Package instance:

    ~~~js
    J.Package( {
        init() {
            const user = this.$mount( 'user-model', 'http://xxx.xx/packages/models/user' );
            const data = this.$install( 'models.data', 'data.js' );
            this.$install( 'view', 'view.js', {
                user,
                data,
                // ask for data from other package with j://message
                session : this.$message( this.$root, 'session' ),
                // bind a J.Model instnace of this package which is in the model.js
                model : 'model.js'
            } );
        }
    } )
    ~~~

    The `view.js` for view part:

    ~~~js
    J.extend( ( options, init ) => {
        return new J.View( {
            scope : {},
            models : {
                user : options.user,
                data : options.data,
                session : options.session,
                model : options.model 
            }
        } );
    }, init );
    ~~~


- **filters**

    Bind filters to the J.View instance. You can bind a `Function`, a `Promise` or a [`Filter Package`](#filter-package)

    ~~~js
    new J.View( {
        filters : {
            cut : ( str, len, ext = '...' ) => {
                return str.substr( 0, len ) + ext;
            },
            photo : 'http://xxx.xx/packages/filters/photo'
        },
        template : '<img $src="src # photo" /><p>{{content # cut 20}}</p>'
    } );
    ~~~

- **init**

    This method will execute after the J.View instance finish loading the template and models, if the method returns a Promise object, it will block the J.View instance becomes ready.

- **action**

    This method will execute after the J.View instance is ready.

**Init Properties**

The `init properties` should be pass in as the second param for creating a new J.View instance, this is the full list of the init properties:

~~~js
J.Package( {
    init() {
        this.$install( 'views.header', new J.View( {
        }, {
            name : 'views.header',
            package : this
        } ) );

        this.$install( 'views.nav', 'views/nav.js' );
    }
} );
~~~

If you are loading an individual file for the view, init properties would pass in to the [`J.extend`](#jextend) function as the second param, so for the example above, the code in `nav.js` sould like:

~~~js
J.extend( ( options, init ) => {
    return new J.View( {}, init );
} );
~~~

- **name**

    The name of the view you want to give, the name would be sent with the [`j://signal`](#jsignal) message for distinguish the sender of messages. Usually, you should use name which passed in for the installation.

- **package**

    The package of current J.View instance.

### Installing a J.View instance

The `J.View` is a type of extension which extends from [`J.Extension`](#jextension), so it should be installed by calling [`$install`](#install) method in a package.

~~~js
J.Package( {
    rules : [
        new J.Rule( 'events/edit', {
            action : 'edit'
        } )
    ]
    init() {
        this.$install( 'view', 'view.js' );
    },
    edit( text ) {
        this.view.text = text;
    }
} );
~~~

Code in `view.js`:

~~~js
J.extend( ( options, init ) => {
    return new J.View( {
        scope : {
            text : 'ABC'
        },
        template : `
            <p>{{text}}</p>
        `
    } );
}, init );
~~~

You can also install J.View instance as an "inline" mode:

~~~js
J.Package( {
    rules : [
        new J.Rule( 'events/edit', {
            action : 'edit'
        } )
    ]
    init() {
        this.$install( 'view', new J.View( {
            scope : {
                text : 'ABC'
            },
            template : `
                <p>{{text}}</p>
            `
        }, {
            name : 'view',
            package : this
        } ) );
    },
    edit( text ) {
        this.view.text = text;
    }
} );

~~~

### Properties of J.View instance

#### $els

An `Object` for storing all `elements` which used the [`:els`](#els-1) directive.

#### $filters

An `Object` for storing bound [`filters`](#filters).

#### $package

The package bound to current view.

### Methods of J.View

#### $assign

To manipulate the scope of the view, the DOM created in the view will change automatically.

__Syntax__

~~~js
view.$assign( desc, src )
view.$assign( src )
~~~

__Parameters__

- **desc** | `Object`

    The target object you want to modify.

- **src** | `Object`

    The object you want to set to the `desc`, if `desc` is not set, the `src` would be set to the `scope` of the view.

#### $bind

To bind data or a `J.Model` to the view.

__Syntax__

~~~js
view.$bind( name, model )
~~~

__Parameters__

- **name** | `String`

The name of the model

- **model** | `Object` | `J.Model` | `J.Package`

__Return value__

A `Promise` object which would resolve after the data is loaded.

__Examples__

To bind an object to the view.

~~~js

J.Package( {
    init() {
        this.$install( 'view', 'view.js' ).then( view => {
            view.$bind( 'model', {
            } );
        } );
    }
} );
~~~

To bind a [`J.Model`](#jmodel) to a view.

~~~js
new J.Package( {
    init() {
        this.$install( 'view', 'view.js' );
        this.$install( 'model', 'model.js' );
    },
    action() {
        this.view.$bind( 'model', this.model );
    }
} );
~~~

You can bind a [`J.Model`](#jmodel) with the path of the model, then the model would be installed as an anonymous extension to current package, and bound to the view.

~~~js
new J.Package( {
    init() {
        this.$install( 'view', 'view.js' );
    },
    action() {
        this.view.$bind( 'model', 'model.js' );
    }
} );
~~~

You can bind a [`Model Package`](#model-package) to a view directly, then the `Model Package` would be mounted to current package.

~~~js
J.Package( {
    init() {
        this.$install( 'view', 'view.js' );
    },
    action() {
        this.view.$bind( 'model', this.$mount( 'model-package', 'http://xxx.xx/pacakge/model' ) );
    }
} );
~~~

There is a more convenient way to bind models to a view, so generally, we don't need to use `$bind` method. For more information, please view [`Creating a J.View instance`](#creating-a-jview-instance).

#### $filter

To bind a filter to current J.View instance, usually, you can bind filters during creating the J.View instance by passing in the `filters` option. For more information, please view [`Creating a J.View instance`](#creating-a-jview-instance).

__Syntax__

~~~js
view.$filter( name, handler )
~~~

__Parameters__

- **name** | `String`

- **handler** | `String` | `Promise` | `Function`

__Return value__

A Promise instance.

__Examples__

~~~js
new J.View( { 
    init() {
        this.$filter( 'time', () => {
        } );

        this.$filter( 'photo', 'http://xxx.xx/packages/filters/photo' );
    }
}, init );
~~~

#### $set

For setting a value to the view with a name.

__Syntax__

~~~js
view.$set( dest, key, value )
~~~

__Parameters__

- **dest** | `Object`

    The target object you want to bind data to.

- **key** | `String`

    The name of the data.

- **value** | `Mixed`

    The value you want to add.

__Examples__

~~~js
new J.Package( {
    init() {
        this.$install( 'view', 'view.js' );
    },
    action() {
        this.view.$set( this.view.data, 'name', 'Jolin' );
    }
} );
~~~

#### $watch

To watch the changes of specified data of the J.View instance with the path of the data or with an expression.

__Syntax__

~~~js
view.$watch( exp, handler )
~~~

__Parameters__

- **exp** | `String`

    The expression or path you want to watch.

- **handler** | `Function`

    The callback function would be called, while the value of the expression changed, the new value and old value would be passed in as params.

__Examples__

~~~js
new J.View( {
    scope : {
        a : 1,
        b : 1
    },
    init() {
        this.$watch( 'a', ( newValue, oldValue ) => {
            this.b = newValue;
        } );
    }
} );
~~~

#### $unwatch

To stop from viewing data changes which was started to watch with `$watch`.

__Syntax__

~~~js
view.$unwatch( exp, handler )
~~~

__Parameters__

- **exp** | `String`

    The expression that you want to stop watching.

- **handler** | `Function`

    The handler that you bound to this expression with `$watch`.

__Examples__

~~~js

new J.View( {
    scope : {
        a : 1,
        b : 1
    },
    init() {
        const handler = newValue => {
            this.b = newValue;
        };

        this.$watch( 'a', handler );

        this.$unwatch( 'a', handler );
    }
} );

~~~

### Directives of template

#### :skip

**Expects**: `None`

Skip compilation for this element and all its children elements. You can use this for displaying raw mustache tags or HTML tags with J.View special format such as `styles` or `directives`. Skipping nodes with no directives on them can also speed up compilation.

~~~html
<div :skip>
    <a href="###" :prevent @click="submit">
        {{text}}
    </a>
</div>
~~~

#### :once

**Expects**: `None`

This directive would make the element to be compiled for only once, and the element would not be re-render even if the data changed. This can be used to optimize update performance.

~~~html
<div :once>
    <a href="###" :prevent @click="submit">
        {{text}}
    </a>
</div>
~~~

#### :router

**Expects**: `String`

**Related directives**: [:elserouter](#elserouter), [:routerelse](#routerelse).

**Directive Options**

- **router-remove** | `String`

    To set if remove the rendered element or not while the URL changed and doesn't match the rule. The value of this option should be a string of "TRUE" or "FALSE", and the default value is "TRUE". If the value is "FALSE" the element would be hidden instead of being removed.

~~~html
<div :router="^/user">
    This part would be render if the URL matches the router rule.
</div>
<div :router="^/user" router-remove="false">
    This element would not be removed.
</div>
~~~

#### :elserouter

**Expects**: `String`

**Related directives**: [:router](#router), [:routerelse](#routerelse).

**Directive Options**

- **router-remove** | `String`

    Same as the `router-remove` option of [:router](#router).

Denote the "else router" block which just likes "else if" but using the rules of `:router` directive.

The previous sibling element must have a `:router` directive.

~~~html
<div :router="^/user">
    This part would be render if the URL matches the router rule.
</div>
<div :elserouter="^/home" router-remove="false">
    This part would be render if the URL matches the router rule.
</div>
~~~

#### :routerelse

**Expects**: `String`

**Related directives**: [:router](#router), [:elserouter](#elserouter).

**Directive Options**

- **router-remove** | `String`

    Same as the `router-remove` option of [:router](#router).

~~~html
<div :router="^/user">
    This part would be render if the URL matches the router rule.
</div>
<div :elserouter="^/home" router-remove="false">
    This part would be render if the URL matches the router rule.
</div>
<div :routerelse>
    This part would be render if all the rules in this :router chain didn't match the URL.
</div>
~~~


#### :for...of

**Expects**: `Expression`

To render the element for multiple times with iterating an Array as its source data. In the directive's value, you need to specify an alias for the element of each iteration. 

~~~html
<ul>
    <li :for="value of list">
        {{value.text}}
        The value of current element is assigned to value.
    </li>
</ul>
~~~

You can also specified an alias for current index:

~~~html
<div :for="value, index of list">
    {{index}}. {{value.text}}
</li>
~~~

#### :for...in

**Expects**: `Expression`

To render the element for multiple times with itrating over the enumerable properties of an object. Same as the `:for...of` directive, in the directive's value, you need to specify aliases for "key" and "value" of current element.

~~~html
<ul>
    <li :for="attr, value in list">
        {{attr}}: {{value}}
    </li>
</ul>
~~~

#### :var

**Expects**: `Expression`

To declare a new variable inside of current scope of current element.

~~~html
<div :var="show=false">
    <a href="###" :prevent @click="show=true">
        <span :if="show">Hide</span>
        <span :else>Show</span>
    </div>
</div>
~~~

#### :lazy

**Expects**: `Number`

To render an element like "lazy-load", the value sould be the distance from the current position of the element to the visible scrolled position. When the package is scrolling, if the distance smaller the the value, the element would be rendered.

If you don't specify a value, the value would be set as 100.

Using this directive, you can optimize the performance of rendering elements and loading packages or model.

~~~html
<div :lazy>
    Default value is 100
</div>
<div :lazy="1">
    This element would be rendered when it would be shown in the page.
</div>
~~~

#### :if

**Expects**: `Expression`

**Related directives**: [:elseif](#elseif), [:else](#else).

**Directive Options**

- **if-remove** | `String`

    To set if the element would be remove after the data changed and doesn't match the rule. The value of this option would be a "TRUE" or "FALSE" string.

Confitionally render the element based on the result of the expression specified in the value of this directive.

~~~html
<div :if="action==1" if-remove="false"></div>
~~~

#### :elseif

**Expects**: `Expression`

**Related directives**: [:if](#if), [:else](#else).

**Directive Options**

- **if-remove** | `String`

    Same as the options `:if-remove` of `:if`. 

Denote the "elsf if block" for `:if` directive, the previous node must have a `:if` directive, or this directive would be ignore.

~~~html
<div :if="action == 1" if-remove="false">
    This element would be rendered if the variable action is 1.
</div>
<div :elseif="action > 0" if-remove="false">
    This element would be rendered if tha action is greater than 0 but not equal to 1.
</div>
~~~

#### :else

**Expects**: `Expression`

**Related directives**: [:if](#if), [:elseif](#elseif).

**Directive Options**

- **if-remove** | `String`

    Same as the options `:if-remove` of `:if`. 

Denote the "else block" for `:if`. The previous element of current element must have a `:if` directive or `:elseif` directive.

~~~html
<div :if="action == 1" if-remove="false">
    This element would be rendered if the variable action is 1.
</div>
<div :elseif="action > 0" if-remove="false">
    This element would be rendered if tha action is greater than 0 but not equal to 1.
</div>
<div :else>
    This element woule be rendered if the previous rules don't match.
</div>
~~~

#### :data

**Expects** | `String`

The variable name of the data.

**Directive Options**

- **data-global** | [TRUE, FALSE]
    
    To set if the `:data` directive would create a global variable. If you want to create a variable in the `scope` of current element, set the value to "FALSE".

- **data-url** | `String` # *{{Supports Expression}}*

    The API for requesting data, the data would be gotten by a GET type AJAX request, and the response of the request would be parsed as JSON data. You can add params for AJAX request with `data-query` option.

- **data-query** | `String` # *{{Supports Expression}}*

    The query string that will be used for data requesting if you set the `data-url`.

- **data-model** | `String`

    To bind a model for the `:data` directive, the value should be the file path of the model. You can specify a name for installing the model with `data-name` option.

- **data-package** | `String`

    To bind a [Model Package](#model-package) to the `:data` directive, the value should be the address of the package. You can specify a name for the sub package with `data-name` option.

- **data-name** | `String`

    If you are using `data-model` or `data-package`, you can use `data-name` to set a name.

- **data-expose-method** | `String`

   If you are using `data-package`, you can specify an exposing method name for the package. For more information, please view [Model Package](#model-package).

- **data-param-***

    If you are using `data-model` or `data-package`, you can set options by using `data-param-*`. Wrapping expressions with "{{}}" if you want to use in `data-param-*`, such as, `data-param-id={{id}}`.

~~~html
<div :data="account"
    data-url="http://xxx.xx/api/data/user"
    data-query="id={{id}}&_t={{+new Date}}"
>
   {{account.name}} 
</div>
~~~

To load a model file and set the data to the scope of current element.

~~~html
<div :data="account"
    data-global="false"
    data-model="models/account.js"
    data-param-id="{{id}}"
>
    {{account.name}}
</div>
~~~

To load a [Model Package](#model-package) and set the data to the scope of current element.

~~~html
<div :data="account"
    data-global="false"
    data-package="http://xxx.xx/packages/models/account"
    data-param-id="{{id}}"
>
    {{account.name}}
</div>
~~~

#### :show

**Expects**: `Expression`

**Related Directives** [elseshow](#elseshow), [:showelse](#showelse)

To toggle the `display` CSS property of the element, the directive would not overwrite the inline `display` style.

~~~html
<div :show="n==1">
    If n equal 1, this element would be shown.
</div>
~~~

#### :elseshow

**Expects**: `Expression`

**Related Directives** [elseshow](#elseshow), [:showelse](#showelse)

Denote the "else show block" which just likes "else if" block. The previous element must have `:show` or `:elseshow` directive.

~~~html
<div :show="n = 1"></div>
<div :elseshow="n > 0">
    This element would be shown if n greater than 0 and not equal 1.
</div>
~~~

#### :showelse

**Expects**: `Expression`

**Related Directives** [elseshow](#elseshow), [:showelse](#showelse)

Denote the "else" block for `:show` directive, the preveous element must have `:show` or `:elseshow` directive.

~~~html
<div :show="n = 1"></div>
<div :elseshow="n > 0"></div>
<div :showelse>
    If previous rules are not matched, this element would be shown.
</div>
~~~

#### :mount

**Expects**: `String` | `Optional` - Name of the package or anonymous package with an empty value.

This directive is used to mount a package in template, so that you don't need to mount a sub package from the package of current J.View instance. You can specify a name for the package or a random name would be set.

**Directive Options**

- **mount-url** | `String`

    The URL of the package, expressions can be used by being wrapped with "{{}}".

- **mount-param-***

    The params that you want to pass in to the package while creating it. support using expressions with being wrapped with "{{}}".

~~~html
<div :mount="card"
    mount-url="http://xxx.xx/package/card"
    mount-param-id="{{id}}"
></div>
~~~

You can add sub elements in the element which is using `:mount` directive, and the sub element would be shown before the sub package finish loading.

~~~html
<div :mount
   mount-url="http://xxx.xx/package/card" 
   mount-param-id="{{id}}"
>LOADING...</div>
~~~

You can also use [`:model`](#model) directive with a `:mount` directive, in sub package, dispatching an "input" event can expose the "value" of the package as the "value" of an input form item.

~~~html
<div :model="code"
    :mount
    mount-url="http://xxx.xx/package/input"
    mount-param-placeholder="Enter your code"
></div>
~~~

For implementing the functionalities above, you can create a package like this:

~~~js
J.Package( {
    init() {
        this.$install( 'view', 'view.js' );
    }
} );
~~~

The "view.js" should like this:

~~~js
J.extend( ( options, init ) => {
    return new J.View( {
        container : options.container,
        scope : {
            code : null
        },
        url : 'template.html'
    }, init );
} );
~~~

The code of sub package:

~~~js
J.Package( {
    signals : {
        change( code ) {
            this.$trigger( 'input', code );
        }
    },
    init( options ) {
        this.$install( 'view', new J.View( {
            container : options.container,
            template : `<input type="input"
                :model="code"
                @input="change"
                $value="code"
                $placeholder="{{placeholder}}"
            />`,
            scope : {
                placeholder : options.placeholder,
                code : null
            },
            change() {
                this.signal( 'change', this.code );
            }
        }, {
            name : 'view',
            package : this
        } ) );
    }
} );
~~~

#### :prevent

**Expects**: `String`

To prevent the default action by calling `event.preventDefault()`. The value is the event types you want to listen to, and using comma (,) to split different types, such as "click,mouseover,mousedoen".


For different element, there are some default event types if the value is empty:

| Element | Events |
|:--------|--------|
| A | click |
| BUTTON | click |
| INPUT[TYPE=BUTTON] | click |
| INPUT[TYPE=SUBMIT] | click |
| FORM | submit |

You can also prevent [`Extend DOM Events`](#xxx) defined in J.View.

~~~html
<a href="###" :prevent>Button</a>
<a href="###" :prevent="click,mousedown">Button</a>
<form :prevent></form>
~~~


#### :stop

**Expects**: `String`

To call the `event.stopPropagation()` while a DOM event been dispatched, if the value is empty, the `click` event would be canceled bubbling as default.

~~~html
<a href="###" :stop></a>
<div :stop="click">
    While clicking this node, the event.stopPropagation() would be called.
</div>
~~~

#### :model

**Expects**: `Expression`

**Directives Options**

- **model-debounce** | `Number` | Default: 50

    Debouncing is used to limit the max frequence of the dispatching of `input` method. If the value is empty, it would be set to 50 by default. If you want to have a real time event, you can set this value to 0.

Create a two-way binding on a form input element, a element has "contentEditable" property or a package.

~~~js
<input type="text" :model="account.name" $value="account.name" />
<textarea :model="account.desc" $value="account.desc"></textarea>

<input type="radio" name="sex" $value="0" :model="account.sex" /> Male
<input type="radio" name="sex" $value="1" :model="account.sex" /> Female

<input type="checkbox" $value="1" :model="account.agreed" />
~~~

[J.View filters](#filters) can also be used in the value of the directive. 

~~~html
<input type="text" :model="account.bio # cut 50" />
~~~

You can use `:model` directive with `:mount` directive, here is a simple example, for more information, please view [:mount](#mount)

~~~html
<div :model="account.photo" :mount
    mount-url="http://xxx.xx/packages/account/edit-photo"
></div>
~~~

#### :html

**Expects**: `Expression`

To set or update the element's `innerHTML`.

**Directives Options**

- **html-template**: `String:[TRUE|FALSE]`

    To parse the HTML content as template string.

~~~html
<div :html="user.summary"></div>
~~~

#### :text

To set or update the element's `textContent`.

~~~html
<div :text="account.sex == 1 ? 'Male' : 'Female'"></div>
~~~

#### :els

**Expects**: `String`

To get the reference the element, and store it in the `$els` property with the value of this directive as its name.

~~~js

new J.View( {
    container : document.body,
    template : '<div :els="container"></div>',
    init() {
        console.log( this.$els.container );
    }
}, init )

~~~

#### :fixed

**Expects**: `Expression`

**Directive Options**

- **fixed-top** | `Number` | `Default: 0`

    The distance from the element to the top of page while the element becomes "fixed".

- **fixed-left** | `Number` | `Default: 0`

    The distance from the element to the left of page while the element becomes "fixed".

This directive will help you to set an element to `position:fixed` much easier. The value of this directive should be an expression that controlling if the element should be "fixed" or not.
    

~~~html
<div :fixed="fixed"
    fixed-top="50"
>
    This element would be fixed while the variable "fixed" is true, and keep the distance to the top of page as 50px.
</div>
~~~

If the directive's value is empty, the directive will listen to the scroll event of window, and "fixed" the element automatically if the element is scrolled in to the distance that set with `fixed-top` or `fixed-left`.

~~~html
<div :fixed>
    This element will be fixed while it is scrolled to the top of page.
</div>
~~~

#### :validate

This directive is used to validate a FORM.

~~~html
<form :validate></form>
~~~

#### :submit

**Expects**: `NULL`

To submit the form which the element belongs to.

~~~html
<form :prevent @submit="model.$submit()">
    <input type="text" placeholder="Enter you password" :model="password" />
    <a href="###" :prevent :submit>Submit</a>
</form>
~~~

#### :checked

**Expects**: `Expression`

To set the `checked` attribute to the element. This directive should be used to `radio` and `checkbox` input item.

~~~html
<input type="checked" :checked="checked > 0" />
~~~

#### :state

**Expects**: `Expression`

**Directive Options**

- **state-url** | `Expression`

    The URL param for `pushState` method.

- **state-title** | `Expression`

    The "title" param for `pushState` method.

To execute `history.pushState` method while clicking the element, the value of this direcitve will be the state object for `pushState` method.
If the element is a "<a>" element, the `href` attribute would be get as the URL param if the `state-url` option is not set.

~~~html
<a href="/" :state>Home</a>
<a href="/user" :state>User</a>
<span :state state-url="/feedback" state-title="feedback"></span>
~~~

#### :exec

**Expects**: `Expression`

To execute an expression.

~~~html
<div :exec="count+=1"></div>
~~~

### Filters

J.View allows you to define filters that can be used to apply common text formatting. Filters can be used in most of expressions in J.View template.

Which different from other frameworks, in J.View template, the sharp (#) is used to separate expression and filter, because "|" also means "Bitwise OR".

~~~html
{{ expression # filter1 param1 param2 # filter2 param1 param2 }}
<input type="text" :model="model.data # filter param1 param2" />
~~~

You can add a filter with [`$filter`](#filter) method, or load filters as a [Filter Package](#filter-package).

There are some built-in filters you can use in template directly.

#### Operation

| Filter | Syntax | Expression | Result | Description |
|:-------|:-------|:-----------|:-------|:------------|
| add | `10 # add 100` | `110` | To get the sum of the expression's result and another number, or an array filled with numbers. |
| sum | `[1, 2, 3] # sum` | `6` | To get the sum of an Array filled with numbers. |
| numberFormat | `123.345 # numberFormat 1` | `123.3` | To format a number with fixed-point notation, two digts after the decimal point by default. |

#### String

| Filter | Syntax | Expression | Result | Description |
|:-------|:-------|:-----------|:-------|:------------|
| trim | `trim( str )` | `" abc " # trim` | `abc` | Removing whitespaces from both ends of a string. |
| cut | `cut( str, length, ext = '...' )` | `"abcdefg" # cut 2 "..."` | `ab...` | Cutting the string with a specified length and add a string like "..." at the end of the new string. |
| uppercase | `uppercase( str )` | `"abc" # uppercase` | `ABC` | To convert the string to uppercase letters. |
| lowercase | `lowercase( str )` | `"ABC" # lowercase` | `abc` | To convert the string to lowercase letters. |
| ucfirst | `ucfirst( str )` | `first` | `First` | To convert the first letter of a string to uppercase. |

#### Time

| Filter | Syntax | Expression | Result | Description |
|:-------|:-------|:-----------|:-------|:------------|
| time | `time( timestamp, format = 'Y-m-d' )` | `new Date() # time 'Y-m-d'` | `2000-12-12` | To get formatted time string with a Date object or a timestamp. |

#### html

| Filter | Syntax | Expression | Result | Description |
|:-------|:-------|:-----------|:-------|:------------|
| encodeHTML | `encodeHTML( str )` | `"<>" # encodeHTML` | `&lt;&gt;` | Encode HTML special chars in the string. |
| highlight | `highlight( str, query, classname = '', escape = true)` | `<abcdefg> # highlight bc 'hl' true ` | `&lt;a<em class="hl">bc</em>defg&gt` | Highlight queries in a string. |


#### URL

| Filter | Syntax | Expression | Result | Description |
|:-------|:-------|:-----------|:-------|:------------|
| encode | `encode( url )` | `"?&" # encode` | `%3F%26` | Encode URL special chars in a string. |
| decode | `decode( str )` | `%3F%26 # decode` | `"?&"` | Decode URL special chars in a string. |

We are going to migrate them to independent filter packages.

## J.Model

Jolin provides a built-in `Model` named `J.Model` which can help you to create a model and to bind it to a J.View instance easily.

### Creating a J.Model instance

J.Model is an extension which extends from [J.Extension](#jextension), so, a J.Model instance would follow the rules of J.Extension class, and it can be created and loaded in the same as a typical extension.

So, for creating an instance of J.Model, just use `new J.Model`:

~~~js
new J.Model( {
    // options
}, {
    // init
} );
~~~

**Options**

When you create a `J.Model` instance, you need to pass in an **options object**, here is the full list of options:

- **data** | `Object` | `Array` | `Function` 

    The initial data of the J.Model instnace, it could be an `Object`, an `Array` or a `Function`. If the value is a `Function` the return value of the function would be used as the initial data, and if the return value is a `Promise` instance, the initial data would be the value of the `Promise` instance, and the `J.Model` instance would wait for the `Promise` instance resolve, so you can load data from a remote server.

    ~~~js
    new J.Model( {
        data : {
            id : '124',
            title : 'J.Model'
        },
        init() {
            console.log( this.$data );
        }
    }, init );
    ~~~

    Using a function which returns an object:
    ~~~js
    new J.Model( {
        data() {
            return {
                id : '123',
                title : 'J.Model'
            }
        },
        init() {
            console.log( this.$data );
        }
    }, init );
    ~~~

    Using a function which returns a Promise instance:

    ~~~js
    nwe J.Model( {
        data() {
            return new Promise( resolve => {
                resolve( {
                    id : '123',
                    title : 'J.Model'
                } );
            } );
        },
        init() {
            console.log( this.$data );
        }
    }, init );
    ~~~


- **url** | `String`

    If the initial data can just be loaded as a `GET` request based on AJAX, you can use the `url` option instead of the `data`.

    ~~~js
    new J.Model( {
        url : 'http://xxx.xx/api/data',
        init() {
            console.log( this.$data );

            // the $data is the response data requested from the URL.
        }
    }, init );
    ~~~

- **expose** | `Array` 

    While an J.Model instance bound to a J.View instance, the `$data` of this instance would be bound to the view automatically, so you can use the data in J.View template, but, if you want to use methods of this instance in the template, you should add the methods' name in the `expose`.

    ~~~js
    new J.Model( {
        expose : [ 'vote', 'mark' ],
        data : {
            name : 'Name'
        },
        vote() {
        },
        mark() {
        }
    }, init );
    ~~~

    ~~~html
    <h3>{{model.name}}</h3>
    <span @click="model.vote()">Vote</span>
    <span @click="model.mark()">Mark</span>
    ~~~

- **validations** | `Object` | `Function`
    Add validation rules for the instance, and a variable named `$validation` would be created in the model which can be used in template.

    ~~~js
    new J.Model( {
        data : {
            uname : ''
        },
        validations : {
            uname : {
                on : 'change',
                required : true,
                maxlength : 10,
                minlength : 2
            },
        }
    } );
    ~~~

    By adding the `validations` property, the data will be validated before submitting or while the actions in the `on` property occured.

    Option list of each item of `validations` property:

    | Name | Value | Description |
    |:-----|:------|:------------|
    | path | `a`, `a.b`, `text.length` | The path of the data you wan to check. |
    | on | `1` or `change` means checking while the data changed. `2` or `change-after-submit` means checking while the data changed after the first time calling `$submit` of the model. | The time that you want to run the validator function. |

    Except the options in the list above, other properties should be the name of each validator, you can use the built-in validators or a function.

    The list of built-in validators:

    | Name | Syntax | Description |
    |:-----|:-------|:------------|
    | required | `required : true` | For validating that this value is required.|
    | email | `email : true` | For validating email address. |
    | phone | `phone : true` | Validating phone number which would match 1 through 14 digits number. |
    | url | `url : true` | For validating an URL. |
    | numeric | `numeric : true` | For validating a number. |
    | int | `int : true` | Validating an int number. |
    | min | `min : 3` | To check if the value is greater than a number.  |
    | max | `max : 100` | To check if the value is less than a number. |
    | minlength | `minlength : 10` | To check if the length a `String` or an `Array` is greater than a number. |
    | maxlength | `maxlength : 100` | To check if the length of a `String` or an `Array` is less than a number. |
    | minlengthIfNotEmpty | `minlengthIfNotEmpty : 30` | Returning `TRUE` if the `String` or the `Array` is empty or not empty but the length is greater than the specified number. |
    | pattern | `pattern : /^[\w]{3,6}$/` | Checking the value with a regular expression. |
    | in | `in : [ 'a', 'b', 'c' ]` <br> `in : 'abc'` | Checking if the value is included in a list of if the string is a sub string of another one. | 
    | date | `date : true` | To check if the value match the format of a date like `2000-01-01`. |
    | minDate | `date : '1991-11-8'` <br> `date : '-1 day'` | |
    | maxDate | `date : '2018-05-09` <br> `date : '1 week` | |
    | time | `time : true` | |
    | minTime | `minTime : 11:11:11` <br> `minTime : '2 hour'` |
    | maxTime | `maxTime : 22:22:22` <br> `maxTime : '4 minutes'` | |

    You can use the `$validations` property of the J.Model instance in the template of J.View instance:

    ~~~html
    <form :submit="model.$submit()" :prevent>
        <input type="text" :model="model.title" $value="model.title" />
        <span :if="model.$validation.title.$errors.required">
            The title is required.
        </span>
        <span :elseif="model.$validation.title.$errors.minlength">
            The title is too short.
        </span>

        <input type="text" :model="model.bio" $value="model.bio" />
        <span :if="model.$validation.bio.$errors.format">
            The bio must start with a dash.
        </span>
        <a href="###" :prevent :submit>Submit</a>
    </form>
    ~~~

    ~~~js
    new J.Model( {
        data : {
            title : '',
            bio : ''
        },
        validations : {
            title : {
                on : change,
                required : true,
                minlength : 30
            },
            bio : {
                on : 'change-after-submit',
                format() {
                    if( bio.charAt( 0 ) !== '-' ) {
                        return false;
                    }
                }
            }
        }
    } );
    ~~~

    Or, you can use the `$error` property of J.Model instance to check whether there was any error occurred from validating.

    ~~~html
    <form>
        Form items.
        <p :if="model.$error">There are some mistakes of the data, please correct them first.</p>
    </form>
    ~~~

- **init** | `Function`

    The function will execute after loading the data and before the J.Model instance is ready, so you can load other resource or data and block the ready of the instance be returning a Promise object.

- **action** | `Function`

    The function will execute after the J.Model instance is ready.

- **submit** | `Function`

    The function will be called while calling the `$submit` method of the instance, the function should return a Promise instance, or a `FALSE` if an error occurred.

    ~~~html
    <form :submit="model.$submit()">
        Form items.
    </form>
    ~~~

    ~~~js
    new J.Model( {
        submit() {
            return this.$request( 'http://xxx.xx/api/xx' );
        }
    }, init );
    ~~~

### Installing a Model

The same as other extensions, you can install a J.Model instance to a package by using [`$install`](#jinstall) method.

~~~js
J.Package( {
    init() {
        this.$install( 'model', new J.Model( {
            data : {}
        }, {
            name : 'model',
            package : this
        } ) );
    }
});
~~~

### Special Properties of J.Model

We designed some special properties for you while using J.Model with J.View, this is the list of these properties:

| Name | Type | Description |
|:-----|:-----|:------------|
| `$ready` | `Boolean` | `true`, `false` | Denoting if the model is ready. |
| `$loading` | `Boolean` | Denoting the loading status before ready. |
| `$failed` | `Boolean` | Denoting if it was failed while loading data. |
| `$error` | `Boolean`, `Object` | Denoting if there is an error occurred. |
| `$submiting` | `Boolean` | Denoting if the model is submitting data. |
| `$requesting` | `Boolean` | Denoting if the model is in requesting data. |
| `$validation` | `Object` | Details of validations. |

~~~html
<div :if="model">
    <div :if="!model.$ready">
        LOADING...
    </div>
    <form :else :submit="model.$submit()">
        <input type="text" :model="model.bio" $value="model.bio" />
        <span>{{100 - model.bio.length}}</span>

        <p :if="model.$validation.bio.$error.required">Bio is required.</p>
        <p :elseif="model.$validation.bio.$error.maxlength">Bio is too long.</p>
        <p :if="model.$error && model.$error.errno">
            Something error occurred while submitting data.
        </p>
        <a href="#" :show="!model.$submitting" :prevent :submit> Submit </a>
        <a href="#" :showelse :prevent>Submitting...</a>
    </form>
</div>
~~~

~~~js
new J.Model( {
    data() {
        return this.$request( 'url' );
    },
    validations : {
        bio : {
            required : true,
            maxlength : 100
        }
    },
    submit() {
        return this.$request( 'url', {
            method : 'POST,
            data : {
                bio : 
            }
        } ).then( response => {
            if( +response.errno ) {
                throw response;
            }
            return response;
        } );
    }
} );
~~~

### Properties of J.Model instance

#### $data

The real data of the model instane would be stored in `$data` property, so if you want to get or set data, please use `$data`.

~~~js
new J.Model( {
    data : {
        name : 'Jolin'
    },
    init() {
        this.$data.name = 'J';
    }
} );
~~~

#### $package

The package which was bound to the model.

### Methods of J.Model instance

#### $assign

Assign a value to the `$data` of the instance.

__Syntax__

~~~js
model.$assign( dest, key, value );
model.$assign( key, value );
model.$assign( value );
~~~

__Parameters__

- **dest** | `Object`

The target object that you want to set data to.

- **key** | `String`

The key of the value you want ot assign.

- **value** | `Mixed`

The value that you want to add.

__Examples__

~~~js
new J.Model( {
    data : {
    },
    init() {
        this.$assign( account, {
            name : 'Jolin'
        } );

        this.$assign( this.$data.account, 'age', 12 );

        this.$request( url ).then( response => {
            this.$assign( response );
        } );
    }
} );
~~~

#### $pure

To get the purified data which was remove the [special properties](#special-properties-of-jmodel) such as `$ready`, `$loading`.

__Syntax__

~~~js
model.$pure( keys )
~~~

__Parameters__

- **keys** | `Array`

The data you want to get from `$data`, the whole data will return if `keys` is undefined.

__Return value__

The data from `$data`;

__Examples__

~~~js
new J.Model( {
    data : {
    },
    submit() {
        return this.$request( url, {
            method : 'POST',
            data : this.$pure()
        } );
    }
} );
~~~

#### $reset

Resetting the `$data` to the initial data that was created or loaded while initializing the instance.

__Syntax__

~~~js
model.$pure( keys )
~~~

__Return value__

Returns a Promise instance, the value of the Promise instance is the `$data` after resetting.

__Examples__

~~~js
new J.Model( {
    data : {
        id : 1
    },

    init() {
        this.$data.id = 2;
    },

    action() {
        this.$reset();
        /**
         * the data will be reset to:
         * {
         *    id : 1 
         * }
         */
    }
} );
~~~

~~~js
new J.Model( {
    data : {
        return Promise.resolve( {
            id : 1
        } );
    },
    init() {
        this.$data.id = 2;
    },
    action() {
        this.$reset();
        /**
         * the data will be reset to:
         * {
         *     id : 1
         * }
         */
    }
} )
~~~

You can also call the method in a template.

~~~html
<form :if="model && model.$ready">
    <input type="text" :model="model.id" $value="model.id" />
    <input type="reset" :prevent="click" @click="model.$reset()" />
</form>
~~~

#### $refresh

To refresh the data of the J.Model instance, if the initial data was loaded from remote server, it would be loaded again.


__Syntax__

~~~js
model.$refresh()
~~~

__Return value__

Returns a Promise instance with the `$data` of the model as its value.

__Examples__

~~~js
new J.Model( {
    data() {
        return this.$request( 'url' );
    },
    action() {
        // while calling $refresh, the request in the data method will be send again for getting new data from the url.
        this.$refresh();
    }
} );
~~~

~~~html
<div :if="model && model.$ready">
    <span>ID: {{model.id}}</span>
    <a href="#" :prevent @click="model.$refresh()">Refresh<</a>
</div>
~~~

#### $reload

By using the method `$refresh` you can refresh data of the model, but you cannot set new options for the model.

Method `$reload` makes you can reload data with different options.

__Syntax__

~~~js
model.$reload( options )
~~~

__Parameters__

- **options** | `Object`

    The new options that about reloading data.

__Return value__

A Promise instance which has a value as the `$data` of the model.

__Examples__

~~~js
new J.Model( {
    data() {
        return this.$request( 'url', {
            id : this.id
        } );
    }
} );
~~~

~~~html
<div :if="model && model.$ready">
    {{model.xxx}}
    <a href="#" :prevent @click="model.reload( { id : 123 } )">
        Reload data with another ID
    </a>
</div>
~~~


#### $request

The send an AJAX request, the value of `$requesting` and `$error` will be changed in this method as the status changing.

__Syntax__

~~~js
model.$request( options )
~~~

__Parameters__

Please view [J.Request](#jrequest) to get more information of the params of this method.

__Return value__

A Promise instance wiht the response data as its value.

__Examples__

You can define another method for dealing with the response data with the rules you are using.

~~~js
new J.Model( {
    request( ...args ) {
        return this.$request( ...args ).then( response => {
            if( +response.errno ) {
                throw  response;
            }
            return response;
        } ).catch( e => {
            this.$data.$error = error;
        });
    }
} );
~~~

#### $submit

To submit data to an API, this method will call a "submit" method (or method with another specified name) you defined in this model, and this method will help you to do validation and manage status of `$error` and `$submitting`.

__Syntax__

~~~js
model.$submit( method = 'submit', multiple = false, ...args );
~~~

__Parameters__

- **method** | `String`

    The method name which will be called by `$submit`, "submit" by default.

- **multiple** | `Boolean`

    Denoting if you would like to allow to send multiple request at the same time, the default value is `false`, so, the method would check whether the value of `$submitting` is true, then prevent the new submitting and return a rejected Promise instance. If you set this value to `true`, the method will not check the status.

- **...args** | `Arguments`

    The params that will be pass in to the `submit` method or the method you specified.

__Return value__

A Promise instance which has the response data as its value.

__Examples__

~~~js
new J.Model( {
    submit() {
        return this.$request( 'url', {
            method : 'POST',
            data : {
                name : 'Jolin'
            }
        } ).then( response => {
            this.$signal( 'success', response );
        } );
    }
} );
~~~

~~~html
<form :prevent :submit="model.$submit()">
    <input type="submit" value="submit" />
</form>
~~~


#### $watch

The watch an expression based on current model.

__Syntax__

~~~js
model.$watch( exp, handler )
~~~

__Parameters__

- **exp** | `String`

The expression that you want to listen to.

- **handler** | `Function`

The callback function will execute while the expression, that you are listening to, changed.

__Examples__

~~~js
new J.Model( {
    data : {
        name : 'Jolin'
    },
    init() {
        this.$watch( 'name', () => {
            this.$submit();
        } );
    },
    submit() {
        return this.$request( 'url', {
            method : 'POST",
            data : {
                name : this.$data.name
            }
        } );
    }
} );
~~~

#### $unwatch

To stop from watching the changes of an expression.

__Syntax__

~~~js
model.$unwatch( exp, handler )
~~~

__Parameters__

- **exp** | `String`

The expression which you are listening to.

- **handler** | `Function`

The callback function that you bound to the expression before.

__Examples__

~~~js
new J.Model( {
    data : {
        name : 'Jolin'
    },
    init() {
        const handler = val => {
            console.log( val );
        };
        this.$watch( 'name', handler );
        this.$unwatch( 'name', handler );
    }
} );
~~~

#### $validate

To validate the value of specified data, the rules in `validations` will be used for validating the data.

__Syntax__

~~~js
model.$validate( field )
~~~

__Parameters__

- **field** | `String`

The name of the field which you want to check and defined in `validations`.

__Return value__

The result of the validation as a boolean value.

__Examples__

~~~js
new J.Model( {
    data : {
        name : 'Jolin'
    },
    validations : {
        name : {
            required : true
        }
    },
    submitName() {
        if( this.$validate( 'name' ) === false ) {
            return.
        }
    }
} );
~~~

By calling this method, the value of `$validation` will change too, so you can get the status from template.

~~~html
<input type="name" :model="model.name" $value="model.name" />
<p :if="model.$validation.name.$error.required">
    The name is required.
</p>
~~~

### Filter Package

You can create a package just for one or some filters for using them in templates, and to load them by adding their paths to the `filters` while installing a J.View instance.

A `Filter Package` is a simple package with nothing different from other package, and the package would be load by J.View, and all methods would be seemed as a filter function.

For example, this is a `Filter Package` for doing some simple operations to an `Array`:

~~~js
J.Package( {
    sum( arr ) {
        return arr.reduce( ( a, b ) => a + b, 0 );
    },
    max( arr ) {
        return Math.max.apply( null, arr );
    }
} );
~~~

You can load this `Filter Package` while installing the view, and use the filters in the template:

~~~js
J.Package( {
    init() {
        this.$install( 'view', new J.View( {
            container : document.body,
            template : `{{[1,2,3] # number.sum}}`,
            filters : {
                number : 'http://xxx.xx/packages/filters/number' // path of the package.
            }
        } ) );
    }
} );
~~~

You can also use another `Filter Package` in current package, then you can reuse more code of filters:

~~~js
J.Package( {
    init() {
        // mount the filter package as a sub package.
        return this.$mount( 'filter1', 'path of filter1' );
    },
    f1() {
        return this.$find( 'filter1' ).func1( ...params );
    }
} );
~~~

### Model Package

Sometimes, we wouldn't like to manage all of the models and views in one single package, as we want to reuse one model in different packages, so, you can create a `Model Package` for the model.

A `Model Package` is also a simple package, but there is a little difference between a simple package and a `Model Package`.

In a `Model Package`, you need to install J.Model with a name "data", or else, you should provide a method named "expose" and return the real data in the "expose" method.

~~~js
J.Package( {
    init( options ) {
        this.$install( 'data', new J.Model( {
            data : {
                name : options.name
            }
        }, {
            name : 'data',
            package : this
        } ) );
    },
    expose() {
        // if the name of the model is "data", you can omit this method.
        return this.data;
    }
} );
~~~

In another which is using this `Model Package`, you can just mount it as normal as a simple sub package, or load it while installing a view as follow:

~~~js
J.Package( {
    init() {
        this.$install( 'view', new J.View( {
            container : document.body,
            url : 'view.html',
            models : this.$mount( 'model', 'path of model package', {
                name : 'Jolin'
            } )
        }, {
            name : 'view',
            package : this
        } ) );
    }
} );
~~~

### Language

### J.Storage

We provide methods for you to store the data in the local in defferent levels:

| Level | Description |
|:------|:------------|
| page | to store data in memory so that the data would not need to be loaded multiple times until the user leave this page or reach the specified lifetime which caching the data. |
| session | to store data in session storage if the browser supports it, or it will be stored in the local by other ways like local storage or indexedDB. The data will be removed after current session or reaching the lifetime. |
| persistent | to store data persistently, it would not be removed util you remove it or the time reachs the lifetime. |

You can set storage options while calling `J.request` method:

~~~js
J.request( url, {
    params : {
    },
    storage : {
        level : 'page',
        priority : 6,
        lifetime : 10000
    }
} );
~~~


## J.EventCenter

The classes `J`, `J.Package` and `J.Extension` are extends from an event center which is `J.EventCenter`.

## J.Promise

We implemented a Promise in Jolin by following the standards of [Promise A+](https://promisesaplus.com/). You can use this Promise object by calling `J.Promise` if the browsers you want to support do not support a native Promise object. And it also will be working well with the native Promise in browsers we support.

~~~js
new J.Promise( resolve => {
    return window.Promise.resolve( 'Jolin' );
} ).then( name => {
    // name is Jolin
} ).catch( e => {
    console.error( e );
} );

J.Promise.all( [
    window.Promise.resolve(),
    J.Promise.resolve()
] );

window.Promise.race( [
    window.Promise.resovle(),
    J.Promise.resolve()
] );
~~~

## Browser Support

> Level 0 ( Compiled with Babeljs )
    IE 9/9+
    Chrome 4/4+
    Firefox 2/2+
    Safari 4/4+
    iOS Safari 6/6+
    Android 2.1/2.1+
    Edge 12/12+

> Level 1 ( Not compiled with Babeljs )
    Edge 14/14+
    Firefox 48/48+
    Chrome 50/50+
    Safari 10/10+tes
    Opera 37/37+
