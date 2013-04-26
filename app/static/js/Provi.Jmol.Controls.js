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
                    var out = self.applet.script_wait(
                        cmd, { maintain_selection: self.maintain_selection, try_catch: true }
                    );
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
            console.log('JMOL CONSOLE APPLET CHANGE',applet, self.applet_selector.get_value(true));
            self.console.applet = self.applet_selector.get_value(true);
        });
        self.console.applet = self.applet_selector.get_value(true);
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
    params = _.defaults(
        params,
        Provi.Jmol.Controls.JmolGlobalControlWidget.prototype.default_params
    );
    this.sync_mouse = params.sync_mouse;
    Widget.call( this, params );
    this._build_element_ids([ 'sync_mouse', 'sync_orientation', 'applet_selector_sync_orientation', 'change_default_applet' ]);
    
    var template = '' +
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
    '';
    this.add_content( template, params );

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
    default_params: {
        heading: 'Global Controls',
        sync_mouse: false,
        collapsed: true
    },
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

        Provi.Widget.Widget.prototype.init.call(this);
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
    params = _.defaults(
        params,
        Provi.Jmol.Controls.JmolDisplayWidget.prototype.default_params
    );
    this.style_cmd = params.style_cmd;
    Provi.Widget.Widget.call( this, params );
    this._init_eid_manager([ 
        'style', 'quality', 'color_scheme', 'color_models', 'center', 
        'applet_selector_widget', 'style_sele', 'color_models_sele',
        'center_all', 'center_protein', 'center_selected', 'center_displayed',
        'select_all', 'select_none', 'select_protein', 'select_invert', 'presets'
    ]);
    var template = '' +
        '<div class="control_row" id="${eids.applet_selector_widget}"></div>' +
        '<div class="control_row">' +
            '<select style="width:1.5em;" id="${eids.style}" class="ui-state-default">' +
                '<option value=""></option>' +
                '<option value="default">default</option>' +
                '<option value="lines">lines</option>' +
                '<option value="sticks">sticks</option>' +
                '<option value="cpk">cpk</option>' +
                '<option value="spacefill">spacefill</option>' +
                '<option value="backbone">backbone</option>' +
                '<option value="backbone+lines">backbone & lines</option>' +
                '<option value="backbone+sticks">backbone & sticks</option>' +
                '<option value="backbone+cpk">backbone & cpk</option>' +
                '<option value="trace">trace</option>' +
                '<option value="tube">tube</option>' +
                '<option value="tube10">tube10</option>' +
                '<option value="tube8">tube8</option>' +
                '<option value="tube5">tube5</option>' +
                '<option value="ribbon">ribbon</option>' +
                '<option value="cartoon">cartoon</option>' +
                '<option value="cartoon+lines">cartoon & lines</option>' +
                '<option value="cartoon+sticks">cartoon & sticks</option>' +
                '<option value="cartoon+cpk">cartoon & cpk</option>' +
                '<option value="cartoon+aromatic">cartoon & aromatic</option>' +
            '</select>' +
            '&nbsp;' +
            '<label for="${eids.style}">style</label>' +
            '&nbsp;&nbsp;&nbsp;' +
            '<input id="${eids.style_sele}" type="checkbox" style="margin-top: 0.5em;">' +
            '&nbsp;' +
            '<label for="${eids.style_sele}">selection only</label>' +
        '</div>' +
        '<div class="control_row">' +
            '<select style="width:1.5em;" id="${eids.color_scheme}" class="ui-state-default">' +
                '<option value=""></option>' +
                '<option value="structure">secondary structure</option>' +
                '<option value="chain">by chain</option>' +
                '<option value="group">by group (rainbow)</option>' +
                '<option value="cpk">cpk</option>' +
                '<option value="molecule">by molecule</option>' +
                '<option value="property temperature">temperature (b-factor)</option>' +
                '<option value=\'property partialCharge "rwb" range -1 1\'>partial charge</option>' +
                '<option value="altloc">altloc</option>' +
                '<option value="formalcharge">formalcharge</option>' +
            '</select>' +
            '&nbsp;' +
            '<label for="${eids.color_scheme}">color scheme</label>' +
        '</div>' +
        '<div class="control_row">' +
            '<select style="width:1.5em;" id="${eids.quality}" class="ui-state-default">' +
                '<option value=""></option>' +
                '<option value="0">normal</option>' +
                '<option value="1">better cartoons</option>' +
                '<option value="2">highest (print)</option>' +
            '</select>' +
            '&nbsp;' +
            '<label for="${eids.quality}">quality</label>' +
        '</div>' +
        '<div class="control_row">' +
            '<select style="width:1.5em;" id="${eids.color_models}" class="ui-state-default">' +
                '<option value=""></option>' +
                '<option value="roygb">red, orange, yellow, green, blue</option>' +
                '<option value="bgyor">blue, green, yellow, orange, red</option>' +
                '<option value="rwb">red, white, blue</option>' +
                '<option value="bwr">blue, white, red</option>' +
                '<option value="high">yellow, green, blue</option>' +
                '<option value="low">red, orange, yellow</option>' +
                '<option value="bw">black, white</option>' +
                '<option value="wb">white, black</option>' +
            '</select>' +
            '&nbsp;' +
            '<label for="${eids.color_models}">color models</label>' +
            '&nbsp;&nbsp;&nbsp;' +
            '<input id="${eids.color_models_sele}" type="checkbox" style="margin-top: 0.5em;">' +
            '&nbsp;' +
            '<label for="${eids.color_models_sele}">selection only</label>' +
        '</div>' +
        '<div class="control_row">' +
            '<select style="width:1.5em;" id="${eids.presets}" class="ui-state-default">' +
                '<option value=""></option>' +
                '<option value="crystal_contacts">crystal contacts</option>' +
                '<option value="phi_psi_coloring">phi/psi coloring</option>' +
            '</select>' +
            '&nbsp;' +
            '<label for="${eids.presets}">presets</label>' +
        '</div>' +
        '<div class="control_row">' +
            'center:&nbsp;' +
            '<button id="${eids.center_all}">all</button>' +
            '<button id="${eids.center_protein}">polymer</button>' +
            '<button id="${eids.center_selected}">selected</button>' +
            '<button id="${eids.center_displayed}">displayed</button>' +
        '</div>' +
        '<div class="control_row">' +
            'select:&nbsp;' +
            '<button id="${eids.select_all}">all</button>' +
            '<button id="${eids.select_none}">none</button>' +
            '<button id="${eids.select_protein}">polymer</button>' +
            '<button id="${eids.select_invert}">invert</button>' +
        '</div>' +
    '';
    this.add_content( template, params );

    this.applet_selector = new Provi.Jmol.JmolAppletSelectorWidget({
        parent_id: this.eid('applet_selector_widget')
    });

    if( params.hide_color_models ){
        this.elm('color_models').parent().hide();
    }

    this._init();
}
Provi.Jmol.Controls.JmolDisplayWidget.prototype = Utils.extend(Widget, /** @lends Provi.Jmol.Controls.JmolDisplayWidget.prototype */ {
    default_params: {
        style_cmd: '',
        heading: 'General Controls'
    },
    _init: function(){
        var self = this;
        
        // init quality
        this.quality = this.elm('quality').children("option:selected").val();
        this.elm('quality').bind('change', function(){
            self.quality = self.elm('quality').children("option:selected").val();
            self.elm('quality').val('');
            self.update_quality();
        });
    
        // init style
        this.elm('style').bind('click change', function() {
            self.set_style();
        });
        this.set_style();

        // init color scheme
        this.elm('color_scheme').bind('change', function() {
            self.set_color_scheme();
        });
        //this.set_color_scheme();
        
        // init color model
        this.elm('color_models').bind('click change', function(){
            var applet = self.applet_selector.get_value();
            var cs = self.elm('color_models').children("option:selected").val();
            var sele = self.elm('color_models_sele').is(':checked') ? 'selected' : '*';
            if(applet && cs){
                var s = '' +
                    'var mi = {' + sele + '}.modelindex.all.count().join("").split("\t");' +
                    'var mi2 = [];' +
                    'for (var i=mi.length; i>0; --i){' +
                        'if(i%2==0){ mi2 += mi[i]; }' +
                    '}' +
                    'var count = mi2.length;' +
                    'mi2.sort;' +
                    'for( var i = 1; i <= count; i++ ){' +
                        'var c = color("' + cs + '", 1-0.5, count+1.5, i);' +
                        'select @{ "modelindex=" + mi2[i] };' +
                        'color @c;' +
                    '}' +
                '';
                applet.script( s, { maintain_selection: true, try_catch: true } );
            }
            self.elm('color_models').val('');
        });

        // init presets
        this.elm('presets').bind('change', function() {
            self.set_preset();
        });
    
        // init centering
        var centering_button_data = [
            { eid:"center", sele:"*" },
            { eid:"center_all", sele:"*" },
            { eid:"center_protein", sele:"protein" },
            { eid:"center_selected", sele:"selected" },
            { eid:"center_displayed", sele:"displayed" }
        ];
        _.each(centering_button_data, function(d){
            self.elm( d.eid ).button().click(function(){
                var applet = self.applet_selector.get_value();
                if(applet){
                    applet.script('center ' + d.sele + '; zoom(' + d.sele + ') 100;');
                }
            });
        });

        // init select
        this.elm('select_all').button().click(function(){
            var applet = self.applet_selector.get_value();
            if(applet) applet.script('select *;');
        });
        this.elm('select_none').button().click(function(){
            var applet = self.applet_selector.get_value();
            if(applet) applet.script('select none;');
        });
        this.elm('select_protein').button().click(function(){
            var applet = self.applet_selector.get_value();
            if(applet) applet.script('select protein;');
        });
        this.elm('select_invert').button().click(function(){
            var applet = self.applet_selector.get_value();
            if(applet) applet.script('select not selected;');
        });

        Provi.Widget.Widget.prototype.init.call(this);
    },
    update_quality: function(){
        var applet = this.applet_selector.get_value();
        if(applet){
            // if( this.quality==2 ){
            //     applet.quality_manager.set({
            //         high_resolution: true, 
            //         antialias_display: true, 
            //         antialias_translucent: true
            //     });
            //     applet.style_manager.set({
            //         hermite_level: -3, 
            //         cartoon: 0.8, 
            //         ribbon_aspect_ratio: 16
            //     });
            // }else if( this.quality==1 ){
            //     applet.quality_manager.set({
            //         high_resolution: true, 
            //         antialias_display: false, 
            //         antialias_translucent: true
            //     });
            //     applet.style_manager.set({
            //         hermite_level: -1, 
            //         cartoon: 0.6, 
            //         ribbon_aspect_ratio: 4
            //     });
            // }else{
            //     applet.quality_manager.set({
            //         high_resolution: false, 
            //         antialias_display: false, 
            //         antialias_translucent: true
            //     });
            //     applet.style_manager.set({
            //         hermite_level: 0, 
            //         cartoon: 0.8, 
            //         ribbon_aspect_ratio: 16
            //     });
            // }
        }
    },
    set_style: function (){
        var applet = this.applet_selector.get_value(true);
        if( !applet ) return;
        
        var selected_style = this.elm('style').children("option:selected").val();
        if( !selected_style ) return;
        this.elm('style').val('');
        
        var s = 'provi_style("' + selected_style + '");';
        if( this.elm('style_sele').is(':checked') ){
            s = 'subset selected;' + s + 'subset;';
        }
        console.log(s);
        applet.script( 'try{' + s + '}catch(e){ subset; }', { maintain_selection: true });
    },
    set_preset: function (){
        var applet = this.applet_selector.get_value(true);
        if( !applet ) return;
        
        var selected_preset = this.elm('presets').children("option:selected").val();
        if( !selected_preset ) return;
        this.elm('presets').val('');
        
        var presets = {
            'crystal_contacts': '' +
                'display within(12.0, not symmetry); ' +
                'try{ contact {symmetry} {not symmetry} full vdw 120% color white; }catch(){}' +
                'color {*} molecule; ' +
                'center displayed; ',
            'phi_psi_coloring': '' +
                'var phi=0; var psi=0; var r=0; var g=0; var b=0; var colr=0;' +
                'for(a in {protein and *.CA}){' +
                    'phi = {@a}.phi;' +
                    'psi = {@a}.psi;' +
                    'try{' +
                        'r = (( phi + 180 )/360 )*255;' +
                        'g = 256 - (( psi + 180 )/360 )*255;' +
                        //'b = 1;' +
                        'b = sqrt(r*r + g*g);' +
                        'colr = {@r, @g, @b};' +
                        'color @a @colr;' +
                    '}catch(){' +
                        'color @a grey;' +
                    '}' +
                '}'
        }
        
        this.preset_cmd = presets[ selected_preset ] || '';
        
        if( this.preset_cmd ){
            var s = this.preset_cmd;
            applet.script( s, { maintain_selection: true, try_catch: false } );
        }
    },
    set_color_scheme: function (){
        var applet = this.applet_selector.get_value(true);
        var color_scheme = this.elm('color_scheme').children("option:selected").val();
        console.log( 'COLORSCHEME', color_scheme );
        this.elm('color_scheme').val('');
        if( !applet || !color_scheme ) return;

        var s = 'select all; color ' + color_scheme + ';';
        applet.script( s, { maintain_selection: true, try_catch: true });
    }
});



