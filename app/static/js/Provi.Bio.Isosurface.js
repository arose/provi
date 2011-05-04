/**
 * @fileOverview This file contains the {@link Provi.Bio.Isosurface} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * @namespace
 * Isosurface module
 */
Provi.Bio.Isosurface = {};


(function() {

/** @exports Utils as Provi.Utils */
var Utils = Provi.Utils;

/** @exports Widget as Provi.Widget.Widget */
var Widget = Provi.Widget.Widget;

/**
 * A widget
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Bio.Isosurface.IsosurfaceWidget = function(params){
    //params.persist_on_applet_delete = false;
    //params.heading = '';
    //params.collapsed = false;
    console.log(params);
    this.dataset = params.dataset;
    this.applet = params.applet;
    this.resolution = parseFloat(params.resolution) || 1.0;
    this.display_within = params.display_within || 10.0;
    this.within = params.within || '';
    this.color = params.color || '';
    this.style = params.style || '';
    this.sele = params.sele || 'atomno=1';
    
    Widget.call( this, params );
    this._build_element_ids([ 'show', 'color', 'focus', 'display_within', 'translucent', 'colorscheme', 'color_range', 'style' ]);
    
    this.isosurface_name = 'isosurface_' + this.id;
    this.translucent = 0.0;
    this.focus = params.focus || false;
    this.colorscheme = "rwb";
    this.color_range = "-20 20";
    
    var content = '<div class="control_group">' +
	'<div class="control_row">' +
            '<input id="' + this.show_id + '" type="checkbox" checked="checked" style="float:left; margin-top: 0.5em;"/>' +
            '<label for="' + this.show_id + '" style="display:block;">show isosurface</label>' +
        '</div>' +
        '<div class="control_row">' +
            '<input id="' + this.color_id + '" type="text" value="#000000"/> ' +
            '<label for="' + this.color_id + '" >color</label>' +
        '</div>' +
	'<div class="control_row">' +
            '<label for="' + this.translucent_id + '">translucent</label>' +
            '<select id="' + this.translucent_id + '" class="ui-state-default">' +
                '<option value="0.0">opaque</option>' +
                '<option value="0.2">0.2</option>' +
		'<option value="0.4">0.4</option>' +
		'<option value="0.6">0.6</option>' +
		'<option value="0.8">0.8</option>' +
            '</select>' +
        '</div>' +
	'<div class="control_row">' +
            '<input id="' + this.focus_id + '" type="checkbox" checked="checked" style="float:left; margin-top: 0.5em;"/>' +
            '<label for="' + this.focus_id + '" style="display:block;">focus</label>' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="' + this.display_within_id + '">display within</label>' +
            '<select id="' + this.display_within_id + '" class="ui-state-default">' +
		'<option value="0"></option>' +
                '<option value="5.0">5.0</option>' +
                '<option value="7.0">7.0</option>' +
                '<option value="10.0">10.0</option>' +
                '<option value="15.0">15.0</option>' +
            '</select>&nbsp;&#8491;' +
        '</div>' +
	'<div class="control_row">' +
            '<label for="' + this.colorscheme_id + '">colorscheme</label>' +
            '<select id="' + this.colorscheme_id + '" class="ui-state-default">' +
		'<option value=""></option>' +
                '<option value="rwb">red-white-blue</option>' +
                '<option value="bwr">blue-white-red</option>' +
                '<option value="roygb">rainbow</option>' +
		'<option value="low">red-green</option>' +
		'<option value="high">green-blue</option>' +
		'<option value="sets">by surface fragments</option>' +
            '</select>' +
	'</div>' +
	'<div class="control_row">' +
            '<label for="' + this.color_range_id + '">color range</label>' +
            '<select id="' + this.color_range_id + '" class="ui-state-default">' +
		'<option value=""></option>' +
		'<option value="0 0">ALL</option>' +
                '<option value="-1 1">[-1,1]</option>' +
		'<option value="-5 5">[-5,5]</option>' +
                '<option value="-10 10">[-10,10]</option>' +
		'<option value="-15 15">[-15,15]</option>' +
		'<option value="-20 20">[-20,20]</option>' +
		'<option value="-30 30">[-30,30]</option>' +
		'<option value="-50 50">[-50,50]</option>' +
		'<option value="-70 70">[-70,70]</option>' +
		'<option value="-100 100">[-100,100]</option>' +
		'<option value="-150 150">[-150,150]</option>' +
		'<option value="0 10">[0,10]</option>' +
		'<option value="0 20">[0,20]</option>' +
		'<option value="0 50">[0,50]</option>' +
		'<option value="0 100">[0,100]</option>' +
		'<option value="20 100">[20,100]</option>' +
            '</select>' +
        '</div>' +
	'<div class="control_row">' +
            '<label for="' + this.style_id + '">style</label>' +
            '<select id="' + this.style_id + '" class="ui-state-default">' +
		'<option value=""></option>' +
                '<option value="mesh nofill nodots">mesh</option>' +
                '<option value="fill nomesh nodots">fill</option>' +
                '<option value="dots nomesh nofill">dots</option>' +
            '</select>' +
	'</div>' +
    '</div>';
    $(this.dom).append( content );
    if( !params.no_init ){
	this._init();
    }
}
Provi.Bio.Isosurface.IsosurfaceWidget.prototype = Utils.extend(Widget, /** @lends Provi.Bio.Isosurface.IsosurfaceWidget.prototype */ {
    _init: function(){
        var self = this;
	
        // init crystal mode
        $('#' + this.show_id).click(function(){
            self.set_show();
        });
        
        // init color picker
        $('#' + this.color_id).colorPicker();
        $('#' + this.color_id).change(function(){
            console.log($('#' + self.color_id).val());
            var id = 'isosurface_' + self.id;
            self.applet.script('color $' + id + ' [x' + $('#' + self.color_id).val().substring(1) + '];');
        });
        
        // init display within
        $("#" + this.display_within_id).bind('change', function() {
            self.display_within = $("#" + self.display_within_id + " option:selected").val();
            self.set_focus();
        });
	
	// init focus
        $("#" + this.focus_id).bind('change', function() {
            self.focus = $("#" + self.focus_id).is(':checked');
            self.set_focus();
        });
        
	// init translucent
        $("#" + this.translucent_id).bind('change', function() {
            self.translucent = $("#" + self.translucent_id + " option:selected").val();
            self.applet.script('color $' + self.isosurface_name + ' translucent ' + self.translucent + ';');
        });
	
	// init colorscheme
        $("#" + this.colorscheme_id).bind('change', function() {
            self.colorscheme = $("#" + self.colorscheme_id + " option:selected").val();
	    $("#" + self.colorscheme_id).val('');
            self.applet.script('color $' + self.isosurface_name + ' "' + self.colorscheme + '";');
        });
	
	// init color range
        $("#" + this.color_range_id).bind('change', function() {
            self.color_range = $("#" + self.color_range_id + " option:selected").val();
            self.applet.script('color $' + self.isosurface_name + ' "' + self.colorscheme + '" RANGE ' + self.color_range + ';');
        });
	
	// init style
        $('#' + this.style_id).change(function(){
	    self.style = $("#" + self.style_id + " option:selected").val();
            self.applet.script('isosurface ID ' + self.isosurface_name + ' ' + self.style + ';');
        });
	
	this.init_isosurface();
	
	if( true ){
	    $(this.applet).bind('pick', function(event, info, applet_id){
		var parsedInfo = /\[\w.+\](\d+):([\w\d]+)\.(\w+) .*/.exec(info);
		var chain = parsedInfo[2];
		var res = parsedInfo[1];
		var atom = parsedInfo[3];
		self.sele = 'resNo=' + res + (chain ? ' and chain=' + chain : '') + ' and atomName="' + atom + '"';
		console.log( self.sele );
		self.set_focus();
	    });
	    this.set_focus();
	}
	
	//Widget.prototype.init.call(this);
    },
    set_show: function(){
        var s = $("#" + this.show_id).is(':checked') ? 'display' : 'hide';
        this.applet.script( s + ' $' + this.isosurface_name + ';' );
    },
    set_focus: function(){
	var s = '';
	if( this.focus ){
	    s = 'isosurface id "' + this.isosurface_name + '" ' +
		    'display within ' + this.display_within + ' {' + this.sele + '}; ' +
		'set rotationRadius 15; zoom {' + this.sele + '} 100; ' +
		'select *; star off; select ' + this.sele + '; color star green; star 1.0;' +
		'slab on; set slabRange 28.0; set zShade on; set zSlab 50; set zDepth 37; ' +
		//'slab on; set slabRange 25.0;' +
		'';
	}else{
	    s = 'isosurface id "' + this.isosurface_name + '" display all; ' +
		'center {all}; slab off;';
	}
	this.applet.script(s);
    },
    init_isosurface: function(){
	var file_url = '../../data/get/?id=' + this.dataset.server_id;
	if( this.dataset.type=='vert' ){
	    file_url += '&dataname=data.vert';
	}
	this.applet.script(
	    'isosurface ID "' + this.isosurface_name + '" ' +
	    ( this.color ? 'COLOR ' + this.color + ' ' : '' ) + 
	    ( this.within ? 'WITHIN ' + this.within + ' ' : '' ) + 
	    '"' + file_url + '" ' +
	    ( this.style ? this.style : '' ) + 
	    ';', true);
    }
});



/**
 * A widget
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Bio.Isosurface.VolumeWidget = function(params){
    //params.persist_on_applet_delete = false;
    //params.heading = '';
    //params.collapsed = false;
    this.color_density = params.color_density;
    this.cutoff = params.cutoff;
    this.within = params.within;
    this.downsample = params.downsample;
    this.sigma = params.sigma;
    this.type = params.type;
    this.resolution = params.resolution;
    this.select = params.select || '*';
    this.ignore = params.ignore;
    this.style = params.style;
    params.no_init = true;
    Provi.Bio.Isosurface.IsosurfaceWidget.call( this, params );
    //this._build_element_ids([  ]);

    var content = '<div class="control_group">' +
		'' +
    '</div>';
    
    if( this.dataset && $.inArray( this.dataset.type, ['ccp4', 'mrc']) >= 0 ){
	this.style = 'MESH NOFILL';
	this.downsample = null;
	this.focus = true;
	this.sele = params.sele || 'atomno=1';
	this.sigma = params.sigma || 1;
    }
    
    //$(this.dom).append( content );
    this._init();
}
Provi.Bio.Isosurface.VolumeWidget.prototype = Utils.extend(Provi.Bio.Isosurface.IsosurfaceWidget, /** @lends Provi.Bio.Isosurface.VolumeWidget.prototype */ {
    _init: function(){
	Provi.Bio.Isosurface.IsosurfaceWidget.prototype._init.call(this);
        var self = this;
    },
    init_isosurface: function(){
	if( this.color_density ){
	    if( !this.cutoff ){
		this.cutoff = '[-1000,1000]';
	    }
	    this.applet.script(
		'isosurface id "' + this.isosurface_name + '" ' +
		( this.color ? 'COLOR ' + this.color + ' ' : '' ) + 
		( this.within ? 'WITHIN ' + this.within + ' ' : '' ) + 
		(this.downsample ? 'downsample ' + this.downsample + ' ' : '') +
		(this.cutoff ? 'cutoff ' + this.cutoff + ' ' : '') +
		(this.sigma ? 'sigma ' + this.sigma + ' ' : '') +
		'color density ' +
		'"../../data/get/?id=' + this.dataset.server_id + '" ' +
		';' +
		'color $' + this.isosurface_name + ' "rwb" range -20 20;' +
		'', true);
	}else{
	    this.applet.script(
		'isosurface id "' + this.isosurface_name + '" ' +
		( this.color ? 'COLOR ' + this.color + ' ' : '' ) + 
		( this.within ? 'WITHIN ' + this.within + ' ' : '' ) + 
		(this.downsample ? 'downsample ' + this.downsample + ' ' : '') +
		(this.cutoff ? 'cutoff ' + this.cutoff + ' ' : '') +
		(this.sigma ? 'sigma ' + this.sigma + ' ' : '') +
		(this.resolution ? 'resolution ' + this.resolution + ' ' : '') +
		(this.select ? 'select {' + this.select + '} ' : '') +
		(this.ignore ? 'ignore {' + this.ignore + '} ' : '') +
		'colorscheme "rwb" color absolute -20 20 ' +
		(this.type ? this.type + ' ' : '') +
		(this.type ? 'MAP ' : '') +
		'"../../data/get/?id=' + this.dataset.server_id + '" ' +
		(this.style ? this.style + ' ' : '') +
		';', true);
	}
    }
});



