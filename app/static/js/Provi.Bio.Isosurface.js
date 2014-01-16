/**
 * @fileOverview This file contains the {@link Provi.Bio.Isosurface} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * @namespace
 * Isosurface module
 */
Provi.Bio.Isosurface = {};


(function() {

/** @exports Utils as Provi.Utils */
var Utils = Provi.Utils;

/** @exports Widget as Provi.Widget.Widget */
var Widget = Provi.Widget.Widget;



// load_params_widget: [
//     {
//         params: [
//             { name: 'within', getter: 'get_within' },
//             { name: 'insideout', getter: 'get_insideout' },
//             { name: 'reload_widget', getter: 'get_reload_widget' }
//         ],
//         obj: Provi.Bio.Isosurface.LoadParamsWidget
//     },
//     {
//         params: [
//             { name: 'sigma', getter: 'get_sigma' },
//             { name: 'cutoff', getter: 'get_cutoff' },
//             { name: 'sign', getter: 'get_sign' },
//             { name: 'color_density', getter: 'get_color_density' },
//             { name: 'downsample', getter: 'get_downsample' }
//         ],
//         obj: Provi.Bio.Isosurface.VolumeParamsWidget
//     },
//     {
//         params: [
//             { name: 'resolution', getter: 'get_resolution' },
//             { name: 'select', getter: 'get_select' },
//             { name: 'ignore', getter: 'get_ignore' },
//             { name: 'type', getter: 'get_type' }
//         ],
//         obj: Provi.Bio.Isosurface.SurfaceParamsWidget
//     }
// ],


Provi.Bio.Isosurface.LoadParamsWidget = function(params){
    Provi.Widget.ParamsWidget.call( this, params );
}
Provi.Bio.Isosurface.LoadParamsWidget.prototype = Utils.extend(Provi.Widget.ParamsWidget, {
    params_dict: {
        within: { 'default': 2, type: "float", range: [ 1, 10 ] },
        insideout: { 'default': false, type: "bool" },
        resolution: { 'default': 2, type: "float", range: [ 1, 10 ] },
        select: { 'default': "*", type: "str" },
        ignore: { 'default': "", type: "str" },
        color: { 'default': "", type: "str" }
    }
});



Provi.Bio.Isosurface.VolumeLoadParamsWidget = function(params){
    Provi.Widget.ParamsWidget.call( this, params );
}
Provi.Bio.Isosurface.VolumeLoadParamsWidget.prototype = Utils.extend(Provi.Widget.ParamsWidget, {
    params_dict: {
        within: { 'default': 2, type: "float", range: [ 1, 10 ] },
        insideout: { 'default': false, type: "bool" },
        sigma: { 'default': 1, type: "float", range: [ 0, 5 ] },
        cutoff: { 'default': 0, type: "float", range: [ 0, 255 ] },
        color_density: { 'default': false, type: "bool" },
        sign: { 'default': true, type: "bool" },
        downsample: { 'default': 1, type: "int", range: [ 1, 10 ] },
        type: { 'default': "", type: "str", options: [ 
            "", "sasurface", "molecular", "cavity", "solvent 1.4", 
            "solvent 1.0", "solvent 0.8", "cavity 1.0 8", 
            "interior cavity 1.0 8", "pocket cavity 1.0 8"
        ] },
        resolution: { 'default': 2, type: "float", range: [ 1, 10 ] },
        select: { 'default': "*", type: "sele" },
        ignore: { 'default': "", type: "sele" },
        style: { 'default': "", type: "str", options: [ 
            "", "FILL", "MESH NOFILL", "DOTS, NOFILL"
        ] },
    }
});




Provi.Bio.Isosurface.Isosurface = function(params){
    params = _.defaults( params, this.default_params );
    var p = [ 
        "applet", "dataset", "color", "within", "insideout", 
        "frontonly", "style", "translucent",
        "resolution", "select", "ignore", "slab", "type", "map",
        "iso_slab", "probe_radius", "outer_probe_radius"
    ];
    _.extend( this, _.pick( params, p ) );

    if( this.dataset ){
        this.load();    
    }else{
        this.create();
    }
};
Provi.Bio.Isosurface.Isosurface.prototype = /** @lends Provi.Bio.Isosurface.Isosurface.prototype */ {
    default_params: {
        select: "*",
        type: "sasurface",
        translucent: 0.0
    },
    load: function(){
        this.iso_id = 'iso_' + Provi.Utils.uuid();
        var s = 'isosurface ID "' + this.iso_id + '" ' +
            ( this.color ? 'COLOR ' + this.color + ' ' : '' ) + 
            ( this.within ? 'WITHIN ' + this.within + ' { protein } ' : '' ) +
            ( this.frontonly ? 'FRONTONLY ' : '' ) + 
            ( this.insideout ? 'INSIDEOUT ' : '' ) + 
            '"' + this.dataset.url + '" ' +
            ( this.style ? this.style + ' ' : '' ) + 
            'TRANSLUCENT ' + this.translucent + ' ' +
        ';'
        if( this.iso_slab ){
            s += 'provi_iso_slab_id = "' + this.iso_id + '";' +
                'isosurface SLAB WITHIN 8.0 (@{ {*}.XYZ });';
        }
        s += 'provi_dataset_loaded( ' + this.dataset.id + ' );';
        this.applet.script( s, { maintain_selection: true, try_catch: true } );
    },
    create: function(){
        var type = this.type;
        if( type=="solvent" && this.probe_radius ){
            type += " " + this.probe_radius;
        }else if( _.contains( [ "cavity", "interior cavity", "pocket cavity" ], type ) && this.probe_radius && this.outer_probe_radius ){
            type += " " + this.probe_radius + " " + this.outer_probe_radius;
        }

        var s = 'isosurface ID "iso_' + Provi.Utils.uuid() + '" ' +
            (this.resolution ? 'resolution ' + this.resolution + ' ' : '') +
            (this.select ? 'select {' + this.select + '} ' : '') +
            (this.ignore ? 'ignore {' + this.ignore + '} ' : '') +
            (type ? type + ' ' : '') +
            (this.map ? 'MAP ' + this.map + ' ' : '') +
        ';'
        console.log('Provi.Bio.Isosurface.Isosurface.create', s);
        this.applet.script( s , { maintain_selection: true, try_catch: true } );
    }
};



Provi.Bio.Isosurface.Volume = function(params){
    params = _.defaults( params, this.default_params );
    var p = [ 
        "applet", "dataset", "color_density", "within", "insideout", "cutoff", "sigma", 
        "resolution", "select", "ignore", "type", "sign", 
        "color", "style", "frontonly"
    ];
    _.extend( this, _.pick( params, p ) );

    if( this.dataset ){
        this.load();    
    }else{
        this.create();
    }
};
Provi.Bio.Isosurface.Volume.prototype = /** @lends Provi.Bio.Isosurface.Volume.prototype */ {
    default_params: {
        
    },
    load: function(){
        this.iso_id = 'vol_' + Provi.Utils.uuid();
        var s = 'isosurface ID "' + this.iso_id + '" ';

        if( this.color_density ){
            if( !this.cutoff ){
                this.cutoff = '[-1000,1000]';
            }
            s += '' +
                ( this.color ? 'COLOR ' + this.color + ' ' : '' ) + 
                //( this.within ? 'WITHIN ' + this.within + ' ' : '' ) + 
                (this.downsample ? 'downsample ' + this.downsample + ' ' : '') +
                //(this.cutoff ? 'cutoff ' + this.cutoff + ' ' : '') +
                (this.sigma ? 'sigma ' + this.sigma + ' ' : '') +
                'color density ' +
                '"' + this.dataset.url + '" ' +
                ';' +
                'color $"' + this.iso_id + '" "rwb" range -20 20;' +
            '';
        }else{
            if( !this.cutoff ){
                this.cutoff = '[-1000,1000]';
            }
            s += '' +
                ( this.color ? 'COLOR ' + this.color + ' ' : '' ) + 
                ( this.within ? 'WITHIN ' + this.within + ' {*} ' : '' ) + 
                (this.downsample ? 'downsample ' + this.downsample + ' ' : '') +
                (this.cutoff ? 'cutoff ' + this.cutoff + ' ' : '') +
                (this.sign ? 'SIGN blue red ' : '') +
                (this.sigma ? 'sigma ' + this.sigma + ' ' : '') +
                (this.resolution ? 'resolution ' + this.resolution + ' ' : '') +
                (this.select ? 'select {' + this.select + '} ' : '') +
                (this.ignore ? 'ignore {' + this.ignore + '} ' : '') +
                'colorscheme "bwr" color absolute -20 20 ' +
                (this.type ? this.type + ' ' : '') +
                (this.type ? 'MAP ' : '') +
                ( (!this.type && this.insideout) ? 'INSIDEOUT ' : '' ) + 
                '"' + this.dataset.url + '" ' +
                (this.style ? this.style + ' ' : '') +
            ';';
        }

        if( this.style ){
            s += 'isosurface ID "' + this.iso_id + '" ' + this.style + ';';
        }
        if( this.frontonly ){
            s += 'isosurface ID "' + this.iso_id + '" frontonly;';
        }
        if( this.color ){
            s += 'color $"' + this.iso_id + '" ' + this.color + ';';
        }
        s += 'provi_dataset_loaded( ' + this.dataset.id + ' );';
        s += 'provi_iso_slab_id = "' + this.iso_id + '";';
        this.applet.script( 
            s, { maintain_selection: true, try_catch: true } 
        );
    }
};




Provi.Bio.Isosurface.ConstructParamsWidget = function(params){
    Provi.Widget.ParamsWidget.call( this, params );
}
Provi.Bio.Isosurface.ConstructParamsWidget.prototype = Utils.extend(Provi.Widget.ParamsWidget, {
    params_dict: {
        resolution: { 'default': 2, type: "float", range: [ 1, 10 ] },
        select: { 'default': "*", type: "sele" },
        ignore: { 'default': "", type: "sele" },
        probe_radius: { 'default': 1.4, type: "float" },
        outer_probe_radius: { 'default': 8.0, type: "float" },
        type: { 'default': "", type: "str", options: [ 
            "", "sasurface", "molecular", "cavity", "solvent",
            "cavity", "interior cavity", "pocket cavity"
        ] }
    }
});


Provi.Bio.Isosurface.ConstructionWidget = function(params){
    params = _.defaults( params, this.default_params );

    var p = [ "datalist" ];
    _.extend( this, _.pick( params, p ) );
    
    Provi.Widget.Widget.call( this, params );
    this._init_eid_manager([ 'construct_params_widget', 'construct' ]);
    
    var template = '' +
        '<div class="control_row" id="${eids.construct_params_widget}"></div>' +
        '<div class="control_row">' +
            '<button id="${eids.construct}">construct</button>' +
        '</div>' + 
    '';
    this.add_content( template, params );
    
    this.construct_params_widget = new Provi.Bio.Isosurface.ConstructParamsWidget({
        parent_id: this.eid('construct_params_widget')
    });
    this._init();
}
Provi.Bio.Isosurface.ConstructionWidget.prototype = Utils.extend(Provi.Widget.Widget, {
    default_params: {
        
    },
    _init: function(){
        this.elm('construct').button().click( _.bind( this.construct, this ) );
        Provi.Widget.Widget.prototype.init.call(this);
    },
    construct: function(){
        var params = { applet: this.datalist.applet };
        _.extend( params, this.construct_params_widget.params );
        console.log('IsosurfaceConstructionWidget', params);
        new Provi.Bio.Isosurface.Isosurface( params );
    }
});



Provi.Bio.Isosurface.IsosurfaceDatalist = function(params){
    Provi.Data.Datalist.call( this, params );
    this.handler = _.defaults({
        "details": {
            "selector": 'span[cell="label"]',
            "click": this.details,
            "label": "Show details"
        },
        "visibility": {
            "selector": 'input[cell="visibility"]',
            "click": this.visibility,
            "label": "visibility"
        }
    }, this.handler);
}
Provi.Bio.Isosurface.IsosurfaceDatalist.prototype = Utils.extend(Provi.Data.Datalist, {
    type: "IsosurfaceDatalist",
    params_object: Provi.Bio.Isosurface.ConstructionWidget,
    get_ids: function(){
        return _.keys( this.get_info() );
    },
    get_data: function(id){
        
    },
    make_row: function(id){
        if( id=="all" ){
            var data = this.get_info();
            var visible = _.reduce( data, function( memo, d ){
                return memo + ( d["visible"] ? 1 : 0 );
            }, 0) / _.size(data);
            var label = 'all';
        }else{
            var data = this.get_info(id);
            var visible = data["visible"];
            var label = id;
        }
        var $row = $('<div></div>').append(
            this.label_cell( label, id ),
            this.visibility_cell( id, visible )
        );
        return $row;
    },
    _visibility: function(id, flag, params){
        var self = this;
        var ids = (id==='all') ? this.get_ids() : [ id ];
        return _.map( ids, function(id){
            return 'isosurface ' +
                'ID "' + id + '" ' +
                ( flag ? 'OFF': 'ON' ) + ';';
        }).join(' ');
    },
    visibility: function(id, flag, params){
        var s = this._visibility(id, flag, params);
        this.script( s, true );
    },
    label_cell: function(label, id){
        var $label = $('<span cell="label" style="float:left; width:120px;">' +
            label +
        '</span>').data( 'id', id );
        return $label;
    },
    visibility_cell: Provi.Widget.Grid.CellFactory({
        "name": "visibility", "color": "skyblue"
    }),
    selection: function(id){
        
    },
    get_info: function(id){
        var shape_info = this.applet.get_property_as_array('shapeInfo');
        var info = {};
        _.each( shape_info["Isosurface"], function( d, i ){
            _.each( d, function( elm, key ){
                if( elm=="false" ){
                    d[key] = false;
                }else if( elm=="true" ){
                    d[key] = true;
                }
            });
            info[ d["ID"] ] = d;
        });
        if( id ){
            return info[id] || {};
        }else{
            return info;   
        }
    },
    make_details: function(id){
        var info = this.get_info();
        console.log( info[id] );
        
        var e = new Provi.Bio.Isosurface.IsosurfaceWidget({
            isosurface_name: id,
            applet: this.applet,
            no_create: true
        });
        return e.dom;
    }
});





/**
 * A widget
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Bio.Isosurface.IsosurfaceWidget = function(params){
    params = _.defaults( params, this.default_params );
    params.parent_id = Provi.defaults.dom_parent_ids.DATASET_WIDGET;

    var p = [ 
        "isosurface_type", "dataset", "applet", "resolution", "within", "color", 
        "style", "sele", "no_create", "no_init", "translucent", "focus",
        "colorscheme", "color_range", "frontonly", "insideout"
    ];
    _.extend( this, _.pick( params, p ) );
    
    Widget.call( this, params );
    this._build_element_ids([ 
        'show', 'color', 'focus', 'display_within', 'translucent', 'colorscheme', 'map',
        'color_range', 'color_sele_widget', 'style', 'delete', 'load_params', 'frontonly'
    ]);
    
    this.isosurface_name = params.isosurface_name || 'isosurface_' + this.id;
    
    var content = '<div class="control_group">' +
        '<div class="control_row">' +
            '<input id="' + this.show_id + '" type="checkbox" checked="checked" style="float:left; margin-top: 0.5em;"/>' +
            '<label for="' + this.show_id + '" style="display:block;">show isosurface</label>' +
        '</div>' +
        '<div class="control_row">' +
            '<input id="' + this.frontonly_id + '" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
            '<label for="' + this.frontonly_id + '" style="display:block;">front only</label>' +
        '</div>' +
        '<div class="control_row">' +
            '<input id="' + this.color_id + '" type="text" value="#000000"/> ' +
            '<label for="' + this.color_id + '" >color</label>' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="' + this.translucent_id + '">translucent</label>' +
            '<select id="' + this.translucent_id + '" class="ui-state-default">' +
                '<option value="0.0">opaque</option>' +
                '<option value="0.2">0.2</option>' +
                '<option value="0.4">0.4</option>' +
                '<option value="0.6">0.6</option>' +
                '<option value="0.8">0.8</option>' +
            '</select>' +
        '</div>' +
        '<div class="control_row">' +
            '<input id="' + this.focus_id + '" type="checkbox" checked="checked" style="float:left; margin-top: 0.5em;"/>' +
            '<label for="' + this.focus_id + '" style="display:block;">focus</label>' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="' + this.display_within_id + '">display within</label>' +
            '<select id="' + this.display_within_id + '" class="ui-state-default">' +
                '<option value="0"></option>' +
                '<option value="5.0">5.0</option>' +
                '<option value="7.0">7.0</option>' +
                '<option value="10.0">10.0</option>' +
                '<option value="15.0">15.0</option>' +
            '</select>&nbsp;&#8491;' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="' + this.colorscheme_id + '">colorscheme</label>' +
            '<select id="' + this.colorscheme_id + '" class="ui-state-default">' +
                '<option value=""></option>' +
                '<option value="rwb">red-white-blue</option>' +
                '<option value="bwr">blue-white-red</option>' +
                '<option value="roygb">rainbow</option>' +
                '<option value="low">red-green</option>' +
                '<option value="high">green-blue</option>' +
                '<option value="sets">by surface fragments</option>' +
            '</select>' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="' + this.color_range_id + '">color range</label>' +
            '<select id="' + this.color_range_id + '" class="ui-state-default">' +
                '<option value=""></option>' +
                '<option value="0 0">ALL</option>' +
                '<option value="-1 1">[-1,1]</option>' +
                '<option value="-5 5">[-5,5]</option>' +
                '<option value="-10 10">[-10,10]</option>' +
                '<option value="-15 15">[-15,15]</option>' +
                '<option value="-20 20">[-20,20]</option>' +
                '<option value="-30 30">[-30,30]</option>' +
                '<option value="-50 50">[-50,50]</option>' +
                '<option value="-70 70">[-70,70]</option>' +
                '<option value="-100 100">[-100,100]</option>' +
                '<option value="-150 150">[-150,150]</option>' +
                '<option value="-200 200">[-200,200]</option>' +
                '<option value="-250 250">[-250,250]</option>' +
                '<option value="0 10">[0,10]</option>' +
                '<option value="0 20">[0,20]</option>' +
                '<option value="0 50">[0,50]</option>' +
                '<option value="0 100">[0,100]</option>' +
                '<option value="20 100">[20,100]</option>' +
            '</select>' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="' + this.color_sele_widget_id + '">color selection</label>' +
            '<span id="' + this.color_sele_widget_id + '"></span>' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="' + this.map_id + '">Map:</label>' +
            '<select id="' + this.map_id + '" class="ui-state-default">' +
                '<option value=""></option>' +
                '<option value="PROPERTY temperature">PROPERTY temperature</option>' +
                '<option value="PROPERTY partialCharge">PROPERTY partialCharge</option>' +
                '<option value="MEP">[1/d] MEP</option>' +
                '<option value="MEP 1">[e^(-d/2)] MLP?</option>' +
                '<option value="MEP 2">[1/(1+d)] MLP</option>' +
                '<option value="MEP 3">[e^(-d)] Hydrophobicity potential</option>' +
                '<option value="CPK">CPK</option>' +
                '<option value="property COLOR">atom color</option>' +
            '</select>' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="' + this.style_id + '">style</label>' +
            '<select id="' + this.style_id + '" class="ui-state-default">' +
                '<option value=""></option>' +
                '<option value="mesh nofill nodots">mesh</option>' +
                '<option value="fill nomesh nodots">fill</option>' +
                '<option value="dots nomesh nofill">dots</option>' +
            '</select>' +
        '</div>' +
        // '<div style="padding-left:0px;">' +
        //     '<button id="' + this.load_params_id + '">load params</button>' +
        // "</div>" +
        '<div class="control_row">' +
            '<button id="' + this.delete_id + '">delete</button>' +
        '</div>' +
    '</div>';
    $(this.dom).append( content );
    this.color_selection_selector = new Provi.Bio.AtomSelection.SelectorWidget({
        parent_id: this.color_sele_widget_id,
        applet: params.applet, tag_name: 'span'
    });
    if( !this.no_init ){
        this._init();
    }
}
Provi.Bio.Isosurface.IsosurfaceWidget.prototype = Utils.extend(Widget, /** @lends Provi.Bio.Isosurface.IsosurfaceWidget.prototype */ {
    default_params: {
        heading: 'Isosurface',
        isosurface_type: 'Isosurface',
        resolution: 1.0,
        display_within: 10.0,
        within: 5.0,
        color: '',
        style: '',
        sele: 'atomno=1',
        translucent: 0.0,
        focus: false,
        colorscheme: "rwb",
        color_range: "-20 20",
        frontonly: false,
        no_init: false,
        no_create: false
    },
    _init: function(){
        var self = this;
    
        // init crystal mode
        $('#' + this.show_id).click(function(){
            self.set_show();
        });

        $('#' + this.frontonly_id).click(function(){
            self.frontonly = $("#" + self.frontonly_id).is(':checked');
            var frontonly = self.frontonly ? 'FRONTONLY' : 'NOTFRONTONLY';
            self.applet.script(
                'isosurface ID "' + self.isosurface_name + '" ' + frontonly + ';' +
                '', { maintain_selection: true, try_catch: true }
            );
        });
        
        // init color picker
        $('#' + this.color_id).colorPicker();
        $('#' + this.color_id).change(function(e, ignore){
            if(ignore) return;
            var sele = self.color_selection_selector.get();
            self.translucent = $("#" + self.translucent_id + " option:selected").val();
            self.applet.script(
                'color $"' + self.isosurface_name + '" ' +
                    '[x' + $('#' + self.color_id).val().substring(1) + '] ' +
                    ' translucent ' + self.translucent + ';' +
                '', { maintain_selection: true, try_catch: true }
            );
            if(sele){
                self.applet.script(
                    'isosurface ID "' + self.isosurface_name + '"; ' +
                    'color ISOSURFACE {' + sele + '} orange;' +
                    '', { maintain_selection: true, try_catch: true }
                );
            }
        });
        
        // init display within
        $("#" + this.display_within_id).bind('change', function() {
            self.display_within = $("#" + self.display_within_id + " option:selected").val();
            self.set_focus();
        });
    
        // init focus
        $("#" + this.focus_id).bind('change', function() {
            self.focus = $("#" + self.focus_id).is(':checked');
            self.set_focus();
        });
        
        // init translucent
        $("#" + this.translucent_id).bind('change', function() {
            self.translucent = $("#" + self.translucent_id + " option:selected").val();
            self.applet.script('color $"' + self.isosurface_name + '" translucent ' + self.translucent + ';');
        });
    
        // init colorscheme
        $("#" + this.colorscheme_id).bind('change', function() {
            self.colorscheme = $("#" + self.colorscheme_id + " option:selected").val();
            $("#" + self.colorscheme_id).val('');
            self.applet.script('color $"' + self.isosurface_name + '" "' + self.colorscheme + '";');
        });
    
        // init color range
        $("#" + this.color_range_id).bind('change', function() {
            self.color_range = $("#" + self.color_range_id + " option:selected").val();
            self.applet.script('color $"' + self.isosurface_name + '" "' + self.colorscheme + '" RANGE ' + self.color_range + ';');
        });

        // init map
        $("#" + this.map_id).bind('change', function() {
            self.map = $("#" + self.map_id + " option:selected").val();
            $("#" + self.map_id).val('');
            
            if(self.map=='CPK'){
                var s = 'isosurface ID "' + self.isosurface_name + '";';
                var cpk = {
                    carbon: 'grey',
                    oxygen: 'red',
                    nitrogen: 'blue',
                    sulfur: 'yellow',
                    phosphorus: 'orange',
                    hydrogen: 'white'
                };
                var sele = this.select ? ' and (' + this.select + ')' : '';
                _.each(cpk, function(color, element){
                    s += 'color ISOSURFACE {' + element + ' ' + sele + '} ' + color + ';';
                });
                self.applet.script(s, { maintain_selection: true, try_catch: true });
            }else if(self.map){
                self.applet.script(
                    'select *; ' +
                    'isosurface ID "' + self.isosurface_name + '" MAP ' + self.map + ';' +
                    '', { maintain_selection: true, try_catch: true }
                );
            }
        });
    
        // init style
        $('#' + this.style_id).change(function(){
        self.style = $("#" + self.style_id + " option:selected").val();
            self.applet.script('isosurface ID ' + self.isosurface_name + ' ' + self.style + ';');
        });
    
        // init delete
        $('#' + this.delete_id).button().click( $.proxy( function(){
            this.delete_isosurface();
            this.del();
        }, this ) );
        
        // // init popup widget
        // this._popup = new Provi.Widget.PopupWidget({
        //     parent_id: self.parent_id,
        //     position_my: 'left top',
        //     position_at: 'left bottom',
        //     template: '<div>{{html content}}</div>'
        // });
        
        // // init load params button
        // $('#' + this.load_params_id).button({
        //     text: false,
        //     icons: {
        //         primary: 'ui-icon-script'
        //     }
        // }).click(function(){
        //     self._popup.hide();
        //     //$(this).attr("disabled", true).addClass('ui-state-disabled');
        //     //var ds = self.import_dataset( id, self.directory_name, name, undefined, true );
        //     var dsw = new Provi.Data.DatasetWidget({
        //         parent_id: self._popup.data_id,
        //         dataset: self.dataset,
        //         load_params_values: self.load_params
        //     });
        //     $(dsw).bind('loaded', function(){
        //         self._popup.hide();
        //     });
        //     self._popup.show( $("#" + self.load_params_id) );
        // });
        
        if(!this.no_create){
            this.init_isosurface();
        }
        
        if( false ){
            $(this.applet).bind('pick', function(event, info, applet_id){
                var parsedInfo = /\[\w.+\](\d+):([\w\d]+)\.(\w+) .*/.exec(info);
                var chain = parsedInfo[2];
                var res = parsedInfo[1];
                var atom = parsedInfo[3];
                self.sele = 'resNo=' + res + (chain ? ' and chain=' + chain : '') + ' and atomName="' + atom + '"';
                console.log( self.sele );
                self.set_focus();
            });
            this.set_focus();
        }
        
        this.sync_params();

        Provi.Widget.Widget.prototype.init.call(this);
    },
    sync_params: function(){
        var self = this;
        var shape_info = this.applet.get_property_as_array('shapeInfo');
        console.log('SHAPE_INFO', shape_info)
        _.each(shape_info['Isosurface'], function(isosurf, i){
            if( isosurf['ID']!=self.isosurface_name ) return;
            console.log( isosurf['jvxlInfo'].match(/translucency=''([^']+)''/) );

            // $("#" + self.translucent_id).val(
            //     isosurf['jvxlInfo'].match(/translucency=''([^']+)''/)[1]
            // );

            $('#' + self.color_id).val('rgb(' + isosurf.color.join(',') + ')');
            $('#' + self.color_id).triggerHandler('change', true);
        });
    },
    set_show: function(){
        var s = $("#" + this.show_id).is(':checked') ? 'display' : 'hide';
        this.applet.script( s + ' $"' + this.isosurface_name + '";' );
    },
    set_focus: function(){
        var s = '';
        if( this.focus ){
            s = 'isosurface ID "' + this.isosurface_name + '" ' +
                'display within ' + this.display_within + ' {' + this.sele + '}; ' +
                'set rotationRadius 15; zoom {' + this.sele + '} 100; ' +
                'select *; star off; select ' + this.sele + '; color star green; star 1.0;' +
                'slab on; set slabRange 28.0; set zShade on; set zSlab 50; set zDepth 37; ' +
                //'slab on; set slabRange 25.0;' +
            '';
        }else{
            s = 'isosurface ID "' + this.isosurface_name + '" display all; ' +
                'center {all}; slab off;';
        }
        this.applet.script(s, { maintain_selection: true, try_catch: true });
    },
    init_isosurface: function(){
        this.applet.script(
            'isosurface ID "' + this.isosurface_name + '" ' +
            ( this.color ? 'COLOR ' + this.color + ' ' : '' ) + 
            ( this.within ? 'WITHIN ' + this.within + ' { protein } ' : '' ) +
            ( this.insideout ? 'INSIDEOUT ' : '' ) + 
            ( this.frontonly ? 'FRONTONLY ' : '' ) + 
            '"' + this.dataset.url + '" ' +
            ( this.style ? this.style : '' ) + 
            ';'
        , { maintain_selection: true, try_catch: true });
    },
    delete_isosurface: function(){
        this.applet.script(
            'isosurface ID ' + this.isosurface_name + ' delete;' +
        '', true);
    },
    reload: function(params){
        this.init_load_params( params );
        this.init_isosurface();
    }
});



/**
 * A widget
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Bio.Isosurface.VolumeWidget = function(params){
    //params.persist_on_applet_delete = false;
    params.heading = 'Volume';
    //params.collapsed = false;
    this.color_density = params.color_density;
    this.cutoff = params.cutoff;
    this.within = params.within;
    this.downsample = params.downsample;
    this.sigma = params.sigma;
    this.type = params.type;
    this.resolution = params.resolution;
    this.select = params.select || '*';
    this.ignore = params.ignore;
    this.style = params.style;
    this.sign = params.sign;
    params.no_init = true;
    Provi.Bio.Isosurface.IsosurfaceWidget.call( this, params );
    //this._build_element_ids([  ]);

    var content = '<div class="control_group">' +
        '' +
    '</div>';
    
    if( this.dataset && $.inArray( this.dataset.type, ['ccp4', 'mrc', 'map']) >= 0 ){
        this.style = 'MESH NOFILL';
        this.downsample = null;
        this.focus = true;
        this.sele = params.sele || 'atomno=1';
        this.sigma = params.sigma || 1;
    }
    if( this.dataset && $.inArray( this.dataset.type, ['cube']) >= 0 ){
        this.style = 'MESH NOFILL';
        this.downsample = null;
        this.cutoff = params.cutoff || 9;
        this.sigma = null;
    }
    
    //$(this.dom).append( content );
    this._init();
}
Provi.Bio.Isosurface.VolumeWidget.prototype = Utils.extend(Provi.Bio.Isosurface.IsosurfaceWidget, /** @lends Provi.Bio.Isosurface.VolumeWidget.prototype */ {
    _init: function(){
    Provi.Bio.Isosurface.IsosurfaceWidget.prototype._init.call(this);
        var self = this;
    },
    init_isosurface: function(){
    if( this.color_density ){
        if( !this.cutoff ){
            this.cutoff = '[-1000,1000]';
        }
        this.applet.script(
            'isosurface id "' + this.isosurface_name + '" ' +
                ( this.color ? 'COLOR ' + this.color + ' ' : '' ) + 
                ( this.within ? 'WITHIN ' + this.within + ' ' : '' ) + 
                (this.downsample ? 'downsample ' + this.downsample + ' ' : '') +
                (this.cutoff ? 'cutoff ' + this.cutoff + ' ' : '') +
                (this.sigma ? 'sigma ' + this.sigma + ' ' : '') +
                'color density ' +
                '"' + this.dataset.url + '" ' +
                ';' +
                'color $' + this.isosurface_name + ' "rwb" range -20 20;' +
        '', true);
    }else{
        this.applet.script(
            'isosurface id "' + this.isosurface_name + '" ' +
                ( this.color ? 'COLOR ' + this.color + ' ' : '' ) + 
                ( this.within ? 'WITHIN ' + this.within + ' ' : '' ) + 
                (this.downsample ? 'downsample ' + this.downsample + ' ' : '') +
                (this.cutoff ? 'cutoff ' + this.cutoff + ' ' : '') +
                (this.sign ? 'SIGN blue red ' : '') +
                (this.sigma ? 'sigma ' + this.sigma + ' ' : '') +
                (this.resolution ? 'resolution ' + this.resolution + ' ' : '') +
                (this.select ? 'select {' + this.select + '} ' : '') +
                (this.ignore ? 'ignore {' + this.ignore + '} ' : '') +
                //'colorscheme "rwb" color absolute -20 20 ' +
                (this.type ? this.type + ' ' : '') +
                (this.type ? 'MAP ' : '') +
                ( (!this.type && this.insideout) ? 'INSIDEOUT ' : '' ) + 
                '"' + this.dataset.url + '" ' +
                (this.style ? this.style + ' ' : '') +
        ';', true);
    }
    }
});



/**
 * A widget
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Bio.Isosurface.SurfaceWidget = function(params){
    //params.persist_on_applet_delete = false;
    params.heading = 'Surface';
    //params.collapsed = false;
    this.within = params.within;
    this.type = params.type;
    this.resolution = params.resolution;
    this.select = params.select || '*';
    this.ignore = params.ignore;
    this.slab = params.slab;
    this.map = params.map;
    params.no_init = true;
    Provi.Bio.Isosurface.IsosurfaceWidget.call( this, params );
    //this._build_element_ids([  ]);

    var content = '<div class="control_group">' +
        '' +
    '</div>';

    //$(this.dom).append( content );
    this._init();
}
Provi.Bio.Isosurface.SurfaceWidget.prototype = Utils.extend(Provi.Bio.Isosurface.IsosurfaceWidget, /** @lends Provi.Bio.Isosurface.SurfaceWidget.prototype */ {
    _init: function(){
        var self = this;
        $(this.applet).bind('message', function(e, msg1, msg2, msg3){
            //if( msg1.slice(0, self.isosurface_name.length) == self.isosurface_name ){
            if( msg1.search(/provi isosurface:/) != -1 ){
                //console.log(msg1, msg2, msg3);
                var m = msg1.match(
                    /provi isosurface: ([\w-\.]+) \| isosurfaceArea = (.*); isosurfaceVolume = (.*);/
                );
                console.log(m, msg1, m[1], m[2], m[3]);

                if( m[1]==self.isosurface_name ){
                    var area = eval( m[2] );
                    var volume = eval( m[3] );
                    area = _.isArray(area) ? area[0] : area;
                    volume = _.isArray(volume) ? volume[0] : volume;
                    console.log(area, volume);
                    self.elm('content').prepend('' +
                        '<div class="control_row">' +
                            '<div>' + area + ' &#8491;<sup>2</sup></div>' +
                            '<div>' + volume + ' &#8491;<sup>3</sup></div>' +
                        '</div>' +
                    '');
                }
            }
        });
        this.applet.script(
            'isosurface id "' + this.isosurface_name + '";' +
            'var x = script("isosurface area");' +
            'var y = script("isosurface volume");' +
            'print "provi isosurface: ' + this.isosurface_name + 
                ' | " + x.trim() + "; " + y.trim() + ";";' +
            ''
        )
        Provi.Bio.Isosurface.IsosurfaceWidget.prototype._init.call(this);
    },
    init_isosurface: function(){
        this.applet.script(
            'isosurface id "' + this.isosurface_name + '" ' +
            (this.resolution ? 'resolution ' + this.resolution + ' ' : '') +
            (this.select ? 'select {' + this.select + '} ' : '') +
            (this.ignore ? 'ignore {' + this.ignore + '} ' : '') +
            (this.slab ? 'SLAB ' + this.slab + ' ' : '') +
            (this.type ? this.type + ' ' : '') +
            (this.map ? 'MAP ' + this.map + ' ' : '') +
        ';', true);
    }
});








})();