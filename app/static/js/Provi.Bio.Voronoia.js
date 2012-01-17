/**
 * @fileOverview This file contains the {@link Provi.Bio.Voronoia} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * @namespace
 * Voronoia module
 */
Provi.Bio.Voronoia = {};


(function() {

/** @exports Utils as Provi.Utils */
var Utils = Provi.Utils;

/** @exports Widget as Provi.Widget.Widget */
var Widget = Provi.Widget.Widget;


/**
 * @class Represents voronoia cavities, neighbours and packing data
 * @constructor
 * @extends Provi.Bio.Smcra.AbstractAtomPropertyMap
 * @param {array} atoms A list containing lists with atom packing data.
 * @param {array} cavities A list of cavities.
 */
Provi.Bio.Voronoia.Vol = function(atoms, cavities){
    // 0: chain_id, 1: residue_number, 2: residue_type, 3:atom_type, 4: packing_density,
    // 5: vdw_volume, 6: solv_ex_volume, 7: total_volume, 8: surface, 9: cavity_nb, 10: cavities
    this.atoms = atoms;
    this.cavities = cavities;
    this.cavity_neighbours_dict = {};
    this.init();
};
Provi.Bio.Voronoia.Vol.prototype = Provi.Utils.extend(Provi.Bio.Smcra.AbstractAtomPropertyMap, /** @lends Provi.Bio.Voronoia.Vol.prototype */ {
    key_length: 3,
    init: function( atoms, cavities ){
	if(atoms) this.atoms = atoms;
	if(cavities) this.cavities = cavities;
	if( this.atoms && this.cavities ){
	    this._make_cavity_neighbours_dict();
	}
	if( this.atoms ){
	    this._make_atoms_property_dict();
	}
    },
    _make_atoms_property_dict: function(){
	var self = this;
	this.property_dict = {};
	this.property_list = [];
	$.each( this.atoms, function(i, atom){
	    var property = {
		packing_density: atom[4],
		vdw_volume: atom[5],
		solv_ex_volume: atom[6],
		total_volume: atom[7],
		surface: atom[8],
		cavity_nb: atom[9]
	    }
	    self.property_dict[ [ atom[0], atom[1], atom[3] ] ] = property;
	    self.property_list.push( property );
	})
    },
    _make_cavity_neighbours_dict: function(){
        var self = this;
        if( this.atoms && this.cavities ){
	    console.log(this.atoms);
	    console.log(this.cavities);
            $.each( this.cavities, function(i){
                var cav = this;
		//console.log(cav);
                self.cavity_neighbours_dict[ cav[0] ] = [];
            });
	    console.log( self.cavity_neighbours_dict );
            $.each( this.atoms, function(i){
                var atom = this;
                if(atom[10].length){
                    $.each( atom[10], function(i){
                        var cav_id = parseInt(this) + 1;
                        self.cavity_neighbours_dict[ cav_id ].push( atom );
                    });
                }
            });
        }
    },
    _property_names: {
	packing_density: 'Packing density',
	vdw_volume: 'VdW volume',
	solv_ex_volume: 'Solvent ex. vol.',
	total_volume: 'Total vol.',
	surface: 'Surface',
	cavity_nb: 'Cavity number'
    },
    _html_template: (function(){
	return $.template('<ul>' +
	    '<lh>Voronoia data</lh>' +
	    '<li>Packing density: ${packing_density.toFixed(2)}</li>' +
	    '<li>VdW volume: ${vdw_volume.toFixed(2)}</li>' +
	    '<li>Solvent ex. vol.: ${solv_ex_volume.toFixed(2)}</li>' +
	    '<li>Total vol.: ${total_volume.toFixed(2)}</li>' +
	    '<li>Surface: ${surface}</li>' +
	    '<li>Cavity number: ${cavity_nb}</li>' +
	'</ul>');
    })(),
    _html_data: function( property ){
	return property;
    }
});


/**
 * @class Represents voronoia cavities, neighbours and packing data
 * @constructor
 * @extends Provi.Bio.Smcra.AbstractResiduePropertyMap
 * @param {Provi.Bio.Voronoia.Vol} vol An object with voronoia vol atom data.
 */
Provi.Bio.Voronoia.VolResidueMap = function( vol ){
    this.vol = vol;
    this.init();
};
Provi.Bio.Voronoia.VolResidueMap.prototype = Provi.Utils.extend(Provi.Bio.Smcra.AbstractResiduePropertyMap, /** @lends Provi.Bio.Voronoia.VolResidueMap.prototype */ {
    key_length: 2,
    init: function(  ){
	this._make_property_dict();
	console.log( 'VolResidueMap', this );
    },
    _make_property_dict: function(){
	var self = this;
	
	var by_res_vol_dict = {};
	$.each( this.vol.get_dict(), function(key, property){
	    var res_key = key.split(',').slice(0,2);
	    //console.log(res_key, key);
	    if( !by_res_vol_dict[ res_key ] ) by_res_vol_dict[ res_key ] = [];
	    by_res_vol_dict[ res_key ].push( property );
	});
	
	this.property_dict = {};
	this.property_list = [];
	//console.log('by_res_vol_dict', by_res_vol_dict);
	$.each( by_res_vol_dict, function(key, property_list){
	    var property = {
		packing_density: pv.mean( property_list, function(p){ return p['packing_density'] } ),
		vdw_volume: pv.sum( property_list, function(p){ return p['vdw_volume'] } ),
		solv_ex_volume: pv.sum( property_list, function(p){ return p['solv_ex_volume'] } ),
		total_volume: pv.sum( property_list, function(p){ return p['total_volume'] } )
	    }
	    self.property_dict[ key ] = property;
	    self.property_list.push( property );
	});
    },
    _property_names: {
	packing_density: 'Packing density mean',
	vdw_volume: 'VdW volume sum',
	solv_ex_volume: 'Solvent ex. vol. sum',
	total_volume: 'Total vol. sum'
    },
    _html_template: (function(){
	return $.template('<ul>' +
	    '<lh>Voronoia residue data</lh>' +
	    '<li>Packing density mean: ${packing_density.toFixed(2)}</li>' +
	    '<li>VdW volume sum: ${vdw_volume.toFixed(2)}</li>' +
	    '<li>Solvent ex. vol. sum: ${solv_ex_volume.toFixed(2)}</li>' +
	    '<li>Total vol. sum: ${total_volume.toFixed(2)}</li>' +
	'</ul>');
    })(),
    _html_data: function( property ){
	return property;
    }
});



/**
 * A widget to view voronoia data: cavities, their neighbours and packing data
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Bio.Voronoia.VoronoiaWidget = function(params){
    this.applet = params.applet;
    this.dataset = params.dataset;
    this.cavities_model_number = params.cavities_model_number;
    Widget.call( this, params );
    this.canvas_id = this.id + '_canvas';

    var content = '<div class="control_group">' +
	'<div class="control_row">' +
            '<div id="' + this.canvas_id + '" style="width:300px; overflow:auto;"></div>' +
        '</div>' +
    '</div>';
    $(this.dom).append( content );
    this._init();
}
Provi.Bio.Voronoia.VoronoiaWidget.prototype = Utils.extend(Widget, /** @lends VProvi.Bio.Voronoia.oronoiaWidget.prototype */ {
    _init: function(){
        var self = this;
        this.tree_view();
    },
    tree_view: function(){
        var self = this;
        
        var raw_data = this.get_data();
        //console.log(raw_data);
        if( !raw_data ) return;
        
        var cavities = {};
        $.each( raw_data, function(i){
            cavities[i] = i+'';
        })
        
        var root = pv.dom( cavities )
            .root( 'Cavities' );
        
        root.visitAfter(function(node, depth) {
	    node.node_depth = depth;
            if (node.firstChild && depth==0) {
                node.nodeValue = node.childNodes.length + " Cavities";
            }else if(depth == 1){
                node.nodeName = parseInt(node.nodeName) + 1;
                node.nodeValue = raw_data[node.nodeValue][7] + ' \u212B';
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
        
        var center = node.anchor("center").add(pv.Panel)
	    .top(0)
            .width(15)
            .fillStyle('white');
	    
	var cavity_toggler = new Provi.Utils.Protovis.NodeToggler({
	    toggle_name: 'cavity_visible',
	    layout_obj: layout,
	    root: root,
	    on_toggle: function( n, toggle ){
		if( n.node_depth != 1 ) return '';
		if( toggle ){
		    return 'hide hidden or {' + n.nodeName + '/' + self.cavities_model_number + '};';
		}else{
		    return 'display displayed or {' + n.nodeName + '/' + self.cavities_model_number + '};';
		}
	    },
	    after_toggle: function( n, toggle, toggle_data ){
		self.applet.script( toggle_data.join('') );
	    }
	});
	    
        center.anchor('left').add(pv.Dot)
            .strokeStyle("#1f77b4")
            .shape('square')
	    .fillStyle(function(n){ return cavity_toggler.value_switch(n, "black", "white", "lightgrey") })
            .event("mousedown", function(n){ return cavity_toggler.toggle(n) });
	
	var neighbours_toggler = new Provi.Utils.Protovis.NodeToggler({
	    toggle_name: 'neighbours_visible',
	    layout_obj: layout,
	    root: root,
	    on_toggle: function( n, toggle ){
		if( n.node_depth != 1 ) return false;
		var sele = [];
		$.each( self.dataset.data.cavity_neighbours_dict[ n.nodeName ], function(i, atom){
		    sele.push( '(' + (atom[0] ? 'chain=' + atom[0] + ' and ' : '') + 'resNo=' + atom[1] + ')' );
		});
		sele = 'not ' + self.cavities_model_number + ' and (' + sele.join(' or ') + ')';
		var s = 'select {' + sele + '}; wireframe ' + (toggle ? 'off' : '0.2') + ';';
		return [s, sele];
	    },
	    after_toggle: function( n, toggle, toggle_data ){
		var sele = [];
		var script = '';
		$.each( toggle_data, function(i, data){
		    if(data){
			script += data[0];
			sele.push( data[1] );
		    }
		})
		self.applet.script( script, true );
		sele = new Provi.Selection.Selection({ selection: sele.join(' or '), applet: self.applet });
		if( toggle ){
		    pv.event.metaKey ? sele.add() : sele.select();
		}else{
		    if (!pv.event.altKey) sele.deselect();
		}
		if( pv.event.altKey ) self.applet.script_wait( 'zoomto 0.5 (' + sele.selection + ');' );
	    }
	});
	
        center.anchor('right').add(pv.Dot)
            .strokeStyle("#1f77b4")
	    .fillStyle(function(n){ return neighbours_toggler.value_switch(n, "black", "white", "lightgrey") })
            .shape('square')
            .event("mousedown", function(n){ return neighbours_toggler.toggle(n) });
        
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
	
    },
    get_data: function(){
        return this.dataset.data.cavities;
    },
    select: function( selection, applet ){
        
    }
});


})();