/**
 * A widget
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Bio.Isosurface.SurfaceWidget = function(params){
    //params.persist_on_applet_delete = false;
    //params.heading = '';
    //params.collapsed = false;
    this.within = params.within;
    this.type = params.type;
    this.resolution = params.resolution;
    this.select = params.select || '*';
    this.ignore = params.ignore;
    this.map = params.map;
    params.no_init = true;
    Provi.Bio.Isosurface.IsosurfaceWidget.call( this, params );
    //this._build_element_ids([  ]);

    var content = '<div class="control_group">' +
		'' +
    '</div>';

    //$(this.dom).append( content );
    this._init();
}
Provi.Bio.Isosurface.SurfaceWidget.prototype = Utils.extend(Provi.Bio.Isosurface.IsosurfaceWidget, /** @lends Provi.Bio.Isosurface.SurfaceWidget.prototype */ {
    _init: function(){
	Provi.Bio.Isosurface.IsosurfaceWidget.prototype._init.call(this);
        var self = this;
    },
    init_isosurface: function(){
	this.applet.script(
	    'isosurface id "' + this.isosurface_name + '" ' +
	    (this.resolution ? 'resolution ' + this.resolution + ' ' : '') +
	    (this.select ? 'select {' + this.select + '} ' : '') +
	    (this.ignore ? 'ignore {' + this.ignore + '} ' : '') +
	    (this.type ? this.type + ' ' : '') +
	    (this.map ? 'MAP ' + this.map + ' ' : '') +
	    ';', true);
    }
});



