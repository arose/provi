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
    var tag_name = params.tag_name || 'div';
    var content = typeof(params.content) != 'undefined' ? params.content : '';
    /** The text of the widget's heading */
    this.heading = params.heading;
    /** Weather the widget is collapsed or not */
    this.collapsed = params.collapsed;
    /** Dom id of the widget itself */
    this.id = Provi.Widget.WidgetManager.get_widget_id(params.id);
    /** Id of the parent dom object */
    this.parent_id = params.parent_id;
    Provi.Widget.WidgetManager.add_widget(this.id, this);
    
    if( params.heading ){
        content = '<h3 class="collapsable ui-accordion-header"><span class="ui-icon ui-icon-triangle-1-s"></span><a>' + params.heading + '</a></h3>' + content;
    }
    
    var e = document.createElement( tag_name );
    e.innerHTML = content;
    e.id = this.id;
    $('#' + params.parent_id).append( e );
    /** The dom object */
    this.dom = e;
    
    if(params.applet && !params.persist_on_applet_delete){
        var self = this;
        $(params.applet).bind('delete', function(){
            $(self.dom).hide();
            $(self.dom).appendTo('#trash');
        });
    }
    
    // should be called the subclasses of Widget
    //this.init();
};
Provi.Widget.Widget.prototype = /** @lends Provi.Widget.Widget.prototype */ {
    /** Initialization of the widget */
    init: function(){
        $('#' + this.id + ' [title]').tipsy({ gravity: 'nw' });
        
        if( this.heading ){
            var header = $('#' + this.id + ' .collapsable');
            header.click(function() {
                $(this).next().toggle();
                $(this).children('.ui-icon').toggleClass('ui-icon-triangle-1-e').toggleClass('ui-icon-triangle-1-s');
                return false;
            });
            if( this.collapsed ) header.triggerHandler('click');
        }
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
    }
};


/** @exports Widget as Provi.Widget.Widget */
var Widget = Provi.Widget.Widget;


/**
 * A widget
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Widget.PopupWidget = function(params){
    //params.persist_on_applet_delete = false;
    //params.heading = '';
    //params.collapsed = false;
    Widget.call( this, params );
    this._build_element_ids([ 'data' ]);
    
    this.position_my = params.position_my || 'left top';
    this.position_at = params.position_at || 'bottom';
    
    /** The template that gets filled with changeing data */
    this.template = $.template( params.template );
    var content = '<div style="background-color:lightblue; padding:7px;" id="' + this.data_id + '"></div>';
    $(this.dom).append( content ).css('position', 'absolute');
    this._init();
};
Provi.Widget.PopupWidget.prototype = Utils.extend(Widget, /** @lends Provi.Widget.PopupWidget.prototype */ {
    _init: function(){
        var self = this;
	$(this.dom).hide();
	//Widget.prototype.init.call(this);
    },
    show: function( target, data, template, position_my, position_at ){
        this.set_data( data, template );
        $(this.dom).show();
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

