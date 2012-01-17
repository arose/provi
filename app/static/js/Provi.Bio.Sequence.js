/**
 * @fileOverview This file contains the {@link Provi.Bio.Sequence} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * @namespace
 * Sequence module
 *
 * @requires Provi.Utils
 * @requires Provi.Widget
 * @requires Provi.Jmol.Applet
 */
Provi.Bio.Sequence = {};


(function() {

/** @exports Utils as Provi.Utils */
var Utils = Provi.Utils;

/** @exports Widget as Provi.Widget.Widget */
var Widget = Provi.Widget.Widget;

var toggle_type = {};//Provi.Utils.Protovis.toggle_type;

var Sequence = {};

/**
 * A widget to create sequence view from molecular data
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Bio.Sequence.SequenceViewWidget = function(params){
    this.applet = params.applet;
    this.selection = [];
    this.vis = false;
    params.persist_on_applet_delete = true;
    Widget.call( this, params );
    this._build_element_ids([ 'canvas', 'draw_sequence', 'property_map_vis_builder_widget' ]);
    
    var content = '<div>' +
        '<div style="float:left; ">' +
	    '<button style="float:left; " id="' + this.draw_sequence_id + '">update</button>&nbsp;' +
	'</div>' +
	'<div style="float:left; ">' +
	    '<div class="control_row" id="' + this.property_map_vis_builder_widget_id + '"></div>' +
	'</div>' +
	'<div style="display:block; overflow:auto;">' +
	    '<span id="' + this.canvas_id + '" style="display:inline;"></span>' +
	'</div>' +
    '</div>';
    $(this.dom).append( content );
    
    this.property_map_vis_builder = new Provi.Bio.Smcra.PropertyMapVisBuilderWidget({
	parent_id: this.property_map_vis_builder_widget_id,
	applet: this.applet,
	level: ['R'],
	max_key_length: 5
    });
    this._init();
}
Provi.Bio.Sequence.SequenceViewWidget.prototype = Utils.extend(Widget, /** @lends Provi.Bio.Sequence.SequenceViewWidget.prototype */ {
    _init: function(){
        var self = this;
        
        this.sequence_view();
        $("#" + this.draw_sequence_id).button().click(function() {
            self.update();
        });
        $(this.applet).bind('load_struct', function(){
            self.update();
        });
        $(this.applet.selection_manager).bind('select', function( e, selection, applet ){
            self.selection = selection;
            self.vis ? self.vis.render() : self.update();
        });
	$(this.property_map_vis_builder).bind('built', function( e, property_map ){
	    self.property_map = property_map;
	    self.sequence_view();
	});
    },
    update: function(){
	this.property_map_vis_builder.update( this.get_data() );
	this.sequence_view();
    },
    sequence_view: function(){
        var self = this;
        
        var smcra = this.get_data();
	if(!smcra) return;
	
	var residues = smcra.get_residues();
        if( !residues ) return;
        var w = 20 + 24*residues.length;
        var h = 45;
	
	var color_bfactor = {};
	var y_bfactor = {};
	var max_y = 0;
	// get a scaling function for each structure seperately
	$.each( smcra.get_structures(), function(i, s){
	    var local_max_y = pv.max( s.get_residues(), function(r){ return r.get_bfactor() } ) || 1;
	    max_y = Math.max( max_y, local_max_y );
	    color_bfactor[s.id] = pv.Scale.linear(0, local_max_y/2, local_max_y).range("green", "yellow", "red");
	    y_bfactor[s.id] = pv.Scale.linear(0, local_max_y).range(0, h-13);
	});
	var c_bf = function( entity ){
	    return color_bfactor[entity.structure().id]( entity.get_bfactor() );
	}
	var y_bf = function( entity ){
	    return y_bfactor[entity.structure().id]( entity.get_bfactor() );
	}
        var x = pv.Scale.linear(0, residues.length).range(3, w-17);
        
	
        this.vis = new pv.Panel()
            .canvas( this.canvas_id )
            .margin( 0 )
            .width( w )
            .height( h );
        
	
	var property_map = this.property_map;
	if( !property_map ){
	    var bfactor_dict = {};
	    $.each( residues, function(i, res){
		bfactor_dict[ res.get_full_id() ] = res.get_bfactor();
	    });
	    property_map = new Provi.Bio.Smcra.PropertyMapVisualisationWrapper(
		new Provi.Bio.Smcra.AbstractResiduePropertyMap( bfactor_dict ),
		{ is_atomic: true }
	    );
	}
	
	var color_property = function(d){ return 'lightgrey'; }
	if( property_map.is_atomic ){
	    var p_list = property_map.get_list();
	    var max_property = pv.max( p_list ) || 1;
	    var min_property = pv.min( p_list ) || 0;
	    color_property = pv.Scale.linear(min_property, (min_property+max_property)/2, max_property).range("green", "yellow", "red");
	    y_property = pv.Scale.linear(min_property, max_property).range(0, h-13);
	}
	
	
        var bar = this._bar = this.vis.add(pv.Bar)
            .data( residues )
            .bottom(12)
            .width(19)
            .height(function(r){ return y_property( property_map.get(r) ); })
            .left(function(){ return this.index * 24 + 5; })
            .fillStyle(function(r){
		return property_map.has_id(r) ? color_property( property_map.get(r) ) : ''; });
	
	
        bar.add(pv.Panel)
            .height( h-13 )
            .fillStyle( 'rgba(255, 255, 255, 0.2)' )
	    .lineWidth( function(r){ return self.in_selection(r) ? 2 : 0; })
	    .strokeStyle( 'black' )
            .text(function(r){ return (r.chain().id ? r.chain().id + ':' : '') + r.id; })
	    .event("mouseover", pv.Behavior.tipsy({gravity: "e", fade: true}))
            .event("mouseup", function(r) {
		console.log( r.jmol_expression() );
                //var sele = new Provi.Selection.Selection({ selection: 'resNo=' + r.id + ' ' + (r.chain().id ? 'and chain=' + r.chain().id : ''), applet: self.applet });
		var sele = new Provi.Selection.Selection({ selection: r.jmol_expression(), applet: self.applet });
                if( self.in_selection(r) ){
                    if (!pv.event.altKey) sele.deselect();
                }else{
                    pv.event.metaKey ? sele.add() : sele.select();
                }
                if( pv.event.altKey ) self.applet.script_wait( 'zoomto 0.5 (' + sele.selection + ');' );
            });
          
        bar.anchor("bottom").add(pv.Label)
            .text(function(r){ return r.resname; })
            .textAlign("left")
            .textBaseline("middle")
            .textAngle(-Math.PI / 2);
            
        bar.add(pv.Label)
            .bottom(-2)
            .text(function(r, i){ return (this.index % 10 == 0) ? ( r.chain().id ? r.chain().id + ':' : '') + r.id : ''; })
            .textAlign("left")
            .textAngle(0);
          
        this.vis.root.render();
    },
    get_data: function(){
        if(!this.applet || !this.applet.loaded) return false;
	return this.applet.get_smcra();
    },
    in_selection: function(res){
	return Utils.in_array(this.selection, res, function(a,r){
	    return a.resno==r.id && a.chain==r.chain().id && a.model==r.model().id && a.file==r.structure().id;
	});
    }
});



/**
 * A widget
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Bio.Sequence.GridWidget = function(params){
    params = $.extend(
        Provi.Bio.Sequence.GridWidget.prototype.default_params,
        params
    );
    console.log('SEQUENCE GRID', params);
    params.persist_on_applet_delete = false;
    params.heading = 'Sequence Grid';
    params.collapsed = false;
    Provi.Widget.Widget.call( this, params );
    this._init_eid_manager( ['grid'] );
    
    this.dataset = params.dataset;
    this.applet = params.applet;
    
    var template = '' +
	'<div class="control_row">' +
	'<div class="control_row">' +
        '<div style="width:600px;height:500px; position:absolute;" id="${eids.grid}"></div>' +
	'</div>' +
	'</div>' +
	'';
    
    this.add_content( template, params );
    this._init();
}
Provi.Bio.Sequence.GridWidget.prototype = Utils.extend(Provi.Widget.Widget, /** @lends Provi.Bio.Sequence.GridWidget.prototype */ {
    default_params: {
        
    },
    _init: function(){
        var self = this;
        
        this.create_grid();
	this.update_grid();
        
	if( this.applet ){
	    $(this.applet).bind('load_struct', function(){
		self.update_grid();
	    });
	    $(this.applet).bind('script', function(){
		//self.update_grid();
	    });
	    $(this.applet).bind('select', function(){
		self.update_grid();
	    });
	}
	
	Provi.Widget.Widget.prototype.init.call(this);
    },
    create_grid: function(){
	var self = this;
	
	BoolCellFormatter = function(row, cell, value, columnDef, dataContext) {
	    return value ? "<img src='../js/lib/slickgrid/images/tick.png'>" : "";
	}
	
	ColorCellFormatter = function(row, cell, value, columnDef, dataContext) {
	    var c = "0,0,0";
	    if( value ){
		c = value.split(/\s+/g).join(',');
	    }
	    return "<div style='background-color:rgb(" + c + ");'>&nbsp;</div>";
	}
	
	var columns = [
	    {id:"atomno", name:"Atom No", field:"atomno", width:60},
	    {id:"group", name:"Group", field:"group", width:50},
	    {id:"resno", name:"Res No", field:"resno", width:60},
	    {id:"chain", name:"Chain", field:"chain", width:40},
	    {id:"color", name:"Color", field:"color", width:40, formatter:ColorCellFormatter},
	    {id:"selected", name:"Selected", field:"selected", width:40, formatter:BoolCellFormatter},
	    //{id:"atomname", name:"Atom Name"},
	    //{id:"model", name:"Model"},
	    //{id:"altloc", name:"Alt Loc"},
	    //{id:"bfac", name:"Bfac"}
	];
	
	var data = [ { resno: "1", chain: "A", atomno: 1 } ];
	
	var options = {
	    enableCellNavigation: false,
	    enableColumnReorder: false
	};
	
	data = [ { resno: "1", chain: "A", atomno: 1, group:"Lys", selected:1.0 } ];
        //this.gridx = new Slick.Grid( this.elm('grid'), data, columns, options);
	this.grid = new Slick.Grid( $('#grid'), data, columns, options);
	//console.log( this.grid );
	
    },
    update_grid: function(){
	if( this.applet ){
	    //var selection = 'protein and {*}';
	    var selection = '{*}';
	    var format = '' +
		'\'%[group]\',\'%[sequence]\',\'%[resno]\',\'%[chain]\',\\"%[atomName]\\"' +
		',\'%[atomNo]\',\'%[model]\',\'%[altLoc]\',\'%[temperature]\',\'%[selected]\'' +
		',\'%[color]\',\'%[altLoc]\',\'%[selected]\'' +
		'';
	    var atoms_data = this.applet.atoms_property_map( format, selection );
	    atoms_data = _.map( atoms_data, function(val,i){
		return {
		    resno: parseInt(val[2]),
		    chain: val[3],
		    group: val[0],
		    atomno: parseInt(val[5]),
		    selected: (val[9] === '1.0' ? 1 : 0),
		    color: val[10].replace(/\.00/g, ' ').trim()
		}
	    });
	    //console.log( atoms_data );
	    data = atoms_data;
	    this.grid.setData( data );
	    this.grid.updateRowCount();
	    this.grid.render();
	}
    }
});




