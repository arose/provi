/**
 * @fileOverview This file contains the {@link Provi} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * @namespace
 * Provi module
 */
var Provi = {};


(function() {
    
    Provi.defaults = {};
    
    Provi.defaults.dom_parent_ids = {
        DATASET_WIDGET: undefined,
        CANVAS_WIDGET: undefined,
        SELECTION_WIDGET: undefined,
        BUILDER_WIDGET: undefined,
        SETTINGS_WIDGET: undefined,
        JOBS_WIDGET: undefined
    };
    
    Provi.defaults.base_url = '';
    var pathname = window.location.pathname;
    var base_idx = pathname.indexOf("/static/html/");
    if( base_idx>0 ) Provi.defaults.base_url = pathname.substring( 0, base_idx );
    
    Provi.url_for = function( url ){
        return window.location.protocol + '//' + window.location.host + 
            Provi.defaults.base_url + url;
    }

    Provi.config = {
        debug: $.query.get('debug')
    };

    Provi.init = function(){

        Provi.Jmol.init("../../jmol/current/58/", !$.query.get('unsigned'));
        Provi.Jalview.init("../../jalview/current/0/", !$.query.get('unsigned'));

        Provi.Debug.auto();
        Provi.Utils.event.init();

    }
    
})();