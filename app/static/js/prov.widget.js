

(function() {

/**
 * global widget manager object
 * 
 */
WidgetManager = {
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
WidgetManager._widget_dict.size = Utils.object_size_fn;


/**
 * Widget class
 * @constructor
 */
Widget = function(params){
    var tag_name = params.tag_name || 'div';
    var content = typeof(params.content) != 'undefined' ? params.content : '';
    this.heading = params.heading;
    this.collapsed = params.collapsed;
    this.id = WidgetManager.get_widget_id(params.id);
    this.parent_id = params.parent_id;
    WidgetManager.add_widget(this.id, this);
    
    if( params.heading ){
        content = '<h3 class="collapsable ui-accordion-header"><span class="ui-icon ui-icon-triangle-1-s"></span><a>' + params.heading + '</a></h3>' + content;
    }
    
    var e = document.createElement( tag_name );
    e.innerHTML = content;
    e.id = this.id;
    $('#' + params.parent_id).append( e );
    this.dom = e;
    
    if(params.applet && !params.persist_on_applet_delete){
        var self = this;
        params.applet.on_delete(function(){
            $(self.dom).hide();
            $(self.dom).appendTo('#trash');
        });
    }
    
    // should be called the subclasses of Widget
    //this.init();
};
// prototype for the widget class
Widget.prototype = {
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
    }
};


/**
 * widget class for managing widgets
 * @constructor
 * @extends Widget
 */
WidgetManagerWidget = function(params){
    WidgetManagerWidget.change(this.update, this);
    Widget.call( this, params );
    this.list_id = this.id + '_list';
    var content = '<div class="control_group">' +
        '<div id="' + this.list_id + '"></div>' +
    '</div>';
    $(this.dom).append( content );
    this.update();
}
WidgetManagerWidget.prototype = Utils.extend(Widget, /** @lends WidgetManagerWidget.prototype */ {
    update: function(){
        var elm = $("#" + this.list_id);
        elm.empty();
        $.each( WidgetManager.get_list(), function(){
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

