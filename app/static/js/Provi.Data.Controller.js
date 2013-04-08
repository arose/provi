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
        applet._delete();
        applet.script('load ' + url + get_params + ';', { maintain_selection: true, try_catch: true });
    }
}


/**
 * @class
 */
Provi.Data.Controller.PngMixin = {
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
        applet._delete();
        applet.script('load ' + url + get_params + ';', { maintain_selection: true, try_catch: true });
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
                    if( _.isString(value) ){
                        var m = value.match(/DATASET_(\d+)/i);
                        if( m ){
                            console.log(m, m[1], ds_dict, ds_dict[ m[1] ]);
                            data.params[key] = ds_dict[ m[1] ];
                        }
                    }
                });
            }
            console.log(i, data);
            if( data.type=='story' ){
                ds_dict[i] = ( new Provi.Data.Dataset({type:'story'}) ).init( data.params );

            }else if( data.type=='widget' ){
                var params = $.extend( (data.params || {}), {
                    applet: jw_dict[data.applet].applet
                });
                func = function(){
                    var widget = eval( data.widgetname );
                    wg_dict[i] = new widget( params );
                }
            }else if( data.type=='function' ){
                console.log("FUNCTION", data);
                func = function(){
                    console.log("FUNCTION called", data.funcname, data);
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
                if( !data.dir || data.dir=="RELATIVE" ){
                    console.log(self);
                    var dir = self.meta.directory;
                    var filename = '' + 
                        self.meta.filename.split('/').slice(0,-1).join('/') + 
                        '/' + data.filename;
                }else{
                    var dir = data.dir;
                    var filename = data.filename
                }
                ds_dict[i] = Provi.Data.Io.import_example( 
                    dir, filename, data.type, params, function(ds){console.log('LOADED', i, ds)}, true 
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
        var url = '../../data/get/' + get_params;
        var s = 'provi_load_property("' + url + '", {*}, "' + this.id + '");';
        console.log(s);
        applet.script(s, { maintain_selection: true, try_catch: false });
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
        var url = '../../data/get/' + get_params;
        s = 'provi_load_selection("' + url + '", "' + this.id + '");';
        console.log(s);
        applet.script(s, { maintain_selection: true, try_catch: false });
    }
}



/**
 * @class
 */
Provi.Data.Controller.BondsMixin = {
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
            'x = load("' + url + get_params + '");' +
            'bond_count_before = {*}.bonds.size;' +
            'script INLINE @x;' +
            'bond_count_after = {*}.bonds.size;' +
            'bs = "[{" + (bond_count_before) + ":" + (bond_count_after-1) + "}]";' +
            'hide add @bs;' +
            'print "provi dataset: ' + this.id + ' loaded | " + ' +
                '"provi bonds ds ' + this.id + ': " + bond_count_before + " " + bond_count_after;' +
        '';
        console.log(s);
        applet.script(s, { maintain_selection: true, try_catch: false });
    }
}


/**
 * @class
 */
Provi.Data.Controller.StructureMixin = {
    available_widgets: {
        'StructureWidget': Provi.Bio.Structure.StructureWidget
    },
    load_params_widget: [{
        params: [
            { name: 'load_as', getter: 'get_load_as' },
            { name: 'filter', getter: 'get_filter' },
            { name: 'lattice', getter: 'get_lattice' },
            { name: 'pdb_add_hydrogens', getter: 'get_pdb_add_hydrogens' }
        ],
        obj: Provi.Bio.Structure.StructureParamsWidget
    }],
    init: function(params){
        Provi.Data.Dataset.prototype.init.call(this, params);
        if( params.applet ){

            var get_params = '?id=' + this.server_id + '&session_id=' + $.cookie('provisessions');
            //var params = '?id=' + this.dataset.server_id;
            
            if( $.inArray(this.type, ['pdb', 'pqr', 'ent', 'sco', 'mbn', 'vol']) >= 0 ){
                get_params += '&data_action=get_pdb';
            }

            filename = '../../data/get/' + get_params + '"';

            if( !params.script ) params.script = '';
            params.script += 'print "provi dataset: ' + this.id + ' loaded";';

            new Provi.Bio.Structure.Structure( $.extend( params, {
                filename: filename,
                type: this.type,
                dataset: this
            }));
        }
    }
}


/**
 * @class
 */
Provi.Data.Controller.StoryMixin = {
    available_widgets: {
        'StoryWidget': Provi.Widget.StoryWidget
    },
    init: function( params ){
        var self = this;
        new Provi.Widget.StoryWidget( $.extend( params, {
            parent_id: Provi.defaults.dom_parent_ids.DATASET_WIDGET,
            dataset: self
        }));
        Provi.Data.Dataset.prototype.init.call(this, params);
    }
}


