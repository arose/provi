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
        DATASET_WIDGET: '',
        CANVAS_WIDGET: '',
        SELECTION_WIDGET: '',
        BUILDER_WIDGET: '',
        SETTINGS_WIDGET: ''
    };
    
    //Provi.defaults.jmol = {};
    //Provi.defaults.jmol.style = '' +
    //    'select protein; cartoon only;' +
    //    'select (ligand or ypl or lrt); wireframe 0.15; spacefill 0.5;' +
    //    'select water; wireframe 0.01;' +
    //    //'select group=hoh; cpk 20%;' +
    //    'select HOH; cpk 20%;' +
    //    'select (hetero or ypl or lrt) and connected(protein) or within(GROUP, protein and connected(hetero or ypl or lrt)); wireframe 0.15;' + 
    //    'select (dmpc or dmp or popc or pop); wireframe 0.15;' +
    //    'select none;' +
    //    '';
    //Provi.defaults.jmol.color = '' +
    //    'select (ligand or ypl or lrt); color cpk;' +
    //    '';
    
    Provi.defaults.base_url = ''
    
    Provi.url_for = function( url ){
        return Provi.defaults.base_url + url;
    }
    
})();