/**
 * A widget to create tree view from molecular data
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Bio.Sequence.TreeViewWidget = function(params){
    this.dataset = params.dataset;
    this.applet = params.applet;
    /** A list of property maps used for displaying purposes in this widget */
    this.display_property_maps = [];
    params.persist_on_applet_delete = true;
    Widget.call( this, params );
    this._build_element_ids([ 'canvas', 'applet_selector_widget', 'draw_tree', 'property_map_vis_builder_widget' ]);

    var content = '<div class="control_group">' +
        (!this.applet ? '<div class="control_row" id="' + this.applet_selector_widget_id + '"></div>' : '') +
	'<div class="control_row" id="' + this.property_map_vis_builder_widget_id + '"></div>' +
        '<div class="control_row">' +
            '<button id="' + this.draw_tree_id + '">update</button>' +
        '</div>' +
	'<div class="control_row">' +
            '<div id="' + this.canvas_id + '" style="width:360px; overflow:auto;"></div>' +
        '</div>' +
    '</div>';
    $(this.dom).append( content );
    
    if(!this.applet){
	this.applet_selector = new Provi.Jmol.JmolAppletSelectorWidget({
	    parent_id: this.applet_selector_widget_id
	});
    }
    this.property_map_vis_builder = new Provi.Bio.Smcra.PropertyMapVisBuilderWidget({
	parent_id: this.property_map_vis_builder_widget_id,
	applet: this.get_applet()
    });
    this._init();
}
Provi.Bio.Sequence.TreeViewWidget.prototype = Utils.extend(Widget, /** @lends Provi.Bio.Sequence.TreeViewWidget.prototype */ {
    _init: function(){
        var self = this;
	if( this.applet ){
	    $(this.applet).bind('load_struct', function(){
		self.update();
	    });
	}
	
        $("#" + this.draw_tree_id).button().click(function() {
            self.update();
        });
	$(Provi.Data.DatasetManager).bind('change', function(){
	    // TO BE FIXED: also called on deleted applet triggering an exception
	    //self.update();
	});
	$(this.property_map_vis_builder).bind('built', function( e, property_map ){
	    //console.log( 'built map', property_map );
	    self.add_property_map_visualisation( property_map );
	    self.render();
	    //self._property_map_visualisation_count = 0;
	    //self._tree_view();
	});
	this.update();
    },
    update: function(){
	this._property_map_visualisation_count = 0;
	this._tree_view();
	this.property_map_vis_builder.update( this.get_data(), this.get_applet() );
    },
    render: function(){
	if( this._vis ) this._vis.render();
    },
    get_applet: function(){
	return this.applet ? this.applet : this.applet_selector.get_value(true);
    },
    select: function( e, selection, applet, selection_string ){
	applet.script_wait( 'select {' + selection_string + '};' );
    },
    _tree_view: function(){
        var self = this;
	var applet = this.get_applet();
	if(!applet) return;
        
	var smcra = this._smcra = this.get_data();
        if( !smcra || !smcra.len() ) return;
        
        var tree_map = Provi.Bio.Sequence.smcra_to_map( smcra );
        
	// popup widget
	this._popup = new Provi.Widget.PopupWidget({
	    parent_id: this.parent_id,
	    template: '<div>{{html content}}</div>'
	});
	
	// boundbox
	this._boundbox = new Provi.Utils.Protovis.Boundbox({});
	
	var color_bfactor = {};
	// get a scaling function for each structure seperately
	$.each( smcra.get_structures(), function(i, s){
	    var max_bfactor = pv.max( s.get_atoms(), function(d){ return d.bfactor} ) || 1;
	    var min_bfactor = pv.min( s.get_atoms(), function(d){ return d.bfactor} ) || 0;
	    color_bfactor[s.id] = pv.Scale.linear(min_bfactor, (min_bfactor+max_bfactor)/2, max_bfactor).range("green", "yellow", "red");
	});
	var c_bf = function( entity ){
	    return color_bfactor[entity.structure().id]( entity.get_bfactor() );
	}
	
        var root = this._tree_root_node = pv.dom( tree_map )
            .root( 'Tree' );
        console.log('root', root);
	
        /* init nodes */
        root.visitAfter(function(node, depth) {
	    var smcra_id = node.smcra_id = node.nodeName.split(',');
	    var smcra_entity = node.smcra_entity = smcra.get_by_full_id( smcra_id );
	    
            if (node.firstChild) {
                if( depth == 3){
                    node.nodeValue = node.childNodes.length + " Residues";
                }else if( depth == 2){
                    node.nodeValue = node.childNodes.length + " Chains";
                }else if( depth == 1){
                    node.nodeValue = node.childNodes.length + " Models";
                }else if( depth == 0){
                    node.nodeValue = node.childNodes.length + " Structures";
                }
            }
	    
	    if( depth == 5){
		node.nodeName = node.smcra_entity.name;
		node.nodeValue = node.smcra_entity.serial_number;
	    }else if( depth == 4){
		node.nodeName = node.smcra_entity.resname + ' ' + node.smcra_entity.id;
	    }else if( depth == 3){
		node.nodeName = 'Chain ' + node.smcra_entity.id;
	    }else if( depth == 2){
		node.nodeName = 'Model ' + node.smcra_entity.id;
	    }else if( depth == 1){
		node.nodeName = 'Structure ' + node.smcra_entity.id;
	    }
	    
	    if(depth > 1){
                node.toggle();
            }
        });
        
        var vis = this._vis = new pv.Panel()
            .canvas( this.canvas_id )
            .width(350)
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
            .text(function(n){ return n.nodeName })
	    .cursor("default")
	    .events("all")
	    .event('mouseover', function(d){
		if( d.smcra_entity ){
		    self._boundbox.attach( this );
		    $(pv.event.target).one('mouseleave', function(){ self._popup.hide() });
		    self._popup.show( self._boundbox.bb, { content: d.smcra_entity.html() } );
		}
	    });
	  
	var center = this._tree_center_panel = node.anchor("center").add(pv.Panel)
	    .top(0)
            .width(15);
	
	
	$.each( this.property_map_vis_builder.get_list(), function(i, property_map){
	    self.add_property_map_visualisation( property_map );
	})
	
	// select toggler, responsible for selecting and deselecting nodes
	var select_toggler = this.select_toggler = new Provi.Utils.Protovis.NodeToggler({
	    toggle_name: 'selected',
	    layout_obj: layout,
	    root: root,
	    on_toggle: function( n, toggle ){},
	    after_toggle: function( n, toggle, toggle_data ){
		entity = n.smcra_entity;
		var sele = new Provi.Selection.Selection({ selection: entity.jmol_expression(), applet: self.applet });
		if( !toggle ){
                    if (!pv.event.altKey) sele.deselect();
                }else{
                    pv.event.metaKey ? sele.add() : sele.select();
                }
                if( pv.event.altKey ) self.applet.script_wait( 'zoomto 0.5 (' + sele.selection + ');' );
	    }
	});
	
	// select checkbox
	center.anchor('left').add(pv.Dot)
            .strokeStyle("#1f77b4")
	    .shape('square')
	    .fillStyle(function(n){ return select_toggler.value_switch(n, "black", "white", "lightgrey") })
            .event("mousedown", function(n){ return select_toggler.toggle(n) });
	
	//// Image for a node instead of an icon
	//center.anchor('left').add(pv.Image)
	//    .url("../img/icons/eye.png")
	//    .top(-2)
	//    .width(15)
	//    .height(15)
	//    .event("mousedown", function(n){ return select_toggler.toggle(n) });
        
	// node text
        node.anchor("right").add(pv.Label)
            .textStyle(function(n){ return n.firstChild || n.toggled ? "#aaa" : "#000" })
            .text(function(n){ return n.nodeValue || ''; });
        
        vis.render();
        
	// register tree with the applet's selection manager
	$(applet.selection_manager).bind('select', function( e, selection, applet, sele_string, smcra ){
	    self.selection = selection;
	    //console.log( smcra );
	    Provi.Utils.Protovis.node_visit_after(root, function(node, depth) {
		//console.log(node);
		if(node.smcra_entity){
		    //console.log('full_id', node.smcra_entity.get_full_id());
		    node.selected = smcra.get_by_full_id( node.smcra_entity.get_full_id() ) ? toggle_type.ON : toggle_type.OFF;
		}
	    });
	    select_toggler.update();
	});
	
        function toggle_node(n){
            n.toggle(pv.event.altKey);
            return layout.reset().root;
        }
	
    },
    get_data: function(){
        var applet = this.get_applet();
	if(!applet || !applet.loaded) return false;
	return applet.get_smcra();
    },
    add_property_map_visualisation: function( property_map ){
	var self = this;
	this._property_map_visualisation_count += 1;
	var color_property = function(d){ return 'lightgrey'; }
	if( property_map.is_atomic ){
	    var p_list = property_map.get_list();
	    var max_property = pv.max( p_list ) || 1;
	    var min_property = pv.min( p_list ) || 0;
	    color_property = pv.Scale.linear(min_property, (min_property+max_property)/2, max_property).range("green", "yellow", "red");
	}
	
	this._tree_center_panel.anchor("right").add(pv.Dot)
	    .left(6+(this._property_map_visualisation_count)*12)
	    .strokeStyle("")
	    .fillStyle( function(d){
		if( d === self._tree_root_node ){
		    return 'black'
		}else{
		    return property_map.has_id(d.smcra_entity) ? color_property( property_map.get( d.smcra_entity ) ) : '';
		}
	    })
	    .shape( function(d){ return d === self._tree_root_node ? 'triangle' : 'square'; })
	    .event('mouseover', function(d){
		if( d === self._tree_root_node ){
		    self._boundbox.attach( this );
		    $(pv.event.target).one('mouseleave', function(){ self._popup.hide() });
		    self._popup.show( self._boundbox.bb, { content: property_map.info }, undefined, 'center top' );
		} else if( property_map.has_id( d.smcra_entity ) ){
		    self._boundbox.attach( this );
		    $(pv.event.target).one('mouseleave', function(){ self._popup.hide() });
		    self._popup.show( self._boundbox.bb, { content: property_map.html( d.smcra_entity ) }, undefined, 'center top' );
		}
	    });
    },
    in_selection: function(res){
	return Utils.in_array(this.selection, res, function(a,r){
	    return a.resno==r.id && a.chain==r.chain().id && a.model==r.model().id && a.file==r.structure().id;
	});
    }
});