/**
 * A widget to get load params
 * @constructor
 * @extends Provi.Widget.Widget
 */
Provi.Bio.Isosurface.LoadParamsWidget = function(params){
    this.dataset = params.dataset;
    Widget.call( this, params );
    this._build_element_ids([ 'within' ]);
    var content = '<div>' +
	'<div class="control_row">' +
	    '<label for="' + this.within_id + '">Within:</label>' +
	    '<input id="' + this.within_id + '" type="text" size="10" value=""/>' +
	'</div>' +
    '</div>';
    $(this.dom).append( content );
    
    if( this.dataset && $.inArray( this.dataset.type, ['ccp4', 'mrc']) >= 0 ){
	$("#" + this.within_id).val('2 {protein}');
    }
}
Provi.Bio.Isosurface.LoadParamsWidget.prototype = Utils.extend(Widget, /** @lends Provi.Bio.Isosurface.LoadParamsWidget.prototype */ {
    get_within: function(){
        return $("#" + this.within_id).val();
    }
});


/**
 * A widget to get volume load params
 * @constructor
 * @extends Provi.Widget.Widget
 */
Provi.Bio.Isosurface.VolumeParamsWidget = function(params){
    this.dataset = params.dataset;
    Widget.call( this, params );
    this._build_element_ids([ 'sigma', 'cutoff', 'downsample', 'color_density' ]);
    var content = '<div>' +
	'<div class="control_row">' +
	    '<label for="' + this.sigma_id + '">Sigma:</label>' +
	    '<input id="' + this.sigma_id + '" type="text" size="4" value=""/>' +
	'</div>' +
	'<div class="control_row">' +
	    '<label for="' + this.cutoff_id + '">Cutoff:</label>' +
	    '<input id="' + this.cutoff_id + '" type="text" size="4" value=""/>' +
	'</div>' +
	'<div class="control_row">' +
	    '<label for="' + this.downsample_id + '">Downsample:</label>' +
	    '<input id="' + this.downsample_id + '" type="text" size="4" value="3"/>' +
	'</div>' +
	'<div class="control_row">' +
            '<input id="' + this.color_density_id + '" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
            '<label for="' + this.color_density_id + '" style="display:inline-block;">Color density</label>' +
        '</div>' +
    '</div>';
    $(this.dom).append( content );
    
    if( this.dataset && $.inArray( this.dataset.type, ['ccp4', 'mrc']) == -1 ){
	$('#' + this.sigma_id).parent().hide();
    }else{
	$('#' + this.sigma_id).val('1');
	$('#' + this.downsample_id).parent().hide();
	$('#' + this.cutoff_id).parent().hide();
	$('#' + this.as_map_id).parent().hide();
    }
}
Provi.Bio.Isosurface.VolumeParamsWidget.prototype = Utils.extend(Widget, /** @lends Provi.Bio.Isosurface.VolumeParamsWidget.prototype */ {
    get_sigma: function(){
        return parseFloat( $("#" + this.sigma_id).val() );
    },
    get_cutoff: function(){
        return parseFloat( $("#" + this.cutoff_id).val() );
    },
    get_downsample: function(){
        return parseInt( $("#" + this.downsample_id).val() );
    },
    get_color_density: function(){
        return $("#" + this.color_density_id).is(':checked');
    }
});


