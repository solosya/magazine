import Handlebars from 'handlebars'
import { Templates } from './article-templates'


window.Acme       = window.Acme || {};
Acme.View         = Acme.View   || {};
Acme.Model        = Acme.Model  || {};
// Acme.Collection   = {};
// Acme.Controller   = {};
// Acme.State        = {};
// Acme.SigninView   = {};
// Acme.SigninView   = {};



export const Server = {
    create: function(uri, queryParams) {return this.call(uri, queryParams, 'post');},
    fetch: function(uri, queryParams, datatype){return this.call(uri, queryParams, 'get', datatype);},
    update: function(uri, queryParams) {return this.call(uri, queryParams, 'put');},
    delete: function(uri, queryParams) {return this.call(uri, queryParams, 'delete');},
    call: function(uri, queryParams, type, datatype) {

        if (!window.location.origin) {
                window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '');
        }
        type = (typeof type !== 'undefined') ? type : 'get';

        queryParams = (typeof queryParams !== 'undefined') ? queryParams : {};
        
        var url = (uri.indexOf("http") === 0) ? uri : _appJsConfig.appHostName + uri;
        
        return $.ajax({
            url: url,
            data: queryParams,
            dataType: datatype || "json",
            type: type,
            beforeSend: function(xhr) {
                if (type !== 'get' && url.indexOf('https://hivenews') === -1) {
                    var token = $('meta[name="csrf-token"]').attr("content");
                    // console.log('adding token2', token);
                    xhr.setRequestHeader('x-csrf-token', token);
                }
            }
        }).fail(function(r) {
            // console.log(r);
            if (r.status == 501 || r.status == 404) console.log(r.responseText);
            if (r.responseJSON) console.log(r.responseJSON);
            console.log(r.responseText);
        });
    }
}

Acme.listen = function() {};
Acme.listen.prototype.listener = function(topic, data)
{
    // console.log(listner);
    var keys = Object.keys(data);
    for (var i = 0; i<keys.length; i++) {
        for (var listener in this.listeners) {
            if ( listener === keys[i] ) {
                this.listeners[listener].call(this, data, topic);
                if (this.listeners.after) {
                    this.listeners.after.call(this, data, topic);
                }
                break;
            }
        }
    }
};


Acme.Model.create = function(config)
{
    var obj = Object.create(
    Acme._Model.prototype, {
        'resource': {
                'value' : config['url'],
                'enumerable': true,
            },
            'alias' : {
                'value' : config['alias'] || null,
                'enumerable': true,
            },
            'resource_id': {
                'value' : config['resource_id'],
                'enumerable': true,
            },
            'query' : {
                'value': [],
                'writable': true,
                'enumerable': true,
            }
        }
    );
    for (var param in config['this']) {
        obj[param] = config['this'][param];
    }
    obj.messages = {
        'set'   : 'updated',
        'delete': 'deleted',
    };

    if (config['messages']) {
        for (var msg in config['messages']) {
            obj.messages[msg] = config['messages'][msg];
        }
    }

    return obj;
};


// Used by Acme.form
export const View = function() {};
    View.prototype = new Acme.listen();
    View.prototype.updateData = function(data) {
        var keys = Object.keys(data);
        for (var j=0; j<keys.length; j++) {
            var key = keys[j];
            var keySplit = key.split('.');
            var scope = this.data;

            for(var i=0; i<keySplit.length; i++) {
                if (!scope[keySplit[i]]) {
                    scope[keySplit[i]] = {};
                }
                if(i == keySplit.length -1 ) {
                    scope[keySplit[i]] = data[key];
                }
                scope = scope[keySplit[i]];
            }
        }
    }

// Acme.View.create = function(config)
// {
//     var obj = function(){};

//     for (conf in config) {
//         obj.prototype[conf] = config[conf];
//     }

//     return obj;
// }


export const PubSub = {
    topics : {},
    lastUid : -1,
};

    PubSub.publisher = function(topic, data) {
        var self = this;
        var Deferred = function() {
            return {
                done: function(func) {
                    this.func = func;
                },
                resolve: function() {
                    if (this.func) {
                        this.func();
                    }
                }
            }
        };

        if ( !this.topics.hasOwnProperty( topic ) ){
            return false;
        }

        var dfd = Deferred();

        var notify = function(){
            var subscribers = self.topics[topic];

            for ( var i = 0, j = subscribers.length; i < j; i++ ){
                var scope = window;
                var scopeSplit = subscribers[i].context.split('.');

                for (var k = 0; k < scopeSplit.length - 1; k++) {
                    scope = scope[scopeSplit[k]];
                    if (scope == undefined) return;
                }

                var caller = scope[scopeSplit[scopeSplit.length - 1]];
                var func   = subscribers[i].func;
                if (caller) {
                    caller[func]( topic, data );
                }
            }
            dfd.resolve();
        };

        setTimeout( notify , 0 );

        return dfd;
    };

    PubSub.publish = function( topic, data ){
        return this.publisher( topic, data, false );
    };

    PubSub.reset = function( ){
        this.lastUid = -1;
    };

    PubSub.print = function(){
        var subscribers = this.topics;
        for (var sub in subscribers) {
            for ( var i = 0; i < subscribers[sub].length; i++ ) {
            }
        }
    };

    PubSub.subscribe = function( subscription ) {
        var callbacks = Object.keys(subscription);
        var ret_topics = {};

        for (var i=0;i<callbacks.length; i++) {
            for(var j=0;j<subscription[callbacks[i]].length;j++) {
                var topic = subscription[callbacks[i]][j];

                var context = callbacks[i].substring(0, callbacks[i].lastIndexOf('.'));

                var func = callbacks[i].substring(callbacks[i].lastIndexOf('.') + 1);

                if ( !this.topics.hasOwnProperty( topic ) ) {
                    this.topics[topic] = [];
                }

                for (var k=0;k<this.topics[topic].length; k++) {
                    if (this.topics[topic][k].context === context && this.topics[topic][k].func === func) {
                        return;
                    }
                }

                var token = (++this.lastUid).toString();

                this.topics[topic].push( { token : token, func : func, context : context } );
                ret_topics[topic] = this.topics[topic];
            }

        }
        return ret_topics;
    };

    PubSub.unsubscribe = function( token ){
        for ( var m in this.topics ){
            if ( this.topics.hasOwnProperty( m ) ){
                for ( var i = 0, j = this.topics[m].length; i < j; i++ ){
                    if ( this.topics[m][i].token === token ){
                        this.topics[m].splice( i, 1 );
                        return token;
                    }
                }
            }
        }
        return false;
    };











     