/**
 * Converts a protein loaded into Jmol to a {@link Provi.Bio.Smcra.Collection}.
 *
 * @param {Provi.Jmol.Applet} applet A Jmol applet instance.
 * @param {string} selection A Jmol atom expression.
 */
Provi.Bio.Sequence.GraphWidget = function( params ){
    
    this.property_maps = params.property_maps || [];
}
Provi.Bio.Sequence.GraphWidget.prototype = Utils.extend(Widget, /** @lends Provi.Bio.Sequence.GraphWidget.prototype */ {
    _init: function(){
	
    },
    build_graph: function(){
	var data = pv.range(100).map(function(x) {
	    return {x: x, y: Math.random(), z: Math.pow(10, 2 * Math.random())};
	});
	
	var w = 300,
	    h = 300,
	    x = pv.Scale.linear(0, 99).range(0, w),
	    y = pv.Scale.linear(0, 1).range(0, h),
	    c = pv.Scale.log(1, 100).range("orange", "brown");
	
	/* The root panel. */
	var vis = new pv.Panel()
	    .width(w)
	    .height(h)
	    .bottom(20)
	    .left(20)
	    .right(10)
	    .top(5);
	
	/* Y-axis and ticks. */
	vis.add(pv.Rule)
	    .data(y.ticks())
	    .bottom(y)
	    .strokeStyle(function(d){ d ? "#eee" : "#000" })
	  .anchor("left").add(pv.Label)
	    .visible(function(d){ d > 0 && d < 1 })
	    .text(y.tickFormat);
	
	/* X-axis and ticks. */
	vis.add(pv.Rule)
	    .data(x.ticks())
	    .left(x)
	    .strokeStyle(function(d){ d ? "#eee" : "#000" })
	  .anchor("bottom").add(pv.Label)
	    .visible(function(d){ d > 0 && d < 100 })
	    .text(x.tickFormat);
	
	/* The dot plot! */
	vis.add(pv.Panel)
	    .data(data)
	  .add(pv.Dot)
	    .left(function(d){ x(d.x) })
	    .bottom(function(d){ y(d.y) })
	    .strokeStyle(function(d){ c(d.z) })
	    .fillStyle(function(){ this.strokeStyle().alpha(.2) })
	    .size(function(d){ d.z })
	    .title(function(d){ d.z.toFixed(1) });
	
	vis.render();

    }
});