/**
 * @class
 */
Provi.Data.Controller.ScriptMixin = {
    available_widgets: {},
    init: function( params ){
        var self = this;
        this.retrieve_data( function(d){
            self.set_data( d );
            if( params.applet ){
                self.load( params.applet );
            }
        });
        Provi.Data.Dataset.prototype.init.call(this, params);
    },
    retrieve_data: function( onload ){
        var get_params = { 'id': this.server_id+'' };
        $.get( '../../data/get/', get_params, onload, 'text' );
    },
    load: function(applet){
        applet.script( this.data );
    }
}


/**
 * @class
 */
Provi.Data.Controller.MplaneMixin = {
    available_widgets: {
        'MplaneWidget': Provi.Bio.MembranePlanes.MplaneWidget
    },
    init: function( params ){
        var self = this;
        console.log('MPLANE init');
        this.retrieve_data( function(d){
            console.log('MPLANE onload');
            self.set_data( new Provi.Bio.MembranePlanes.Mplane( d[0], d[1], d[2] ) );
            if( params.applet ){
                console.log('MPLANEdfmgmsdpfgmsdpsd');
                new Provi.Bio.MembranePlanes.MplaneWidget( $.extend( params, {
                    parent_id: Provi.defaults.dom_parent_ids.DATASET_WIDGET,
                    dataset: self
                }));
            }
        });
        Provi.Data.Dataset.prototype.init.call(this, params);
    },
    retrieve_data: function( onload ){
        console.log('MPLANE retrieve');
        var get_params = { 'id': this.server_id+'', 'data_action': 'get_planes', 'session_id': $.cookie('provisessions') };
        //$.getJSON( '../../data/get/', get_params, onload );
        $.ajax({
            dataType: "json",
            url: '../../data/get/',
            data: get_params,
            success: onload,
            error: function(e){ console.log(e); }
        });
    }
}


/**
 * @class
 */
Provi.Data.Controller.IsosurfaceMixin = {
    available_widgets: {
        'IsosurfaceWidget': Provi.Bio.Isosurface.IsosurfaceWidget
    },
    load_params_widget: [
        {
            params: [
                { name: 'within', getter: 'get_within' },
                { name: 'insideout', getter: 'get_insideout' },
                { name: 'reload_widget', getter: 'get_reload_widget' }
            ],
            obj: Provi.Bio.Isosurface.LoadParamsWidget
        }
    ],
    init: function( params ){
        var self = this;
        Provi.Data.Dataset.prototype.init.call(this, params);
        console.log( this, params );
        if( params.reload_widget ){
            params.reload_widget.reload(params);
        }else if( params.applet ){
            new Provi.Bio.Isosurface.IsosurfaceWidget({
                parent_id: 'tab_widgets',
                dataset: self,
                applet: params.applet,
                within: params.within,
                insideout: params.insideout,
                select: params.select,
                ignore: params.ignore,
                color: params.color,
                style: params.style,
                focus: params.focus,
                sele: params.sele
            });
        }
    }
}


/**
 * @class
 */
Provi.Data.Controller.VolumeMixin = {
    available_widgets: {
        'VolumeWidget': Provi.Bio.Isosurface.VolumeWidget
    },
    load_params_widget: [
        {
            params: [
                { name: 'within', getter: 'get_within' },
                { name: 'insideout', getter: 'get_insideout' },
                { name: 'reload_widget', getter: 'get_reload_widget' }
            ],
            obj: Provi.Bio.Isosurface.LoadParamsWidget
        },
        {
            params: [
                { name: 'sigma', getter: 'get_sigma' },
                { name: 'cutoff', getter: 'get_cutoff' },
                { name: 'sign', getter: 'get_sign' },
                { name: 'color_density', getter: 'get_color_density' },
                { name: 'downsample', getter: 'get_downsample' }
            ],
            obj: Provi.Bio.Isosurface.VolumeParamsWidget
        },
        {
            params: [
                { name: 'resolution', getter: 'get_resolution' },
                { name: 'select', getter: 'get_select' },
                { name: 'ignore', getter: 'get_ignore' },
                { name: 'type', getter: 'get_type' }
            ],
            obj: Provi.Bio.Isosurface.SurfaceParamsWidget
        }
    ],
    init: function( params ){
        var self = this;
        Provi.Data.Dataset.prototype.init.call(this, params);
        console.log( this, params );
        //if( params.reload_widget ){
            new Provi.Bio.Isosurface.VolumeWidget( $.extend( params, {
                parent_id: Provi.defaults.dom_parent_ids.DATASET_WIDGET,
                dataset: self
            }));
        //}
    }
}


