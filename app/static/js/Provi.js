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
        SETTINGS_WIDGET: undefined
    };
    
    Provi.defaults.base_url = ''
    
    Provi.url_for = function( url ){
        return Provi.defaults.base_url + url;
    }
    
})();