export const Modal = function(template, name, layouts, data) {
    this.template = template || null;
    this.parentCont = name   || null;
    this.layouts = layouts   || null;
    this.data = data         || {};
    this.dfd = $.Deferred();
}
    Modal.prototype = new Acme.listen();

    Modal.prototype.render = function(layout, title, data) {
        this.data = data || this.data;
        
        if (title) {
            this.data['title'] = title;
        }
        this.data['name'] = this.parentCont;
        var tmp = Handlebars.compile(Templates[this.template]);
        var tmp = tmp(this.data);

        $('html').addClass('u-noscroll')
        $('body').addClass('u-noscroll').append(tmp);
        if (layout) {
            this.renderLayout(layout, this.data);
        }
        this.events();
        this.rendered(); // lifecycle hook that can be overriden
        return this.dfd.promise();
    };
    Modal.prototype.renderLayout = function(layout, data) {

        var data = data || {};
        var tmp = Handlebars.compile(Templates[this.layouts[layout]]);
        var layout = tmp(data);

        $('#'+this.parentCont).find('#dialogContent').empty().append(layout); 
    };
    Modal.prototype.events = function() 
    {
        var self = this;
        $('#'+this.parentCont).on("click", function(e) {
            // console.log(self.handler);
            self.handle(e);
        });

    };
    Modal.prototype.rendered = function() {
        return true;
    };
    Modal.prototype.handle = function(e) {
        var $elem = $(e.target);

        if ( !$elem.is('input') && !$elem.is('a') && !$elem.parent().is('a') ) {
            e.preventDefault();
        }
        if ($elem.data('behaviour') == 'close') {
            e.preventDefault();
            this.closeWindow();
            return $elem;
        }
        if ( $elem.is('button') ) {
            if ($elem.text().toLowerCase() === "cancel" || $elem.data('role') == 'cancel') {
                this.dfd.fail();
                this.closeWindow();

            } else if ($elem.text().toLowerCase() === "okay" || $elem.data('role') == 'okay') {
                this.dfd.resolve();
                this.closeWindow();
            }
        }
        return $elem;
    };
    Modal.prototype.closeWindow = function() {
        $('html').removeClass('u-noscroll');
        $('body').removeClass('u-noscroll');
        $('#'+this.parentCont).remove();
    };




// Acme.dialog = {
//     type : '',
//     state : {},

//     show : function(message, type, callback, self, data) {
//         var that = this;
//         var template  = '<div id="wrapper" class="flex_col"> <div id="dialog"><div><p id="dialogTitle">{{title}}</p><div id="dialogMessage">{{message}}</div>';
//             template += '<ul id="dialogButtons"><button>Okay</button><button>Cancel</button></div></div></div>';

//         template = template.replace( /{{title}}/ig, type || "");
//         template = template.replace( /{{message}}/ig, message);
//         var dfd = $.Deferred();

//         $('body').append(template);
//         $('#dialog').on("click", function(e) {
//             var $elem = $(e.target);
//             if (!$elem.is('input')) {
//                 e.preventDefault();
//             }

//             if ( $elem.is('button') ) {
//                 if ($elem.text() === "Cancel") {
//                     Acme.dialog.closeWindow();
//                 } else if ($elem.text() === "Okay") {
//                     Acme.dialog.closeWindow();

//                     // State can be provided by client external to 'show' call
//                     if (data === undefined && that.state) {
//                         data = that.state;
//                     // If data is also provided we merge the two
//                     } else if (that.state) {
//                         var keys = Object.keys(that.state)
//                         for (var k=0; k<keys.length;k++) {
//                             data[keys[k]] = that.state[keys[k]];
//                         }
//                     }

//                     if (self != undefined) {
//                         if (data != undefined) {
//                             var result = callback.call(self, data);
//                             dfd.resolve(result);
//                         } else {
//                             var result = callback.call(self);
//                             dfd.resolve(result);
//                         }
//                     } else {
//                         var result = callback();
//                         dfd.resolve(result);
//                     }
//                 }
//             }
//         });
//         return dfd.promise();
//     },
//     closeWindow : function() {
//         $('#dialog').closest('#wrapper').remove();
//     }
// };







