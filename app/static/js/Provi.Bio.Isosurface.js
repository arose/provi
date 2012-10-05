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
    params = _.defaults(
        params,
        Provi.Bio.Isosurface.IsosurfaceWidget.prototype.default_params
    );
    this.isosurface_type = params.isosurface_type;
    console.log(params, Provi.Bio.Isosurface.IsosurfaceWidget.prototype.default_params);
    this.dataset = params.dataset;
    this.applet = params.applet;
    this.resolution = parseFloat(params.resolution);
    this.display_within = params.display_within;
    this.color = params.color;
    this.style = params.style;
    this.sele = params.sele;

    this.no_create = params.no_create;
    this.no_init = params.no_init;
    
    // this.init_load_params( params );
    
    Widget.call( this, params );
    this._build_element_ids([ 
        'show', 'color', 'focus', 'display_within', 'translucent', 
        'colorscheme', 'color_range', 'color_sele_widget',
        'style', 'delete', 'load_params', 'frontonly', 'map'
    ]);
    
    this.isosurface_name = params.isosurface_name || 'isosurface_' + this.id;
    this.translucent = params.translucent;
    this.focus = params.focus;
    this.colorscheme = params.colorscheme;
    this.color_range = params.color_range;
    this.frontonly = params.frontonly;
    
    var content = '<div class="control_group">' +
        '<div class="control_row">' +
            '<input id="' + this.show_id + '" type="checkbox" checked="checked" style="float:left; margin-top: 0.5em;"/>' +
            '<label for="' + this.show_id + '" style="display:block;">show isosurface</label>' +
        '</div>' +
        '<div class="control_row">' +
            '<input id="' + this.frontonly_id + '" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
            '<label for="' + this.frontonly_id + '" style="display:block;">front only</label>' +
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
                '<option value="-200 200">[-200,200]</option>' +
                '<option value="-250 250">[-250,250]</option>' +
                '<option value="0 10">[0,10]</option>' +
                '<option value="0 20">[0,20]</option>' +
                '<option value="0 50">[0,50]</option>' +
                '<option value="0 100">[0,100]</option>' +
                '<option value="20 100">[20,100]</option>' +
            '</select>' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="' + this.color_sele_widget_id + '">color selection</label>' +
            '<span id="' + this.color_sele_widget_id + '"></span>' +
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
                '<option value="CPK">CPK</option>' +
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
        // '<div style="padding-left:0px;">' +
        //     '<button id="' + this.load_params_id + '">load params</button>' +
        // "</div>" +
        '<div class="control_row">' +
            '<button id="' + this.delete_id + '">delete</button>' +
        '</div>' +
    '</div>';
    $(this.dom).append( content );
    this.color_selection_selector = new Provi.Selection.SelectorWidget({
        parent_id: this.color_sele_widget_id,
        applet: params.applet,
        tag_name: 'span'
    });
    if( !this.no_init ){
        this._init();
    }
}
Provi.Bio.Isosurface.IsosurfaceWidget.prototype = Utils.extend(Widget, /** @lends Provi.Bio.Isosurface.IsosurfaceWidget.prototype */ {
    default_params: {
        heading: 'Isosurface',
        isosurface_type: 'Isosurface',
        resolution: 1.0,
        display_within: 10.0,
        color: '',
        style: '',
        sele: 'atomno=1',
        translucent: 0.0,
        focus: false,
        colorscheme: "rwb",
        color_range: "-20 20",
        frontonly: false,
        no_init: false,
        no_create: false
    },
    _init: function(){
        var self = this;
    
        // init crystal mode
        $('#' + this.show_id).click(function(){
            self.set_show();
        });

        $('#' + this.frontonly_id).click(function(){
            self.frontonly = $("#" + self.frontonly_id).is(':checked');
            var frontonly = self.frontonly ? 'FRONTONLY' : 'NOTFRONTONLY';
            self.applet.script_wait(
                'isosurface ID "' + self.isosurface_name + '" ' + frontonly + ';' +
                '', true
            );
        });
        
        // init color picker
        $('#' + this.color_id).colorPicker();
        $('#' + this.color_id).change(function(e, ignore){
            if(ignore) return;
            var sele = self.color_selection_selector.get().selection;
            self.translucent = $("#" + self.translucent_id + " option:selected").val();
            self.applet.script_wait(
                'color $' + self.isosurface_name + ' ' +
                    '[x' + $('#' + self.color_id).val().substring(1) + '] ' +
                    ' translucent ' + self.translucent + ';' +
                '', true
            );
            if(sele){
                self.applet.script_wait(
                    'isosurface ID "' + self.isosurface_name + '"; ' +
                    'color ISOSURFACE {' + sele + '} orange;' +
                    '', true
                );
            }
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

        // init map
        $("#" + this.map_id).bind('change', function() {
            self.map = $("#" + self.map_id + " option:selected").val();
            $("#" + self.map_id).val('');
            
            if(self.map=='CPK'){
                var s = 'isosurface ID "' + self.isosurface_name + '";';
                var cpk = {
                    carbon: 'grey',
                    oxygen: 'red',
                    nitrogen: 'blue',
                    sulfur: 'yellow',
                    phosphorus: 'orange',
                    hydrogen: 'white'
                };
                var sele = this.select ? ' and (' + this.select + ')' : '';
                _.each(cpk, function(color, element){
                    s += 'color ISOSURFACE {' + element + ' ' + sele + '} ' + color + ';';
                });
                self.applet.script_wait(s, true);
            }else if(self.map){
                self.applet.script_wait(
                    'select *; ' +
                    'isosurface ID "' + self.isosurface_name + '" MAP ' + self.map + ';' +
                    '', true
                );
            }
        });
    
        // init style
        $('#' + this.style_id).change(function(){
        self.style = $("#" + self.style_id + " option:selected").val();
            self.applet.script('isosurface ID ' + self.isosurface_name + ' ' + self.style + ';');
        });
    
        // init delete
        $('#' + this.delete_id).button().click( $.proxy( function(){
            this.delete_isosurface();
            this.del();
        }, this ) );
        
        // // init popup widget
        // this._popup = new Provi.Widget.PopupWidget({
        //     parent_id: self.parent_id,
        //     position_my: 'left top',
        //     position_at: 'left bottom',
        //     template: '<div>{{html content}}</div>'
        // });
        
        // // init load params button
        // $('#' + this.load_params_id).button({
        //     text: false,
        //     icons: {
        //         primary: 'ui-icon-script'
        //     }
        // }).click(function(){
        //     self._popup.hide();
        //     //$(this).attr("disabled", true).addClass('ui-state-disabled');
        //     //var ds = self.import_dataset( id, self.directory_name, name, undefined, true );
        //     var dsw = new Provi.Data.DatasetWidget({
        //         parent_id: self._popup.data_id,
        //         dataset: self.dataset,
        //         load_params_values: self.load_params
        //     });
        //     $(dsw).bind('loaded', function(){
        //         self._popup.hide();
        //     });
        //     self._popup.show( $("#" + self.load_params_id) );
        // });
        
        if(!this.no_create){
            this.init_isosurface();
        }
        
        if( false ){
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
        
        this.sync_params();

        Provi.Widget.Widget.prototype.init.call(this);
    },
    sync_params: function(){
        var self = this;
        var shape_info = this.applet.get_property_as_array('shapeInfo');
        console.log('SHAPE_INFO', shape_info)
        _.each(shape_info['Isosurface'], function(isosurf, i){
            if( isosurf['ID']!=self.isosurface_name ) return;
            console.log( isosurf['jvxlInfo'].match(/translucency=''([^']+)''/) );

            // $("#" + self.translucent_id).val(
            //     isosurf['jvxlInfo'].match(/translucency=''([^']+)''/)[1]
            // );

            $('#' + self.color_id).val('rgb(' + isosurf.color.join(',') + ')');
            $('#' + self.color_id).triggerHandler('change', true);
        });
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
    init_load_params: function( params ){
        this.within = params.within || '';
        this.insideout = params.insideout || '';
        this.load_params = {
            within: this.within,
            insideout: this.insideout,
            reload_widget: this
        };
    },
    init_isosurface: function(){
        var file_url = '../../data/get/?id=' + this.dataset.server_id + '&session_id=' + $.cookie('provisessions');
        if( this.dataset.type=='vert' ){
            file_url += '&dataname=data.vert';
        }
        this.applet.script(
            'isosurface ID "' + this.isosurface_name + '" ' +
            ( this.color ? 'COLOR ' + this.color + ' ' : '' ) + 
            ( this.within ? 'WITHIN ' + this.within + ' ' : '' ) +
            ( this.insideout ? 'INSIDEOUT ' : '' ) + 
            ( this.frontonly ? 'FRONTONLY ' : '' ) + 
            '"' + file_url + '" ' +
            ( this.style ? this.style : '' ) + 
            ';'
        , true);
    },
    delete_isosurface: function(){
        this.applet.script(
            'isosurface id ' + this.isosurface_name + ' delete;' +
        '', true);
    },
    reload: function(params){
        this.init_load_params( params );
        this.init_isosurface();
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
    params.heading = 'Volume';
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
    this.sign = params.sign;
    params.no_init = true;
    Provi.Bio.Isosurface.IsosurfaceWidget.call( this, params );
    //this._build_element_ids([  ]);

    var content = '<div class="control_group">' +
        '' +
    '</div>';
    
    if( this.dataset && $.inArray( this.dataset.type, ['cube', 'ccp4', 'mrc', 'map']) >= 0 ){
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
        '"../../data/get/?id=' + this.dataset.server_id + '&session_id=' + $.cookie('provisessions') + '" ' +
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
        (this.sign ? 'SIGN blue red ' : '') +
        (this.sigma ? 'sigma ' + this.sigma + ' ' : '') +
        (this.resolution ? 'resolution ' + this.resolution + ' ' : '') +
        (this.select ? 'select {' + this.select + '} ' : '') +
        (this.ignore ? 'ignore {' + this.ignore + '} ' : '') +
        //'colorscheme "rwb" color absolute -20 20 ' +
        (this.type ? this.type + ' ' : '') +
        (this.type ? 'MAP ' : '') +
        ( (!this.type && this.insideout) ? 'INSIDEOUT ' : '' ) + 
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
    params.heading = 'Surface';
    //params.collapsed = false;
    this.within = params.within;
    this.type = params.type;
    this.resolution = params.resolution;
    this.select = params.select || '*';
    this.ignore = params.ignore;
    this.slab = params.slab;
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
        var self = this;
        $(this.applet).bind('message', function(e, msg1, msg2, msg3){
            //if( msg1.slice(0, self.isosurface_name.length) == self.isosurface_name ){
            if( msg1.startsWith( self.isosurface_name ) ){
                console.log(msg1, msg2, msg3);
                var area = eval( self.applet.script_wait_output('isosurface area;') );
                var volume = eval( self.applet.script_wait_output('isosurface volume;') );
                area = _.isArray(area) ? area[0] : area;
                volume = _.isArray(volume) ? volume[0] : volume;
                console.log(area, volume);
                self.elm('content').prepend('' +
                    '<div class="control_row">' +
                        '<div>' + area + ' &#8491;<sup>2</sup></div>' +
                        '<div>' + volume + ' &#8491;<sup>3</sup></div>' +
                    '</div>' +
                '');
            }
        });
        Provi.Bio.Isosurface.IsosurfaceWidget.prototype._init.call(this);
    },
    init_isosurface: function(){
        this.applet.script(
            'isosurface id "' + this.isosurface_name + '" ' +
            (this.resolution ? 'resolution ' + this.resolution + ' ' : '') +
            (this.select ? 'select {' + this.select + '} ' : '') +
            (this.ignore ? 'ignore {' + this.ignore + '} ' : '') +
            (this.slab ? 'SLAB ' + this.slab + ' ' : '') +
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
    this.load_params_values = params.load_params_values || {};
    console.log( this.load_params_values );
    Widget.call( this, params );
    this._build_element_ids([ 'within', 'insideout' ]);
    var content = '<div>' +
    '<div class="control_row">' +
        '<label for="' + this.within_id + '">Within:</label>' +
        '<input id="' + this.within_id + '" type="text" size="10" value=""/>' +
    '</div>' +
    '<div class="control_row">' +
        '<input id="' + this.insideout_id + '" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
            '<label for="' + this.insideout_id + '" style="display:block;">insideout (lighting)</label>' +
    '</div>';
    $(this.dom).append( content );
    
    if( this.dataset && $.inArray( this.dataset.type, ['ccp4', 'mrc', 'map']) >= 0 ){
    $("#" + this.within_id).val('2 {protein}');
    }
    
    if( this.load_params_values.hasOwnProperty('within') ){
    $("#" + this.within_id).val( this.load_params_values.within );
    }
    if( this.load_params_values.hasOwnProperty('insideout') ){
    $("#" + this.insideout_id).attr('checked', this.load_params_values.insideout);
    }
    if( this.load_params_values.hasOwnProperty('reload_widget') ){
    this.reload_widget = this.load_params_values.reload_widget;
    }
}
Provi.Bio.Isosurface.LoadParamsWidget.prototype = Utils.extend(Widget, /** @lends Provi.Bio.Isosurface.LoadParamsWidget.prototype */ {
    get_within: function(){
        return $("#" + this.within_id).val();
    },
    get_insideout: function(){
        return $("#" + this.insideout_id).is(':checked');
    },
    get_reload_widget: function(){
        return this.reload_widget;
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
    this._build_element_ids([ 'sigma', 'cutoff', 'downsample', 'color_density', 'sign' ]);
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
    '<div class="control_row">' +
            '<input id="' + this.sign_id + '" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
            '<label for="' + this.sign_id + '" style="display:inline-block;">Sign</label>' +
        '</div>' +
    '</div>';
    $(this.dom).append( content );
    
    if( this.dataset && $.inArray( this.dataset.type, ['cube', 'ccp4', 'mrc', 'map']) == -1 ){
    $('#' + this.sigma_id).parent().hide();
    }else{
    $('#' + this.sigma_id).val('1');
    $('#' + this.downsample_id).parent().hide();
    $('#' + this.cutoff_id).parent().hide();
    $('#' + this.sign_id).parent().hide();
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
    },
    get_sign: function(){
        return $("#" + this.sign_id).is(':checked');
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
    this._build_element_ids([ 'select', 'ignore', 'negate_ignore', 'resolution', 'type', 'map', 'slab', 'opposite_slab', 'select_selector', 'ignore_selector', 'negate_select_as_ignore' ]);
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
    '<div class="control_row">' +
            '<label for="' + this.slab_id + '">Slab:</label>' +
            '<select id="' + this.slab_id + '" class="ui-state-default">' +
        '<option value=""></option>' +
            '</select>' +
        '<div class="control_row">' +
        '<input id="' + this.opposite_slab_id + '" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
            '<label for="' + this.opposite_slab_id + '" style="display:block;">opposite facing plane</label>' +
    '</div>' +
        '</div>' +
    '</div>';
    $(this.dom).append( content );
    
    this.select_selector = new Provi.Selection.SelectorWidget({
        parent_id: this.select_selector_id,
        applet: params.applet,
        tag_name: 'span'
    });
    this.ignore_selector = new Provi.Selection.SelectorWidget({
        parent_id: this.ignore_selector_id,
        applet: params.applet,
        tag_name: 'span'
    });
    
    if( this.dataset && this.dataset.type != 'dx' ){
        $('#' + this.type_id).parent().hide();
    }
    if( this.dataset ){
        $('#' + this.map_id).parent().hide();
    }
    if( this.dataset && $.inArray( this.dataset.type, ['cube', 'ccp4', 'mrc', 'map']) >= 0 ){
        $('#' + this.select_selector_id).parent().hide();
        $('#' + this.ignore_selector_id).parent().hide();
        $('#' + this.resolution_id).parent().hide();
    }
    
    var self = this;
    $(Provi.Data.DatasetManager).bind('change', function(){ self._init_plane_selector() });
    this._init_plane_selector();
}
Provi.Bio.Isosurface.SurfaceParamsWidget.prototype = Utils.extend(Widget, /** @lends Provi.Bio.Isosurface.SurfaceParamsWidget.prototype */ {
    _init_plane_selector: function(){
        var self = this;
        var elm = $('#' + this.slab_id);
        elm.empty();
        elm.append("<option value=''></option>");
        $.each( Provi.Data.DatasetManager.get_list(), function(i, dataset){
            if( dataset.type == 'mplane' && dataset.data && Utils.in_array(dataset.applet_list, self.applet) ){
                elm.append("<option value='" + this.id + ",0'>" + this.name + ' PLANE 1 (' + this.id + ')' + "</option>");
                elm.append("<option value='" + this.id + ",1'>" + this.name + ' PLANE 2 (' + this.id + ')' + "</option>");
                self.mplane_list = dataset.data.tmh_list;
                return false;
            }else{
                return true;
            }
        });
    },
    get_select: function(){
        return this.select_selector.get().selection;
        //return $("#" + this.select_id).val();
    },
    get_ignore: function(){
        if( $("#" + this.negate_select_as_ignore_id).is(':checked') ){
            var ignore = this.select_selector.get().selection;
            var negate = true;
        }else{
            var ignore = this.ignore_selector.get().selection;
            //var ignore = $("#" + this.ignore_id).val();
            var negate = $("#" + this.negate_ignore_id).is(':checked');
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
    get_slab: function(){
        var plane = $("#" + this.slab_id + " option:selected").val().split(',');
        var ds_id = plane[0];
        var plane_id = plane[1]
        if(ds_id){
            var ds = Provi.Data.DatasetManager.get( ds_id );
            var sign = $("#" + this.opposite_slab_id).is(':checked') ? '- ' : '';
            return sign + ds.data.format_as_jmol_planes()[ plane_id ];
        }else{
            return '';
        }
    },
    set_applet: function( applet ){
        this.applet = applet;
        this.select_selector.set_applet( applet );
        this.ignore_selector.set_applet( applet );
    }
});


})();