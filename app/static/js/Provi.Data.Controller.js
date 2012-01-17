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

Provi.Data.Controller.extend_by_type = function( obj, type ){
    
    var Ctrl = Provi.Data.Controller;
    
    if( $.inArray(type, Provi.Data.types.structure) >= 0 ){
        $.extend( obj, Ctrl.StructureMixin );
    }else if( $.inArray(type, Provi.Data.types.interface_contacts) >= 0 ){
        $.extend( obj, Ctrl.InterfaceContactsMixin );
    }else if( type == 'mplane' ){
        $.extend( obj, Ctrl.MplaneMixin );
    }else if( $.inArray(type, Provi.Data.types.isosurface) >= 0 ){
        $.extend( obj, Ctrl.IsosurfaceMixin );
    }else if( $.inArray(type, Provi.Data.types.volume) >= 0 ){
        $.extend( obj, Ctrl.VolumeMixin );
    }else if( type == 'jspt' ){
        $.extend( obj, Ctrl.ScriptMixin );
    }else if( type == 'tmhelix' ){
        $.extend( obj, Ctrl.TmHelicesMixin );
    }else if( type == 'anal' ){
        $.extend( obj, Ctrl.HbondsMixin );
    }else if( type == 'vol' ){
        $.extend( obj, Ctrl.VoronoiaMixin );
    }else if( type == 'ndx' ){
        $.extend( obj, Ctrl.NdxMixin );
    }else if( type == 'story' ){
        $.extend( obj, Ctrl.StoryMixin );
    }else if( type == 'prop' ){
        $.extend( obj, Ctrl.PropensitiesMixin );
    }else{
        console.log('unkown file type', obj, type);
    }
}



})();