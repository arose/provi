/**
 * @fileOverview This file contains the {@link Provi.Jmol.Controls} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * @namespace
 * Jmol controls module
 */
Provi.Jmol.Controls = {};


(function() {

/** @exports Utils as Provi.Utils */
var Utils = Provi.Utils;

/** @exports Widget as Provi.Widget.Widget */
var Widget = Provi.Widget.Widget;


/**
 * A class representing a console for a jmol applet
 * @constructor
 */
Provi.Jmol.Controls.JmolConsole = function(input, log, applet){
    this.input = input;
    this.log = log;
    this.applet = applet;
    this.maintain_selection = false;
    this._init();
}
Provi.Jmol.Controls.JmolConsole.prototype = /** @lends Provi.Jmol.Controls.JmolConsole.prototype */ {
    _init: function() {
        this.history = new Utils.HistoryManager();
        var self = this;
        this.input.keypress(function(event) {
            if (event.which == 13 && this.value) {
                try {
                    var cmd = this.value.trim();
		    if( cmd.charAt( cmd.length-1 ) != ';' ) cmd += ';';
                    self.print('> ' + cmd);
                    var out = self.applet.script_wait(cmd, self.maintain_selection);
		    self.applet.selection_manager.sync();
                    if( out.search(/ERROR/) != -1 ){
                        var error = /.*ERROR: (.*)\n.*/.exec(out);
                        if(error.length){
                            self.print(error[1] , '#FF0000');
                        }else{
                            self.print(out , '#FF0000');
                        }
                    }else{
                        var echo = /.*scriptEcho,0,(.*)\n.*/.exec(out);
                        if(echo && echo.length){
                            self.print(echo[1] , 'green');
                        }
                    }
                } catch (e) {
                    self.print(e.toString(), '#ff0000');
                } finally {
                    self.history.push(cmd);
                    this.value = '';
                }
            }
        });
        
        this.input.keydown(function(event) {
            var valid = {38: 'prev', 40: 'next'};
            if (event.keyCode in valid) {
                var curr = self.history.scroll(valid[event.keyCode]);
                if (curr !== null) this.value = curr;
            }
        });
    },
    
    print: function (text, color) {
        this.log.append($('<div/>').css({'color': color || 'black', margin: 0, padding: 0}).text(text));
        this.log[0].scrollTop = this.log[0].scrollHeight;
    }
}


/**
 * A widget holding a jmol console and a jmol applet selector
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Jmol.Controls.JmolConsoleWidget = function(params){
    Widget.call( this, params );
    this._build_element_ids([ 'input', 'log', 'maintain_selection', 'applet_selector_widget' ]);
    
    var content = '<div class="control_group">' +
	'<div class="control_row" id="' + this.applet_selector_widget_id + '"></div>' +
	'<div class="control_row">' +
            '<input id="' + this.maintain_selection_id + '" type="checkbox" style="float:left; margin-top: 0.0em;"/>' +
            '<label for="' + this.maintain_selection_id + '">maintain current selection</label>' +
        '</div>' +
        '<label for="' + this.input_id + '">Execute a Jmol command (<a href="http://chemapps.stolaf.edu/jmol/docs/" target="_blank">docu</a>):</label>' +
        '<input type="text" id="' + this.input_id + '" class="ui-state-default" style="margin-top:0.2em; width:100%; border: 0px;"/>' +
        '<div id="' + this.log_id + '" style="overflow:auto; max-height:300px; min-height:150px; margin-top:10px;  padding: 2px;" class="ui-state-default ui-state-disabled"></div>' +
    '</div>';
    $(this.dom).append( content );
    this.applet_selector = new Provi.Jmol.JmolAppletSelectorWidget({
        parent_id: this.applet_selector_widget_id,
        applet: params.applet
    });
    this.console = new Provi.Jmol.Controls.JmolConsole( $('#'+this.input_id), $('#'+this.log_id), params.applet );
    this._init();
}
Provi.Jmol.Controls.JmolConsoleWidget.prototype = Utils.extend(Widget, /** @lends Provi.Jmol.Controls.JmolConsoleWidget.prototype */ {
    _init: function(){
	var self = this;
	$(this.applet_selector).bind("change", function(event, applet){
	    //console.log('JMOL CONSOLE APPLET CHANGE',applet, self.applet_selector.get_value(true));
	    self.console.applet = self.applet_selector.get_value(true);
	});
	self.console.applet = self.applet_selector.get_value(true);
	$("#" + this.maintain_selection_id).bind('change', function() {
	    self.console.maintain_selection = $("#" + self.maintain_selection_id).is(':checked');
	});
    }
});



/**
 * A base class to create classes to provide a central instance for changing settings
 * @constructor
 */
Provi.Jmol.Controls.SettingsManager = function(params) {
    this.names = Object.keys( this.default_params );
    console.log(this.names, typeof(this), this.default_params);
    params = $.extend( this.default_params, params );
    console.log(this.names, typeof(this), this.default_params);
    this.applet = params.applet;
    this.set( params );
}
Provi.Jmol.Controls.SettingsManager.prototype = /** @lends Provi.Jmol.Controls.SettingsManager.prototype */ {
    default_params: {},
    jmol_param_names: {},
    _command: function( names ){
	names = names || this.names;
	return $.map( names, $.proxy( function( name ){
	    if( this.jmol_param_names[name] ){
		return "set " + this.jmol_param_names[name] + " " + this[name] + ';';
	    }else{
		return '';
	    }
	}, this )).join(" ");
    },
    _set: function( params ){
        for( var p in params || {} ){
	    this[ p ] = params[ p ];
	}
	console.log( 'SETTINGS MANAGER CHANGE', typeof(this), this.get() );
	$(this).triggerHandler( 'change', this.get() );
    },
    set: function( params ){
        this._set( params );
	this.applet.script_wait( this._command() );
    },
    get: function(){
	var params = {};
	$.each( this.names, $.proxy( function( i, name ){
	    params[ name ] = this[name];
	}, this ));
	return params;
    },
    promise: function( params ){
	this._set( params );
	return this._command();
    },
    repair: function(){
	this.set( this.get() );
    },
    sync: function(){
	var params = {};
	$.each( this.jmol_param_names, $.proxy( function( name, jmol_name ){
	    params[ name ] = this.applet.evaluate( jmol_name );
	}, this ));
	console.log( 'SYNC SETTINGS', typeof(this), this._command(), params );
	this._set( params );
    },
    defaults: function(){
	this.set( this.default_params );
    }
};


/**
 * A class to provide a central instance for setting lighting parameters
 * @constructor
 * @extends Provi.Jmol.Controls.SettingsManager
 */
Provi.Jmol.Controls.LightingManager = function(params) {
    Provi.Jmol.Controls.SettingsManager.call( this, params );
}
Provi.Jmol.Controls.LightingManager.prototype = Utils.extend( Provi.Jmol.Controls.SettingsManager, /** @lends Provi.Jmol.Controls.LightingManager.prototype */ {
    default_params: {
	ambient_percent: 45,
	diffuse_percent: 84,
	specular: true,
	specular_percent: 22,
	specular_power: 40,
	specular_exponent: 6,
	phong_exponent: 64,
	z_shade: true,
	z_shade_power: 3,
	z_slab: 10,
	z_depth: 0
    },
    jmol_param_names: {
	ambient_percent: "ambientPercent",
	diffuse_percent: "diffusePercent",
	specular: "specular",
	specular_percent: "specularPercent",
	specular_power: "specularPower",
	specular_exponent: "specularExponent",
	phong_exponent: "phongExponent",
	z_shade: "zShade",
	z_shade_power: "zShadePower",
	z_slab: "zSlab",
	z_depth: "zDepth"
    }
});


/**
 * A class to provide a central instance for setting lighting parameters
 * @constructor
 * @extends Provi.Jmol.Controls.SettingsManager
 */
Provi.Jmol.Controls.ClippingManager = function(params) {
    Provi.Jmol.Controls.SettingsManager.call( this, params );
}
Provi.Jmol.Controls.ClippingManager.prototype = Utils.extend( Provi.Jmol.Controls.SettingsManager, /** @lends Provi.Jmol.Controls.ClippingManager.prototype */ {
    default_params: {
	clipping: true,
	slab_range: 0,
	slab: 100,
	depth: 0,
	slab_by_atom: false,
	slab_by_molecule: false
    },
    jmol_param_names: {
	clipping: "slabEnabled",
	slab_range: "slabRange",
	slab: "slab",
	depth: "depth",
	slab_by_atom: "slabByAtom",
	slab_by_molecule: "slabByMolecule"
    },
    _command: function( names ){
	//this.applet.lighting_manager.set({z_depth: (this.depth||0), z_slab: (this.depth||0)+30});
	names = names || this.names.slice();
	if( this.slab_range ) names.removeItems( "slab" );
	return '' +
	    'bind "ALT-WHEEL" "slab @{slab - _DELTAY/abs(_DELTAY)}; if(slab<0){slab 0;} if(slab>100){slab 100;} depth @{depth + _DELTAY/abs(_DELTAY)}; if(depth<0){depth 0;} if(depth>100){depth 100;} javascript jmol_bind(' + this.applet.name_suffix + ') ";' +
	    //'javascript "jmol_bind(1);";' +
	    //'function javascript_bind(i){ javascript "xjmol_binder()"; }' +
	    //'bind "ALT-WHEEL" "javascript_bind(1);";' +
	    Provi.Jmol.Controls.SettingsManager.prototype._command.call( this, names );
    }
});


/**
 * A class to provide a central instance for setting quality parameters
 * @constructor
 * @extends Provi.Jmol.Controls.SettingsManager
 */
Provi.Jmol.Controls.QualityManager = function(params) {
    Provi.Jmol.Controls.SettingsManager.call( this, params );
}
Provi.Jmol.Controls.QualityManager.prototype = Utils.extend( Provi.Jmol.Controls.SettingsManager, /** @lends Provi.Jmol.Controls.QualityManager.prototype */ {
    default_params: {
	high_resolution: false,
	antialias_display: false,
	antialias_translucent: true,
	antialias_images: true,
	wireframe_rotation: false
    },
    jmol_param_names: {
	high_resolution: "highResolution",
	antialias_display: "antialiasDisplay",
	antialias_translucent: "antialiasTranslucent",
	antialias_images: "antialiasImages",
	wireframe_rotation: "wireframeRotation"
    }
});


/**
 * A class to provide a central instance for setting picking parameters
 * @constructor
 * @extends Provi.Jmol.Controls.SettingsManager
 */
Provi.Jmol.Controls.PickingManager = function(params) {
    Provi.Jmol.Controls.SettingsManager.call( this, params );
}
Provi.Jmol.Controls.PickingManager.prototype = Utils.extend( Provi.Jmol.Controls.SettingsManager, /** @lends Provi.Jmol.Controls.PickingManager.prototype */ {
    default_params: {
	atom_picking: true,
	draw_picking: false,
	picking: 'group',
	picking_style: 'toggle',
	selection_halos: true,
	selection_halos_color: 'green',
	hover_delay: 0.1
    },
    jmol_param_names: {
	atom_picking: "atomPicking",
	draw_picking: "drawPicking",
	picking: "picking",
	picking_style: "pickingStyle",
	selection_halos: "selectionHalos",
	hover_delay: "hoverDelay"
    },
    _command: function( names ){
	return '' +
	    'color selectionHalos ' + this['selection_halos_color'] + ';' +
	    Provi.Jmol.Controls.SettingsManager.prototype._command.call( this, names );
    }
});


/**
 * A class to provide a central instance for setting style parameters
 * @constructor
 * @extends Provi.Jmol.Controls.SettingsManager
 */
Provi.Jmol.Controls.StyleManager = function(params) {
    Provi.Jmol.Controls.SettingsManager.call( this, params );
    console.log( this.get_default_style() );
}
Provi.Jmol.Controls.StyleManager.prototype = Utils.extend( Provi.Jmol.Controls.SettingsManager, /** @lends Provi.Jmol.Controls.StyleManager.prototype */ {
    default_params: {
	cartoon: '1.0',
	line: '0.01',
	stick: '0.15',
	cpk: '20%',
	spacefill: '0.5',
	backbone: '0.3',
	style: '' +
	    'select protein; cartoon only; select helix or sheet; cartoon ${cartoon};' +
	    'select (ligand or ypl or lrt); wireframe ${stick}; spacefill ${spacefill};' +
	    'select water; wireframe ${line};' +
	    //'select group=hoh; cpk 20%;' +
	    'select HOH; cpk ${cpk};' +
	    'select (hetero or ypl or lrt) and connected(protein) or within(GROUP, protein and connected(hetero or ypl or lrt)); wireframe ${stick};' + 
	    'select (dmpc or dmp or popc or pop); wireframe ${stick};' +
	    'select none;' +
	    '',
	hermite_level: 0,
	cartoon_rockets: false,
	ribbon_aspect_ratio: 16,
	ribbon_border: false,
	rocket_barrels: false,
	sheet_smoothing: 1,
	trace_alpha: true
    },
    jmol_param_names: {
	hermite_level: "hermiteLevel",
	cartoon_rockets: "cartoonRockets",
	ribbon_aspect_ratio: "ribbonAspectRatio",
	ribbon_border: "ribbonBorder",
	rocket_barrels: "rocketBarrels",
	sheet_smoothing: "sheetSmoothing",
	trace_alpha: "traceAlpha"
    },
    get_default_style: function(){
	return this.get_style( this.style );
    },
    get_style: function( style ){
	return $.tmpl( style, this ).text();
    }
});



/**
 * A widget holding a global jmol controls
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Jmol.Controls.JmolGlobalControlWidget = function(params){
    this.sync_mouse = false;
    Widget.call( this, params );
    this._build_element_ids([ 'sync_mouse', 'sync_orientation', 'applet_selector_sync_orientation', 'change_default_applet' ]);
    
    var content = '<div class="control_group">' +
        '<div class="control_row">' +
            '<input id="' + this.sync_mouse_id + '" type="checkbox" style="float:left; margin-top: 0.0em;"/>' +
            '<label for="' + this.sync_mouse_id + '">sync mouse</label>' +
        '</div>' +
        '<div class="control_row">' +
            '<button id="' + this.sync_orientation_id + '">sync orientation</button>&nbsp;' +
            '<span id="' + this.applet_selector_sync_orientation_id + '"></span>' +
        '</div>' +
	'<div class="control_row">' +
            'Change default&nbsp;' +
            '<span id="' + this.change_default_applet_id + '"></span>' +
        '</div>' +
    '</div>';
    $(this.dom).append( content );
    this.applet_selector_sync_orientation = new Provi.Jmol.JmolAppletSelectorWidget({
        parent_id: this.applet_selector_sync_orientation_id
    });
    this.change_default_applet_selector = new Provi.Jmol.JmolAppletSelectorWidget({
        parent_id: this.change_default_applet_id,
	show_default_applet: false
    });
    this._init();
}
Provi.Jmol.Controls.JmolGlobalControlWidget.prototype = Utils.extend(Widget, /** @lends Provi.Jmol.Controls.JmolGlobalControlWidget.prototype */ {
    _init: function(){
	this.sync_mouse = $("#" + this.sync_mouse_id).is(':checked');
        this.update_sync_mouse();
        var self = this;
        
        $("#" + this.sync_mouse_id).bind('change', function() {
            self.sync_mouse = $("#" + self.sync_mouse_id).is(':checked');
            self.update_sync_mouse();
        });
        $("#" + this.sync_orientation_id).button().click(function() {
            self.sync_orientation();
        });
	$(this.change_default_applet_selector).bind('change_selected', function( event ) {
	    var applet = self.change_default_applet_selector.get_value(true);
	    var default_applet = Provi.Jmol.get_default_applet();
	    if(applet && applet != default_applet){
		Provi.Jmol.set_default_applet( applet );
	    }
        });
	$(Provi.Jmol).bind('default_applet_change', function(){
	    var applet = Provi.Jmol.get_default_applet();
	    if(applet && self.change_default_applet_selector.get_value(true) != applet){
		self.change_default_applet_selector.set_value( applet.name_suffix );
	    }
	});
    },
    update_sync_mouse: function(){
        var s = '';
        if( this.sync_mouse ){
            s += 'sync * on; sync * "set syncMouse on";';
        }else{
            s += 'sync * off;';
        }
        var applet = Provi.Jmol.get_default_applet();
        if(applet){
            applet.script(s);
        }
    },
    sync_orientation: function(){
        var applet = this.applet_selector_sync_orientation.get_value();
        if(applet){
            var s = 'sync * on;';
            s += 'sync > "' + applet.get_property_as_array('orientationInfo').moveTo.replace(/1\.0/,"0") + '";';
            s += 'sync * off;';
            applet.script(s);
        }
        this.update_sync_mouse();
    }
});


