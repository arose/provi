/**
 * @fileOverview This file contains the {@link Provi.Jmol.Analysis} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * @namespace
 * Jmol analysis module
 */
Provi.Jmol.Analysis = {};


(function() {

/** @exports Utils as Provi.Utils */
var Utils = Provi.Utils;

/** @exports Widget as Provi.Widget.Widget */
var Widget = Provi.Widget.Widget;



/**
 * A widget to create ramachandran plots from molecular data
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Jmol.Analysis.RamachandranPlotWidget = function(params){
    Widget.call( this, params );
    this.canvas_id = this.id + '_canvas';
    this.favored_angles_id = this.id + '_favored_angles';
    this.do_ramachandran_plot_id = this.id + '_do_plot';
    this.applet_selector_widget_id = this.id + '_applet';
    this.selection = [];
    this.vis = false;

    var content = '<div class="control_group">' +
	'<div class="control_row" id="' + this.applet_selector_widget_id + '"></div>' +
        '<div class="control_row">' +
            '<label for="' + this.style_id + '">favored angles</label>' +
            '<select id="' + this.favored_angles_id + '" class="ui-state-default">' +
                '<option value="General" selected="selected">General</option>' +
                '<option value="Glycine">Glycine</option>' +
                '<option value="Pre-Pro">Pre-Pro</option>' +
                '<option value="Proline">Proline</option>' +
            '</select>' +
            '<button id="' + this.do_ramachandran_plot_id + '">ramachandran plot</button>' +
        '</div>' +
	'<div class="control_row">' +
            '<div id="' + this.canvas_id + '" style="width:300px;height:300px"></div>' +
        '</div>' +
    '</div>';
    $(this.dom).append( content );
    this.applet_selector = new Provi.Jmol.JmolAppletSelectorWidget({
        parent_id: this.applet_selector_widget_id
    });
    this._init();
}
Provi.Jmol.Analysis.RamachandranPlotWidget.prototype = Utils.extend(Widget, /** @lends Provi.Jmol.Analysis.RamachandranPlotWidget.prototype */ {
    _init: function(){
	this.ramachandran_plot();
        var self = this;
        
	$("#" + this.do_ramachandran_plot_id).button().click(function() {
            self.ramachandran_plot();
        });
	
	// init favored angle contour overlay
        $("#" + this.favored_angles_id).change( function() {
            self.ramachandran_plot();
        });
	
	this.applet_selector.change( function() {
            self.ramachandran_plot();
        });
	
	$.each( Provi.Jmol.get_applet_list(), function(i, applet){
	    $(applet.selection_manager).bind('select', function( e, selection, applet ){
		self.selection = selection;
		if(self.vis){
		    self.vis.render();
		}else{
		    self.ramachandran_plot();
		}
	    });
	    $(applet).bind('load_struct', function(){
		if(applet == self.applet_selector.get_value(true)) self.ramachandran_plot();
	    });
	});
	$(Provi.Jmol).bind('applet_added', function(event, applet){
	    $(applet.selection_manager).bind('select', function( e, selection, applet ){
		self.selection = selection;
		if(self.vis){
		    self.vis.render();
		}else{
		    self.ramachandran_plot();
		}
	    });
	    $(applet).bind('load_struct', function(){
		if(applet == self.applet_selector.get_value(true)) self.ramachandran_plot();
	    });
	});
    },
    /**
     * draw a ramachandran plot
     */
    ramachandran_plot: function(){
	var self = this;
        var applet = this.applet_selector.get_value(true);
	var ramachandran_data = [];
	
        if(applet && applet.loaded){
	    var selection = 'protein and {*.ca}';
	    var format = '%[phi],%[psi],\'%[group]\', \'%[resNo]\', \'%[chain]\'';
	    ramachandran_data = applet.evaluate('"[" + {' + selection + '}.label("[' + format + ']").join(",") + "]"');
	    ramachandran_data = ramachandran_data.replace(/%\[psi\]/g,"");
	    ramachandran_data = ramachandran_data.replace(/%\[phi\]/g,"");
	    ramachandran_data = eval(ramachandran_data.replace(/\,\]/g,",null]"));
	    //console.log( ramachandran_data );
	}
	
	/* Sizing and scales. */
	var w = 270,
	    h = 270,
	    kx = 180,
	    ky = 180,
	    x = pv.Scale.linear(-180, 180).range(0, w),
	    y = pv.Scale.linear(-180, 180).range(0, h);
	
	//var img = vis.add(pv.Panel)
	var vis = new pv.Panel()
	    .canvas(this.canvas_id)
	    .width(w)
	    .height(h)
	    .top(5).left(30).right(5).bottom(15);
	  
	var img = vis.add(pv.Panel).overflow("hidden").add(pv.Image)
	    .left(x)
	    .bottom(y)
	    .url("../img/ramachandran_plot_empty_" + $("#" + this.favored_angles_id + " option:selected").val() + ".png");
	
	/* X-axis and ticks. */
	vis.add(pv.Rule)
	    .data(x.ticks())
	    .left(x)
	    .strokeStyle(function(d){ return d ? "#eee" : "#000"; })
	  .anchor("bottom").add(pv.Label)
	    .text(x.tickFormat);
	
	/* Y-axis and ticks. */
	vis.add(pv.Rule)
	    .data(y.ticks())
	    .top(y)
	    .strokeStyle(function(d){ return d ? "#eee" : "#000"; })
	  .anchor("left").add(pv.Label)
	    .text(y.tickFormat);
	
	/** Update the x- and y-scale domains per the new transform.
	 * @private
	*/
	function transform() {
	    var t = this.transform();
	    var ti = t.invert();
	    x.domain(ti.x / w * 2 * kx - kx, (ti.k + ti.x / w) * 2 * kx - kx);
	    y.domain(ti.y / h * 2 * ky - ky, (ti.k + ti.y / h) * 2 * ky - ky);
	    var ih = h * t.k;
	    var iw = w * t.k;
	    img.height(ih).width(iw).top(t.y).left(t.x);
	    vis.render();
	}
	
	/* Use an invisible panel to capture pan & zoom events. */
	vis.add(pv.Panel)
	    .events("all")
	    .event("mousedown", pv.Behavior.pan())
	    .event("mousewheel", pv.Behavior.zoom())
	    .event("pan", transform)
	    .event("zoom", transform);
	
	/* The dot plot! */
	vis.add(pv.Panel)
	    .overflow("hidden")
	  .add(pv.Dot)
	    .data(ramachandran_data)
	    .left(function(d){ return x(d[0]); })
	    .top(function(d){ return y(-d[1]); })
	    .size( function(d){ return self.in_selection(d) ? 7 : 3; })
	    .lineWidth( function(d){ return self.in_selection(d) ? 2 : 0; })
	    .strokeStyle( 'gold' )
	    .text(function(d){ return d[2]; })
	    .event("mouseover", pv.Behavior.tipsy({gravity: "s", fade: true}))
	    .event("mouseup", function(d) {
		var sele = new Provi.Selection.Selection({ selection: 'resNo=' + d[3] + ' ' + (d[4] ? 'and chain=' + d[4] : ''), applet: applet });
                if( self.in_selection(d) ){
                    if (!pv.event.altKey) sele.deselect();
                }else{
                    pv.event.metaKey ? sele.add() : sele.select();
                }
		if( pv.event.altKey ) applet.script_wait( 'zoomto 0.5 (' + sele.selection + ');' );
            })
	    .fillStyle('black');
	

	
	vis.render();
	self.vis = vis;
    },
    in_selection: function(d){
	return Utils.in_array(this.selection, d, function(a,b){
	    return a.resno==b[3] && (a.chain==b[4] || !b[4]);
	});
    },
    select: function( foo, selection, applet ){
	console.log(foo);
	console.log( applet == this.applet_selector.get_value(true) );
    }
});



