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
    }else{
        console.log('unkown file type', obj, type);
        $.extend( obj, Ctrl.DataMixin );
    }
}



})();