/**
 * A widget holding jmol display related controls
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Jmol.Controls.JmolDisplayWidget = function(params){
    this.style_cmd = '';
    params.heading = 'General Controls';
    Widget.call( this, params );
    this._build_element_ids([ 'style', 'quality', 'center', 'applet_selector_widget' ]);
    var content = '<div class="control_group">' +
        '<div class="control_row" id="' + this.applet_selector_widget_id + '"></div>' +
        '<div class="control_row">' +
            '<label for="' + this.style_id + '">style</label>' +
            '<select id="' + this.style_id + '" class="ui-state-default">' +
		'<option value=""></option>' +
		'<option value="default">default</option>' +
		'<option value="lines">lines</option>' +
                '<option value="sticks">sticks</option>' +
		'<option value="backbone">backbone</option>' +
                '<option value="backbone+lines">backbone & lines</option>' +
		'<option value="backbone+sticks">backbone & sticks</option>' +
		'<option value="cartoon">cartoon</option>' +
                '<option value="cartoon+lines">cartoon & lines</option>' +
		'<option value="cartoon+sticks">cartoon & sticks</option>' +
		'<option value="cartoon+aromatic">cartoon & aromatic</option>' +
            '</select>' +
        '</div>' +
//	'<div class="control_row">' +
//            '<label for="' + this.quality_id + '">style</label>' +
//            '<select id="' + this.quality_id + '" class="ui-state-default">' +
//		'<option value="highest">highest</option>' +
//		'<option value="high">high</option>' +
//                '<option value="normal">normal</option>' +
//		'<option value="low">low</option>' +
//                '<option value="lowest">lowest</option>' +
//            '</select>' +
//        '</div>' +
        '<div class="control_row">' +
            '<input id="' + this.quality_id + '" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
            '<label for="' + this.quality_id + '" style="display:block;">high quality</label>' +
        '</div>' +
        '<div class="control_row">' +
            '<button id="' + this.center_id + '">center protein</button>' +
        '</div>' +
    '</div>';
    $(this.dom).append( content );
    this.applet_selector = new Provi.Jmol.JmolAppletSelectorWidget({
        parent_id: this.applet_selector_widget_id
    });
    this._init();
}
Provi.Jmol.Controls.JmolDisplayWidget.prototype = Utils.extend(Widget, /** @lends Provi.Jmol.Controls.JmolDisplayWidget.prototype */ {
    _init: function(){
        var self = this;
        
        // init quality
        this.quality = $("#" + this.quality_id).is(':checked');
        $('#' + this.quality_id).click(function(){
            self.quality = $("#" + self.quality_id).is(':checked');
            self.update_quality();
        });
	
        // init style
        $("#" + this.style_id).bind('click change', function() {
            self.set_style();
        });
	this.set_style();
        
        // init centering
        $('#' + this.center_id).button().click(function(){
            var applet = self.applet_selector.get_value();
            if(applet){
                applet.script_wait('center *; zoom(*) 100;');
		applet.clipping_manager.sync();
            }
        });
    },
    update_quality: function(){
        var applet = this.applet_selector.get_value();
        if(applet){
	    if( this.quality ){
		applet.quality_manager.set({
		    high_resolution: true, antialias_display: true, antialias_translucent: true
		});
		applet.style_manager.set({ hermite_level: 4 });
	    }else{
		applet.quality_manager.set({
		    high_resolution: false, antialias_display: false, antialias_translucent: true
		});
		applet.style_manager.set({ hermite_level: 0 });
	    }
        }
    },
    set_style: function (){
	var applet = this.applet_selector.get_value(true);
	if( !applet ) return;
	var default_style = applet.style_manager.get_default_style();
	
	var selected_style = $("#" + this.style_id + " option:selected").val();
	$("#" + this.style_id).val('');
	
	var styles = {
	    'default': 'select protein;',
            'lines': 'select protein; wireframe -${line};',
            'sticks': 'select protein; wireframe -${stick};',
	    'backbone': 'select protein; backbone -${backbone};',
	    'backbone+lines': 'select protein; backbone -${backbone}; wireframe ${line};',
	    'backbone+sticks': 'select protein; backbone -${backbone}; wireframe ${stick};',
	    'cartoon': 'select protein; cartoon only; select helix or sheet; cartoon ${cartoon};',
	    'cartoon+lines': 'select protein; cartoon only; wireframe ${line}; select helix or sheet; cartoon ${cartoon};',
	    'cartoon+sticks': 'select protein; cartoon only; wireframe ${stick}; select helix or sheet; cartoon ${cartoon};',
	    'cartoon+aromatic': 'select protein; cartoon only; select helix or sheet; cartoon ${cartoon}; select aromatic; wireframe ${stick};'
        }
	
	this.style_cmd = applet.style_manager.get_style( styles[ selected_style ] || '' );
	
        if( this.style_cmd ){
            applet.script( default_style + this.style_cmd, true);
        }
    }
});