/**
 * @class
 */
Provi.Data.Controller.FastaMixin = {
    available_widgets: {},
    init: function( params ){
        var self = this;
        // params.jalview = Provi.Jalview.get_default_applet();
        // if(params.jalview){
            this.load( params.jalview );
        // }
        Provi.Data.Dataset.prototype.init.call(this, params);
    },
    load: function( jalview ){
        var get_params = '?id=' + this.server_id + '&session_id=' + $.cookie('provisessions');
        var url = window.location.protocol + '//' + window.location.host + '/data/get/';
        new Provi.Jalview.JalviewWidget({ file: url + get_params });
    }
}


/**
 * @class
 */
Provi.Data.Controller.FeaturesMixin = {
    available_widgets: {},
    init: function( params ){
        var self = this;
        params.jalview = Provi.Jalview.get_default_applet();
        if(params.jalview){
            this.load( params.jalview );
        }
        Provi.Data.Dataset.prototype.init.call(this, params);
    },
    load: function( jalview ){
        var get_params = '?id=' + this.server_id + '&session_id=' + $.cookie('provisessions');
        var url = window.location.protocol + '//' + window.location.host + '/data/get/';
        $.get( url + get_params, function(data){
            console.log("Features loaded");
            jalview.applet.loadAnnotation( data );
        });
    }
}


/**
 * @class
 */
Provi.Data.Controller.TmalignMixin = {
    available_widgets: {},
    init: function( params ){
        var self = this;
        var sele = params.sele
        if(!sele){
            sele = "file=1";
        }
        if(params.applet){
            this.load( sele, params.applet );
        }
        Provi.Data.Dataset.prototype.init.call(this, params);
    },
    load: function( sele, applet ){
        var self = this;
        var get_params = '?id=' + this.server_id + '&session_id=' + $.cookie('provisessions');
        var url = window.location.protocol + '//' + window.location.host + '/data/get/';
        $.get( url + get_params, function(data){
            var t = [0, 0, 0];
            var u = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
            var j = 0;
            _.each(data.split(/\n/), function(line, i){
                if( _.contains(["1", "2", "3"], line.charAt(1)) ){
                    var x = line.trim().split(/\s+/);
                    t[j] = x[1];
                    u[j] = x.slice(2,5);
                    j += 1;
                }
            })
            var s = '' +
                'select ' + sele + ';' +
                'm = [[' + u[0] + '],[' + u[1] + '],[' + u[2] + ']];' +
                'rotateSelected @m;' +
                'translateSelected {' + t + '};' +
                'center selected;' +
                'print "provi dataset: ' + self.id + ' loaded";' +
            '';
            //console.log(s);
            applet.script(s, { maintain_selection: true, try_catch: false });
        });
    }
}



Provi.Data.Controller.extend_by_type = function( obj, type ){
    
    var Ctrl = Provi.Data.Controller;
    
    if( _.include(Provi.Data.types.structure, type) ){
        $.extend( obj, Ctrl.StructureMixin );
    // }else if( _.include(Provi.Data.types.interface_contacts, type) ){
    //     $.extend( obj, Ctrl.InterfaceContactsMixin );
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
    // }else if( type === 'vol' ){
    //     $.extend( obj, Ctrl.VoronoiaMixin );
    }else if( type === 'ndx' ){
        $.extend( obj, Ctrl.NdxMixin );
    }else if( type === 'story' ){
        $.extend( obj, Ctrl.StoryMixin );
    }else if( type === 'prop' ){
        $.extend( obj, Ctrl.PropensitiesMixin );
    }else if( type === 'jmol' ){
        $.extend( obj, Ctrl.JmolMixin );
    }else if( type === 'png' ){
        $.extend( obj, Ctrl.PngMixin );
    }else if( type === 'atmprop' ){
        $.extend( obj, Ctrl.AtomPropertyMixin );
    }else if( type === 'atmsele' ){
        $.extend( obj, Ctrl.AtomSelectionMixin );
    }else if( type === 'bonds' ){
        $.extend( obj, Ctrl.BondsMixin );
    }else if( type === 'provi' ){
        $.extend( obj, Ctrl.ProviMixin );
    }else if( type === 'fasta' ){
        $.extend( obj, Ctrl.FastaMixin );
    }else if( type === 'features' ){
        $.extend( obj, Ctrl.FeaturesMixin );
    }else if( type === 'tmalign' ){
        $.extend( obj, Ctrl.TmalignMixin );
    }else{
        console.log('unkown file type', obj, type);
        $.extend( obj, Ctrl.DataMixin );
    }
}



})();