/**
 * A widget to access Jmol's calculate hbonds functionality
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Jmol.Analysis.HbondsWidget = function(params){
    //params.persist_on_applet_delete = false;
    //params.heading = '';
    //params.collapsed = false;
    Provi.Widget.Widget.call( this, params );
    this._build_element_ids([ 'angle_min', 'dist_max', 'calc', 'applet_selector_widget', 'display', 'display_residues' ]);
    
    this.angle_min = 60;
    this.dist_max = 3.9;
    this.visibility = true;
    
    var content = '<div class="control_group">' +
	'<div class="control_row" id="' + this.applet_selector_widget_id + '"></div>' +
	'<div class="control_row">' +
            '<input id="' + this.display_id + '" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
            '<label for="' + this.display_id + '" style="display:inline-block;">display hbonds</label>' +
        '</div>' +
	'<div class="control_row">' +
            '<input size="4" id="' + this.angle_min_id + '" type="text" class="ui-state-default"/>' +
            '<label for="' + this.angle_min_id + '" >min angle</label> ' +
	    '<input size="4" id="' + this.dist_max_id + '" type="text" class="ui-state-default"/>' +
            '<label for="' + this.dist_max_id + '" >max distance</label> ' +
	    '<button id="' + this.calc_id + '">calc hbonds</button>' +
        '</div>' +
	'<div class="control_row">' +
            '<button id="' + this.display_residues_id + '">display residues</button>' +
        '</div>' +
    '</div>';
    $(this.dom).append( content );
    this.applet_selector = new Provi.Jmol.JmolAppletSelectorWidget({
        parent_id: this.applet_selector_widget_id
    });
    this._init();
}
Provi.Jmol.Analysis.HbondsWidget.prototype = Utils.extend(Provi.Widget.Widget, /** @lends Provi.Jmol.Analysis.HbondsWidget.prototype */ {
    _init: function(){
        var self = this;
	
        $('#' + this.display_id).click(function(){
	    self.visibility = $("#" + self.display_id).is(':checked');
            self.display();
        }).attr( 'checked', this.visibility );
	
	$("#" + this.calc_id).button().click(function() {
            self.calc();
        });
	
	$("#" + this.angle_min_id).change(function() {
	    self.angle_min = $(this).val();
            self.calc();
        }).val( this.angle_min );
	
	$("#" + this.dist_max_id).change(function() {
	    self.dist_max = $(this).val();
            self.calc();
        }).val( this.dist_max );
	
	$("#" + this.display_residues_id).button().click(function() {
            self.display_residues();
        });
	
	//Provi.Widget.Widget.prototype.init.call(this);
    },
    calc: function(){
	var applet = this.applet_selector.get_value();
        if(applet){
	    applet.script(
		//"select not backbone and not hydrogen;" +
		"select not hydrogen;" +
		"hbonds delete;" +
		"set hbondsRasmol FALSE;" +
		"set hbondsAngleMinimum " + this.angle_min + ";" +
		"set hbondsDistanceMaximum " + this.dist_max + ";" +
		"calculate hbonds;",
	    true );
	}
    },
    display: function(){
	applet = this.applet_selector.get_value();
        if(applet){
	    applet.script( 'select all; hbonds ' + ( this.visibility ? 'on' : 'off' ) + ';', true );
	}
    },
    display_residues: function(){
	applet = this.applet_selector.get_value();
        if(applet){
	    applet.script(
		'var x = connected("hbond").atoms; ' +
		'select @x or within(group, @x);' +
		'wireframe 0.1;',
	    true );
	}
    }
    
    
    // 
});


