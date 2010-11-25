/**
 * @fileOverview This file contains the {@link Provi.Jmol.Modeling} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * @namespace
 * Jmol modeling module
 */
Provi.Jmol.Modeling = {};


(function() {

/** @exports Utils as Provi.Utils */
var Utils = Provi.Utils;

/** @exports Widget as Provi.Widget.Widget */
var Widget = Provi.Widget.Widget;



/**
 * A widget holding jmol modeling related controls
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Jmol.Modeling.JmolModelingWidget = function(params){
    this.picking_select = 'ATOM';
    this.drag_selected = false;
    this.selection_halos = false;
    Widget.call( this, params );
    this.selection_halos_id = this.id + '_selection_halos';
    this.picking_select_id = this.id + '_picking_select';
    this.drag_selected_id = this.id + '_drag_selected';
    this.rotate_selected_id = this.id + '_rotate_selected';
    this.rotate_range_begin_id = this.id + '_rotate_range_begin';
    this.rotate_range_end_id = this.id + '_rotate_range_end';
    this.rotate_range_id = this.id + '_rotate_range';
    this.applet_selector_widget_id = this.id + '_applet';
    var content = '<div class="control_group">' +
        '<div class="control_row" id="' + this.applet_selector_widget_id + '"></div>' +
	'<div class="control_row">' +
            '<input id="' + this.selection_halos_id + '" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
            '<label for="' + this.selection_halos_id + '" style="display:inline-block;">selection halos</label>' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="' + this.picking_select_id + '">picking select</label>' +
            '<select id="' + this.picking_select_id + '" class="ui-state-default">' +
                '<option value="ATOM" selected="selected">atom</option>' +
                '<option value="CHAIN">chain</option>' +
                '<option value="GROUP">group/residue</option>' +
                '<option value="MOLECULE">molecule</option>' +
		'<option value="DRAW" title="foobar">draw objects</option>' +
            '</select>' +
        '</div>' +
        '<div class="control_row">' +
            '<input id="' + this.drag_selected_id + '" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
            '<label for="' + this.drag_selected_id + '" style="display:inline-block;" title="move selected atoms by pressing ALT-SHIFT-LEFT and dragging">drag selected</label>' +
        '</div>' +
	'<div class="control_row">' +
            '<input id="' + this.rotate_selected_id + '" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
            '<label for="' + this.rotate_selected_id + '" style="display:inline-block;" title="rotate selected molecule by pressing ALT-LEFT and dragging">rotate selected molecule</label>' +
        '</div>' +
	'<div class="control_row">' +
            '<input size="4" id="' + this.rotate_range_begin_id + '" type="text" class="ui-state-default"/>' +
            '<label for="' + this.rotate_range_begin_id + '" >begin</label> ' +
	    '<input size="4" id="' + this.rotate_range_end_id + '" type="text" class="ui-state-default"/>' +
            '<label for="' + this.rotate_range_end_id + '" >end</label> ' +
	    '<button id="' + this.rotate_range_id + '">rotate</button>' +
        '</div>' +
    '</div>';
    $(this.dom).append( content );
    this.applet_selector = new Provi.Jmol.JmolAppletSelectorWidget({
        parent_id: this.applet_selector_widget_id
    });
    this._init();
}
Provi.Jmol.Modeling.JmolModelingWidget.prototype = Utils.extend(Widget, /** @lends Provi.Jmol.Modeling.JmolModelingWidget.prototype */ {
    _init: function(){
        var self = this;
	
	// init selection halos
        this.selection_halos = $("#" + this.selection_halos_id).is(':checked');
        $('#' + this.selection_halos_id).click(function(){
            var applet = self.applet_selector.get_value();
            if(applet){
		self.selection_halos = $("#" + self.selection_halos_id).is(':checked');
		if(self.selection_halos){
		    applet.script('selectionHalos ON');
		}else{
		    applet.script('selectionHalos OFF');
		}
            }
        });
	
        // init drag selected
        this.drag_selected = $("#" + this.drag_selected_id).is(':checked');
        $('#' + this.drag_selected_id).click(function(){
            var applet = self.applet_selector.get_value();
            if(applet){
		self.drag_selected = $("#" + self.drag_selected_id).is(':checked');
		if(self.drag_selected){
		    applet.script('set dragSelected ON');
		}else{
		    applet.script('set dragSelected OFF');
		}
            }
        });
	
	// init rotate selected (molecule)
        this.rotate_selected = $("#" + this.rotate_selected_id).is(':checked');
        $('#' + this.rotate_selected_id).click(function(){
            var applet = self.applet_selector.get_value();
            if(applet){
		self.rotate_selected = $("#" + self.rotate_selected_id).is(':checked');
		if(self.rotate_selected){
		    applet.script('set allowRotateSelected ON');
		}else{
		    applet.script('set allowRotateSelected OFF');
		}
            }
        });
        
        // init picking select
	$("#" + this.picking_select_id).children().tipsy({trigger: 'hover', gravity: 'w'});
        $("#" + this.picking_select_id).bind('click', function() {
            var applet = self.applet_selector.get_value();
            if(applet){
		self.picking_select = $("#" + self.picking_select_id).val();
		switch( self.picking_select ){
		    case 'ATOM':
			applet.script('set picking SELECT ATOM;');
			break;
		    case 'CHAIN':
			applet.script('set picking SELECT CHAIN;');
			break;
		    case 'GROUP':
			applet.script('set picking SELECT GROUP;');
			break;
		    case 'MOLECULE':
			applet.script('set picking SELECT MOLECULE;');
			break;
		    case 'DRAW':
			applet.script('set picking DRAW;');
			break;
		    default:
			applet.script('set picking SELECT ATOM;');
			break;
		}
            }
        });
	
	$("#" + this.rotate_range_id).button().click(function() {
            self.rotate_range();
        });
	
	$("#" + this.rotate_range_begin_id).change(function() {
	    console.log($(this).val());
	    self.rotate_range_begin = $(this).val();
            self.update_rotate_range();
        });
	
	$("#" + this.rotate_range_end_id).change(function() {
	    console.log($(this).val());
	    self.rotate_range_end = $(this).val();
            self.update_rotate_range();
        });
	
	// rotate {protein} 30 MOLECULAR
	// rotateSelected {atomno=1604} {atomno=1882} 30 MOLECULAR
	
	
	
	Widget.prototype.init.call(this);
    },
    rotate_range: function(){
	var applet = this.applet_selector.get_value();
        if(applet){
	    applet.script('select {atomno>=' + this.rotate_range_begin + ' and atomno<=' + this.rotate_range_end + '};rotateSelected {atomno=' + this.rotate_range_begin + '} {atomno=' + this.rotate_range_end + '} 5 MOLECULAR;');
	}
    },
    update_rotate_range: function(){
	var applet = this.applet_selector.get_value();
        if(applet && this.rotate_range_begin && this.rotate_range_end){
	    console.log( this.rotate_range_begin, this.rotate_range_end );
	    applet.script('draw rotate_range_' + this.id + ' ARROW {atomno=' + this.rotate_range_begin + '} {atomno=' + this.rotate_range_end + '};');
	}
    }
    
    // set picking DRAW # SHIFT shifts or ALT drags corner
    // set picking DRAGATOM
    // set MessageCallback "function name"
    // show DRAW
});



})();