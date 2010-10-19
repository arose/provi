/**
 * @fileOverview This file contains the {@link Provi.Bio.Smcra} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * @namespace
 * 
 * The Smcra module. The term smcra stands for <i>s</i>tructure, <i>m</i>odel, <i>c</i>hain, <i>r</i>esidue and <i>a</i>tom.
 * The module is modelled after the <a href="http://biopython.org/">Biopython</a> <a href="">Bio.PDB</a> class published here:
 * Hamelryck T and Manderick B. PDB file parser and structure class implemented in Python. Bioinformatics 2003 Nov 22; 19(17) 2308-10. pmid:14630660.
 * <a href="http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?cmd=Retrieve&db=pubmed&dopt=Abstract&list_uids=14630660">PubMed</a>
 *
 * @requires Provi.Utils
 */
Provi.Bio.Smcra = {};


(function() {

/** @exports Utils as Provi.Utils */
var Utils = Provi.Utils;

/** @exports Widget as Provi.Widget.Widget */
var Widget = Provi.Widget.Widget;


/** Mapping between entity level and corresponding get list function name */
Provi.Bio.Smcra.level_get_fn_map = {
    'S': 'get_structures',
    'M': 'get_model',
    'C': 'get_chains',
    'R': 'get_residues',
    'A': 'get_atoms'
};


/**
 * Entity class, a base class for protein structure related entities.
 * @constructor
 */
Provi.Bio.Smcra.Entity = function(id){
    this.id = id;
    this.full_id = null;
    this.parent = null;
    this.child_list = [];
    this.child_dict = {};
    this.xtra = {};
    this._ptr = 0;
};
Provi.Bio.Smcra.Entity.prototype = /** @lends Provi.Bio.Smcra.Entity.prototype */ {
    /**
     * @returns {int} Number of children
     */
    len: function(){
        return this.child_list.length;
    },
    /**
     * @param {mixed} ent_id The id of a child entity.
     * @return {mixed} The child entity.
     */
    get: function(id){
	return this.child_dict[ id ];
    },
    next: function() {
        if( this._ptr < this.child_list.length ) {
            return this.child_list[ this._ptr++ ];
        } else throw { name: "StopIteration" };
    },
    has_next: function() {
        return this._ptr < this.child_list.length;
    },
    get_level: function(){
        return this.level;
    },
    /**
     * Set the parent entity.
     * @param {mixed} parent The parent entity.
     */
    set_parent: function(parent){
        this.parent = parent;
    },
    detach_parent: function(){
        this.parent = null;
    },
    detach_child: function(id){
        var child = this.child_dict[id];
        child.detach_parent();
        this.child_list.removeItems(this.child_dict[id]);
        delete this.child_dict[id];
    },
    add: function(entity){
        var entity_id = entity.get_id();
        if( this.has_id(entity_id) ){
	    //console.log( this.level, this, 'duplicate' );
            throw entity_id + " defined twice";
        }
        entity.set_parent( this );
        this.child_list.push( entity );
        this.child_dict[ entity_id ] = entity;
    },
    /**
     * @returns {mixed[]} An array of child entities.
     */
    get_list: function(){
	return this.child_list;
    },
    has_id: function( id ){
	return this.child_dict.hasOwnProperty( id );
    },
    /**
     * @returns {mixed} The parent entity.
     */
    get_parent: function(){
        return this.parent;
    },
    /**
     * @returns {mixed} The entity id.
     */
    get_id: function(){
        return this.id;
    },
    get_full_id: function(){
        if( this.full_id == null ){
            var entity_id = this.get_id();
            var l = [ entity_id ];
            var parent = this.get_parent();
            while ( parent != null && parent.level != "O" ){
                entity_id = parent.get_id();
                l.push( entity_id );
                parent = parent.get_parent();
            }
            l.reverse();
            this.full_id = l;
        }
        return this.full_id;
    },
    get_by_full_id: function( full_id ){
	var entity = this;
	for(var i = 0; i < full_id.length; ++i){
            if(entity && entity.get) entity = entity.get( full_id[i] );
        }
	return entity;
    },
    /**
     * Get the jmol expression for the corresponding level. Needs to be implemented by each level.
     */
    _jmol_expression: function(){
	return '';
    },
    /**
     * Recursively gets the complete Jmol atom expression for this entity.
     * @param {array} [l=[]] A list containg previously collected jmol expressions
     * @returns {array} An array containing all jmol atom expressions neccesary to select this entity.
     */
    jmol_expression: function(l){
	l = l || [];
	l.push( this._jmol_expression() );
	if( this.parent ){
	    return this.parent.jmol_expression( l );
	}else{
	    return l.filter( Boolean ).join(' and ');
	}
    },
    /**
     * Holds the prepared html template for the corresponding level. Needs to be implemented by each level.
     * For performance reasons implemented as a self executing function that is executed once.
     */
    _html_template: (function(){ return ''; })(),
    /**
     * Get the data to be injected in the html template of the corresponding level. Needs to be implemented by each level.
     */
    _html_data: function(){ return {}; },
    /**
     * 
     * @returns {string} Html representation of the entity.
     */
    html: function(){
	return $.tmpl( this._html_template, this._html_data() ).html();
    }
};


/**
 * Constructs a new Collection.
 * @class Represents a Collection of Pdb Structures
 * @extends Provi.Bio.Smcra.Entity
 */
Provi.Bio.Smcra.Collection = function(id){
    Provi.Bio.Smcra.Entity.call(this, id);
};
Provi.Bio.Smcra.Collection.prototype = Utils.extend(Provi.Bio.Smcra.Entity, /** @lends Provi.Bio.Smcra.Collection.prototype */ {
    level: 'O',
    /**
     * Wrapper around {@link Provi.Bio.Smcra.Entity.get_list} giving it a more appropriate name.
     * @returns {Provi.Bio.Smcra.Structure[]} An array of structures.
     */
    get_structures: Provi.Bio.Smcra.Entity.prototype.get_list,
    /**
     * get all models
     * @returns {Provi.Bio.Smcra.Model[]} An array of models.
     */
    get_models: function(){
        var models = [];
        var structures = this.get_list();
        for(var i = 0; i < structures.length; ++i){
            models = models.concat( structures[i].get_list() );
        }
        return models;
    },
    /**
     * get all chains
     * @returns {Provi.Bio.Smcra.Chain[]} An array of chains.
     */
    get_chains: function(){
        var chains = [];
        var models = this.get_models();
        for(var i = 0; i < models.length; ++i){
            chains = chains.concat( models[i].get_list() );
        }
        return chains;
    },
    /**
     * get all residues
     * @returns {Provi.Bio.Smcra.Residue[]} An array of residues.
     */
    get_residues: function(){
        var residues = [];
        var chains = this.get_chains();
        for(var i = 0; i < chains.length; ++i){
            residues = residues.concat( chains[i].get_list() );
        }
        return residues;
    },
    /**
     * get all atoms
     * @returns {Provi.Bio.Smcra.Atom[]} An array of atoms.
     */
    get_atoms: function(){
        var atoms = [];
        var residues = this.get_residues();
        for(var i = 0; i < residues.length; ++i){
            atoms = atoms.concat( residues[i].get_list() );
        }
        return atoms;
    }
});


/**
 * Constructs a new Structure.
 * @class Represents a Pdb Structure
 * @extends Provi.Bio.Smcra.Entity
 * @borrows Provi.Bio.Smcra.Collection#get_chains as this.get_chains
 * @borrows Provi.Bio.Smcra.Collection#get_residues as this.get_residues
 * @borrows Provi.Bio.Smcra.Collection#get_atoms as this.get_atoms
 */
Provi.Bio.Smcra.Structure = function(id){
    Provi.Bio.Smcra.Entity.call(this, id);
};
Provi.Bio.Smcra.Structure.prototype = Utils.extend(Provi.Bio.Smcra.Entity, /** @lends Provi.Bio.Smcra.Structure.prototype */ {
    level: 'S',
    /**
     * Wrapper around {@link Provi.Bio.Smcra.Entity.get_list} giving it a more appropriate name.
     * @returns {Provi.Bio.Smcra.Model[]} An array of models.
     */
    get_models: Provi.Bio.Smcra.Entity.prototype.get_list,
    get_chains: Provi.Bio.Smcra.Collection.prototype.get_chains,
    get_residues: Provi.Bio.Smcra.Collection.prototype.get_residues,
    get_atoms: Provi.Bio.Smcra.Collection.prototype.get_atoms,
    _jmol_expression: function(){
	return 'file=' + this.id;
    },
    _html_template: (function(){
	return $.template('<ul>' +
	    '<li>Structure: ${id}</li>' +
	'</ul>');
    })(),
    _html_data: function(){
	return {
	    id: this.id
	};
    }
});

/**
 * @class Represents a Pdb model
 * @extends Provi.Bio.Smcra.Entity
 * @borrows Provi.Bio.Smcra.Collection#get_residues as this.get_residues
 * @borrows Provi.Bio.Smcra.Collection#get_atoms as this.get_atoms
 */
Provi.Bio.Smcra.Model = function(id){
    Provi.Bio.Smcra.Entity.call(this, id);
};
Provi.Bio.Smcra.Model.prototype = Utils.extend(Provi.Bio.Smcra.Entity, /** @lends Provi.Bio.Smcra.Model.prototype */ {
    level: 'M',
    structure: function(){ return this.parent },
    /**
     * Wrapper around {@link Provi.Bio.Smcra.Entity.get_list} giving it a more appropriate name.
     * @returns {Provi.Bio.Smcra.Chain[]} An array of chains.
     */
    get_chains: Provi.Bio.Smcra.Entity.prototype.get_list,
    get_residues: Provi.Bio.Smcra.Collection.prototype.get_residues,
    get_atoms: Provi.Bio.Smcra.Collection.prototype.get_atoms,
    _jmol_expression: function(){
	return 'model=' + this.id;
    },
    _html_template: (function(){
	return $.template('<ul>' +
	    '<li>Model: ${id}</li>' +
	'</ul>');
    })(),
    _html_data: function(){
	return {
	    id: this.id
	};
    }
});

/**
 * @class Represents a Pdb chain
 * @extends Provi.Bio.Smcra.Entity
 * @borrows Provi.Bio.Smcra.Collection#get_atoms as this.get_atoms
 */
Provi.Bio.Smcra.Chain = function(id){
    Provi.Bio.Smcra.Entity.call(this, id);
};
Provi.Bio.Smcra.Chain.prototype = Utils.extend(Provi.Bio.Smcra.Entity, /** @lends Provi.Bio.Smcra.Chain.prototype */ {
    level: 'C',
    structure: function(){ return this.parent.parent },
    model: function(){ return this.parent },
    /**
     * Wrapper around {@link Provi.Bio.Smcra.Entity.get_list} giving it a more appropriate name.
     * @returns {Provi.Bio.Smcra.Residue[]} An array of residues.
     */
    get_residues: Provi.Bio.Smcra.Entity.prototype.get_list,
    get_atoms: Provi.Bio.Smcra.Collection.prototype.get_atoms,
    _jmol_expression: function(){
	return 'chain="' + this.id + '"';
    },
    _html_template: (function(){
	return $.template('<ul>' +
	    '<li>Chain: ${id}</li>' +
	'</ul>');
    })(),
    _html_data: function(){
	return {
	    id: this.id
	};
    }
});

/**
 * @class Represents a Pdb residue
 * @extends Provi.Bio.Smcra.Entity
 */
Provi.Bio.Smcra.Residue = function(id, resname, segid){
    this.resname = resname;
    this.segid = segid;
    Provi.Bio.Smcra.Entity.call(this, id);
};
Provi.Bio.Smcra.Residue.prototype = Utils.extend(Provi.Bio.Smcra.Entity, /** @lends Provi.Bio.Smcra.Residue.prototype */ {
    level: 'R',
    structure: function(){ return this.parent.parent.parent },
    model: function(){ return this.parent.parent },
    chain: function(){ return this.parent },
    /**
     * Wrapper around {@link Provi.Bio.Smcra.Entity.get_list} giving it a more appropriate name.
     * @returns {Provi.Bio.Smcra.Atom[]} An array of atoms.
     */
    get_atoms: Provi.Bio.Smcra.Entity.prototype.get_list,
    /**
     * @returns {float} The mean of the B-factors of the residues' atoms.
     */
    get_bfactor: function(){
	if( typeof this._bfactor_mean == 'undefined' ){
	    this._bfactor_mean = pv.mean( this.get_atoms(), function(a){ return a.bfactor } );
	}
	return this._bfactor_mean;
    },
    _jmol_expression: function(){
	return 'resno=' + this.id;
    },
    _property_names: {
	resname: 'Res. name',
	segid: 'Seg. id'
    },
    _html_template: (function(){
	return $.template('<ul>' +
	    '<lh>Residue data</lh>' +
	    '<li>Res. name: ${resname}</li>' +
	    '<li>Seg. id: ${segid}</li>' +
	'</ul>');
    })(),
    _html_data: function(){
	return {
	    resname: this.resname,
	    segid: this.segid
	};
    }
});

/**
 * @class Represents a Pdb atom
 * @borrows Provi.Bio.Smcra.Entity#set_parent as this.set_parent
 * @borrows Provi.Bio.Smcra.Entity#get_parent as this.get_parent
 * @borrows Provi.Bio.Smcra.Entity#get_id as this.get_id
 * @borrows Provi.Bio.Smcra.Entity#jmol_expression as this.jmol_expression
 * @borrows Provi.Bio.Smcra.Entity#html as this.html
 */
Provi.Bio.Smcra.Atom = function(name, coord, bfactor, occupancy, altloc, fullname, serial_number, element){
    this.name = name;
    this.parent = null;
    this.xtra = {};
    this.fullname = fullname;
    this.coord = coord;
    this.bfactor = bfactor;
    this.occupancy = occupancy;
    this.altloc = altloc;
    this.serial_number = serial_number;
    this.element = element;
    this.id = name;
    this.full_id = null;
};
Provi.Bio.Smcra.Atom.prototype = /** @lends Provi.Bio.Smcra.Atom.prototype */ {
    level: 'A',
    structure: function(){ return this.parent.parent.parent.parent },
    model: function(){ return this.parent.parent.parent },
    chain: function(){ return this.parent.parent },
    residue: function(){ return this.parent },
    get_level: function(){
        return this.level;
    },
    set_parent: Provi.Bio.Smcra.Entity.prototype.set_parent,
    get_parent: Provi.Bio.Smcra.Entity.prototype.get_parent,
    get_id: Provi.Bio.Smcra.Entity.prototype.get_id,
    get_full_id: function(){
        if( this.full_id == null ){
            this.full_id = this.parent.get_full_id().concat( this.name );
        }
        return this.full_id;
    },
    /**
     * @returns {float} The B-factor of the atom.
     */
    get_bfactor: function(){
	return this.bfactor;
    },
    jmol_expression: Provi.Bio.Smcra.Entity.prototype.jmol_expression,
    _jmol_expression: function(){
	return 'atomno=' + this.serial_number;
    },
    _property_names: {
	name: 'Name',
	fullname: 'Fullname',
	bfactor: 'B-factor',
	occupancy: 'Occupancy',
	altloc: 'Altloc',
	serial_number: 'Serial number',
	element: 'Element'
    },
    _html_template: (function(){
	return $.template('<ul>' +
	    '<lh>Atom data</lh>' +
	    '<li>Name: ${name}</li>' +
	    '<li>Fullname: ${fullname}</li>' +
	    '<li>B-factor: ${bfactor}</li>' +
	    '<li>Occupancy: ${occupancy}</li>' +
	    '<li>Altloc: ${altloc}</li>' +
	    '<li>Serial number: ${serial_number}</li>' +
	    '<li>Element: ${element}</li>' +
	'</ul>');
    })(),
    _html_data: function(){
	return {
	    name: this.name,
	    fullname: this.fullname,
	    bfactor: this.bfactor,
	    occupancy: this.occupancy,
	    altloc: this.altloc,
	    serial_number: this.serial_number,
	    element: this.element
	};
    },
    html: Provi.Bio.Smcra.Entity.prototype.html
};


/** Mapping between entity level and corresponding class */
Provi.Bio.Smcra.level_entity_class_map = {
    'S': Provi.Bio.Smcra.Structure,
    'M': Provi.Bio.Smcra.Model,
    'C': Provi.Bio.Smcra.Chain,
    'R': Provi.Bio.Smcra.Residue,
    'A': Provi.Bio.Smcra.Atom
};


/**
 * @class Represents a AbstractPropertyMap
 */
Provi.Bio.Smcra.AbstractPropertyMap = function( property_dict ){
    this.property_dict = property_dict;
    this.property_list = [];
    var self = this;
    $.each( property_dict, function(i, e){ return self.property_list.push(e); } );
};
Provi.Bio.Smcra.AbstractPropertyMap.prototype = /** @lends Provi.Bio.Smcra.AbstractPropertyMap.prototype */ {
    /**
     * To be set by inheriting classes. Used to allow smcra entities as ids to access properties.
     */
    _entity_class: false,
    key_length: 5,
    /**
     * @returns {object} The property map dictionary.
     */
    get_dict: function(){
	return this.property_dict;
    },
    get_list: function( key_fn ){
	return key_fn ? $.map( this.property_list, key_fn ) : this.property_list;
    },
    get_property_names: function(){
	//var property_names = [];
	//console.log('get_property_names', property_names, this.property_list, this);
	//for( var name in this.property_list[0] ){ property_names.push( name ) }
	return this._property_names;
    },
    /**
     * @returns {int} Number of children
     */
    len: function(){
        return this.property_dict.length;
    },
    /**
     * @param {array|mixed} id The id of a child entity.
     * @param {int} [slice] Number id elements from the begining of the id that should be discarded.
     * @return {array} The translated id.
     */
    _translate_id: function(ent_id, slice){
	if( this._entity_class && ent_id instanceof this._entity_class ){
	    ent_id = ent_id.get_full_id();
	}
	//console.log(ent_id);
	return slice ? ent_id.slice( slice ) : ent_id;
    },
    /**
     * @param {array|mixed} id The id of a child entity.
     * @param {int} [slice] Number id elements from the begining of the id that should be discarded.
     * @return {mixed} The child entity.
     */
    get: function(id, slice, key_fn){
	if( !id ) return undefined;
	var property = this.property_dict[ this._translate_id(id, slice) ];
        return key_fn ? key_fn( property ) : property;
    },
    /**
     * @param {array|Provi.Bio.Smcra.Entity|Provi.Bio.Smcra.Atom} id The id to look for, also in form of an smcra entity or atom.
     * @param {int} [slice] Number id elements from the begining of the id that should be discarded.
     * @returns {boolean} Weather there is data for the given id or not.
     */
    has_id: function(ent_id, slice){
	if(!ent_id) return false;
	
	if( (this._entity_class && !(ent_id instanceof this._entity_class)) &&
	    !(ent_id instanceof Array) ){
	    return false;
	}else{
	    return typeof this.get( ent_id, slice ) !== 'undefined';
	}
    },
    /**
     * Holds the prepared html template for the corresponding level. Needs to be implemented by each level.
     * For performance reasons implemented as a self executing function that is executed once.
     */
    _html_template: (function(){ return $.template('<div>${content}</div>'); })(),
    /**
     * Get the data to be injected in the html template of the corresponding level. Needs to be implemented by each level.
     */
    _html_data: function( property ){ return {content: property}; },
    /**
     * @param {mixed} id The id of a child entity.
     * @param {int} [slice] Number id elements from the begining of the id that should be discarded.
     * @return {mixed} The rendered html.
     */
    html: function( id, slice, key_fn, template ){
	return $.tmpl( template || this._html_template, this._html_data( this.get(id, slice, key_fn) ) ).html();
    }
};


/**
 * @class Represents a PropertyMapEntityWrapper
 */
Provi.Bio.Smcra.PropertyMapEntityWrapper = function( entity, level ){
    this.entity = entity;
    console.log('eclass', Provi.Bio.Smcra.level_entity_class_map, level, Provi.Bio.Smcra.level_get_fn_map[ level ], entity);
    this._entity_class = Provi.Bio.Smcra.level_entity_class_map[ level ];
    this.property_list = entity[ Provi.Bio.Smcra.level_get_fn_map[ level ] ]();
    this._property_names = this.property_list[0]._property_names;
};
Provi.Bio.Smcra.PropertyMapEntityWrapper.prototype = Utils.extend(Provi.Bio.Smcra.AbstractPropertyMap, /** @lends Provi.Bio.Smcra.PropertyMapEntityWrapper.prototype */ {
    /**
     * @param {array|mixed} id The id of a child entity.
     * @param {int} [slice] Number id elements from the begining of the id that should be discarded.
     * @return {mixed} The child entity.
     */
    get: function(id, slice, key_fn){
	if( !id ) return undefined;
	var property = this.entity.get_by_full_id( this._translate_id(id, slice) );
        return key_fn ? key_fn( property ) : property;
    }
});


/**
 * @class Represents a PropertyMapWrapper
 */
Provi.Bio.Smcra.PropertyMapVisualisationWrapper = function( property_map, params ){
    if( property_map.hasOwnProperty( '_wrapped_property_map' ) ){
	property_map = property_map._wrapped_property_map;
    }
    
    return $.extend( {}, property_map, {
	is_atomic: params.is_atomic,
	info: params.info,
	_wrapped_property_map: property_map,
	get: function(id){
	    return property_map.get.call( property_map, id, params.slice, params.key_fn );
	},
	get_list: function(){
	    return property_map.get_list.call( property_map, params.key_fn );
	},
	_html_data: function( property ){
	    //console.log( 'property', property );
	    return typeof property === 'object' ? property : {content: property};
	},
	html: function( id, slice, key_fn, template ){
	    return property_map.html.call( this, id, slice || params.slice, key_fn || params.key_fn, template || params.template );
	}
    });
};


/**
 * A widget
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Bio.Smcra.PropertyMapVisBuilderWidget = function(params){
    params.persist_on_applet_delete = true;
    //params.heading = '';
    //params.collapsed = false;
    Provi.Widget.Widget.call( this, params );
    this.max_key_length = params.max_key_length || 5;
    this.applet = params.applet;
    this._build_element_ids([ 'property_map_selector', 'property_selector' ]);

    var content = '<div class="control_group">' +
	'<div class="control_row">' +
	    '<select class="ui-state-default" id="' + this.property_map_selector_id + '"></select>' +
	'</div>' +
	'<div class="control_row">' +
	    '<select class="ui-state-default" id="' + this.property_selector_id + '"></select>' +
	'</div>' +
    '</div>';
    $(this.dom).append( content );
    this._init();
}
Provi.Bio.Smcra.PropertyMapVisBuilderWidget.prototype = Utils.extend(Provi.Widget.Widget, /** @lends Provi.Bio.Smcra.PropertyMapVisBuilderWidget.prototype */ {
    _property_maps: [],
    _ds_property_maps: [],
    _built_property_maps: [],
    _init: function(){
        var self = this;
	
	$('#' + this.property_map_selector_id).bind( 'change', function(){
	    self._update_property_selector();
	});
	$('#' + this.property_selector_id).bind( 'change', function(){
	    $(self).triggerHandler('built', self._build_property_map_vis() );
	});
	
	//this.update();
	//Provi.Widget.Widget.prototype.init.call(this);
    },
    update: function( smcra, applet ){
	if( typeof smcra !== 'undefined' ) this.smcra = smcra;
	if( typeof applet !== 'undefined' ) this.applet = applet;
	
	this._property_maps = [];
	this._ds_property_maps = [];
	this._make_dataset_property_maps();
	this._make_smcra_property_maps();
	
	this._update_property_maps_selector();
	this._update_property_selector();
    },
    _make_dataset_property_maps: function(){
	var self = this;
	$.each( Provi.Data.DatasetManager.get_list(), function(i, dataset){
	    console.log('DS DS DS',dataset);
	    if( Utils.in_array(dataset.applet_list, self.applet) ){
		$.each( dataset.get_list(), function(key, data){
		    
		    if(data instanceof Provi.Bio.Smcra.AbstractPropertyMap ){
			var vis_map = new Provi.Bio.Smcra.PropertyMapVisualisationWrapper(
			    data,
			    {
				slice: self.max_key_length-dataset.data.key_length,
				info: dataset.name + ' (' + dataset.id + ')'
			    }
			)
			self._ds_property_maps.push( vis_map );
			self._property_maps.push( vis_map );
		    }
		});
	    }
	});
    },
    _make_smcra_property_maps: function(){
	if( !this.smcra ) return;
	this._property_maps.push(
	    new Provi.Bio.Smcra.PropertyMapVisualisationWrapper(
		new Provi.Bio.Smcra.PropertyMapEntityWrapper( this.smcra, 'R' ),
		{
		    info: 'loaded protein(s): residue map'
		}));
	this._property_maps.push(
	    new Provi.Bio.Smcra.PropertyMapVisualisationWrapper(
		new Provi.Bio.Smcra.PropertyMapEntityWrapper( this.smcra, 'A' ),
		{
		    info: 'loaded protein(s): atom map'
		}));
	console.log('SMCRA',this.smcra, this._property_maps);
    },
    _update_property_maps_selector: function(){
	var elm = $('#' + this.property_map_selector_id);
        var value = $("#" + this.property_map_selector_id + " option:selected").val();
        elm.empty().append( '<option value="-1"></option>' );
	
        $.each(this._property_maps, function(i, property_map){
            elm.append('<option value="' + i + '">' + property_map.info + '</option>');
        });
        elm.val( value );
    },
    _update_property_selector: function(){
	var elm = $('#' + this.property_selector_id);
        elm.empty().append( '<option value="-1"></option>' );
	
	var property_map_id = $("#" + this.property_map_selector_id + " option:selected").val();
	
	if( property_map_id != -1 ){
	    var property_map = this._property_maps[ property_map_id ];
	    $.each( property_map.get_property_names(), function(property_name, property_label){
	        elm.append( '<option value="' + property_name + '">' + property_label + '</option>' );
	    });
	}
    },
    _build_property_map_vis: function(){
	var property_map_id = $("#" + this.property_map_selector_id + " option:selected").val();
	var property_name = $("#" + this.property_selector_id + " option:selected").val();
	
	if( property_map_id != -1 && property_name != -1 ){
	    var property_map = this._property_maps[ property_map_id ];
	    var pvis = new Provi.Bio.Smcra.PropertyMapVisualisationWrapper(
		property_map,
		{
		    slice: this.max_key_length-property_map.key_length,
		    key_fn: function(p){ return p && typeof p === 'object' ? p[ property_name ] : p; },
		    is_atomic: true,
		    info: property_name + ' - ' + property_map.info + '',
		    template: $.template( '<div>' + property_name + ': ${content}</div>' )
		}
	    );
	    this._built_property_maps.push( pvis );
	    return pvis;
	}
	return null;
    },
    get_list: function(){
	return this._ds_property_maps.concat( this._built_property_maps );
    }
});


/**
 * @class Represents a AbstractAtomPropertyMap
 */
Provi.Bio.Smcra.AbstractAtomPropertyMap = function( property_dict ){
    Provi.Bio.Smcra.AbstractPropertyMap.call(this, property_dict);
};
Provi.Bio.Smcra.AbstractAtomPropertyMap.prototype = Utils.extend(Provi.Bio.Smcra.AbstractPropertyMap, /** @lends Provi.Bio.Smcra.AbstractAtomPropertyMap.prototype */ {
    _entity_class: Provi.Bio.Smcra.Atom,
    key_length: 5
});


/**
 * @class Represents a AbstractResiduePropertyMap
 */
Provi.Bio.Smcra.AbstractResiduePropertyMap = function( property_dict ){
    Provi.Bio.Smcra.AbstractPropertyMap.call(this, property_dict);
};
Provi.Bio.Smcra.AbstractResiduePropertyMap.prototype = Utils.extend(Provi.Bio.Smcra.AbstractPropertyMap, /** @lends Provi.Bio.Smcra.AbstractResiduePropertyMap.prototype */ {
    _entity_class: Provi.Bio.Smcra.Residue,
    key_length: 4
});





})();