/**
 * Converts a protein loaded into Jmol to a {@link Provi.Bio.Smcra.Collection}.
 *
 * @param {Provi.Jmol.Applet} applet A Jmol applet instance.
 * @param {string} selection A Jmol atom expression.
 */
Provi.Bio.Sequence.jmol_to_smcra = function( applet, selection ){
    
    if(!applet || !applet.loaded) return false;
    
    
    selection = selection || 'protein and {*}';
    var format = '\'%[group]\',\'%[sequence]\',\'%[resno]\',\'%[chain]\',\\"%[atomName]\\",\'%[atomNo]\',\'%[model]\',\'%[altLoc]\',\'%[temperature]\'';
    var protein_data = applet.atoms_property_map( format, selection );
    
    var collection = new Provi.Bio.Smcra.Collection();
    
    $.each(protein_data, function(i, atom) {
	//console.log(atom);
	var group = atom[0],
	    sequence = atom[1],
	    resno = parseInt(atom[2]),
	    chain = atom[3],
	    atomName = atom[4],
	    atomNo = parseInt(atom[5]),
	    model = atom[6],
	    altLoc = atom[7],
	    bfactor = parseFloat(atom[8]);
	
	
	var model_file = model.split('.');
	
	//return;
	if (model_file.length >= 2){
	    var model = model_file[1];
	    var file = model_file[0];
	}else{
	    var model = model_file[0];
	    var file = "1";
	}
	
	var s = collection.get( file );
	if( !s ){
	    s = new Provi.Bio.Smcra.Structure( file );
	    collection.add( s );
	}
	
	var m = s.get( model );
	if( !m ){
	    m = new Provi.Bio.Smcra.Model( model );
	    s.add( m );
	}
	
	var c = m.get( chain );
	//console.log('chain', chain, c);
	if( !c ){
	    c = new Provi.Bio.Smcra.Chain( chain );
	    m.add( c );
	}
	
	var r = c.get( resno );
	//console.log('residue', resno, r);
	if( !r ){
	    r = new Provi.Bio.Smcra.Residue( resno, group );
	    c.add( r );
	}
	
	var a = new Provi.Bio.Smcra.Atom( atomName, [], bfactor, 0, altLoc, atomName, atomNo, "" );
	try{
	    r.add( a );
	}catch(err){
	    console.log(err);
	}
    });
    return collection;
}


/**
 * Converts a {@link Provi.Bio.Smcra.Collection} object into multilevel map/dictionary.
 *
 * @param {Provi.Bio.Smcra.Collection} smcra The object to convert.
 */
Provi.Bio.Sequence.smcra_to_map = function( smcra ){
    
    var tree_structures = {};
    var structures = smcra.get_list();
    for(var h = 0; h < structures.length; ++h){
    
	var tree_models = {};
	var models = structures[h].get_list();
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
			tree_atoms[ atoms[l].get_full_id() ] = atoms[l].serial_number;
		    }
		    
		    tree_residues[ residues[k].get_full_id() ] = tree_atoms;
		}
		tree_chains[ chains[j].get_full_id() ] = tree_residues;
	    }
	    tree_models[ models[i].get_full_id() ] = tree_chains;
	};
	tree_structures[ structures[h].get_full_id() ] = tree_models;
    };
    
    return tree_structures;
}


})();