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
 * @param {array} atoms A list containing lists with atom packing data.
 * @param {array} cavities A list of cavities.
 */
Provi.Bio.Voronoia.Vol = function(atoms, cavities){
    this.atoms = atoms;
    this.cavities = cavities;
    this.cavity_neighbours_dict = {};
};
Provi.Bio.Voronoia.Vol.prototype = /** @lends Provi.Bio.Voronoia.Voronoia.prototype */ {
    make_cavity_neighbours_dict: function(){
        var self = this;
        if( this.atoms && this.cavities ){
            $.each( this.cavities, function(i){
                var cav = this;
                self.cavity_neighbours_dict[ cav[0] ] = [];
            });
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
    }
};

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