/**
 * @fileOverview This file contains the {@link Provi.Bio.TransmembraneHelices} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * @namespace
 * Transmembrane helices module
 */
Provi.Bio.TransmembraneHelices = {};


(function() {

/** @exports Utils as Provi.Utils */
var Utils = Provi.Utils;

/** @exports Widget as Provi.Widget.Widget */
var Widget = Provi.Widget.Widget;


/**
 * @class Represents transmembrane helices
 */
Provi.Bio.TransmembraneHelices.TmHelices = function(tmh_list){
    this.tmh_list = tmh_list;
    this.init();
};
Provi.Bio.TransmembraneHelices.TmHelices.prototype = Provi.Utils.extend(Provi.Bio.Smcra.AbstractResiduePropertyMap, /** @lends Provi.Bio.TransmembraneHelices.TmHelices.prototype */ {
    key_length: 2,
    init: function(){
	var self = this;
	this.property_dict = {};
	this.property_list = [];
	this._keys = [];
	$.each( this.tmh_list, function(i, tmh){
	    var property = {
		beg: { resno: tmh[0][1], chain: tmh[0][0] },
		end: { resno: tmh[1][1], chain: tmh[1][0] },
		len: tmh[1][1] - tmh[0][1],
		sele: '(chain = "' + tmh[0][0] + '" and (resNo >= ' + tmh[0][1] + ' and resNo <= ' + tmh[1][1] + '))'
	    }
	    var key = [ tmh[0][0], [ tmh[0][1], tmh[1][1] ] ];
	    self._keys.push( key );
	    self.property_dict[ key ] = property;
	    self.property_list.push( property );
	});
    },
    _get: function(id){
	//console.log('ID', id );
	return this.property_dict[ id ];
    }
});


/**
 * A widget to view transmembrane helix definitions
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Bio.TransmembraneHelices.TmHelicesWidget = function(params){
    params = $.extend(
        Provi.Bio.TransmembraneHelices.TmHelicesWidget.prototype.default_params,
        params
    );
    this.applet = params.applet;
    this.dataset = params.dataset;
    Widget.call( this, params );
    this.canvas_id = this.id + '_canvas';
    this.jstree_id = this.id + '_jstree';

    var content = '<div class="control_group">' +
	'<div class="control_row">' +
            '<div id="' + this.jstree_id + '"></div>' +
        '</div>' +
	'<div class="control_row">' +
            '<div id="' + this.canvas_id + '" style="width:300px; overflow:auto;"></div>' +
        '</div>' +
    '</div>';
    $(this.dom).append( content );
    this._init();
}
Provi.Bio.TransmembraneHelices.TmHelicesWidget.prototype = Utils.extend(Widget, /** @lends Provi.Bio.TransmembraneHelices.TmHelicesWidget.prototype */ {
    _init: function(){
        var self = this;
	$(this.applet.selection_manager).bind('select', $.proxy(this.select, this));
        this.tree_view();
	Widget.prototype.init.call(this);
    },
    tree_view: function(){
        var self = this;
        
        var raw_data = this.get_data();
        //console.log(raw_data);
        if( !raw_data ) return;
	
	var jstree_data = [];
	var jstree_data_by_chain = {};
        $.each( raw_data, function(){
	    var tmh = this;
	    var tmh_node = {
		data: tmh[0][1] + ' - ' + tmh[1][1] + '\t(' + (tmh[1][1] - tmh[0][1]) + ' Residues)',
		metadata: {
		    type: 'tmh',
		    tmh_id: [ tmh[0][0], [ tmh[0][1], tmh[1][1] ] ]
		}
	    };
	    var chain = tmh[0][0];
	    if( !jstree_data_by_chain[chain] ){
		jstree_data_by_chain[chain] = {
		    data : "Chain " + chain,
		    children : [],
		    metadata: {
			type: 'chain',
			tmh_id: [ tmh[0][0] ]
		    }
		}
	    }
	    jstree_data_by_chain[chain]['children'].push( tmh_node );
        });
        $.each( jstree_data_by_chain, function(){
	    jstree_data.push( this );
	});
        
	
	
	console.log( jstree_data );
	this.jstree = $( '#' + this.jstree_id ).jstree({
	    json_data: {
		data: {
                    data : "Protein",
		    metadata: {
			type: 'protein'
		    },
                    children : jstree_data
                },
		progressive_render: true
	    },
	    core: {
		html_titles: true
	    },
	    themes: {
		icons: false
	    },
	    checkbox_grid: {
		columns: 1
	    },
	    plugins: [ "json_data", "themes", "checkbox_grid" ]
	});
	this.jstree = $.jstree._reference( '#' + this.jstree_id );
	
	$( '#' + this.jstree_id ).bind("check_node.jstree uncheck_node.jstree", function(event, data){
	    self.__tree_trigger_selection_update(event, data);
	});
    },
    __tree_trigger_selection_update: function(event, data){
	var self = this;
	var selected = data.inst.get_checked( -1, data.args[1] );
	var selection_list = [];
	selected.each( function(i, elm){
	    var $elm = $(elm)
	    console.log( $elm.data() );
	    if( $elm.data('type')=='tmh' ){
		selection_list.push( self.dataset.data.get( $elm.data('tmh_id') ).sele );
	    }else if( $elm.data('type')=='chain' ){
		$.each( self.dataset.data.get( $elm.data('tmh_id') ), function(i, tmh){
		    selection_list.push( tmh.sele );
		});
	    }else if( $elm.data('type')=='protein' ){
		$.each( self.dataset.data.get_dict(), function(i, tmh){
		    selection_list.push( tmh.sele );
		});
	    }
	});
	var sele = selection_list.length ? selection_list.join(' OR ') : 'none';
	this._not_listen_select = true;
	this.applet.selection_manager.select( sele );
	this._not_listen_select = false;
    },
    get_data: function(){
        return this.dataset.data.tmh_list;
    },
    select: function( selection, applet ){
	console.log('#' + this.jstree_id, this._not_listen_select);
	if( this._not_listen_select || !this.jstree ) return;
	this.jstree.uncheck_all( 1 );
    }
});



})();