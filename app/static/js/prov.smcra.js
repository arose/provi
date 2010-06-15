// depends on utils.js


(function() {

Pdb = {};


var Entity = Pdb.Entity = function(id){
    this.id = id;
    this.full_id = null;
    this.parent = null;
    this.child_list = [];
    this.child_dict = {};
    this.xtra = {};
    this._ptr = 0;
};
Entity.prototype = {
    len: function(){
        return this.child_list.length;
    },
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
            throw entity_id + " defined twice";
        }
        entity.set_parent( this );
        this.child_list.push( entity );
        this.child_dict[ entity_id ] = entity;
    },
    get_list: function(){
        return this.child_list;
    },
    has_id: function(id){
        return this.child_dict.hasOwnProperty( id );
    },
    get_parent: function(){
        return this.parent;
    },
    get_id: function(){
        return this.id;
    },
    get_full_id: function(){
        if( this.full_id == null ){
            var entity_id = this.get_id();
            var l = [ entity_id ];
            var parent = this.get_parent();
            while ( parent != null ){
                entity_id = this.get_id();
                l.push( entity_id );
                parent = parent.get_parent();
            }
            l.reverse();
            this.full_id = l;
        }
        return this.full_id;
    }
};


/**
 * Constructs a new Structure.
 *
 * @class Represents a Pdb Structure
 *
 * @extends Pdb.Entity
 */
var Structure = Pdb.Structure = function(id){
    Entity.call(this, id);
};
Structure.prototype = Utils.extend(Entity,{
    level: 'S',
    get_chains: function(){
        var chains = [];
        var models = this.get_list();
        for(var i = 0; i < models.length; ++i){
            chains = chains.concat( models[i].get_list() );
        }
        return chains;
    },
    get_residues: function(){
        var residues = [];
        var chains = this.get_chains();
        for(var i = 0; i < chains.length; ++i){
            residues = residues.concat( chains[i].get_list() );
        }
        return residues;
    },
    get_atoms: function(){
        var atoms = [];
        var residues = this.get_residues();
        for(var i = 0; i < residues.length; ++i){
            atoms = atoms.concat( residues[i].get_list() );
        }
        return atoms;
    }
});


var Model = Pdb.Model = function(id){
    Entity.call(this, id);
};
Model.prototype = Utils.extend(Entity,{
    level: 'M',
    get_residues: function(){
        var residues = [];
        var chains = this.get_list();
        for(var i = 0; i < chains.length; ++i){
            residues = residues.concat( chains[i].get_list() );
        }
        return residues;
    },
    get_atoms: function(){
        var atoms = [];
        var residues = this.get_residues();
        for(var i = 0; i < residues.length; ++i){
            atoms = atoms.concat( residues[i].get_list() );
        }
        return atoms;
    }
});


var Chain = Pdb.Chain = function(id){
    Entity.call(this, id);
};
Chain.prototype = Utils.extend(Entity,{
    level: 'C',
    get_atoms: function(){
        var atoms = [];
        var residues = this.get_list();
        for(var i = 0; i < residues.length; ++i){
            atoms = atoms.concat( residues[i].get_list() );
        }
        return atoms;
    }
});


var Residue = Pdb.Residue = function(id, resname, segid){
    this.resname = resname;
    this.segid = segid;
    Entity.call(this, id);
};
Residue.prototype = Utils.extend(Entity,{
    level: 'R'
});


var Atom = Pdb.Atom = function(name, coord, bfactor, occupancy, altloc, fullname, serial_number, element){
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
Atom.prototype = {
    level: 'A',
    get_level: function(){
        return this.level;
    },
    set_parent: function(parent){
        this.parent = parent;
    },
    get_parent: function(){
        return this.parent;
    },
    get_id: function(){
        return this.id;
    },
    get_full_id: function(){
        if( this.full_id == null ){
            this.full_id = this.parent.get_full_id().concat( [this.name, this.altloc] );
        }
        return this.full_id;
    }
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