/**
 * A widget to get surface construction params
 * @constructor
 * @extends Provi.Widget.Widget
 */
Provi.Bio.Isosurface.SurfaceParamsWidget = function(params){
    this.dataset = params.dataset;
    Widget.call( this, params );
    this._build_element_ids([ 'select', 'ignore', 'negate_ignore', 'resolution', 'type', 'map', 'select_selector', 'ignore_selector', 'negate_select_as_ignore' ]);
    var content = '<div>' +
	//'<div class="control_row">' +
	//    '<label for="' + this.select_id + '">Select:</label>' +
	//    '<input id="' + this.select_id + '" type="text" size="10" value="protein"/>' +
	//'</div>' +
	//'<div class="control_row">' +
	//    '<label for="' + this.ignore_id + '">Ignore:</label>' +
	//    '<input id="' + this.ignore_id + '" type="text" size="10" value="protein"/>' +
	//'</div>' +
	'<div class="control_row">' +
	    '<label for="' + this.select_selector_id + '">Select </label>' +
	    '<span id="' + this.select_selector_id + '"></span>' +
	'</div>' +
	'<div class="control_row">' +
	    '<input id="' + this.negate_select_as_ignore_id + '" type="checkbox" checked="checked" style="float:left; margin-top: 0.5em;"/>' +
            '<label for="' + this.negate_select_as_ignore_id + '" style="display:block;">negated select as ignore</label>' +
	'</div>' +
	'<div class="control_row">' +
	    '<label for="' + this.ignore_selector_id + '">Ignore </label>' +
	    '<span id="' + this.ignore_selector_id + '"></span>' +
	'</div>' +
	'<div class="control_row">' +
	    '<input id="' + this.negate_ignore_id + '" type="checkbox" checked="checked" style="float:left; margin-top: 0.5em;"/>' +
            '<label for="' + this.negate_ignore_id + '" style="display:block;">negate ignore</label>' +
	'</div>' +
	'<div class="control_row">' +
	    '<label for="' + this.resolution_id + '">Resolution:</label>' +
	    '<input id="' + this.resolution_id + '" type="text" size="4" value="1.0"/>' +
	'</div>' +
	'<div class="control_row">' +
            '<label for="' + this.type_id + '">Type:</label>' +
            '<select id="' + this.type_id + '" class="ui-state-default">' +
		'<option value=""></option>' +
                '<option value="SASURFACE">SASURFACE</option>' +
                '<option value="SOLVENT 1.4">SOLVENT 1.4</option>' +
		'<option value="SOLVENT 1.0">SOLVENT 1.0</option>' +
		'<option value="CAVITY 1.0 8">CAVITY 1.0 8</option>' +
		'<option value="INTERIOR CAVITY 1.0 8">INTERIOR CAVITY 1.0 8</option>' +
		'<option value="POCKET CAVITY 1.0 8">POCKET CAVITY 1.0 8</option>' +
            '</select>' +
        '</div>' +
	'<div class="control_row">' +
            '<label for="' + this.map_id + '">Map:</label>' +
            '<select id="' + this.map_id + '" class="ui-state-default">' +
		'<option value=""></option>' +
                '<option value="PROPERTY temperature">PROPERTY temperature</option>' +
		'<option value="PROPERTY partialCharge">PROPERTY partialCharge</option>' +
		'<option value="MEP">[1/d] MEP</option>' +
		'<option value="MEP 1">[e^(-d/2)] MLP?</option>' +
		'<option value="MEP 2">[1/(1+d)] MLP</option>' +
		'<option value="MEP 3">[e^(-d)] Hydrophobicity potential</option>' +
            '</select>' +
        '</div>' +
    '</div>';
    $(this.dom).append( content );
    
    this.select_selector = new Provi.Selection.SelectorWidget({
        parent_id: this.select_selector_id,
	tag_name: 'span'
    });
    this.ignore_selector = new Provi.Selection.SelectorWidget({
        parent_id: this.ignore_selector_id,
	tag_name: 'span'
    });
    
    if( this.dataset && this.dataset.type != 'dx' ){
	$('#' + this.type_id).parent().hide();
    }
    if( this.dataset ){
	$('#' + this.map_id).parent().hide();
    }
    if( this.dataset && $.inArray( this.dataset.type, ['ccp4', 'mrc']) >= 0 ){
	$('#' + this.select_selector_id).parent().hide();
	$('#' + this.ignore_selector_id).parent().hide();
	$('#' + this.resolution_id).parent().hide();
    }
}
Provi.Bio.Isosurface.SurfaceParamsWidget.prototype = Utils.extend(Widget, /** @lends Provi.Bio.Isosurface.SurfaceParamsWidget.prototype */ {
    get_select: function(){
        return this.select_selector.get().selection;
	//return $("#" + this.select_id).val();
    },
    get_ignore: function(){
	if( $("#" + this.negate_select_as_ignore_id).val() ){
	    var ignore = this.select_selector.get().selection;
	    var negate = true;
	}else{
	    var ignore = this.ignore_selector.get().selection;
	    //var ignore = $("#" + this.ignore_id).val();
	    var negate = $("#" + this.negate_ignore_id).val();
	}
	return ( negate && ignore ) ? ('not (' + ignore + ')' ) : ignore;
    },
    get_resolution: function(){
        return parseFloat( $("#" + this.resolution_id).val() );
    },
    get_type: function(){
        return $("#" + this.type_id + " option:selected").val();
    },
    get_map: function(){
        return $("#" + this.map_id + " option:selected").val();
    },
    set_applet: function( applet ){
	this.applet = applet;
	this.select_selector.set_applet( applet );
	this.ignore_selector.set_applet( applet );
    }
});


})();