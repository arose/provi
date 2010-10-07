/**
 * @fileOverview This file contains the {@link Provi.Utils.Protovis} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * @namespace
 * Protovis utils module
 */
Provi.Utils.Protovis = {};


(function() {

/** @exports Utils as Provi.Utils */
var Utils = Provi.Utils;


Provi.Utils.Protovis.toggle_type = {
    OFF: 0,
    ON: 1,
    MIXED: 2
};


Provi.Utils.Protovis.toggle_type_switch = function(value, on, off, mixed){
    return value ? (value === Provi.Utils.Protovis.toggle_type.MIXED ? mixed : on) : off;
};


/**
 * tree node toggle class for protovis dom trees
 * @constructor
 * @param {object} params The configuration object.
 * @param {string} params.toggle_name The name of the property on a {@link pv.Dom.Node}.
 * @param {pv.Layout.Indent} params.layout_obj The protovis tree (indent) layout object.
 * @param {pv.Dom.Node} params.root The root node.
 * @param {function} params.on_toggle The function called while toggling a node.
 * @param {function} params.after_toggle The function called after toggling all nodes.
 */
Provi.Utils.Protovis.NodeToggler = function(params){
    this.toggle_name = params.toggle_name;
    this.layout_obj = params.layout_obj;
    this.root = params.root;
    this.on_toggle = params.on_toggle || function(){};
    this.after_toggle = params.after_toggle || function(){};
};
Provi.Utils.Protovis.NodeToggler.prototype = /** @lends Provi.Utils.Protovis.NodeToggler.prototype */ {
    toggle: function( n ) {
	var self = this;
	var toggle_data = [];
        var toggle = n[self.toggle_name] ? n[self.toggle_name] : Provi.Utils.Protovis.toggle_type.OFF;
        Provi.Utils.Protovis.node_visit_after( n, function(node){
            toggle_data.push( self._toggle( node, toggle ) );
        });
        this.update();
	this.after_toggle( n, n[this.toggle_name], toggle_data );
	return this.layout_obj.reset().root;
    },
    _toggle: function( n, toggle ){
	if( typeof(toggle) == 'undefined' ) toggle = n[this.toggle_name];
        n[this.toggle_name] = toggle ? Provi.Utils.Protovis.toggle_type.OFF : Provi.Utils.Protovis.toggle_type.ON;
	return this.on_toggle( n, toggle );
    },
    update: function(){
        var self = this;
        // find nodes with mixed child toggle status
        Provi.Utils.Protovis.node_visit_after( this.root, function(node){
            if(!node.childNodes.length) return;
            var on = 0
            var off = 0;
	    $.each(node.childNodes, function(i, cn){
                var cn_toggle = cn[self.toggle_name];
                if( cn_toggle === Provi.Utils.Protovis.toggle_type.ON ){
                    ++on;
                }else if( cn_toggle === Provi.Utils.Protovis.toggle_type.OFF || typeof(cn_toggle) == 'undefined' ){
                    ++off;
                }
            });
            if( on == node.childNodes.length ){
                node[self.toggle_name] = Provi.Utils.Protovis.toggle_type.ON;
            }else if( off == node.childNodes.length ){
                node[self.toggle_name] = Provi.Utils.Protovis.toggle_type.OFF;
            }else{
                node[self.toggle_name] = Provi.Utils.Protovis.toggle_type.MIXED;
            }
        });
    },
    value_switch: function(node, on, off, mixed){
        return Provi.Utils.Protovis.toggle_type_switch( node[this.toggle_name], on, off, mixed );
    }
};


/**
 * Visits all childs of the given node in preorder.
 * @param {pv.Dom.Node} node A protovis dom node
 * @param {function} f A function called on every visited node with the node itself and the depth as arguments.
 */
Provi.Utils.Protovis.node_visit_before = function(node, f) {
    function visit(n, i) {
        var toggled = false;
        if(n.toggled){ toggled = true; n.toggle(); }
        f(n, i);
        for (var c = n.firstChild; c; c = c.nextSibling) {
            visit(c, i + 1);
        }
        if(toggled) n.toggle();
    }
    visit(node, 0);
};


/**
 * Visits all childs of the given node in postorder.
 * @param {pv.Dom.Node} node A protovis dom node
 * @param {function} f A function called on every visited node with the node itself and the depth as arguments.
 */
Provi.Utils.Protovis.node_visit_after = function(node, f) {
    function visit(n, i) {
        var toggled = false;
        if(n.toggled){ toggled = true; n.toggle(); }
        for (var c = n.firstChild; c; c = c.nextSibling) {
            visit(c, i + 1);
        }
        f(n, i);
        if(toggled) n.toggle();
    }
    visit(node, 0);
};



})();