/**
 * A widget
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Jmol.Controls.SettingsManagerWidget = function(params){
    params = $.extend(
        Provi.Jmol.Controls.SettingsManagerWidget.prototype.default_params,
        params
    );
    params.collapsed = true;
    Provi.Widget.Widget.call( this, params );
    this._init_eid_manager([
	'defaults', 'applet_selector'
    ]);
    
    var template = '' +
	'<div class="control_group">' +
	    '<div class="control_row" id="${eids.applet_selector}"></div>' +
	    '<div class="control_row">' +
		'<button id="${eids.defaults}">defaults</button>' +
	    '</div>' +
        '</div>' +
	'';
    
    this.add_content( template, params );
    
    this.manager_name = params.manager_name;
    this.applet_selector = new Provi.Jmol.JmolAppletSelectorWidget({
        parent_id: this.eid('applet_selector')
    });
    
    // to be called by child classes
    //this._init();
}
Provi.Jmol.Controls.SettingsManagerWidget.prototype = Utils.extend(Provi.Widget.Widget, /** @lends Provi.Jmol.Controls.SettingsManagerWidget.prototype */ {
    default_params: {
        
    },
    _init: function(){
        var self = this;
	
	
	this.elm('defaults').button().click(function(){
            var applet = self.applet_selector.get_value();
            if(applet){
		applet[ self.manager_name ].defaults();
            }
        });
	
        // init clipping manager
	this._init_manager();
	$( this.applet_selector ).bind('change_selected', function(event, applet){
	    $.each( Provi.Jmol.get_applet_list(), function(i, applet){
		$(applet[ self.manager_name ]).unbind('.'+self.id);
	    });
	    self._init_manager();
	});
        
	Provi.Widget.Widget.prototype.init.call(this);
    },
    _init_manager: function(){
	var applet = this.applet_selector.get_value();
        if(applet){
	    var self = this;
	    $( applet[ this.manager_name ] ).bind('change', function(){
		self._sync();
	    });
	    this._sync();
	}
    },
    _sync: function(){
	var applet = this.applet_selector.get_value();
        if(applet){
	    var params = applet[ this.manager_name ].get();
	}
    },
    set: function(){
	var applet = this.applet_selector.get_value();
        if(applet){
	    applet[ this.manager_name ].set({
		
	    });
        }
    }
});



