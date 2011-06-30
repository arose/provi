/**
 * @fileOverview This file contains the {@link Provi.Bio.TransmembraneHelices} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * @namespace
 * Transmembrane helices module
 */
Provi.Bio.TransmembraneHelices = {};


(function() {

/** @exports Utils as Provi.Utils */
var Utils = Provi.Utils;

/** @exports Widget as Provi.Widget.Widget */
var Widget = Provi.Widget.Widget;


/**
 * @class Represents transmembrane helices
 */
Provi.Bio.TransmembraneHelices.TmHelices = function(tmh_list){
    this.tmh_list = tmh_list;
};
Provi.Bio.TransmembraneHelices.TmHelices.prototype = /** @lends Provi.Bio.TransmembraneHelices.TmHelices.prototype */ {
    
};


/**
 * A widget to view transmembrane helix definitions
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Bio.TransmembraneHelices.TmHelicesWidget = function(params){
    params = $.extend(
        Provi.Bio.TransmembraneHelices.TmHelicesWidget.prototype.default_params,
        params
    );
    this.applet = params.applet;
    this.dataset = params.dataset;
    Widget.call( this, params );
    this.canvas_id = this.id + '_canvas';
    this.jstree_id = this.id + '_jstree';

    var content = '<div class="control_group">' +
	'<div class="control_row">' +
            '<div id="' + this.jstree_id + '"></div>' +
        '</div>' +
	'<div class="control_row">' +
            '<div id="' + this.canvas_id + '" style="width:300px; overflow:auto;"></div>' +
        '</div>' +
    '</div>';
    $(this.dom).append( content );
    this._init();
}
Provi.Bio.TransmembraneHelices.TmHelicesWidget.prototype = Utils.extend(Widget, /** @lends Provi.Bio.TransmembraneHelices.TmHelicesWidget.prototype */ {
    _init: function(){
        var self = this;
        this.tree_view();
	Widget.prototype.init.call(this);
    },
    tree_view: function(){
        var self = this;
        
        var raw_data = this.get_data();
        //console.log(raw_data);
        if( !raw_data ) return;
	
	var jstree_data = [];
        $.each( raw_data, function(){
	    var tmh = this;
	    jstree_data.push({
		data: '[' + tmh[0][0] + ']\t' + tmh[0][1] + ' - ' + tmh[1][1] + '\t(' + (tmh[1][1] - tmh[0][1]) + ' Residues)'
	    });
        });
        
	console.log( jstree_data );
	$( '#' + this.jstree_id ).jstree({
	    json_data: {
		data: {
                    "data" : "Protein",
                    "children" : jstree_data
                }
	    },
	    core: {
		
	    },
	    plugins: [ "json_data", "themeroller" ]
	});
	
	
	//var tmhelices = {};
	//$.each( raw_data, function(){
	//    var tmh = this;
	//    var chain = tmhelices[ tmh[0][0] ];
	//    if( !chain ){
	//	chain = tmhelices[ tmh[0][0] ] = {};
	//    }
	//    chain[ tmh[0][1] + ' - ' + tmh[1][1] ] = (tmh[1][1] - tmh[0][1]) + ' Residues';
	//});
	//
        //var root = pv.dom( tmhelices )
        //    .root( 'Protein' );
        //
        ///* Recursively compute the package sizes. */
        //root.visitAfter(function(node, depth) {
        //    if (node.firstChild) {
        //        if( depth == 1){
        //            node.nodeValue = node.childNodes.length + " TMHs";
        //        }if( depth == 0){
        //            node.nodeValue = node.childNodes.length + " Chains";
        //        }
        //    }
        //});
        //
        //var vis = new pv.Panel()
        //    .canvas( this.canvas_id )
        //    .width(260)
        //    .height(function(){ return (root.nodes().length + 1) * 12 })
        //    .margin(5);
        //
        //var layout = vis.add(pv.Layout.Indent)
        //    .nodes(function(){ return root.nodes() })
        //    .depth(12)
        //    .breadth(12);
        //
        //layout.link.add(pv.Line);
        //
        //var node = layout.node.add(pv.Panel)
        //    .top(function(n){ return n.y - 6 })
        //    .height(12)
        //    .right(6)
        //    .strokeStyle(null)
        //    .fillStyle(null)
        //    .events("all")
        //    .event("mousedown", toggle_node)
        //    .event("mouseup", select_tmhelix);
        //
        //node.anchor("left").add(pv.Dot)
        //    .strokeStyle("#1f77b4")
        //    .fillStyle(function(n){ return n.toggled ? "#1f77b4" : n.firstChild ? "#aec7e8" : "#ff7f0e" })
        //    .title(function t(d){ return d.parentNode ? (t(d.parentNode) + "." + d.nodeName) : d.nodeName })
        //  .anchor("right").add(pv.Label)
        //    .text(function(n){ return n.nodeName });
        //
        //node.anchor("right").add(pv.Label)
        //    .textStyle(function(n){ return n.firstChild || n.toggled ? "#aaa" : "#000" })
        //    .text(function(n){ return n.nodeValue || ''; });
        //
        //root.visitAfter(function(node, depth){
        //    if(depth > 1){
        //        //node.toggle();
        //    }
        //});
        //
        //vis.render();
        //
        //function toggle_node(n){
        //    n.toggle(pv.event.altKey);
        //    return layout.reset().root;
        //}
        //
        //function select_tmhelix(n) {
        //    if( self.applet && n.childNodes.length == 0 && n.parentNode ){
        //        var beg_end = n.nodeName.split(' - ');
        //        self.applet.selection_manager.select( 'resNo >= ' + beg_end[0] + ' and resNo <= ' + beg_end[1] + ' and chain=' + n.parentNode.nodeName );
        //    }
        //}
    },
    get_data: function(){
        return this.dataset.data.tmh_list;
    },
    select: function( selection, applet ){
        
    }
});



})();