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
 * Visits all childs of the given node in preorder. Also visits toggled nodes.
 * @param {pv.Dom.Node} node A protovis dom node
 * @param {function} f A function that is called on every visited node with the node itself and the depth as arguments.
 */
Provi.Utils.Protovis.node_visit_before = function(node, f) {
    function visit(n, i) {
	// untoggle toggled nodes
        var switched = false;
        if(n.toggled){ switched = true; n.toggle(); }
        // call supplied function before descending
	f(n, i);
        for (var c = n.firstChild; c; c = c.nextSibling) {
            visit(c, i + 1);
        }
	// reverse previous untoggeling
        if(switched) n.toggle();
    }
    visit(node, 0);
};


/**
 * Visits all childs of the given node in postorder.  Also visits toggled nodes.
 * @param {pv.Dom.Node} node A protovis dom node
 * @param {function} f A function that is called on every visited node with the node itself and the depth as arguments.
 */
Provi.Utils.Protovis.node_visit_after = function(node, f) {
    function visit(n, i) {
	// untoggle toggled nodes
        var switched = false;
        if(n.toggled){ switched = true; n.toggle(); }
        for (var c = n.firstChild; c; c = c.nextSibling) {
            visit(c, i + 1);
        }
	// call supplied function after descending
        f(n, i);
	// reverse previous untoggeling
        if(switched) n.toggle();
    }
    visit(node, 0);
};



Provi.Utils.Protovis.Boundbox = function( params ){
    this.canvas = params.canvas;
    this.bb;
};
Provi.Utils.Protovis.Boundbox.prototype = /** @lends Provi.Utils.Protovis.Boundbox.prototype */ {
    /**
     * Attach the bounding box to a <tt>pv.Mark</tt>
     * @param {pv.Mark} mark
     */
    attach: function(mark){
	
	/* Compute the transform to offset the tooltip position. */
	var t = pv.Transform.identity,
	    p = mark.parent;
	do {
	    t = t.translate( p.left(), p.top() ).times( p.transform() );
	} while ( p = p.parent );
	
	if( !this.bb ){
	    var c = mark.root.canvas();
	    c.style.position = "relative";
      
	    this.bb = c.appendChild( document.createElement("div") );
	    this.bb.style.position = "absolute";
	    this.bb.style.pointerEvents = "none"; // ignore mouse events
	    
	    //console.log( this.bb.style );
	    //this.bb.style["background-color"] = "red";
	    //this.bb.style["z-index"] = 1000;
	}
	
	/*
	 * Compute bounding box. TODO support area, lines, wedges, stroke. Also
	 * note that CSS positioning does not support subpixels, and the current
	 * rounding implementation can be off by one pixel.
	 */
	//console.log( mark, mark.properties );
	if (mark.properties.width) {
	    //console.log('mark.properties.width');
	    this.bb.style.width = Math.ceil(mark.width() * t.k) + 1 + "px";
	    this.bb.style.height = Math.ceil(mark.height() * t.k) + 1 + "px";
	} else if (mark.properties.shapeRadius) {
	    //console.log('mark.properties.shapeRadius');
	    var r = mark.shapeRadius();
	    t.x -= r;
	    t.y -= r;
	    this.bb.style.height = this.bb.style.width = Math.ceil(2 * r * t.k) + "px";
	} else if (mark.properties.radius) {
	    //console.log('mark.properties.radius');
	    var r = mark.radius();
	    t.x -= r;
	    t.y -= r;
	    this.bb.style.height = this.bb.style.width = Math.ceil(2 * r * t.k) + "px";
	} else if (mark.properties.font) {
	    //console.log('mark.properties.font', mark.top(), mark.textBaseline(), mark.font(), mark.left(), mark.right(), mark.textMargin());
	    
	    var f = parseInt( mark.font().split(" ")[0].split('px') ); 
	    //console.log(f);
	    t.y -= f/2;
	    this.bb.style.height = this.bb.style.width = f + 'px';
	}
	console.log('height,width', this.bb.style.height, this.bb.style.width);
	this.bb.style.left = Math.floor(mark.left() * t.k + t.x) + "px";
	this.bb.style.top = Math.floor(mark.top() * t.k + t.y) + "px";
    }
}


})();