/**
 * A widget
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Jmol.Controls.ClippingManagerWidget = function(params){
    params = $.extend(
        Provi.Jmol.Controls.ClippingManagerWidget.prototype.default_params,
        params
    );
    params.heading = 'Clipping Settings';
    params.manager_name = 'clipping_manager';
    
    Provi.Jmol.Controls.SettingsManagerWidget.call( this, params );
    
    this._init_eid_manager([
	'clipping_state', 'clipping_slider', 'clipping_range',
	'slab_by_atom', 'slab_by_molecule'
    ]);
    
    var template = '' +
	'<div class="control_group">' +
	    '<div class="control_row">' +
		'<label for="${eids.clipping_range}" style="display:block;">clipping</label>' +
		'<input id="${eids.clipping_state}" type="checkbox" checked="checked" style="float:left; margin-top: 0.5em;"/>' +
		'<div id="${eids.clipping_slider}"></div>' +
	    '</div>' +
	    '<div class="control_row">' +
		'<label for="${eids.clipping_range}" style="display:block;">range to viewpoint clipping</label>' +
		'<div id="${eids.clipping_range}"></div>' +
	    '</div>' +
	    '<div class="control_row">' +
		'<input id="${eids.slab_by_atom}" type="checkbox" checked="checked" style="float:left; margin-top: 0.5em;"/>' +
		'<label for="${eids.slab_by_atom}" style="display:block;">clip by atom</label>' +
	    '</div>' +
	    '<div class="control_row">' +
		'<input id="${eids.slab_by_molecule}" type="checkbox" checked="checked" style="float:left; margin-top: 0.5em;"/>' +
		'<label for="${eids.slab_by_molecule}" style="display:block;">clip by molecule</label>' +
	    '</div>' +
        '</div>' +
	'';
    
    this.add_content( template, params );
    
    this._init();
}
Provi.Jmol.Controls.ClippingManagerWidget.prototype = Utils.extend(Provi.Jmol.Controls.SettingsManagerWidget, /** @lends Provi.Jmol.Controls.ClippingManagerWidget.prototype */ {
    default_params: {
        
    },
    _init: function(){
        var self = this;
	
        this.elm('clipping_state').bind('click', $.proxy( this.set, this ));
	
        this.elm('clipping_slider').slider({
            values: [0, 100], range: true,
            min: 0, max: 100
	}).bind( 'slidestop slide', function(event, ui){
	    console.log( event.orginalEvent );
	    // deactivate slabRange/clipping_range
	    if(ui.values[1] < 100){
		self.elm('clipping_range').slider('value', 0);
	    }
	    self.set();
	});
	this.elm('clipping_range').slider({
	    min: 0, max: 100
	}).bind( 'slidestop slide', function(event, ui){
	    // deactivate clipping slab
	    if( ui.value > 0 ){
		self.elm('clipping_slider').slider('values', 1, 100);
	    }
            self.set();
        });
	
	this.elm('slab_by_atom').bind('click', $.proxy( this.set, this ));
	this.elm('slab_by_molecule').bind('click', $.proxy( this.set, this ));
        
	Provi.Jmol.Controls.SettingsManagerWidget.prototype._init.call(this);
    },
    _sync: function(){
	var applet = this.applet_selector.get_value();
        if(applet){
	    var params = applet.clipping_manager.get();
	    
	    this.elm('clipping_state').attr('checked', params.clipping);
	    this.elm('clipping_slider').slider("values", 0, params.depth);
	    this.elm('clipping_slider').slider("values", 1, params.slab);
	    this.elm('clipping_range').slider("value", params.slab_range);
	    this.elm('slab_by_atom').attr('checked', params.slab_by_atom);
	    this.elm('slab_by_molecule').attr('checked', params.slab_by_molecule);
	}
    },
    set: function(){
	var applet = this.applet_selector.get_value();
        if(applet){
	    applet.clipping_manager.set({
		clipping: this.elm('clipping_state').is(':checked'),
		depth: this.elm('clipping_slider').slider("values", 0),
		slab: this.elm('clipping_slider').slider("values", 1),
		slab_range: this.elm('clipping_range').slider("value"),
		slab_by_atom: this.elm('slab_by_atom').is(':checked'),
		slab_by_molecule: this.elm('slab_by_molecule').is(':checked')
	    });
        }
    }
});



