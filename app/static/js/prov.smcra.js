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
MplaneWidget.prototype = Utils.extend(Widget, /** @lends Widget.prototype */ {
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
 * A widget to create sequence view from molecular data
 * @constructor
 */
SequenceViewWidget = function(params){
    this.applet = params.applet
    this.selection = [];
    this.vis = false;
    params.persist_on_applet_delete = true;
    Widget.call( this, params );
    this.canvas_id = this.id + '_canvas';
    this.draw_sequence_id = this.id + '_draw_sequence';

    var content = '<div>' +
        '<button style="float:left" id="' + this.draw_sequence_id + '">update</button>' +
        '<span id="' + this.canvas_id + '" style="margin-left:80px; position:absolute;"></span>' +
    '</div>';
    $(this.dom).append( content );
    this._init();
}
SequenceViewWidget.prototype = Utils.extend(Widget, /** @lends Widget.prototype */ {
    _init: function(){
        var self = this;
        
        this.sequence_view();
        $("#" + this.draw_sequence_id).button().click(function() {
            self.sequence_view();
        });
        $(this.applet).bind('load_struct', function(){
            self.sequence_view();
        });
        $(this.applet.selection_manager).bind('select', function( foo, selection, applet ){
            self.selection = selection;
            if(self.vis){
                self.vis.render();
            }else{
                self.sequence_view();
            }
        });
    },
    sequence_view: function(){
        var self = this;
        
        var raw_data = this.get_data();
        //console.log(raw_data);
        if( !raw_data ) return;
        var max_y = pv.max( raw_data, function(d){ return d[5]} );
        var h = 45;
        var y = pv.Scale.linear(0, max_y).range(0, h);
        var c = pv.Scale.linear(0, max_y/2, max_y).range("green", "yellow", "red");
        
        this.vis = new pv.Panel()
            .canvas( this.canvas_id )
            .width(20 + 24*raw_data.length)
            .height( h )
          .add(pv.Bar)
            .data( raw_data )
            .bottom(0)
            .width(19)
            .height(function(d){ return y( d[5] ); })
            .left(function(){ return this.index * 24 + 5; })
            .fillStyle(function(d){ return c(d[5]); })
	    .lineWidth( function(d){ return self.in_selection(d) ? 2 : 0; })
	    .strokeStyle( 'black' )
            .event("mouseup", function(d) {
		self.applet.selection_manager.select( 'resNo=' + d[2] + ' ' + (d[3] ? 'and chain=' + d[3] : '') );
            })
          .anchor("bottom").add(pv.Label)
            .text(function(d){ return d[0]; })
            .textAlign("left")
            .textBaseline("middle")
            .textAngle(-Math.PI / 2)
          .root.render();
    },
    get_data: function(){
        if(!this.applet || !this.applet.loaded) return false;
        var selection = 'protein and {*.ca}';
        var format = '\'%[group]\',\'%[sequence]\',%[resno],\'%[chain]\',\'%[model]\',\'%[temperature]\'';
        var protein_data = this.applet.evaluate('"[" + {' + selection + '}.label("[' + format + ']").join(",") + "]"');
        protein_data = eval( protein_data );
        return protein_data;
    },
    in_selection: function(d){
	return Utils.in_array(this.selection, d, function(a,b){
	    return a[2]==b[2] && (a[3]==b[3] || !b[3]);
	});
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
    this.applet_selector_widget_id = this.id + '_applet';
    this.draw_tree_id = this.id + '_draw_tree';

    var content = '<div class="control_group">' +
        '<div class="control_row" id="' + this.applet_selector_widget_id + '"></div>' +
        '<div class="control_row">' +
            '<button id="' + this.draw_tree_id + '">update</button>' +
        '</div>' +
	'<div class="control_row">' +
            '<div id="' + this.canvas_id + '" style="width:300px; overflow:auto;"></div>' +
        '</div>' +
    '</div>';
    $(this.dom).append( content );
    this.applet_selector = new JmolAppletSelectorWidget({
        parent_id: this.applet_selector_widget_id
    });
    this._init();
}
TreeViewWidget.prototype = Utils.extend(Widget, /** @lends Widget.prototype */ {
    _init: function(){
        var self = this;
        
        this.tree_view();
        $("#" + this.draw_tree_id).button().click(function() {
            self.tree_view();
        });
    },
    tree_view: function(){
        var self = this;
        
        var raw_data = this.get_data();
        //console.log(raw_data);
        if( !raw_data ) return;
        
        var tree_structures = {};
        for(var struc in raw_data){
            console.log(struc);
        
            var tree_models = {};
            var models = raw_data[ struc ].get_list();
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
                tree_models[ 'Model ' + models[i].get_id() ] = tree_chains;
            };
            tree_structures[ 'Structure/File ' + raw_data[ struc ].get_id() ] = tree_models;
        };
        
        var root = pv.dom( tree_structures )
            .root( 'Tree' );
        
        /* Recursively compute the package sizes. */
        root.visitAfter(function(node, depth) {
            if (node.firstChild) {
                if( depth == 3){
                    node.nodeValue = node.childNodes.length + " Residues";
                }else if( depth == 2){
                    node.nodeValue = node.childNodes.length + " Chains";
                }else if( depth == 1){
                    node.nodeValue = node.childNodes.length + " Models";
                }if( depth == 0){
                    node.nodeValue = node.childNodes.length + " Structures";
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
            .event("mousedown", toggle_node);
        
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
            }else{
                console.log(node);
            }
        });
        
        vis.render();
        
        function toggle_node(n){
            n.toggle(pv.event.altKey);
            return layout.reset().root;
        }
        
    },
    get_data: function(){
        var applet = this.applet_selector.get_value(true);
        if(!applet || !applet.loaded) return false;
        
        var selection = 'protein and {*}';
        var format = '\'%[group]\',\'%[sequence]\',%[resno],\'%[chain]\',\'%[atomName]\',%[atomNo],\'%[model]\'';
        var protein_data = applet.evaluate('"[" + {' + selection + '}.label("[' + format + ']").join(",") + "]"');
        //console.log( protein_data );
        //console.log( protein_data );
        //protein_data = protein_data.replace(/\'\'/g,"'");
        
        //protein_data = protein_data.replace(/\,\]/g,",null]");
        
        protein_data = eval( protein_data );
        
        var dat = {};
        
        $.each(protein_data, function() {
            //console.log(this);
            var atom = this;
            //console.log(atom);
            var group = atom[0],
                sequence = atom[1],
                resno = atom[2],
                chain = atom[3],
                atomName = atom[4],
                atomNo = atom[5],
                model = atom[6];
            
            
            var model_file = model.split('.');
            //console.log(model_file);
            //console.log(model.length);
            
            //return;
            if (model.length >= 2){
                var model = model_file[1];
                var file = model_file[0];
            }else{
                var model = model_file[0];
                var file = 1;
            }
            
            var s = dat[ file ];
            if( !s ){
                s = new Bio.Pdb.Structure( file );
                dat[ file ] = s;
            }
            
            var m = s.get( model );
            if( !m ){
                m = new Bio.Pdb.Model( model );
                s.add( m );
            }
            
            var c = m.get( chain );
            //console.log('chain', chain, c);
            if( !c ){
                c = new Bio.Pdb.Chain( chain );
                m.add( c );
            }
            
            var r = c.get( resno );
            //console.log('residue', resno, r);
            if( !r ){
                r = new Bio.Pdb.Residue( resno, group );
                c.add( r );
            }
            
            var a = new Bio.Pdb.Atom( atomName, [], 0, 0, "", atomName, atomNo, "" );
            try{
                r.add( a );
            }catch(err){
                //console.log(err);
            }
        });
        return dat;
    }
});


/**
 * @class Represents transmembrane helices
 * @name Bio.TmHelices
 */
var TmHelices = Bio.TmHelices = function(tmh_list){
    this.tmh_list = tmh_list;
};
TmHelices.prototype = /** @lends Bio.TmHelices.prototype */ {
    
};


/**
 * A widget to view transmembrane helix definitions
 * @constructor
 */
TmHelicesWidget = function(params){
    this.applet = params.applet;
    this.dataset = params.dataset;
    Widget.call( this, params );
    this.canvas_id = this.id + '_canvas';

    var content = '<div class="control_group">' +
        '<div class="control_row">' +
            '<span>Dataset: ' + this.dataset.name + '</span>&nbsp;|&nbsp;' +
            '<span>Applet: ' + this.applet.name_suffix + '</span>' +
        '</div>' +
	'<div class="control_row">' +
            '<div id="' + this.canvas_id + '" style="width:300px; overflow:auto;"></div>' +
        '</div>' +
    '</div>';
    $(this.dom).append( content );
    this._init();
}
TmHelicesWidget.prototype = Utils.extend(Widget, /** @lends Widget.prototype */ {
    _init: function(){
        var self = this;
        this.tree_view();
    },
    tree_view: function(){
        var self = this;
        
        var raw_data = this.get_data();
        //console.log(raw_data);
        if( !raw_data ) return;
        
        var tmhelices = {};
        $.each( raw_data, function(){
            var tmh = this;
            var chain = tmhelices[ tmh[0][0] ];
            if( !chain ){
                chain = tmhelices[ tmh[0][0] ] = {};
            }
            chain[ tmh[0][1] + ' - ' + tmh[1][1] ] = (tmh[1][1] - tmh[0][1]) + ' Residues';
        })
        
        var root = pv.dom( tmhelices )
            .root( 'Protein' );
        
        /* Recursively compute the package sizes. */
        root.visitAfter(function(node, depth) {
            if (node.firstChild) {
                if( depth == 1){
                    node.nodeValue = node.childNodes.length + " TMHs";
                }if( depth == 0){
                    node.nodeValue = node.childNodes.length + " Chains";
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
            .event("mousedown", toggle_node)
            .event("mouseup", select_tmhelix);
        
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
                //node.toggle();
            }
        });
        
        vis.render();
        
        function toggle_node(n){
            n.toggle(pv.event.altKey);
            return layout.reset().root;
        }
        
        function select_tmhelix(n) {
            if( self.applet && n.childNodes.length == 0 && n.parentNode ){
                var beg_end = n.nodeName.split(' - ');
                self.applet.selection_manager.select( 'resNo > ' + beg_end[0] + ' and resNo < ' + beg_end[1] + ' and chain=' + n.parentNode.nodeName );
            }
        }
    },
    get_data: function(){
        return this.dataset.data.tmh_list;
    },
    select: function( selection, applet ){
        
    }
});



/**
 * @class Represents hydrogen bonds
 * @name Bio.Hbonds
 */
var Hbonds = Bio.Hbonds = function(hbonds_list){
    this.hbonds_list = hbonds_list;
};
Hbonds.prototype = /** @lends Bio.Hbonds.prototype */ {
    
};


/**
 * A widget to view hydrogen bonds data
 * @constructor
 */
HbondsWidget = function(params){
    this.color = 'blue';
    this.show_hbonds = '';
    this.applet = params.applet;
    this.dataset = params.dataset;
    Widget.call( this, params );
    this.canvas_id = this.id + '_canvas';
    this.draw_id = this.id + '_draw';
    this.draw_tree_id = this.id + '_draw_tree';
    this.show_hbonds_check_id = this.id + '_show_hbonds_check';
    this.show_hbonds_select_id = this.id + '_show_hbonds_select';

    var content = '<div class="control_group">' +
        '<div class="control_row">' +
            '<span>Dataset: ' + this.dataset.name + '</span>&nbsp;|&nbsp;' +
            '<span>Applet: ' + this.applet.name_suffix + '</span>' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="' + this.show_hbonds_check_id + '">show hydrogen bonds</label>&nbsp;' +
            '<input id="' + this.show_hbonds_check_id + '" type="checkbox" />' +
            '<select id="' + this.show_hbonds_select_id + '" class="ui-state-default">' +
                '<option value="" selected="selected">none</option>' +
                '<option value="all">all available</option>' +
                '<option value="interhelical">interhelical</option>' +
            '</select>' +
        '</div>' +
        //'<div class="control_row">' +
        //    '<i>the hydrogen bonds are shown in blue; residues donor and acceptor atoms are light green</i>' +
        //'</div>' +
        //'<div class="control_row">' +
        //    '<button id="' + this.draw_id + '">draw</button>' +
        //    '<button id="' + this.draw_tree_id + '">draw tree</button>' +
        //'</div>' +
	'<div class="control_row">' +
            '<div id="' + this.canvas_id + '" style="width:300px; overflow:auto;"></div>' +
        '</div>' +
    '</div>';
    $(this.dom).append( content );
    this._init();
}
HbondsWidget.prototype = Utils.extend(Widget, /** @lends HbondsWidget.prototype */ {
    _init: function(){
        DatasetManager.change(this._init_control, this);
        var self = this;
        this.update();
        $("#" + this.draw_id).button().click(function() {
            self.draw();
        });
        $("#" + this.draw_tree_id).button().click(function() {
            self.draw_tree();
        });
        this._init_control();
        $("#" + this.show_hbonds_select_id).hide();
        $("#" + this.show_hbonds_check_id).change( function() {
            self.show_hbonds = $("#" + self.show_hbonds_check_id).is(':checked');
            console.log(self.show_hbonds);
            self.update();
        });
        $("#" + this.show_hbonds_select_id).change( function() {
            self.show_hbonds = $("#" + self.show_hbonds_select_id + " option:selected").val();
            self.update();
        });
        this._init_control();
    },
    _init_control: function(){
        var self = this;
        $.each( DatasetManager.get_list(), function(){
            if(this.type == 'tmhelix' && this.data){
                //console.log(this);
                self.tmh_dataset = this;
                self.show_hbonds = self.show_hbonds ? 'all' : '';
                //self.show_hbonds = 'interhelical'
                $("#" + self.show_hbonds_select_id).val( self.show_hbonds );
                self.update();
                $("#" + self.show_hbonds_select_id).show();
                $("#" + self.show_hbonds_check_id).hide();
                return false;
            }else{
                $("#" + self.show_hbonds_select_id).hide();
                $("#" + self.show_hbonds_check_id).show();
                return true;
            }
        });
    },
    update: function(){
        this.draw();
        this.draw_tree();
    },
    draw: function(){
        if( !this.applet ) return;
        var hbonds = this.get_hbonds();
        this.applet.script( 'draw hbond_' + this.id + '* off' );
        if(hbonds){
            var self = this;
            var draw_hbonds = '';
            var i = 0;
            $.each(hbonds, function(){
                draw_hbonds += 'draw hbond_' + self.id + '_all' + i + ' color ' + self.color + ' (' + this[0][3] + ':' + this[0][2] + '.' + $.trim(this[0][0]) + ') (' + this[1][3] + ':' + this[1][2] + '.' + $.trim(this[1][0]) + ');';
                //draw_hbonds += 'select ' + this[0][3] + ':' + this[0][2] + ',' + this[1][3] + ':' + this[1][2] + '; color lightgreen; cartoon ONLY; wireframe 0.1;';
                i = i+1;
            });
            this.applet.script( draw_hbonds );
        }else{
            this.applet.script( 'draw hbond_' + this.id + '* off' );
        }
    },
    draw_tree: function(){
        var self = this;
        
        var raw_data = this.get_hbonds();
        //if( !raw_data ) return;
        if( !raw_data ) raw_data = [];
        
        var hbonds = {};
        $.each( raw_data, function(){
            var hb = this;
            var chain = hbonds[ hb[0][2] ];
            if( !chain ){
                chain = hbonds[ hb[0][2] ] = {};
            }
            chain[ hb[0][3] + ':' + hb[0][2] + '.' + $.trim(hb[0][0]) + ' <> ' + hb[1][3] + ':' + hb[1][2] + '.' + $.trim(hb[1][0]) ] = 'Type: ' + hb[2] + '';
        })
        
        var root = pv.dom( hbonds )
            .root( 'Protein' );
        
        /* Recursively compute the package sizes. */
        root.visitAfter(function(node, depth) {
            if (node.firstChild) {
                if( depth == 1){
                    node.nodeValue = node.childNodes.length + " Hbonds";
                }if( depth == 0){
                    node.nodeValue = node.childNodes.length + " Chains";
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
            .event("mousedown", toggle_node)
            .event("mouseup", select_hbond);
        
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
            if(depth > 0){
                node.toggle();
            }
        });
        
        vis.render();
        
        function toggle_node(n){
            n.toggle(pv.event.altKey);
            return layout.reset().root;
        }
        
        function select_hbond(n) {
            if( self.applet && n.childNodes.length == 0 && n.parentNode ){
                var hb_res = n.nodeName.split(' <> ');
                self.applet.selection_manager.select(hb_res[0] + ' or ' + hb_res[1]);
            }
        }
    },
    get_hbonds: function(){
        if(this.show_hbonds){
            var self = this;
            var hbonds = this.dataset.data.hbonds_list;
            //console.log( 'helices', this.get_helices() );
            if( this.show_hbonds == 'interhelical' && this.get_helices() ){
                //console.log( this.get_helices() );
                hbonds = $.map(hbonds, function(hb, i){
                    var tmh_a = self.in_which_helix( hb[0] );
                    var tmh_b = self.in_which_helix( hb[1] );
                    if(tmh_a && tmh_b && tmh_a != tmh_b){
                        return [hb];
                    }else{
                        return null;
                    }
                });
            }
            return hbonds;
        }else{
            return false;
        }
    },
    in_which_helix: function (aa){
        var tmh_list = this.get_helices();
        if( tmh_list ){
            var chain = aa[2];
            var number = aa[3];
            var ret = false;
            $.each(tmh_list, function(){
                if(this[0][0] == chain && this[1][0] == chain && this[0][1] <= number && this[1][1] >= number){
                    ret = this;
                    return false; // break
                }
                return true; // continue
            });
            return ret;
        }
        return undefined;
    },
    get_helices: function(){
        if( this.tmh_dataset && this.tmh_dataset.data ){
            return this.tmh_dataset.data.tmh_list;
        }else{
            return false;
        }
    },
    in_selection: function(d){
	return Utils.in_array(this.selection, d, function(a,b){
	    return a[2]==b[2] && (a[3]==b[3] || !b[3]);
	});
    }
});



/**
 * @class Represents interface contacts from sco and mbn files
 * @name Bio.InterfaceContacts
 * @param atoms { cutoff: [atom] } A dictionary containing a list of atoms for different cutoff values
 * @param names [name] A list of available interface names
 */
var InterfaceContacts = Bio.InterfaceContacts = function(atoms, names){
    this.atoms = atoms;
    this.names = names;
};
InterfaceContacts.prototype = /** @lends Bio.InterfaceContacts.prototype */ {
    get_atoms: function( names, cutoff ){
        try{
            return this.atoms[ names ][ cutoff ];
        }catch(err){
            return false;
        }
    }
};


/**
 * A widget to view interface contacts from sco and mbn data
 * @constructor
 */
InterfaceContactsWidget = function(params){
    this.color = 'orange';
    this.cutoff = 1.5;
    this.show_only_interface_atoms = false;
    this.color_interface_residue = false;
    this.interface_ids = '';
    this.interface_names = '';
    this.atoms = [];
    this.structure_atoms = [];
    this.applet = params.applet;
    this.dataset = params.dataset;
    this.dataset.change(this._init_control, this);
    Widget.call( this, params );
    this.interface_name_id = this.id + '_interface_name';
    this.cutoff_id = this.id + '_cutoff';
    this.show_only_interface_atoms_id = this.id + '_show_only_interface_atoms';
    this.color_interface_residue_id = this.id + '_color_interface_residue';
    
    var content = '<div class="control_group">' +
        '<div class="control_row">' +
            '<span>Dataset: ' + this.dataset.name + '</span>&nbsp;|&nbsp;' +
            '<span>Applet: ' + this.applet.name_suffix + '</span>' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="' + this.interface_name_id + '">interface contacts for</label>' +
            '<select id="' + this.interface_name_id + '" class="ui-state-default">' +
                '<option value="">none</option>' +
                '<option value="helix">all helices</option>' +
            '</select>' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="' + this.cutoff_id + '">interface contact cutoff</label>' +
            '<select id="' + this.cutoff_id + '" class="ui-state-default">' +
                '<option value="2.8">2.8</option>' +
                '<option value="2.5">2.5</option>' +
                '<option value="2.0">2.0</option>' +
                '<option value="1.5" selected="selected">1.5</option>' +
                '<option value="1.0">1.0</option>' +
                '<option value="0.5">0.5</option>' +
                '<option value="0.0">0.0</option>' +
                '<option value="-0.5">-0.5</option>' +
            '</select>&nbsp;&#8491;' +
        '</div>' +
        '<div class="control_row">' +
            '<input id="' + this.show_only_interface_atoms_id + '" type="checkbox" />' +
            '<label for="' + this.show_only_interface_atoms_id + '">show only interface atoms/residues</label>' +
        '</div>' +
        '<div class="control_row">' +
            '<input id="' + this.color_interface_residue_id + '" type="checkbox" />' +
            '<label for="' + this.color_interface_residue_id + '">color the complete residue (not only the contact making atom)</label>' +
        '</div>' +
        '<i>interface atoms are shown in orange</i>' +
    '</div>';
    $(this.dom).append( content );
    this._init();
}
InterfaceContactsWidget.prototype = Utils.extend(Widget, /** @lends InterfaceContactsWidget.prototype */ {
    _init: function(){
        var self = this;
        
        if(this.dataset.type == 'mbn'){
            $("#" + this.interface_name_id + ' option[value=]').after("<option value='membrane' selected='selected'>membrane</option>");
            this.interface_names = 'membrane';
        }else{
            this.interface_names = 'helix';
        }
        $("#" + this.interface_name_id).val( this.interface_names );
        
        this._init_control();
        this.retrieve_atoms();
        
        $("#" + this.cutoff_id).change( function() {
            self.cutoff = $("#" + self.cutoff_id + " option:selected").val();
            //console.log( self.cutoff );
            self.retrieve_atoms();
        });
        $("#" + this.interface_name_id).change( function() {
            self.interface_names = $("#" + self.interface_name_id + " option:selected").val();
            self.retrieve_atoms();
        });
        $("#" + self.color_interface_residue_id).bind('change click', function(){
            self.color_interface_residue = $("#" + self.color_interface_residue_id).is(':checked');
            self.draw();
        });
        $("#" + self.show_only_interface_atoms_id).bind('change click', function(){
            self.show_only_interface_atoms = $("#" + self.show_only_interface_atoms_id).is(':checked');
            self.draw();
        });
    },
    _init_control: function(){
        var self = this;
        if( this.dataset.data.names ){
            var data = this.dataset.data.names;
            data.sort();
            $.each(data, function(i){
                $("#" + self.interface_name_id).append("<option value='" + this + "'>helix " + (i+1) + "</option>");
            });
        }
    },
    retrieve_atoms: function (){
        if(this.interface_names){
            var self = this;
            this.dataset.get_atoms( this.interface_ids, this.interface_names, this.cutoff, function( interface_data, structure_data ){
                self.atoms = interface_data;
                self.structure_atoms = structure_data;
                self.draw();
            });
        }else{
            this.atoms = [];
            this.structure_atoms = [];
            this.draw();
        }
    },
    draw: function(){
        if(this.atoms && this.atoms.length){
            var atoms = $.map(this.atoms, function(atom){
                return atom.asNr + ":" + atom.chainId + "." + atom.atomName;
            });
            atoms = atoms.join(',');
            
            if(this.color_interface_residue){
                var cmd = 'display all; select all; color grey; select within(GROUP, (' + atoms + ') ); save selection MINTERF; color ' + this.color + ';';
            }else{
                var cmd = 'display all; select all; color grey; select (' + atoms + '); save selection MINTERF; color ' + this.color + ';';
            }
            
            if(this.show_only_interface_atoms){
                //cmd = cmd + ' restore selection MINTERF; display selected;';
                cmd = cmd + ' display selected; zoom(selected) 100;';
            }else if(this.structure_atoms && this.structure_atoms.length){
                var structure_atoms = $.map(this.structure_atoms, function(atom){
                    return atom.asNr + ":" + atom.chainId + "." + atom.atomName;
                });
                structure_atoms = structure_atoms.join(',');
                cmd = cmd + ' select (' + structure_atoms + '); save selection MSTRUC; color pink; zoom(selected) 100;';
            }
        }else{
            var cmd = 'display all; select all; color grey;';
        }
        
        this.applet.script(cmd + ' select none;');
        //colorSelectedNodes($("#pdb_tree").dynatree("getTree"));
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