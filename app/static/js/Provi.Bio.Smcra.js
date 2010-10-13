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
     * @param {mixed} id The id of a child entity.
     * @return {mixed} The child entity.
     */
    get: function(id){
        return this.child_dict[id];
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
    has_id: function(id){
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
    _html_template: (function(){
	return $.template('<ul>' +
	    '<li>Res. Name: ${resname}</li>' +
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
    _html_template: (function(){
	return $.template('<ul>' +
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




/*
var test_entity = new Entity('my_entity');
console.log(test_entity);
var test_struc = new Structure('my_struc');


test_struc.add( new Model('m1') );
test_struc.add( new Model('m2') );
test_struc.add( new Model('m3') );

test_struc.detach_child('m2');

var m1 = test_struc.get('m1');
var c1 = new Chain('C');
var res = new Residue('r1');
var at = new Atom('a1');
res.add( at );
res.add( new Atom('a2') );
res.add( new Atom('a3') );

m1.add( c1 );
m1.add( new Chain('C2') );
m1.add( new Chain('C3') );
m1.add( new Chain('C4') );
c1.add( res );

var a = test_struc.get_chains()
console.log( a );

console.log( m1.get_atoms() );
*/

})();