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
	this.applet_selector.change(function(event){
	    self.console.applet = self.applet_selector.get_value();
	});
	$("#" + this.maintain_selection_id).bind('change', function() {
	    self.console.maintain_selection = $("#" + self.maintain_selection_id).is(':checked');
	});
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
    this.style_cmd = 'cartoon ONLY; wireframe 0.015;';
    this.zshade_depth = 5;
    this.zshade_slab = 95;
    this.zshade_state = true;
    this.clipping_depth = 0;
    this.clipping_slab = 100;
    this.clipping_state = false;
    this.clipping_slab_range = 10.0;
    Widget.call( this, params );
    this._build_element_ids([ 'zshade_slider', 'zshade_state',  'style', 'quality', 'clipping_slider', 'clipping_state', 'clipping_slab_range', 'center', 'applet_selector_widget' ]);
    var content = '<div class="control_group">' +
        '<div class="control_row" id="' + this.applet_selector_widget_id + '"></div>' +
        '<div class="control_row">' +
            '<label for="' + this.style_id + '">style</label>' +
            '<select id="' + this.style_id + '" class="ui-state-default">' +
		'<option value=""></option>' +
		'<option value="default">default</option>' +
		'<option value="default+wireframe">default & wireframe</option>' +
                '<option value="backbone">backbone</option>' +
                '<option value="wireframe">wireframe</option>' +
                '<option value="cartoon">cartoon</option>' +
                '<option value="wireframe+backbone">wireframe & backbone</option>' +
                '<option value="cartoon+wireframe" selected="selected">cartoon & wireframe</option>' +
            '</select>' +
        '</div>' +
        '<div class="control_row">' +
            '<input id="' + this.quality_id + '" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
            '<label for="' + this.quality_id + '" style="display:block;">high quality</label>' +
        '</div>' +
	'<div class="control_row">' +
            '<label for="' + this.zshade_state_id + '" style="display:block;">zshade</label>' +
            '<input id="' + this.zshade_state_id + '" type="checkbox" checked="checked" style="float:left; margin-top: 0.5em;"/>' +
            '<div id="' + this.zshade_slider_id + '"></div>' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="' + this.clipping_state_id + '" style="display:block;">clipping</label>' +
	    '<select id="' + this.clipping_state_id + '" class="ui-state-default" style="">' +
                '<option value="">off</option>' +
                '<option value="1">on</option>' +
                '<option value="range">slab range</option>' +
            '</select>' +
            '<div id="' + this.clipping_slider_id + '"></div>' +
	    '<input id="' + this.clipping_slab_range_id + '" type="text" size="4" value="10.0"/>' +
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
        
        // init zshade
	$("#" + this.zshade_slider_id).slider('option', 'values', [this.zshade_depth, this.zshade_slab]);
        this.zshade_state = $("#" + this.zshade_state_id).is(':checked');
        //this.update_zshade();
        $('#' + this.zshade_state_id).click(function(){
            self.zshade_state = $("#" + self.zshade_state_id).is(':checked');
            self.update_zshade();
        });
	$("#" + this.zshade_slider_id).slider({
            values: [this.zshade_depth, this.zshade_slab],
            range: true,
            min: 0, max: 100,
            slide: function(event, ui){
                //console.log(ui, ui.values);
                self.zshade_depth  = ui.values[0];
                self.zshade_slab= ui.values[1];
                self.update_zshade();
            }
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
                applet.script('center *; zoom(all) 100;');
            }
        });
        
        // init clipping
        $("#" + this.clipping_slider_id).slider('option', 'values', [this.clipping_depth, this.clipping_slab]);
        this.clipping_state = $("#" + this.clipping_state_id).is(':checked');
        //this.update_clipping();
	$("#" + this.clipping_slab_range_id).hide();
	$("#" + this.clipping_slider_id).hide();
        $("#" + this.clipping_state_id).bind('change click', function(){
            self.clipping_state = $("#" + self.clipping_state_id).val();
	    if( self.clipping_state == '1' ){
		$("#" + self.clipping_slab_range_id).hide();
		$("#" + self.clipping_slider_id).show();
	    }else if( self.clipping_state == 'range' ){
		$("#" + self.clipping_slab_range_id).show();
		$("#" + self.clipping_slider_id).hide();
	    }else{
		$("#" + self.clipping_slab_range_id).hide();
		$("#" + self.clipping_slider_id).hide();
	    }
            self.update_clipping();
        });
        $("#" + this.clipping_slider_id).slider({
            values: [this.clipping_depth, this.clipping_slab],
            range: true,
            min: 0, max: 100,
            slide: function(event, ui){
                //console.log(ui, ui.values);
                self.clipping_depth  = ui.values[0];
                self.clipping_slab= ui.values[1];
                self.update_clipping();
            }
        });
        $("#" + this.clipping_slider_id).mousewheel( function(event, delta){
            //console.log(event, delta);
            self.clipping_slab = Math.round(self.clipping_slab + 2*delta);
            self.clipping_depth = Math.round(self.clipping_depth + 2*delta);
            if(self.clipping_slab > 100) self.clipping_slab = 100;
            if(self.clipping_slab < 0) self.clipping_slab = 0;
            if(self.clipping_depth > 100) self.clipping_depth = 100;
            if(self.clipping_depth < 0) self.clipping_depth = 0;
            $("#" + this.clipping_slider_id).slider('values', 0, self.clipping_depth);
            $("#" + this.clipping_slider_id).slider('values', 1, self.clipping_slab);
            self.update_clipping();
        });
	$("#" + this.clipping_slab_range_id).change(function() {
	    self.clipping_slab_range = parseFloat( $("#" + self.clipping_slab_range_id).val() );
	    self.update_clipping();
        });
    },
    update_quality: function(){
        var applet = this.applet_selector.get_value();
        if(applet){
            var s = '';
            if( this.quality ){
                s = 'set highresolution ON; set hermitelevel 5; set antialiasDisplay On; set antialiasTranslucent ON;';
            }else{
                s = 'set highresolution OFF; set hermitelevel 0; set antialiasDisplay OFF; set antialiasTranslucent OFF;';
            }
            applet.script( s );
        }
    },
    update_zshade: function(){
	var applet = this.applet_selector.get_value();
        if(applet){
	    var s = this.zshade_state ? 'set zShade ON;' : 'set zShade OFF;';
            s += 'set zDepth ' + this.zshade_depth + '; set zSlab ' + this.zshade_slab + ';';
            applet.script(s);
        }
    },
    set_style: function (){
        switch($("#" + this.style_id + " option:selected").val()){
	    case 'default':
                this.style_cmd = 'select all; spacefill off; wireframe off; backbone off; cartoon on; ' +
		    //'select protein; color cartoon structure; color structure; ' +
		    //'slab on; set slabRange 10.0; set zShade on; set zSlab 95; set zDepth 5; ' +
		    'select (ligand or ypl or lrt); wireframe 0.16; spacefill 0.5; ' +
		    'select water; wireframe 0.01;' +
		    'select group=hoh; cpk 20%;' +
		    'select (hetero or ypl or lrt) and connected(protein) or within(GROUP, protein and connected(hetero or ypl or lrt)); wireframe 0.1;' + 
		    'select (dmpc or dmp or popc or pop); wireframe 0.1;' +
		    'select none;';
                break;
	    case 'default+wireframe':
                this.style_cmd = 'select all; spacefill off; wireframe off; backbone off; cartoon on; wireframe 0.01;' +
		    //'select protein; color cartoon structure; color structure; ' +
		    //'slab on; set slabRange 10.0; set zShade on; set zSlab 95; set zDepth 5; ' +
		    'select (ligand or ypl or lrt); wireframe 0.16; spacefill 0.5; ' +
		    'select water; wireframe 0.01;' +
		    'select group=hoh; cpk 20%;' +
		    'select (hetero or ypl or lrt) and connected(protein) or within(GROUP, protein and connected(hetero or ypl or lrt)); wireframe 0.1;' + 
		    'select (dmpc or dmp or popc or pop); wireframe 0.1;' +
		    'select none;';
                break;
            case 'backbone':
                this.style_cmd = 'backbone ONLY; backbone 0.3;';
                break;
            case 'wireframe':
                this.style_cmd = 'wireframe ONLY; wireframe 0.2;';
                break;
            case 'wireframe+backbone':
                this.style_cmd = 'wireframe ONLY; backbone 0.3; wireframe 0.01;';
                break;
            case 'cartoon+wireframe':
                this.style_cmd = 'cartoon ONLY; wireframe 0.015;';
                break;
            case 'cartoon':
                this.style_cmd = 'cartoon ONLY;';
                break;
            default:
		this.style_cmd = '';
                break;
        }
	$("#" + this.style_id).val('');
        var applet = this.applet_selector.get_value(true);
        if(applet && this.style_cmd){
            applet.script('select all; ' + this.style_cmd + ' select none;');
        }
    },
    update_clipping: function(){
        var applet = this.applet_selector.get_value();
        if(applet){
            var s = this.clipping_state ? 'slab on;' : 'slab off;';
	    if( this.clipping_state == 'range' ){
		s += 'set slabRange ' + this.clipping_slab_range + ';';
	    }else{
		s += 'depth ' + this.clipping_depth + '; slab ' + this.clipping_slab + ';';
	    }
            applet.script(s);
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