// depends on utils.js


(function() {

//Pdb = {};


var Entity = Pdb.Entity = function(id){
    this.id = id;
    this.full_id = null;
    this.parent = null;
    this.child_list = [];
    this.child_dict = {};
    this.xtra = {};
};

Entity.prototype = {
    len: function(){
        return length( this.child_list );
    },
    get_item: function(id){
        return this.child_dict[id];
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
        delete this.child_dict[id];
        this.child_list.removeItems(id);
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


var Structure = Pdb.Structure = function(){
    
}

/**
    @function
 */
function HistoryManager() {
    this.curr = -1;
    this.entries = [];
}

/**
    @class
    @constructor
 */
HistoryManager.prototype = {
    push: function(item) {
        if (this.entries.length && this.entries[0] == item) return;
        if (item.match(/^\s*$/)) return;
        this.entries.unshift(item);
        this.curr = -1;
    },
    scroll: function(direction) {
        var moveTo = this.curr + (direction == 'prev' ? 1 : -1);
        if (moveTo >= 0 && moveTo < this.entries.length) {
            this.curr = moveTo;
            return this.entries[this.curr];
        } else if (moveTo == -1) {
            this.curr = moveTo;
            return '';
        } else {
            return null;
        }
    }
};


})();