/**
 * @fileOverview This file contains the {@link Provi.Widget} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * @namespace
 * Widget base
 */
Provi.Widget = {};

(function() {

var Utils = Provi.Utils;


/**
 * global widget manager object
 * 
 */
Provi.Widget.WidgetManager = {
    _widget_dict: {},
    _widget_list: [],
    get_widget: function(id){
        return this._widget_dict[id];
    },
    get_widget_list: function(){
        return this._widget_list;
    },
    add_widget: function(id, widget){
        if( typeof(this._widget_dict[id]) != 'undefined' ){
            throw "id '" + id + "' is already in use";
        }
        this._widget_dict[id] = widget;
        this._widget_list.push(widget);
    },
    remove_widget: function(id){
        delete this._widget_dict[id];
        this._widget_list.removeItems(id);
    },
    get_widget_id: function(id){
        if( typeof(id) != 'undefined' ){
            if( typeof(this._widget_dict[id]) != 'undefined' ){
                throw "id '" + id + "' is already in use";
            }
        }else{
            id = 'widget_' + this._widget_list.length;
        }
        return id;
    }
};
Provi.Widget.WidgetManager._widget_dict.size = Utils.object_size_fn;


/**
 * Widget class
 * @constructor
 * @param {object} params The configuration object.
 * @param {string} [params.tag_name="div"] The html tag in which the widget gets enclosed.
 * @param {string} [params.heading] A heading for the widget.
 * @param {boolean} [params.collapsed=false] When the widget has a heading, it can be collapsed.
 * @param {string} params.parent_id The html id of the parent object of this widget
 * @param {int} [params.id] An id to identify the widget. Though in general not neccesary as it is created automatically.
 * @param {Provi.Jmol.Applet} [params.applet] A Jmol applet the widget should get bound to.
 * @param {boolean} [params.persist_on_applet_delete=false] When bound to a Jmol applet, the widget gets automatically destroyed when the applet is destroyed. This flag switches that behavior off.
 */
Provi.Widget.Widget = function(params){
    this.initialized = false;
    this.eid_dict = {};
    var tag_name = params.tag_name || 'div';
    var content = typeof(params.content) != 'undefined' ? params.content : '';
    this.sort_key = typeof(params.sort_key) != 'undefined' ? params.sort_key : 1000000;
    params.show_dataset_info = typeof(params.show_dataset_info) != 'undefined' ? params.show_dataset_info : true;
    /** The text of the widget's heading */
    this.heading = params.heading;
    /** Weather the widget is collapsed or not */
    this.collapsed = params.collapsed;
    this.info = params.info;
    this.description = params.description;
    this.applet = params.applet;
    this.persist_on_applet_delete = params.persist_on_applet_delete;
    /** Dom id of the widget itself */
    this.id = Provi.Widget.WidgetManager.get_widget_id(params.id);
    
    this._init_eid_manager( ['info', 'heading', 'description', 'content'] );
    
    /** Id of the parent dom object */
    this.parent_id = params.parent_id;
    Provi.Widget.WidgetManager.add_widget(this.id, this);
    
    if( !this.parent_id || $('#' + this.parent_id).length == 0 ){
	throw "Widget is missing a parent object to add to.";
    }
    
    var template = '' +
	'<div class="ui-widget-header ui-state-active" id="${eids.heading}" ' +
		'style="{{if !params.heading}}display:none;{{/if}}">' +
	    '<span title="show/hide" class="ui-icon ui-icon-triangle-1-s"></span>' +
	    '<span>${params.heading}</span>' +
	    '<span style="float:right; padding:0.1em; {{if !params.info}}display:none;{{/if}}">' +
		'<span title="${params.info}" id="${eids.info}" class="ui-icon ui-icon-info">' +
		    '${params.info}' +
		'</span>' +
	    '</span>' +
	'</div>' +
	'<div class="my-content">' +
	    '<div class="" id="${eids.description}" ' +
		    'style="{{if !params.info}}display:none;{{/if}}">' +
		'${params.description}' +
	    '</div>' +
	    '{{if params.show_dataset_info && params.dataset && params.applet}}' +
		'<div class="" >' +
		    '<span>Dataset: ${params.dataset.name}</span>&nbsp;|&nbsp;' +
		    '<span>Applet: ${params.applet.name_suffix}</span>' +
		'</div>' +
	    '{{/if}}' +
	    '<div class="" id="${eids.content}">${params.content}</div>' +
	'</div>';
    
    var e = document.createElement( tag_name );
    $.tmpl( template, { eids: this.eid_dict, params: params } ).appendTo(e);
    e.id = this.id;
    $('#' + this.parent_id).append( e );
    /** The dom object */
    this.dom = e;
    if( params.hidden ){
	this.hide();
    }
    $(this.dom).addClass( 'ui-container ui-widget' );
    $('#' + this.parent_id).triggerHandler('Provi.widget_added');
    
    // must be called in the subclasses of Widget
    //this.init();
};
Provi.Widget.Widget.prototype = /** @lends Provi.Widget.Widget.prototype */ {
    /** Initialization of the widget */
    init: function(){
	var self = this;
        
	this.elm('info').tipsy({ gravity: 'ne' });
	
	var heading = this.elm( 'heading' );
	heading.hover(function(){
	    $(this).toggleClass('ui-state-hover');
	});
	heading.children('[title]').tipsy({ gravity: 'nw' });
	heading.click(function() {
	    $(this).siblings().toggle();
	    //self.elm( 'content' ).toggle();
	    //self.elm( 'content' ).next().toggle();
	    $(this).children('.ui-icon').toggleClass('ui-icon-triangle-1-e').toggleClass('ui-icon-triangle-1-s');
	    $(this).toggleClass('ui-state-active ui-state-default');
	    return false;
	});
	if( this.heading && this.collapsed ) heading.triggerHandler('click');
	
	if( !this.heading ) this.elm( 'heading' ).hide();
	if( !this.info ) this.elm( 'info' ).hide();
	if( !this.description ) this.elm( 'description' ).hide();
	
	if(this.applet && !this.persist_on_applet_delete){
	    var self = this;
	    $(this.applet).bind('delete', function(){
		$(self.dom).hide();
		$(self.dom).appendTo('#trash');
	    });
	}
	//console.log('WIDGET INIT', this.heading);
	this.initialized = true;
	$(this).triggerHandler('init');
    },
    set_heading: function( heading ){
	this.elm( 'heading' ).text( heading ).show();
    },
    set_description: function( description ){
	this.elm( 'description' ).text( description ).show();
    },
    set_info: function( info ){
	this.elm( 'info' ).text( info ).show();
    },
    set_content: function( content ){
	this.elm( 'content' ).innerHTML( content );
    },
    add_content: function( template, params ){
	var e = this.elm( 'content' );
	$.tmpl( template, { eids: this.eid_dict, params: params } ).appendTo(e);
    },
    /**
    * Helper function to create unique ids for dom elements that belong to the widget.
    * The ids are build for each name in names from the following template: this.id + '_' + name.
    * 
    * @param {array} names An array containing the names to create ids for.
    * @returns {void}
    */
    _build_element_ids: function( names ){
	var self = this;
	$.each( names, function(i, name){
	    self[ name + '_id' ] = self.id + '_' + name;
	});
    },
    _make_eid: function( name ){
	return this.id + '_' + name;
    },
    _init_eid_manager: function( eid_list ){
	this.add_eids( eid_list );
    },
    add_eids: function( eid_list ){
	var self = this;
	var eid_dict = {};
	$.each( eid_list, function(i, eid){
	    eid_dict[eid] = self._make_eid(eid);
	});
	this.eid_dict = $.extend( this.eid_dict, eid_dict );
    },
    eid: function( name ){
	if( !this.eid_dict[ name ] ) throw "Eid '" + name + "' not found.";
	return this.eid_dict[ name ];
    },
    elm: function( name ){
	return $( '#' + this.eid(name) );
    },
    show: function(){
	$(this.dom).show();
    },
    hide: function(){
	$(this.dom).hide();
    },
    block: function( params ){
	if(this._blocked) return;
	this._blocked = true;
	params = $.extend({
	    message: 'loading...'
	}, params);
	$(this.dom).block( params );
    },
    unblock: function(){
	this._blocked = false;
	$(this.dom).unblock();
    }
};


/** @exports Widget as Provi.Widget.Widget */
var Widget = Provi.Widget.Widget;



/**
 * A popup widget
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Widget.PopupWidget = function(params){
    //params.persist_on_applet_delete = false;
    //params.heading = '';
    //params.collapsed = false;
    Widget.call( this, params );
    this._build_element_ids([ 'data', 'close' ]);
    
    this.position_my = params.position_my || 'left top';
    this.position_at = params.position_at || 'bottom';
    
    /** The template that gets filled with changeing data */
    this.template = $.template( params.template );
    var content = '<div style="background-color:lightblue; padding:7px;">' +
	'<span title="close" id="' + this.close_id + '" class="ui-icon ui-icon-close" style="float:right;"></span>' +
	'<div id="' + this.data_id + '"></div>' +
    '</div>';
    $(this.dom).append( content ).css('position', 'absolute');
    this._init();
};
Provi.Widget.PopupWidget.prototype = Utils.extend(Widget, /** @lends Provi.Widget.PopupWidget.prototype */ {
    _init: function(){
        var self = this;
	$(this.dom).hide();
	$( '#' + this.close_id ).tipsy({ gravity: 'e' }).click( function(){
	    self.hide();
	});
	//Widget.prototype.init.call(this);
    },
    show: function( target, data, template, position_my, position_at ){
        if( data ){
	    $( '#' + this.data_id ).empty();
	    this.set_data( data, template );
	}
	console.log( target, position_my, position_at );
	$(this.dom).show();
	// TODO FIX arose
	// for an unknown reason this needs to be called twice to be visible
	// after the very first call to show
	this.set_position( target, position_my, position_at );
	this.set_position( target, position_my, position_at );
    },
    hide: function(){
        $( '#' + this.data_id ).empty();
        $(this.dom).hide();
    },
    set_data: function( data, template ){
        this.data = data;
        $.tmpl( template || this.template, this.data ).appendTo( '#' + this.data_id );
    },
    set_position: function( target, position_my, position_at ){
        //console.log('target',target, $(target), $(target).width(), $(target).height(), $(target).css('top'), $(target).css('left'));
        $(this.dom).position({
            of: target,
            my: position_my || this.position_my,
            at: position_at || this.position_at
        });
    }
});


/**
 * widget class for managing widgets
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Widget.WidgetManagerWidget = function(params){
    Provi.Widget.WidgetManagerWidget.change(this.update, this);
    Widget.call( this, params );
    this.list_id = this.id + '_list';
    var content = '<div class="control_group">' +
        '<div id="' + this.list_id + '"></div>' +
    '</div>';
    $(this.dom).append( content );
    this.update();
}
Provi.Widget.WidgetManagerWidget.prototype = Utils.extend(Provi.Widget.Widget, /** @lends Provi.Widget.WidgetManagerWidget.prototype */ {
    update: function(){
        var elm = $("#" + this.list_id);
        elm.empty();
        $.each( Provi.Widget.WidgetManager.get_list(), function(){
            var status = this.get_status();
            elm.append(
                '<div class="control_row" style="background-color: lightorange; margin: 5px; padding: 3px;">' +
                    '<div>ID: ' + this.id + '</div>' +
                    '<div>Type: ' + this.type + '</div>' +
                '</div>'
            );
        });
        //$('#'+this.list_id).load('../../data/index/', function() {
        //    console.log('data list loaded');
        //});
    }
});


})();

