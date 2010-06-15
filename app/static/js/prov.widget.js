

(function() {

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
    get_widget: function(id){
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


Widget = function(params){
    var content = typeof(params.content) != 'undefined' ? params.content : '';
    this.id = WidgetManager.get_widget_id(params.id);
    WidgetManager.add_widget(this.id, this);
    
    var e = document.createElement("div")
    e.innerHTML = content;
    e.id = this.id;
    $('#' + params.parent_id).append( e );
    this.dom = e;
};
Widget.prototype = {
    
};


})();