/**
 * A widget
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Jmol.Controls.LightingManagerWidget = function(params){
    params = $.extend(
        Provi.Jmol.Controls.LightingManagerWidget.prototype.default_params,
        params
    );
    params.heading = 'Lighting Settings';
    params.manager_name = 'lighting_manager';
    
    Provi.Jmol.Controls.SettingsManagerWidget.call( this, params );
    
    this._init_eid_manager([
	'ambient_percent', 'diffuse_percent',
	'specular_state', 'specular_percent', 'specular_exponent',
	'specular_power', 'phong_exponent',
	'z_shade_state', 'z_shade_slider', 'z_shade_power'
    ]);
    
    var template = '' +
	'<div class="control_group">' +
	    '<div class="control_row">' +
		'<label for="${eids.ambient_percent}" style="display:block;">ambient percent</label>' +
		'<div id="${eids.ambient_percent}"></div>' +
	    '</div>' +
	    '<div class="control_row">' +
		'<label for="${eids.diffuse_percent}" style="display:block;">diffuse percent</label>' +
		'<div id="${eids.diffuse_percent}"></div>' +
	    '</div>' +
	    '<div class="control_row">' +
		'<label for="${eids.specular_percent}" style="display:block;">specular percent</label>' +
		'<input id="${eids.specular_state}" type="checkbox" checked="checked" style="float:left; margin-top: 0.5em;"/>' +
		'<div id="${eids.specular_percent}"></div>' +
	    '</div>' +
	    '<div class="control_row">' +
		'<label for="${eids.specular_power}" style="display:block;">specular power</label>' +
		'<div id="${eids.specular_power}"></div>' +
	    '</div>' +
	    '<div class="control_row">' +
		'<label for="${eids.specular_exponent}">specular exponent</label>' +
		'<select id="${eids.specular_exponent}" class="ui-state-default">' +
		    '<option value="1">1</option><option value="2">2</option>' +
		    '<option value="3">3</option><option value="4">4</option>' +
		    '<option value="5">5</option><option value="6">6</option>' +
		    '<option value="7">7</option><option value="8">8</option>' +
		    '<option value="9">9</option><option value="10">10</option>' +
		'</select>' +
	    '</div>' +
	    '<div class="control_row">' +
		'<label for="${eids.phong_exponent}" style="display:block;">phong exponent (specular)</label>' +
		'<div id="${eids.phong_exponent}"></div>' +
	    '</div>' +
	    '<div class="control_row">' +
		'<label for="${eids.z_shade_state}" style="display:block;">z-shade</label>' +
		'<input id="${eids.z_shade_state}" type="checkbox" checked="checked" style="float:left; margin-top: 0.5em;"/>' +
		'<div id="${eids.z_shade_slider}"></div>' +
	    '</div>' +
	    '<div class="control_row">' +
		'<label for="${eids.z_shade_power}">z-shade power</label>' +
		'<select id="${eids.z_shade_power}" class="ui-state-default">' +
		    '<option value="1">1</option><option value="2">2</option>' +
		    '<option value="3">3</option><option value="4">4</option>' +
		'</select>' +
	    '</div>' +
        '</div>' +
	'';
    
    this.add_content( template, params );
    
    this._init();
}
Provi.Jmol.Controls.LightingManagerWidget.prototype = Utils.extend(Provi.Jmol.Controls.SettingsManagerWidget, /** @lends Provi.Jmol.Controls.LightingManagerWidget.prototype */ {
    default_params: {
        
    },
    _init: function(){
        var self = this;
	
	this.elm('ambient_percent')
	    .slider({min: 0, max: 100})
	    .bind( 'slidestop slide', $.proxy( this.set, this ));
	
	this.elm('diffuse_percent')
	    .slider({min: 0, max: 100})
	    .bind( 'slidestop slide', $.proxy( this.set, this ));
	
	this.elm('specular_state').click( $.proxy( this.set, this ) );
	
	this.elm('specular_percent')
	    .slider({min: 0, max: 100})
	    .bind( 'slidestop slide', $.proxy( this.set, this ));
	
	this.elm('specular_exponent').bind('click change', $.proxy( this.set, this ));
	
	this.elm('specular_power')
	    .slider({min: 0, max: 100})
	    .bind( 'slidestop slide', $.proxy( this.set, this ));
	
	this.elm('phong_exponent')
	    .slider({min: 0, max: 100})
	    .bind( 'slidestop slide', $.proxy( this.set, this ));
	
        this.elm('z_shade_state').click( $.proxy( this.set, this ) );
	
	this.elm('z_shade_slider')
	    .slider({ values: [0, 100], range: true, min: 0, max: 100 })
	    .bind( 'slidestop slide', $.proxy( this.set, this ));
	
	this.elm('z_shade_power').bind('click change', $.proxy( this.set, this ));
	
	Provi.Jmol.Controls.SettingsManagerWidget.prototype._init.call(this);
    },
    _sync: function(){
	var applet = this.applet_selector.get_value();
        if(applet){
	    var params = applet.lighting_manager.get();
	    this.elm('ambient_percent').slider("value", params.ambient_percent);
	    this.elm('diffuse_percent').slider("value", params.diffuse_percent);
	    this.elm('specular_state').attr('checked', params.specular);
	    this.elm('specular_percent').slider("value", params.specular_percent);
	    this.elm('specular_exponent').val( params.specular_exponent );
	    this.elm('specular_power').slider("value", params.specular_power);
	    this.elm('phong_exponent').slider("value", params.phong_exponent);
	    this.elm('z_shade_state').attr('checked', params.z_shade);
	    this.elm('z_shade_slider').slider("values", 0, params.z_depth);
	    this.elm('z_shade_slider').slider("values", 1, params.z_slab);
	    this.elm('z_shade_power').val( params.z_shade_power );
	}
    },
    set: function(){
	var applet = this.applet_selector.get_value();
        if(applet){
	    applet.lighting_manager.set({
		ambient_percent: this.elm('ambient_percent').slider("value"),
		diffuse_percent: this.elm('diffuse_percent').slider("value"),
		specular: this.elm('specular_state').is(':checked'),
		specular_percent: this.elm('specular_percent').slider("value"),
		specular_power: this.elm('specular_power').slider("value"),
		specular_exponent: this.elm('specular_exponent').children("option:selected").val(),
		phong_exponent: this.elm('phong_exponent').slider("value"),
		z_shade: this.elm('z_shade_state').is(':checked'),
		z_shade_power: this.elm('z_shade_power').children("option:selected").val(),
		z_depth: this.elm('z_shade_slider').slider("values", 0),
		z_slab: this.elm('z_shade_slider').slider("values", 1)
	    });
        }
    }
});