/**
 * A widget to access Jmol's isosruface creation functionality
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Jmol.Analysis.IsosurfaceWidget = function(params){
    //params.persist_on_applet_delete = false;
    //params.heading = '';
    //params.collapsed = false;
    Provi.Widget.Widget.call( this, params );
    this._build_element_ids([ 'angle_min', 'dist_max', 'calc', 'applet_selector_widget', 'display', 'display_residues' ]);
    
    this.angle_min = 60;
    this.dist_max = 3.9;
    this.visibility = true;
    
    var content = '<div class="control_group">' +
	'<div class="control_row" id="' + this.applet_selector_widget_id + '"></div>' +
	'<div class="control_row">' +
            '<input id="' + this.display_id + '" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
            '<label for="' + this.display_id + '" style="display:inline-block;">display hbonds</label>' +
        '</div>' +
	'<div class="control_row">' +
            '<input size="4" id="' + this.angle_min_id + '" type="text" class="ui-state-default"/>' +
            '<label for="' + this.angle_min_id + '" >min angle</label> ' +
	    '<input size="4" id="' + this.dist_max_id + '" type="text" class="ui-state-default"/>' +
            '<label for="' + this.dist_max_id + '" >max distance</label> ' +
	    '<button id="' + this.calc_id + '">calc hbonds</button>' +
        '</div>' +
	'<div class="control_row">' +
            '<button id="' + this.display_residues_id + '">display residues</button>' +
        '</div>' +
    '</div>';
    $(this.dom).append( content );
    this.applet_selector = new Provi.Jmol.JmolAppletSelectorWidget({
        parent_id: this.applet_selector_widget_id
    });
    this._init();
}
Provi.Jmol.Analysis.IsosurfaceWidget.prototype = Utils.extend(Provi.Widget.Widget, /** @lends Provi.Jmol.Analysis.IsosurfaceWidget.prototype */ {
    _init: function(){
        var self = this;
    }
});



})();