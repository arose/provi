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
        var url = window.location.protocol + '//' + window.location.host + 
            '/example/data/' + this.url;
        new Provi.Jalview.JalviewWidget({ file: url });
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
        var url = window.location.protocol + '//' + window.location.host + 
            '/example/data/' + this.url;
        $.get( url, function(data){
            jalview.applet.loadAnnotation( data );
        });
    }
}







var type_mixins = {
    "provi": {
        bio_object: Provi.Bio.Data.DotProvi,
        raw_type: "json"
    },
    "tmalign": {
        bio_object: Provi.Bio.Data.Tmalign,
        params_object: "todo: sele",
        raw_type: "text"
    },
    "structure": {
        load_params_widget: [{
            params: [
                { name: 'load_as', getter: 'get_load_as' },
                { name: 'filter', getter: 'get_filter' },
                { name: 'lattice', getter: 'get_lattice' },
                { name: 'pdb_add_hydrogens', getter: 'get_pdb_add_hydrogens' }
            ],
            obj: Provi.Bio.Structure.StructureParamsWidget
        }],
        params_object: "todo",
        bio_object: Provi.Bio.Structure.Structure,
    },
    "atmprop": {
        bio_object: Provi.Bio.AtomProperty.AtomProperty
    },
    "atmsele": {
        bio_object: Provi.Bio.AtomSelection.AtomSelection
    },
    "bonds": {
        bio_object: Provi.Bio.HydrogenBonds.BondSet
    },
    "mplane": {
        bio_object: Provi.Bio.MembranePlanes.Mplane,
        raw_type: "text"
    },
    "jmol": {
        bio_object: Provi.Bio.Data.JmolFile
    },
    "jspt": {
        bio_object: Provi.Bio.Data.JmolScript,
        raw_type: "text"
    },
    "story": {
        bio_object: Provi.Bio.Data.Story
    },
    "dat": {
        bio_object: Provi.Bio.HydrogenBonds.BondSet
    }
}


var get_canonical_type = function( type ){
    var canonical_type = type;
    _.each( Provi.Data.types, function( type_list, ct ){
        if( _.include( type_list, type ) ) canonical_type = ct;
    });
    return canonical_type;
}


Provi.Data.Controller.extend_by_type = function( obj, type ){
    var canonical = get_canonical_type( type );
    var mixin = type_mixins[ canonical ];
    if( !mixin ){
        console.log('unkown file type', obj, type);
        mixin = type_mixins[ "dat" ];
    }
    _.extend( obj, mixin );
}



})();