/**
 * A widget
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Jmol.Controls.QualityManagerWidget = function(params){
    params = $.extend(
        Provi.Jmol.Controls.QualityManagerWidget.prototype.default_params,
        params
    );
    params.heading = 'Quality Settings';
    params.manager_name = 'quality_manager';
    
    Provi.Jmol.Controls.SettingsManagerWidget.call( this, params );
    
    this._init_eid_manager([
	'high_resolution', 'antialias_display',
	'antialias_translucent', 'antialias_images', 'wireframe_rotation',
    ]);
    
    var template = '' +
	'<div class="control_group">' +
	    '<div class="control_row">' +
		'<input id="${eids.high_resolution}" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
		'<label for="${eids.high_resolution}" style="display:block;">high resolution</label>' +
	    '</div>' +
	    '<div class="control_row">' +
		'<input id="${eids.antialias_display}" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
		'<label for="${eids.antialias_display}" style="display:block;">antialias display</label>' +
	    '</div>' +
	    '<div class="control_row">' +
		'<input id="${eids.antialias_translucent}" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
		'<label for="${eids.antialias_translucent}" style="display:block;">antialias translucent</label>' +
	    '</div>' +
	    '<div class="control_row">' +
		'<input id="${eids.antialias_images}" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
		'<label for="${eids.antialias_images}" style="display:block;">antialias images</label>' +
	    '</div>' +
	    '<div class="control_row">' +
		'<input id="${eids.wireframe_rotation}" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
		'<label for="${eids.wireframe_rotation}" style="display:block;">wireframe rotation</label>' +
	    '</div>' +
        '</div>' +
	'';
    
    this.add_content( template, params );
    
    this._init();
}
Provi.Jmol.Controls.QualityManagerWidget.prototype = Utils.extend(Provi.Jmol.Controls.SettingsManagerWidget, /** @lends Provi.Jmol.Controls.QualityManagerWidget.prototype */ {
    default_params: {
        
    },
    _init: function(){
        var self = this;
	
	this.elm('high_resolution').bind('click', $.proxy( this.set, this ));
	this.elm('antialias_display').bind('click', $.proxy( this.set, this ));
	this.elm('antialias_translucent').bind('click', $.proxy( this.set, this ));
	this.elm('antialias_images').bind('click', $.proxy( this.set, this ));
	this.elm('wireframe_rotation').bind('click', $.proxy( this.set, this ));
        
	Provi.Jmol.Controls.SettingsManagerWidget.prototype._init.call(this);
    },
    _sync: function(){
	var applet = this.applet_selector.get_value();
        if(applet){
	    var params = applet.quality_manager.get();
	    this.elm('high_resolution').attr('checked', params.high_resolution);
	    this.elm('antialias_display').attr('checked', params.antialias_display);
	    this.elm('antialias_translucent').attr('checked', params.antialias_translucent);
	    this.elm('antialias_images').attr('checked', params.antialias_images);
	    this.elm('wireframe_rotation').attr('checked', params.wireframe_rotation);
	}
    },
    set: function(){
	var applet = this.applet_selector.get_value();
        if(applet){
	    applet.quality_manager.set({
		high_resolution: this.elm('high_resolution').is(':checked'),
		antialias_display: this.elm('antialias_display').is(':checked'),
		antialias_translucent: this.elm('antialias_translucent').is(':checked'),
		antialias_images: this.elm('antialias_images').is(':checked'),
		wireframe_rotation: this.elm('wireframe_rotation').is(':checked')
	    });
        }
    }
});



/**
 * A widget
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Jmol.Controls.PickingManagerWidget = function(params){
    params = $.extend(
        Provi.Jmol.Controls.PickingManagerWidget.prototype.default_params,
        params
    );
    params.heading = 'Picking Settings';
    params.manager_name = 'picking_manager';
    
    Provi.Jmol.Controls.SettingsManagerWidget.call( this, params );
    
    this._init_eid_manager([
	'atom_picking', 'draw_picking', 'picking', 'picking_style',
	'selection_halos', 'selection_halos_color', 'hover_delay'
    ]);
    
    var template = '' +
	'<div class="control_group">' +
	    
	    '<div class="control_row">' +
		'<input id="${eids.atom_picking}" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
		'<label for="${eids.atom_picking}" style="display:block;">atom picking</label>' +
	    '</div>' +
	    '<div class="control_row">' +
		'<input id="${eids.draw_picking}" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
		'<label for="${eids.draw_picking}" style="display:block;">draw picking</label>' +
	    '</div>' +
	    '<div class="control_row">' +
		'<label for="${eids.picking}">picking</label>' +
		'<select id="${eids.picking}" class="ui-state-default">' +
		    '<option value=""></option>' +
		    '<option value="center">center</option>' +
		    '<option value="atom">select atom</option><option value="group">select group</option>' +
		    '<option value="chain">select chain</option><option value="molecule">select molecule</option>' +
		    '<option value="label">label</option>' +
		    '<option value="spin">spin</option>' +
		    '<option value="draw">draw</option>' +
		    '<option value="distance">measure distance</option>' +
		    '<option value="angle">measure angle</option>' +
		    '<option value="torsion">measure torsion</option>' +
		'</select>' +
	    '</div>' +
	    '<div class="control_row">' +
		'<label for="${eids.picking_style}">picking style</label>' +
		'<select id="${eids.picking_style}" class="ui-state-default">' +
		    '<option value="toggle">select toggle</option>' +
		    '<option value="selectOrToggle">select or toggle</option>' +
		    '<option value="extendedSelect">extended select</option>' +
		    '<option value="measure">measure</option>' +
		'</select>' +
	    '</div>' +
	    '<div class="control_row">' +
		'<input id="${eids.selection_halos}" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
		'<label for="${eids.selection_halos}" style="display:block;">selection halos</label>' +
	    '</div>' +
	    '<div class="control_row">' +
		'<label for="${eids.hover_delay}">hover delay</label>' +
		'<select id="${eids.hover_delay}" class="ui-state-default">' +
		    '<option value="0.05">0.05</option>' +
		    '<option value="0.1">0.1</option><option value="0.2">0.2</option>' +
		    '<option value="0.3">0.3</option><option value="0.5">0.5</option>' +
		    '<option value="0.7">0.7</option><option value="1.0">1.0</option>' +
		'</select>' +
	    '</div>' +
        '</div>' +
	'';
    
    this.add_content( template, params );
    
    this._init();
}
Provi.Jmol.Controls.PickingManagerWidget.prototype = Utils.extend(Provi.Jmol.Controls.SettingsManagerWidget, /** @lends Provi.Jmol.Controls.PickingManagerWidget.prototype */ {
    default_params: {
        
    },
    _init: function(){
        var self = this;
	
	this.elm('atom_picking').bind('click', $.proxy( this.set, this ));
	this.elm('draw_picking').bind('click', $.proxy( this.set, this ));
	this.elm('picking').bind('click change', $.proxy( function(){
	    if( this._prevent ) return;
	    this._prevent = true;
	    var picking = this.elm('picking').children("option:selected").val();
	    if( Provi.Utils.in_array( ['atom', 'group', 'chain', 'molecule'], picking ) ){
		var style = this.elm('picking_style').children("option:selected").val();
		if( !Provi.Utils.in_array( ['toggle', 'selectOrToggle', 'extendedSelect'], style ) ){
		    this.elm('picking_style').val( 'toggle' );
		}
	    }
	    if( Provi.Utils.in_array( ['distance', 'angle', 'torsion'], picking ) ){
		this.elm('picking_style').val( 'measure' );
	    }
	    this.set();
	    this._prevent = false;
	}, this ));
	this.elm('picking_style').bind('click change', $.proxy( function(){
	    if( this._prevent ) return;
	    this._prevent = true;
	    var style = this.elm('picking_style').children("option:selected").val();
	    if( style=='measure' ){
		this.elm('picking').val( 'distance' );
	    }
	    if( Provi.Utils.in_array( ['toggle', 'selectOrToggle', 'extendedSelect'], style ) ){
		var picking = this.elm('picking').children("option:selected").val();
		if( !Provi.Utils.in_array( ['atom', 'group', 'chain', 'molecule'], picking ) ){
		    this.elm('picking').val( 'group' );
		}
	    }
	    this.set();
	    this._prevent = false;
	}, this ));
	this.elm('selection_halos').bind('click', $.proxy( this.set, this ));
	this.elm('hover_delay').bind('click change', $.proxy( this.set, this ));
        
	Provi.Jmol.Controls.SettingsManagerWidget.prototype._init.call(this);
    },
    _sync: function(){
	var applet = this.applet_selector.get_value();
        if(applet){
	    var params = applet.picking_manager.get();
	    this.elm('atom_picking').attr('checked', params.atom_picking);
	    this.elm('draw_picking').attr('checked', params.draw_picking);
	    this.elm('picking').val( params.picking );
	    this.elm('picking_style').val( params.picking_style );
	    this.elm('selection_halos').attr('checked', params.selection_halos );
	    this.elm('hover_delay').val( params.hover_delay );
	}
    },
    set: function(){
	var applet = this.applet_selector.get_value();
        if(applet){
	    applet.picking_manager.set({
		atom_picking: this.elm('atom_picking').is(':checked'),
		draw_picking: this.elm('draw_picking').is(':checked'),
		picking: this.elm('picking').children("option:selected").val(),
		picking_style: this.elm('picking_style').children("option:selected").val(),
		selection_halos: this.elm('selection_halos').is(':checked'),
		hover_delay: this.elm('hover_delay').children("option:selected").val()
	    });
        }
    }
});



