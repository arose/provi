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
    this.dataset = params.dataset;
    this.applet = params.applet;
    
    console.log(params);
    console.log('sigma',parseFloat(params.sigma));
    console.log('resolution',parseFloat(params.resolution));
    console.log('cutoff',parseFloat(params.cutoff))
    this.sigma = parseFloat(params.sigma) || 1.0;
    this.resolution = parseFloat(params.resolution) || 6.0;
    this.cutoff = parseFloat(params.cutoff) || 0.0;
    
    Widget.call( this, params );
    this._build_element_ids([ 'show', 'color', 'display_within' ]);
    
    this.isosurface_name = 'isosurface_' + this.id;
    this.display_within = 5.0;
    
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
            '<label for="' + this.display_within_id + '">display within</label>' +
            '<select id="' + this.display_within_id + '" class="ui-state-default">' +
                '<option value="5.0">5.0</option>' +
                '<option value="7.0">7.0</option>' +
                '<option value="10.0">10.0</option>' +
                '<option value="15.0">15.0</option>' +
            '</select>&nbsp;&#8491;' +
        '</div>' +
    '</div>';
    $(this.dom).append( content );
    this._init();
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
            self.applet.script('color $' + id + ' [x' + $('#' + self.color_id).val().substring(1) + '] translucent;');
        });
        
        // init display within
        $("#" + this.display_within_id).bind('click', function() {
            self.display_within = $("#" + self.display_within_id + " option:selected").val();
            self.show_isosurface();
        });
        
	this.load_isosurface();
	//Widget.prototype.init.call(this);
    },
    set_show: function(){
        var s = $("#" + this.show_id).is(':checked') ? 'display' : 'hide';
        this.applet.script( s + ' $' + this.isosurface_name + ';' );
    },
    show_isosurface: function(){
        this.set_show();
        var s = 'isosurface id "' + this.isosurface_name + '" display within ' + parseFloat(this.display_within) + ' ({' + this.sele + '}); ' +
            'center {' + this.sele + '}; slab on; set slabRange 10.0;';
        //this.applet.script(s);
    },
    load_isosurface: function(){
        var self = this;
	console.log(this.dataset);
        var id = 'isosurface_' + this.id;
        this.applet.script(
	    //'select all; wireframe -0.1; ' +
            'isosurface id "' + this.isosurface_name + '" ' +
	    'color black cutoff ' + this.cutoff + ' resolution ' + this.resolution + ' sigma ' + this.sigma + ' ' +
	    '"../../data/get/?id=' + this.dataset.server_id + '&dataname=data.vert" translucent;' + //mesh nofill; ' +
            //'hide $' + this.isosurface_name + ';'
	    '', true);
        //$(this.applet).bind('pick', function(event, info, applet_id){
        //    var parsedInfo = /\[\w.+\](\d+):([\w\d]+)\.(\w+) .*/.exec(info);
        //    var chain = parsedInfo[2];
        //    var res = parsedInfo[1];
        //    var atom = parsedInfo[3];
        //    self.sele = 'resNo=' + res + (chain ? ' and chain=' + chain : '') + ' and atomName="' + atom + '"';
        //    self.show_isosurface();
        //})
        //this.sele = 'atomIndex=1';
        this.show_isosurface();
    }
});


/**
 * A widget to get load params
 * @constructor
 * @extends Provi.Widget.Widget
 */
Provi.Bio.Isosurface.LoadParamsWidget = function(params){
    Widget.call( this, params );
    this._build_element_ids([ 'sigma', 'cutoff', 'resolution' ]);
    var content = '<div>' +
	'<div class="control_row">' +
	    '<label for="' + this.sigma_id + '">Sigma:</label>' +
	    '<input id="' + this.sigma_id + '" type="text" size="4" value="1.0"/>' +
	'</div>' +
	'<div class="control_row">' +
	    '<label for="' + this.cutoff_id + '">Cutoff:</label>' +
	    '<input id="' + this.cutoff_id + '" type="text" size="4" value="0.0"/>' +
	'</div>' +
	'<div class="control_row">' +
	    '<label for="' + this.resolution_id + '">Resolution:</label>' +
	    '<input id="' + this.resolution_id + '" type="text" size="4" value="6.0"/>' +
	'</div>' +
    '</div>';
    $(this.dom).append( content );
}
Provi.Bio.Isosurface.LoadParamsWidget.prototype = Utils.extend(Widget, /** @lends Provi.Bio.Isosurface.LoadParamsWidget.prototype */ {
    get_sigma: function(){
        return parseFloat( $("#" + this.sigma_id).val() );
    },
    get_cutoff: function(){
        return parseFloat( $("#" + this.cutoff_id).val() );
    },
    get_resolution: function(){
        return parseFloat( $("#" + this.resolution_id).val() );
    }
});



})();