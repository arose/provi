// depends on utils.js


(function() {

/**
 * bio namespace object
 * @name Bio
 * @namespace
 */
Bio = {};

/**
 * pdb namespace object
 * @name Bio.Pdb
 * @namespace
 */
var Pdb = Bio.Pdb = {};

/**
 * entity class
 * @name Bio.Pdb.Entity
 * @constructor
 */
var Entity = Bio.Pdb.Entity = function(id){
    this.id = id;
    this.full_id = null;
    this.parent = null;
    this.child_list = [];
    this.child_dict = {};
    this.xtra = {};
    this._ptr = 0;
};
Entity.prototype = /** @lends Bio.Pdb.Entity.prototype */ {
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
 * @class Represents a Pdb Structure
 * @name Bio.Pdb.Structure
 * @extends Bio.Pdb.Entity
 */
var Structure = Bio.Pdb.Structure = function(id){
    Entity.call(this, id);
};
Structure.prototype = Utils.extend(Entity, /** @lends Bio.Pdb.Structure.prototype */ {
    level: 'S',
    /**
     * get all chains of the structure
     */
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

/**
 * @class Represents a Pdb model
 * @name Bio.Pdb.Model
 * @extends Bio.Pdb.Entity
 */
var Model = Bio.Pdb.Model = function(id){
    Entity.call(this, id);
};
Model.prototype = Utils.extend(Entity, /** @lends Bio.Pdb.Model.prototype */ {
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

/**
 * @class Represents a Pdb chain
 * @name Bio.Pdb.Chain
 * @extends Bio.Pdb.Entity
 */
var Chain = Bio.Pdb.Chain = function(id){
    Entity.call(this, id);
};
Chain.prototype = Utils.extend(Entity, /** @lends Bio.Pdb.Chain.prototype */ {
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

/**
 * @class Represents a Pdb residue
 * @name Bio.Pdb.Residue
 * @extends Bio.Pdb.Entity
 */
var Residue = Bio.Pdb.Residue = function(id, resname, segid){
    this.resname = resname;
    this.segid = segid;
    Entity.call(this, id);
};
Residue.prototype = Utils.extend(Entity, /** @lends Bio.Pdb.Residue.prototype */ {
    level: 'R'
});

/**
 * @class Represents a Pdb atom
 * @name Bio.Pdb.Atom
 */
var Atom = Bio.Pdb.Atom = function(name, coord, bfactor, occupancy, altloc, fullname, serial_number, element){
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
Atom.prototype = /** @lends Bio.Pdb.Atom.prototype */ {
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




/**
 * @class Represents membrane planes
 * @name Bio.MembranePlanes
 */
var MembranePlanes = Bio.MembranePlanes = function(plane1, plane2, distance){
    this.plane1 = plane1;
    this.plane2 = plane2;
    this.distance = distance;
};
MembranePlanes.prototype = /** @lends Bio.MembranePlanes.prototype */ {
    __jmol_format: function( p ){
        return "{" + p[0].join(',') + "} {" + p[1].join(',') + "} {" + p[2].join(',') + "}";
    },
    format_as_jmol_planes: function(){
        return [ this.__jmol_format(this.plane1), this.__jmol_format(this.plane2) ];
    }
};


/**
 * widget class for controlling a mplane dataset
 * @constructor
 * @extends Widget
 */
MplaneWidget = function(params){
    this.dataset = params.dataset;
    this.applet = params.applet;
    this.color = "blue";
    this.translucency = 0.6;
    this.size = 500;
    this.visibility = true;
    Widget.call( this, params );
    this.size_id = this.id + '_size';
    this.size_slider_id = this.id + '_size_slider';
    this.size_slider_option_id = this.id + '_size_slider_option';
    this.visibility_id = this.id + '_visibility';
    var content = '<div class="control_group">' +
        '<div class="control_row">' +
            '<span>Dataset: ' + this.dataset.name + '</span>&nbsp;|&nbsp;' +
            '<span>Applet: ' + this.applet.name_suffix + '</span>' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="' + this.size_id + '">membrane plane size</label>' +
            '<select id="' + this.size_id + '" class="ui-state-default">' +
                '<option value="1">hide</option>' +
                '<option id="' + this.size_slider_option_id + '" value="1">slider</option>' +
                '<option value="100">100</option>' +
                '<option value="200">200</option>' + 
                '<option value="300">300</option>' +
                '<option value="400">400</option>' +
                '<option value="500" selected="selected">500</option>' +
                '<option value="600">600</option>' +
                '<option value="700">700</option>' +
                '<option value="800">800</option>' +
                '<option value="1000">1000</option>' +
                '<option value="1200">1200</option>' +
                '<option value="1400">1400</option>' +
            '</select>' +
        '</div>' +
        '<div class="control_row">' +
            '<input id="' + this.visibility_id + '" type="checkbox" checked="checked" style="float:left; margin-top: 0.5em;"/>' +
            '<div id="' + this.size_slider_id + '"></div>' +
        '</div>' +
        '<i>the membrane planes are shown in blue and are semi transparent</i>' +
    '</div>'
    $(this.dom).append( content );
    this._init();
}
MplaneWidget.prototype = Utils.extend(Widget, /** @lends MplaneWidget.prototype */ {
    _init: function () {
        this.visibility = $("#" + this.visibility_id).is(':checked');
        $("#" + this.size_slider_option_id).hide();
        $("#" + this.size_id).val(this.size);
        this.draw();
        var self = this;
        
        $("#" + this.visibility_id).bind('change click', function() {
            self.visibility = $("#" + self.visibility_id).is(':checked');
            self.draw();
        });
        $("#" + this.size_id).change( function() {
            self.size = $("#" + self.size_id + " option:selected").val();
            $("#" + self.size_slider_id).slider('option', 'value', self.size);
            $("#" + self.size_slider_option_id).hide();
            self.draw();
        });
        $("#" + this.size_slider_id).slider({min: 1, max: 1400, slide: function(event, ui){
            self.size = ui.value;
            self.update_size_slider();
        }});
        $("#" + this.size_slider_id).mousewheel( function(event, delta){
            self.size = Math.round(self.size + 20*delta);
            if(self.size > 1400) self.size = 1400;
            if(self.size < 1) self.size = 1;
            $("#" + self.size_slider_id).slider('option', 'value', self.size);
            self.update_size_slider();
        });
        $("#" + this.size_slider_id).slider('option', 'value', this.size);
    },
    update_size_slider: function(){
        if($("#" + this.size_id + " option:contains(" + this.size + ")").size()){
            $("#" + this.size_slider_option_id).hide();
        }else{
            $("#" + this.size_slider_option_id).show();
            $("#" + this.size_slider_option_id).val(this.size);
            $("#" + this.size_slider_option_id).text(this.size);
            
            Array.prototype.sort.call(
                $("#" + this.size_id + " option"),
                function(a,b) {
                    return parseInt($(a).val()) >= parseInt($(b).val()) ? 1 : -1;
                }
            ).appendTo("#" + this.size_id); 
        }
        $("#" + this.size_id).val(this.size);
        this.draw();
    },
    draw: function(){
        if(this.visibility){
            var mp = this.dataset.data;
            var mp_f = mp.format_as_jmol_planes();
            var s = 'draw plane' + this.id + '_1 color TRANSLUCENT ' + this.translucency + ' ' + this.color + ' plane ' + this.size + ' ' + mp_f[0] + '; draw plane' + this.id + '_2 color TRANSLUCENT ' + this.translucency + ' ' + this.color + ' plane ' + this.size + ' ' + mp_f[1] + ';';
            s += 'draw dist arrow {' + mp.plane1[2].join(',') + '} {' + mp.plane2[2].join(',') + '} "' + mp.distance.toFixed(2) + ' A";';
            this.applet.script(s);
        }else{
            this.applet.script('draw plane' + this.id + '_* off;');
        }
    }
});



/**
 * A widget to create tree view from molecular data
 * @constructor
 */
TreeViewWidget = function(params){
    this.dataset = params.dataset;
    Widget.call( this, params );
    this.canvas_id = this.id + '_canvas';

    var content = '<div class="control_group">' +
	'<div class="control_row">' +
            '<div id="' + this.canvas_id + '" style="width:300px;height:400px; overflow:auto;"></div>' +
        '</div>' +
    '</div>';
    $(this.dom).append( content );
    this._init();
}
TreeViewWidget.prototype = Utils.extend(Widget, /** @lends TreeViewWidget.prototype */ {
    _init: function(){
	this.tree_view();
        var self = this;
    },
    tree_view: function(){
        var self = this;
        
        var tree_data = {};
        var models = this.dataset.data.get_list();
        for(var i = 0; i < models.length; ++i){
            
            var tree_chains = {};
            var chains = models[i].get_list();
            for(var j = 0; j < chains.length; ++j){
                
                var tree_residues = {};
                var residues = chains[j].get_list();
                for(var k = 0; k < residues.length; ++k){
                    
                    var tree_atoms = {};
                    var atoms = residues[k].get_list();
                    for(var l = 0; l < atoms.length; ++l){
                        tree_atoms[ atoms[l].get_id() ] = atoms[l].serial_number;
                    }
                    
                    tree_residues[ residues[k].resname + " " + residues[k].get_id() ] = tree_atoms;
                }
                tree_chains[ chains[j].get_id() ] = tree_residues;
            }
            tree_data[ models[i].get_id() ] = tree_chains;
        };
        
        var root = pv.dom( tree_data )
            .root( 'model 1' );
        
        /* Recursively compute the package sizes. */
        root.visitAfter(function(node, depth) {
            if (node.firstChild) {
                if( depth == 2){
                    node.nodeValue = node.childNodes.length + " Residues";
                }else if( depth == 1){
                    node.nodeValue = node.childNodes.length + " Chains";
                }if( depth == 0){
                    node.nodeValue = node.childNodes.length + " Models";
                }
            }
        });
        
        var vis = new pv.Panel()
            .canvas( this.canvas_id )
            .width(260)
            .height(function(){ return (root.nodes().length + 1) * 12 })
            .margin(5);
        
        var layout = vis.add(pv.Layout.Indent)
            .nodes(function(){ return root.nodes() })
            .depth(12)
            .breadth(12);
        
        layout.link.add(pv.Line);
        
        var node = layout.node.add(pv.Panel)
            .top(function(n){ return n.y - 6 })
            .height(12)
            .right(6)
            .strokeStyle(null)
            .fillStyle(null)
            .events("all")
            .event("mousedown", toggle);
        
        node.anchor("left").add(pv.Dot)
            .strokeStyle("#1f77b4")
            .fillStyle(function(n){ return n.toggled ? "#1f77b4" : n.firstChild ? "#aec7e8" : "#ff7f0e" })
            .title(function t(d){ return d.parentNode ? (t(d.parentNode) + "." + d.nodeName) : d.nodeName })
          .anchor("right").add(pv.Label)
            .text(function(n){ return n.nodeName });
        
        node.anchor("right").add(pv.Label)
            .textStyle(function(n){ return n.firstChild || n.toggled ? "#aaa" : "#000" })
            .text(function(n){ return n.nodeValue || ''; });
        
        root.visitAfter(function(node, depth){
            if(depth > 1){
                node.toggle();
            }
        });
        
        vis.render();
        
        /* Toggles the selected node, then updates the layout. */
        function toggle(n) {
            n.toggle(pv.event.altKey);
            return layout.reset().root;
        }
    }
});



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