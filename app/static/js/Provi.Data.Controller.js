/**
 * @fileOverview This file contains the {@link Provi.Data.Controller} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * @namespace
 * Provi data controller module
 */
Provi.Data.Controller = {};


(function() {

/** @exports Utils as Provi.Utils */
var Utils = Provi.Utils;


/**
 * @class
 */
Provi.Data.Controller.DataMixin = {
    available_widgets: {},
    init: function( params ){
        var self = this;
        this.retrieve_data( function(d){
            self.set_data( d );
            console.log( 'DataMixin', d );
        });
        Provi.Data.Dataset.prototype.init.call(this, params);
    },
    retrieve_data: function( onload ){
        var get_params = { 'id': this.server_id+'' };
        $.get( '../../data/get/', get_params, onload, 'text' );
    }
}


/**
 * @class
 */
Provi.Data.Controller.JmolMixin = {
    available_widgets: {},
    init: function( params ){
        var self = this;
        if(params.applet){
            this.load( params.applet );
        }
        Provi.Data.Dataset.prototype.init.call(this, params);
    },
    load: function( applet ){
        var get_params = '?id=' + this.server_id + '&session_id=' + $.cookie('provisessions');
        var url = '../../data/get/'
        applet.script('load ' + url + get_params + ';', true);
    }
}


Provi.Data.Controller.ProviMixin = {
    available_widgets: {},
    init: function( params ){
        var self = this;
        this.retrieve_data( function(d){
            self.set_data( d );
            console.log( 'ProviMixin', d );
            self.load( d );
        });
        Provi.Data.Dataset.prototype.init.call(this, params);
    },
    retrieve_data: function( onload ){
        var get_params = { 'id': this.server_id+'' };
        $.getJSON( '../../data/get/', get_params, onload );
    },

    load: function( d ){
        var self = this;
        var jw_dict = {};
        var ds_dict = {};
        var wg_dict = {};

        _.each( d, function(data, i){
            var func;
            if( data.params ){
                _.each( data.params , function(value, key){
                    console.log();
                    var m = value.match(/DATASET_(\d+)/i);
                    if( m ){
                        console.log(m, m[1], ds_dict, ds_dict[ m[1] ]);
                        data.params[key] = ds_dict[ m[1] ];
                    }
                });
            }
            console.log(i, data);
            if( data.type=='story' ){
                ds_dict[i] = ( new Provi.Data.Dataset({type:'story'}) ).init( data.params );

            }else if( data.type=='widget' ){
                func = function(){
                    var widget = eval( data.widgetname );
                    wg_dict[i] = new widget( data.params );
                }
            }else if( data.type=='function' ){
                console.log("FUNCTION", data);
                func = function(){
                    eval( data.funcname )( data.params );
                }
            }else{
                if( data.applet==="default" ){
                    var jw = Provi.Jmol.get_default_applet(true).widget;
                    console.log(jw);
                }else if(jw_dict[data.applet]){
                    var jw = jw_dict[data.applet];
                }else{
                    var jw = new Provi.Jmol.JmolWidget({ parent: this.parent_id });
                }
                jw_dict[i] = jw;
                var params = $.extend( (data.params || {}), {
                    applet: jw.applet,
                    load_as: (data.load_as || 'new')
                });
                ds_dict[i] = Provi.Data.Io.import_example( 
                    data.dir, data.filename, data.type, params, function(ds){console.log('LOADED', ds)}, true 
                );
                func = function(){
                    var ds = ds_dict[i];
                    console.log('FUNC', ds, ds.get_status().server, params, ds.type);
                    if( ds.get_status().server==="Ok" ){
                        ds.init( params );
                    }else{
                        $(ds).bind('loaded', function(){
                            ds.init( params );
                        });
                    }
                }
            }

            if(func){
                console.log(func);
                if(typeof data.when !== "undefined"){
                    $(ds_dict[ data.when ]).bind('loaded2', function(){
                        func();
                    });
                }else{
                    func();
                }
                console.log("func end");
            }
        });
    }
}


/**
 * @class
 */
Provi.Data.Controller.AtomPropertyMixin = {
    available_widgets: {},
    init: function(params){
        var self = this;
        if( params.applet ){
            this.load( params.applet );
        }
        Provi.Data.Dataset.prototype.init.call(this, params);
    },
    load: function( applet ){
        var get_params = '?id=' + this.server_id + '&session_id=' + $.cookie('provisessions');
        var url = '../../data/get/';
        // applet.script_wait('load DATA '"" + url + get_params + '";');
        var s = '' +
            'select *;' +
            'x = load("' + url + get_params + '");' +
            'line1_end = x.find("\n");' + 
            'line1 = x[1][line1_end-1];' + 
            'columns = line1.split(" ");' +
            'd = x[line1_end][0];' + 
            'i = 0;' +
            'names = [];' +
            'for(c in columns){' +
                'i = i+1;' +
                'name = "property_" + c;' +
                'names = names + name;' +
                's = "DATA \\"" + name + " 0 " + i + " @d\\";";' + 
                's2 = "{selected and " + name + " = 9}." + name + " = NaN;";' + 
                'script INLINE @s;' +
                'script INLINE @s2;' +
                'print "provi property: " + name;' +
            '}' +
            'select none;' +
            'print "provi property ds ' + this.id + ': " + names.join(" ");' +
        '';
        console.log(s);
        applet.script_wait(s, true);
    }
}


/**
 * @class
 */
Provi.Data.Controller.AtomSelectionMixin = {
    available_widgets: {},
    init: function(params){
        var self = this;
        if( params.applet ){
            this.load( params.applet );
        }
        Provi.Data.Dataset.prototype.init.call(this, params);
    },
    load: function( applet ){
        var get_params = '?id=' + this.server_id + '&session_id=' + $.cookie('provisessions');
        var url = '../../data/get/';
        var s = '' +
            // 'while(true){' +
            //     'try{' +
                    'x = load("' + url + get_params + '");' +
                    'lines = x.split();' +
                    'names = [];' +
                    'if(!provi_selection){ provi_selection = {} }' +
                    'for(l in lines){' +
                        'fields = l.split(" ");' +
                        'print fields;' +
                        'print fields.join(" - ");' +
                        'name = fields[1];' +
                        'names = names + name;' +
                        'd = fields[2][0];' +
                        'd = d.sub(1);' +
                        'sele = "({" + d.join(" ") + "})";' +
                        'provi_selection[name] = sele;' + 
                        'print "provi selection: " + name;' +
                    '}' +
                    'print "provi selection ds ' + this.id + ': " + names.join(" ");' +
                // '}catch(e){' +
                //     'print "provi dataset: ' + this.id + ' error " + e;' +
                //     'var log_error = "console.error(\'provi dataset: ' + this.id + ' error " + e + "\')";' +
                //     'javascript @log_error;' +
                //     'break;' +
                // '}' +
                'print "provi dataset: ' + this.id + ' loaded";' +
            //     'break;' +
            // '}' +
        '';
        console.log(s);
        applet.script_wait(s, true);
    }
}



Provi.Data.Controller.extend_by_type = function( obj, type ){
    
    var Ctrl = Provi.Data.Controller;
    
    if( _.include(Provi.Data.types.structure, type) ){
        $.extend( obj, Ctrl.StructureMixin );
    }else if( _.include(Provi.Data.types.interface_contacts, type) ){
        $.extend( obj, Ctrl.InterfaceContactsMixin );
    }else if( type === 'mplane' ){
        $.extend( obj, Ctrl.MplaneMixin );
    }else if( _.include(Provi.Data.types.isosurface, type) ){
        $.extend( obj, Ctrl.IsosurfaceMixin );
    }else if( _.include(Provi.Data.types.volume, type) ){
        $.extend( obj, Ctrl.VolumeMixin );
    }else if( type === 'jspt' ){
        $.extend( obj, Ctrl.ScriptMixin );
    }else if( type === 'tmhelix' ){
        $.extend( obj, Ctrl.TmHelicesMixin );
    }else if( type === 'anal' ){
        $.extend( obj, Ctrl.HbondsMixin );
    }else if( type === 'vol' ){
        $.extend( obj, Ctrl.VoronoiaMixin );
    }else if( type === 'ndx' ){
        $.extend( obj, Ctrl.NdxMixin );
    }else if( type === 'story' ){
        $.extend( obj, Ctrl.StoryMixin );
    }else if( type === 'prop' ){
        $.extend( obj, Ctrl.PropensitiesMixin );
    }else if( type === 'jmol' ){
        $.extend( obj, Ctrl.JmolMixin );
    }else if( type === 'atmprop' ){
        $.extend( obj, Ctrl.AtomPropertyMixin );
    }else if( type === 'atmsele' ){
        $.extend( obj, Ctrl.AtomSelectionMixin );
    }else if( type === 'provi' ){
        $.extend( obj, Ctrl.ProviMixin );
    }else{
        console.log('unkown file type', obj, type);
        $.extend( obj, Ctrl.DataMixin );
    }
}



})();