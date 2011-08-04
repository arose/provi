/**
 * @fileOverview This file contains the {@link Provi.Bio.Structure} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * @namespace
 * Structure module
 */
Provi.Bio.Structure = {};


(function() {

/** @exports Utils as Provi.Utils */
var Utils = Provi.Utils;
/** @exports Widget as Provi.Widget.Widget */
var Widget = Provi.Widget.Widget;



/**
 * A widget
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Bio.Structure.StructureWidget = function(params){
    params = $.extend(
        Provi.Bio.Structure.StructureWidget.prototype.default_params,
        params
    );
    console.log('STRUCTURE', params);
    params.persist_on_applet_delete = false;
    params.heading = 'Structure';
    //params.collapsed = false;
    Provi.Widget.Widget.call( this, params );
    this._init_eid_manager( ['current_file_number'] );
    
    this.dataset = params.dataset;
    this.applet = params.applet;
    this.load_as = params.load_as;
    this.style = params.style;
    
    var template = '' +
	'<div class="" id="${eids.current_file_number}" >' +
            'Jmol file number: <span></span>' +
	'</div>' +
	'';
    
    this.add_content( template, params );
    this._init();
}
Provi.Bio.Structure.StructureWidget.prototype = Utils.extend(Provi.Widget.Widget, /** @lends Provi.Bio.Structure.StructureWidget.prototype */ {
    default_params: {
        style: ''
    },
    _init: function(){
        var self = this;
        
        this.load( this.applet, this.load_as, this.style );
        
	Provi.Widget.Widget.prototype.init.call(this);
    },
    load: function( applet, load_as, style ){
	var self = this;
        console.log( this, this.dataset );
        var params = '?id=' + this.dataset.server_id;
        var type = this.dataset.type;
        if( $.inArray(type, ['pdb', 'pqr', 'ent', 'sco', 'mbn', 'vol']) >= 0 ){
            params += '&data_action=get_pdb';
            type = 'pdb';
        }
        var jmol_types = {
            pdb: 'PDB',
	    ent: 'PDB',
            gro: 'GROMACS'
        };
        type = jmol_types[type];
	type = type ? (type + '::') : '';
	type = '';
	if( !style ){
	    style = Provi.defaults.jmol.style;
	}else{
	    style = 'select all; ' + style;
	}
        
        if( load_as != 'append' && load_as != 'trajectory+append' ){
	    applet._delete();
	}
	
	// load structural data into the jmol applet
	var s = '';
	if(load_as == 'trajectory'){
	    s = 'load TRAJECTORY "' + type + '../../data/get/' + params + '"; ' + style;
	}else if(load_as == 'trajectory+append'){
	    s = 'load APPEND TRAJECTORY "' + type + '../../data/get/' + params + '"; ' +
		'subset file = _currentFileNumber; ' + style + ' subset;';
	}else if(load_as == 'append'){
	    s = 'load APPEND "' + type + '../../data/get/' + params + '"; ' +
		'subset file = _currentFileNumber; ' + style + ' frame all; subset; ';
	//}else if(load_as == 'new'){
	}else{
	    console.log('../../data/get/' + params);
	    s = 'load "' + type + '../../data/get/' + params + '"; ' + style;
	}
	
	applet.script( s , true );
	if( load_as != 'append' && load_as != 'trajectory+append' ){
	    applet.lighting_manager.defaults();
	    applet.clipping_manager.defaults();
	}
    }
});



})();