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
    params.heading = 'FOOBAR';
    //params.collapsed = false;
    Provi.Widget.Widget.call( this, params );
    this._init_eid_manager( ['current_file_number'] );
    
    this.dataset = params.dataset;
    this.applet = params.applet;
    this.load_as = params.load_as;
    this.style = params.style;
    
    var template = '' +
	'<div class="" id="${eids.current_file_number}" >' +
            'Jmol file number: <span>???${params.current_file_number}</span>' +
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
	    style = 'select all; spacefill off; wireframe off; backbone off; cartoon on; ' +
		//'select protein; color cartoon structure; color structure; ' +
		'slab on; set slabRange 10.0; set zShade on; set zSlab 95; set zDepth 5; ' +
		'select (ligand or ypl or lrt); wireframe 0.16; spacefill 0.5; color cpk; ' +
		'select water; wireframe 0.01;' +
		'select group=hoh; cpk 20%;' +
		'select (hetero or ypl or lrt) and connected(protein) or within(GROUP, protein and connected(hetero or ypl or lrt)); wireframe 0.1;' + 
		'select (dmpc or dmp or popc or pop); wireframe 0.1;' +
		'select none;';
	}else{
	    style = 'select all; ' + style +
		'slab on; set slabRange 10.0; set zShade on; set zSlab 95; set zDepth 5; ';
	}
        
        if( load_as != 'append' ) applet._delete();
	
	// load structural data into the jmol applet
	if(load_as == 'trajectory'){
	    applet.script('load TRAJECTORY "' + type + '../../data/get/' + params + '"; ' + style);
	}else if(load_as == 'trajectory+append'){
	    applet.script('load APPEND TRAJECTORY "' + type + '../../data/get/' + params + '"; ' + style);
	}else if(load_as == 'append'){
	    if( !style ){
		var style2 = 'select file = _currentFileNumber; spacefill off; wireframe off; backbone off; cartoon on; ' +
		    //'select protein; color cartoon structure; color structure; ' +
		    'slab on; set slabRange 10.0; set zShade on; set zSlab 95; set zDepth 5; ' +
		    'select (file = _currentFileNumber and (ligand or ypl or lrt)); wireframe 0.16; spacefill 0.5; color cpk; ' +
		    'select (file = _currentFileNumber and water); wireframe 0.01;' +
		    'select (file = _currentFileNumber and group=hoh); cpk 20%;' +
		    'select (file = _currentFileNumber and (hetero or ypl or lrt) and connected(protein) or within(GROUP, protein and connected(hetero or ypl or lrt))); wireframe 0.1;' + 
		    'select (file = _currentFileNumber and (dmpc or dmp or popc or pop)); wireframe 0.1;' +
		    'select none;';
	    }else{
		var style2 = 'select file = _currentFileNumber; ' + style +
		    'slab on; set slabRange 10.0; set zShade on; set zSlab 95; set zDepth 5; ';
	    }
	    applet.script('load APPEND "' + type + '../../data/get/' + params + '"; ' + style2 + ' frame all; ');
	//}else if(load_as == 'new'){
	}else{
	    console.log('../../data/get/' + params);
	    applet.script('load "' + type + '../../data/get/' + params + '"; ' + style);
	}
    }
});



})();