/**
 * A widget holding jmol animation related controls
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Jmol.Controls.JmolAnimationWidget = function(params){
    params = _.defaults(
        params,
        Provi.Jmol.Controls.JmolAnimationWidget.prototype.default_params
    );
    Provi.Widget.Widget.call( this, params );

    this.frame_list = []; //maps frames to file_model ids
    this.file_model_dict = {}; //maps file_model ids to frames

    this._init_eid_manager([
        'mode', 'mode_loop', 'mode_once', 'mode_palindrome',
        'play', 'stop', 'next', 'previous', 'first', 'last',
        'slider', 'current_frame', 'applet_selector_widget'
    ]);
    
    var template = '' +
        '<div class="control_row" id="${eids.applet_selector_widget}"></div>' +
        '<div class="control_row">' +
            '<span>' +
                '<button id="${eids.first}">first frame</button>' +
                '<button id="${eids.previous}">previous frame</button>' +
                '<button id="${eids.play}">play</button>' +
                '<button id="${eids.stop}">stop frame</button>' +
                '<button id="${eids.next}">next frame</button>' +
                '<button id="${eids.last}">last frame</button>' +
                '<span id="${eids.mode}">' +
                    '<input type="radio" value="loop" id="${eids.mode_loop}" name="${eids.mode}" checked="checked" /><label for="${eids.mode_loop}">Loop</label>' +
                    '<input type="radio" value="once" id="${eids.mode_once}" name="${eids.mode}" /><label for="${eids.mode_once}">Once</label>' +
                    '<input type="radio" value="palindrome" id="${eids.mode_palindrome}" name="${eids.mode}" /><label for="${eids.mode_palindrome}">Palindrome</label>' +
                '</span>' +
            '</span>' +
        '</div>' +
        '<div class="control_row">' +
            '<div id="${eids.slider}"></div>' +
        '</div>' +
        '<div class="control_row">' +
            'Frame <span id="${eids.current_frame}"></span>' + 
        '</div>' +
    '';
    this.add_content( template, params );
    
    this.applet_selector = new Provi.Jmol.JmolAppletSelectorWidget({
        parent_id: this.eid('applet_selector_widget')
    });
    this._init();
}
Provi.Jmol.Controls.JmolAnimationWidget.prototype = Utils.extend(Widget, /** @lends Provi.Jmol.Controls.JmolAnimationWidget.prototype */ {
    default_params: {
        heading: 'Animation'
    },
    _init: function(){
        var self = this;
        
        this._init_anim_callback();
        $( this.applet_selector ).bind('change_selected', function(event, applet){
            _.each( Provi.Jmol.get_applet_list(), function(applet, i){
                $(applet).unbind('.'+self.id);
            });
            self._init_anim_callback();
        });
    
        this.elm('first').button({
            text: false,
            icons: { primary: 'ui-icon-seek-start' }
        }).click(function(){
            var s = 'frame REWIND;';
            self.update_animation(s);
        });
        
        this.elm('previous').button({
            text: false,
            icons: { primary: 'ui-icon-seek-prev' }
        }).click(function(){
            var s = 'frame PREVIOUS;';
            self.update_animation(s);
        });
        
        this.play_next = true;
        this.elm('play').button({
            text: false,
            icons: { primary: 'ui-icon-play' }
        }).click(function() {
            var options;
            var s = '';
            if (self.play_next) {
                self.play_next = false;
                self.elm('play').button({
                    text: false,
                    icons: { primary: 'ui-icon-pause' }
                });
                s = 'frame PLAY;';
            } else {
                self.play_next = true;
                self.elm('play').button({
                    text: false,
                    icons: { primary: 'ui-icon-play' }
                });
                s = 'frame PAUSE;';
            }
            self.update_animation(s);
        });
        
        this.elm('stop').button({
            text: false,
            icons: { primary: 'ui-icon-stop' }
        }).click(function() {
            $('#' + self.play_id).button('option', {
                label: 'play',
                icons: { primary: 'ui-icon-play' }
            });
            var s = 'frame PAUSE; frame REWIND;';
            self.update_animation(s);
        });
        
        this.elm('next').button({
            text: false,
            icons: { primary: 'ui-icon-seek-next' }
        }).click(function(){
            var s = 'frame NEXT;';
            self.update_animation(s);
        });
        
        this.elm('last').button({
            text: false,
            icons: { primary: 'ui-icon-seek-end' }
        }).click(function(){
            var s = 'frame LAST;';
            self.update_animation(s);
        });
        
        this.elm('mode').buttonset().change(function(){
            self.set_animation_mode();
        });

        this.elm('slider').slider({
            value: 30, min: 0, max: 50
        }).bind( 'slide slidestop', function(event, ui){
            console.log('UI.VALUE', ui.value, ui, event);
            var s = 'frame ' + ui.value + ';';
            self.update_animation(s);
        });

        Provi.Widget.Widget.prototype.init.call(this);
    },
    _init_model_info: function(){
        var applet = this.applet_selector.get_value(true);
        if(!applet) return;

        var script = '' +
            'var modelInfo = getProperty("modelInfo");' +
            'var count = modelInfo["modelCount"];' +
            'var models = modelInfo["models"];' +
            'var file_model_array = [];' +
            'for (var i = 0; i < count; i++){' +
                'var m = models[i];' +
                'file_model_array += m["file_model"];' +
            '}' +
            'file_model_array.sort();' +
            'print file_model_array;' +
        '';

        var data = applet.script_wait_output( script, { maintain_selection: true } );
        console.log( data );
        if( data && data!==-1 ){
            data = data.split('\n').slice(0,-1);

            this.frame_list = [];
            this.file_model_dict = {};
            _.each( data, function(d, i){
                
            });
        }
    },
    _init_anim_callback: function(){
        var applet = this.applet_selector.get_value(true);
        if(applet){
            var self = this;
            //this._init_model_info();
            var model_info = applet.get_property_as_array('modelInfo');
            console.log('MODEL_INFO', model_info);
            this.elm('slider').slider({ max: model_info.modelCount-1 });
            $(applet).bind('load_struct.'+this.id, function( event, fullPathName, fileName, modelName, ptLoad, previousCurrentModelNumberDotted, lastLoadedModelNumberDotted ){
                //self._init_model_info();
                var model_info = applet.get_property_as_array('modelInfo');
                console.log('MODEL_INFO', model_info);
                self.elm('slider').slider({ max: model_info.modelCount-1 });
            });
            $(applet).bind('anim_frame.'+this.id, function( event, frameNo, fileNo, modelNo, firstNo, lastNo, isAnimationRunning, animationDirection, currentDirection ){
                self.elm('current_frame').html( frameNo + ' ' + modelNo + '' );
                self.elm('slider').slider({ value: frameNo });
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
            var mode = this.elm('mode')
                .children("input[name=" + this.mode_id + "]:radio:checked").val();
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