/**
 * A widget
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Jmol.Controls.StyleManagerWidget = function(params){
    params = $.extend(
        Provi.Jmol.Controls.StyleManagerWidget.prototype.default_params,
        params
    );
    params.heading = 'Style Settings';
    params.manager_name = 'style_manager';
    
    Provi.Jmol.Controls.SettingsManagerWidget.call( this, params );
    
    this._init_eid_manager([
	'cartoon', 'line', 'stick', 'cpk', 'spacefill', 'backbone',
	'hermite_level', 'cartoon_rockets', 'ribbon_aspect_ratio', 'ribbon_border',
	'rocket_barrels', 'sheet_smoothing', 'trace_alpha'
    ]);
    
    var template = '' +
	'<div class="control_group">' +
	    '<div class="control_row">' +
		'<label for="${eids.cartoon}">cartoon</label>' +
		'<select id="${eids.cartoon}" class="ui-state-default">' +
		    '<option value="0.1">0.1</option><option value="0.2">0.2</option>' +
		    '<option value="0.3">0.3</option><option value="0.4">0.4</option>' +
		    '<option value="0.5">0.5</option><option value="0.6">0.6</option>' +
		    '<option value="0.7">0.7</option><option value="0.8">0.8</option>' +
		    '<option value="0.9">0.9</option>' +
		    '<option value="1.0">1.0</option><option value="1.3">1.3</option>' +
		    '<option value="1.5">1.5</option><option value="1.7">1.7</option>' +
		    '<option value="2.0">2.0</option><option value="2.5">2.5</option>' +
		    '<option value="3.0">3.0</option><option value="3.5">3.5</option>' +
		'</select>' +
	    '</div>' +
	    
	    '<div class="control_row">' +
		'<label for="${eids.line}">line</label>' +
		'<select id="${eids.line}" class="ui-state-default">' +
		    '<option value="0.001">0.001</option><option value="0.005">0.005</option>' +
		    '<option value="0.01">0.01</option><option value="0.02">0.02</option>' +
		    '<option value="0.03">0.03</option><option value="0.05">0.05</option>' +
		'</select>' +
	    '</div>' +
	    
	    '<div class="control_row">' +
		'<label for="${eids.hermite_level}">hermite level</label>' +
		'<select id="${eids.hermite_level}" class="ui-state-default">' +
		    '<option value="-4">-4</option><option value="-3">-3</option>' +
		    '<option value="-2">-2</option><option value="-1">-1</option>' +
		    '<option value="0">0</option>' +
		    '<option value="1">1</option><option value="2">2</option>' +
		    '<option value="3">3</option><option value="4">4</option>' +
		'</select>' +
	    '</div>' +
	    '<div class="control_row">' +
		'<input id="${eids.cartoon_rockets}" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
		'<label for="${eids.cartoon_rockets}" style="display:block;">cartoon rockets</label>' +
	    '</div>' +
	    '<div class="control_row">' +
		'<label for="${eids.ribbon_aspect_ratio}">ribbon aspect ratio</label>' +
		'<select id="${eids.ribbon_aspect_ratio}" class="ui-state-default">' +
		    '<option value="2">2</option><option value="3">3</option>' +
		    '<option value="4">4</option><option value="5">5</option>' +
		    '<option value="6">6</option><option value="7">7</option>' +
		    '<option value="8">8</option><option value="9">9</option>' +
		    '<option value="10">10</option><option value="11">11</option>' +
		    '<option value="12">12</option><option value="13">13</option>' +
		    '<option value="14">14</option><option value="15">15</option>' +
		    '<option value="16">16</option><option value="17">17</option>' +
		'</select>' +
	    '</div>' +
	    '<div class="control_row">' +
		'<input id="${eids.ribbon_border}" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
		'<label for="${eids.ribbon_border}" style="display:block;">ribbon border</label>' +
	    '</div>' +
	    '<div class="control_row">' +
		'<input id="${eids.rocket_barrels}" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
		'<label for="${eids.rocket_barrels}" style="display:block;">rocket barrels</label>' +
	    '</div>' +
	    '<div class="control_row">' +
		'<label for="${eids.sheet_smoothing}">sheet smoothing</label>' +
		'<select id="${eids.sheet_smoothing}" class="ui-state-default">' +
		    '<option value="0">0</option><option value="0.1">0.1</option>' +
		    '<option value="0.2">0.2</option><option value="0.3">0.3</option>' +
		    '<option value="0.4">0.4</option><option value="0.5">0.5</option>' +
		    '<option value="0.6">0.6</option><option value="0.7">0.7</option>' +
		    '<option value="0.8">0.8</option><option value="0.9">0.9</option>' +
		    '<option value="1.0">1.0</option>' +
		'</select>' +
	    '</div>' +
	    '<div class="control_row">' +
		'<input id="${eids.trace_alpha}" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
		'<label for="${eids.trace_alpha}" style="display:block;">trace alpha</label>' +
	    '</div>' +
        '</div>' +
	'';
    
    this.add_content( template, params );
    
    this._init();
}
Provi.Jmol.Controls.StyleManagerWidget.prototype = Utils.extend(Provi.Jmol.Controls.SettingsManagerWidget, /** @lends Provi.Jmol.Controls.StyleManagerWidget.prototype */ {
    default_params: {
        
    },
    _init: function(){
        var self = this;
	
	this.elm('cartoon').bind('click change', $.proxy( this.set, this ));
	this.elm('line').bind('click change', $.proxy( this.set, this ));
        
	this.elm('hermite_level').bind('click change', $.proxy( this.set, this ));
	this.elm('cartoon_rockets').bind('click', $.proxy( this.set, this ));
	this.elm('ribbon_aspect_ratio').bind('click change', $.proxy( this.set, this ));
	this.elm('ribbon_border').bind('click', $.proxy( this.set, this ));
	this.elm('rocket_barrels').bind('click', $.proxy( this.set, this ));
	this.elm('sheet_smoothing').bind('click change', $.proxy( this.set, this ));
	this.elm('trace_alpha').bind('click', $.proxy( this.set, this ));
	
	Provi.Jmol.Controls.SettingsManagerWidget.prototype._init.call(this);
    },
    _sync: function(){
	var applet = this.applet_selector.get_value();
        if(applet){
	    var params = applet.style_manager.get();
	    this.elm('cartoon').val( params.cartoon );
	    this.elm('line').val( params.line );
	    
	    this.elm('hermite_level').val( params.hermite_level );
	    this.elm('cartoon_rockets').attr('checked', params.cartoon_rockets);
	    this.elm('ribbon_aspect_ratio').val( params.ribbon_aspect_ratio );
	    this.elm('ribbon_border').attr('checked', params.ribbon_border);
	    this.elm('rocket_barrels').attr('checked', params.rocket_barrels);
	    this.elm('sheet_smoothing').val( params.sheet_smoothing );
	    this.elm('trace_alpha').attr('checked', params.trace_alpha);
	}
    },
    set: function(){
	var applet = this.applet_selector.get_value();
        if(applet){
	    applet.style_manager.set({
		cartoon: this.elm('cartoon').children("option:selected").val(),
		line: this.elm('line').children("option:selected").val(),
		
		hermite_level: this.elm('hermite_level').children("option:selected").val(),
		cartoon_rockets: this.elm('cartoon_rockets').is(':checked'),
		ribbon_aspect_ratio: this.elm('ribbon_aspect_ratio').children("option:selected").val(),
		ribbon_border: this.elm('ribbon_border').is(':checked'),
		rocket_barrels: this.elm('rocket_barrels').is(':checked'),
		sheet_smoothing: this.elm('sheet_smoothing').children("option:selected").val(),
		trace_alpha: this.elm('trace_alpha').is(':checked')
	    });
        }
    }
});



/**
 * A widget holding jmol animation related controls
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Jmol.Controls.JmolAnimationWidget = function(params){
    Widget.call( this, params );
    this._build_element_ids([ 'mode', 'mode_loop', 'mode_once', 'mode_palindrome' ]);
    this._build_element_ids([ 'play', 'stop', 'next', 'previous', 'first', 'last' ]);
    this._build_element_ids([ 'current_frame', 'applet_selector_widget' ]);
    
    var content = '<div class="control_group">' +
        '<div class="control_row" id="' + this.applet_selector_widget_id + '"></div>' +
        '<div class="control_row">' +
            '<span>' +
		'<button id="' + this.first_id + '">first frame</button>' +
		'<button id="' + this.previous_id + '">previous frame</button>' +
		'<button id="' + this.play_id + '">play</button>' +
		'<button id="' + this.stop_id + '">stop frame</button>' +
		'<button id="' + this.next_id + '">next frame</button>' +
		'<button id="' + this.last_id + '">last frame</button>' +
		'<span id="' + this.mode_id + '">' +
		    '<input type="radio" value="loop" id="' + this.mode_loop_id + '" name="' + this.mode_id + '" checked="checked" /><label for="' + this.mode_loop_id + '">Loop</label>' +
		    '<input type="radio" value="once" id="' + this.mode_once_id + '" name="' + this.mode_id + '" /><label for="' + this.mode_once_id + '">Once</label>' +
		    '<input type="radio" value="palindrome" id="' + this.mode_palindrome_id + '" name="' + this.mode_id + '" /><label for="' + this.mode_palindrome_id + '">Palindrome</label>' +
		'</span>' +
            '</span>' +
        '</div>' +
	'<div class="control_row">' +
	    'Frame <span id="' + this.current_frame_id + '"></span>' + 
	'</div>' +
    '</div>';
    $(this.dom).append( content );
    this.applet_selector = new Provi.Jmol.JmolAppletSelectorWidget({
        parent_id: this.applet_selector_widget_id
    });
    this._init();
}
Provi.Jmol.Controls.JmolAnimationWidget.prototype = Utils.extend(Widget, /** @lends Provi.Jmol.Controls.JmolAnimationWidget.prototype */ {
    _init: function(){
        var self = this;
        
	this._init_anim_callback();
	this.applet_selector.change( function() {
            self._init_anim_callback();
        });
	
        $('#' + this.first_id).button({
            text: false,
            icons: {
                primary: 'ui-icon-seek-start'
            }
        }).click(function(){
            var s = 'frame REWIND;';
            self.update_animation(s);
        });
        
        $('#' + this.previous_id).button({
            text: false,
            icons: {
                primary: 'ui-icon-seek-prev'
            }
        }).click(function(){
            var s = 'frame PREVIOUS;';
            self.update_animation(s);
        });
        
        $('#' + this.play_id).button({
            text: false,
            icons: {
                primary: 'ui-icon-play'
            }
        })
        .click(function() {
            var options;
            var s = '';
            if ($(this).text() == 'play') {
                options = {
                    label: 'pause',
                    icons: {
                        primary: 'ui-icon-pause'
                    }
                };
                s = 'frame PLAY;';
            } else {
                options = {
                    label: 'play',
                    icons: {
                        primary: 'ui-icon-play'
                    }
                };
                s = 'frame PAUSE;';
            }
            self.update_animation(s);
        });
        
        $('#' + this.stop_id).button({
            text: false,
            icons: {
                primary: 'ui-icon-stop'
            }
        })
        .click(function() {
            $('#' + self.play_id).button('option', {
                label: 'play',
                icons: {
                    primary: 'ui-icon-play'
                }
            });
            var s = 'frame PAUSE; frame REWIND;';
            self.update_animation(s);
        });
        
        $('#' + this.next_id).button({
            text: false,
            icons: {
                primary: 'ui-icon-seek-next'
            }
        }).click(function(){
            var s = 'frame NEXT;';
            self.update_animation(s);
        });
        
        $('#' + this.last_id).button({
            text: false,
            icons: {
                primary: 'ui-icon-seek-end'
            }
        }).click(function(){
            var s = 'frame LAST;';
            self.update_animation(s);
        });
        
        $("#" + this.mode_id).buttonset().change(function(){
            self.set_animation_mode();
        });
    },
    _init_anim_callback: function(){
        var applet = this.applet_selector.get_value(true);
	if(applet){
	    var self = this;
	    $(applet).bind('anim_frame', function( event, frameNo, fileNo, modelNo, firstNo, lastNo, isAnimationRunning, animationDirection, currentDirection ){
		$('#' + self.current_frame_id).html( frameNo +'' );
	    });
	}
    },
    update_animation: function(script){
        this.set_animation_mode();
        var applet = this.applet_selector.get_value(true);
        if(applet){
            applet.script(script);
        }
    },
    set_animation_mode: function(script){
        var applet = this.applet_selector.get_value(true);
        if(applet){
            var s = '';
            var mode = $("#" + this.mode_id + " input[name=" + this.mode_id + "]:radio:checked").val();
            if(mode == 'palindrome'){
                s = 'animation mode PALINDROME';
            }else if(mode == 'once'){
                s = 'animation mode ONCE';
            }else{
                s = 'animation mode LOOP';
            }
            applet.script(s);
        }
    }
});



})();