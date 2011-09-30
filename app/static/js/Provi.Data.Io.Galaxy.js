/**
 * @fileOverview This file contains the {@link Provi.Data.Io.Galaxy} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * @namespace
 * Galaxy Io module
 */
Provi.Data.Io.Galaxy = {};


(function() {

/** @exports Utils as Provi.Utils */
var Utils = Provi.Utils;

/** @exports Widget as Provi.Widget.Widget */
var Widget = Provi.Widget.Widget;


/**
 * function to import a dataset from galaxy
 * @returns {Provi.Data.Dataset} dataset instance
 */
Provi.Data.Io.Galaxy.import_galaxy = function(id, name, filename, type, params, success, no_init){
    var self = this;
    var dataset = new Provi.Data.Dataset({
        name: name,
        status: { local: null, server: 'importing' }
    });
    $.ajax({
        url: '../../galaxy/import_dataset/',
        data: { id: id, name: name, filename: filename || 'index', datatype: type },
        success: function(response){
            response = $.parseJSON( response );
            dataset.server_id = response.id;
            dataset.set_type( response.type );
            dataset.set_status( 'server', response.status );
            if( !no_init ) dataset.init( params );
            if( $.isFunction(success) ){
                success( dataset );
            }
        }
    });
    return dataset;
}


/**
 * Fired when the galaxy history is switched
 *
 * @name Provi.Data.Io.Galaxy.GalaxyConnector#switch
 * @event
 * @param {object} event A jQuery event object.
 */


/**
 * Galaxy conector object providing a set of functions to comunicate with a galaxy instance via the provi server component
 * @class
 */
Provi.Data.Io.Galaxy.GalaxyConnector = {
    history_id: false,
    /**
     * Sets the galaxy history.
     * Triggers the {@link Provi.Data.Io.Galaxy.GalaxyConnector#event:switch} event.
     * @param {int|string} id Galaxy histroy id.
     */
    set_history_id: function( id ){
        this.history_id = id;
        $(this).triggerHandler( 'switch' );
    },
    login: function( onsuccess ){
        var self = this;
        $.ajax({
            url: '../../galaxy/login/',
            data: { galaxysession: $.cookie('galaxysession') || '' },
            success: function(){
                if( $.isFunction(onsuccess) ) onsuccess();
            }
        });
    },
    update_history_id: function( onsuccess ){
        var self = this;
        $.ajax({
            type: 'GET',
            url: '../../galaxy/dataset_list/',
            dataType: 'xml',
            success: function(data, textStatus, XMLHttpRequest) {
                $("#" + self.dataset_list_id).empty();
                var list = $('#' + self.dataset_list_id);
                self.set_history_id( $(data).find("history").attr("id") );
                if( $.isFunction(onsuccess) ) onsuccess();
            }
        });
    },
    history_list: function( onsuccess ){
        var self = this;
        $.ajax({
            type: 'GET',
            url: '../../galaxy/history_list/',
            dataType: 'xml',
            success: function(data, textStatus, XMLHttpRequest) {
                onsuccess( data, textStatus, XMLHttpRequest );
            }
        });
    },
    switch_history: function( history_id, onsuccess ){
        var self = this;
        $.ajax({
            url: '../../galaxy/switch_history/',
            data: { history_id: history_id },
            success: function(data){
                onsuccess( data );
                self.set_history_id( history_id );
            }
        });
    }
};

/**
 * A widget to select a Galaxy history
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Data.Io.Galaxy.GalaxyHistorySelectorWidget = function(params){
    params.tag_name = 'span';
    this.galaxy_connector = params.galaxy_connector || Provi.Data.Io.Galaxy.GalaxyConnector;
    Widget.call( this, params );
    this.history_selector_id = this.id + '_history';
    this.refresh_id = this.id + '_refresh';
    var content = '<span class="control_row">' +
            '<label for="' + this.history_selector_id + '">History:</label>&nbsp;' +
            '<select id="' + this.history_selector_id + '" class="ui-state-default"></select>&nbsp;' +
            '<span title="refresh" class="ui-icon ui-icon-refresh" style="cursor:pointer;" id="' + this.refresh_id + '">refresh</span>' +
        '</span>';
    $(this.dom).append( content );
    this._init();
};
Provi.Data.Io.Galaxy.GalaxyHistorySelectorWidget.prototype = Utils.extend(Widget, /** @lends Provi.Data.Io.Galaxy.GalaxyHistorySelectorWidget.prototype */ {
    _init: function(){
        var self = this;
        this.galaxy_connector.login(function(){
            self._update();
        });
        $(this.galaxy_connector).bind('switch', function(){
            $("#" + self.history_selector_id).val( self.galaxy_connector.history_id );
            //self._update();
            $("#" + self.history_selector_id).triggerHandler('switch');
        });
        $("#" + this.history_selector_id).change(function(){
            self.galaxy_connector.switch_history( $("#" + self.history_selector_id + " option:selected").val(), function(){
                //$("#" + self.history_selector_id).triggerHandler('switch');
            });
        });
        $('#' + this.refresh_id).click(function(){
            self._update();
            self.galaxy_connector.update_history_id();
            //$("#" + self.history_selector_id).triggerHandler('switch');
        });
    },
    _update: function(){
        var self = this;
        this.galaxy_connector.history_list(function(data, textStatus, XMLHttpRequest) {
            var elm = $("#" + self.history_selector_id);
            //var value = $("#" + self.history_selector_id + " option:selected").val();
            elm.empty();
            $(data).find("history_ids").find("data").each(function(){
                elm.append("<option value='" + $(this).attr("id") + "'>" + $(this).attr("hid") + ":&nbsp;" + $(this).attr("name") + "&nbsp;(" + $(this).attr("num") + ")</option>");
            });
            elm.val( self.galaxy_connector.history_id );
        });
    },
    get_value: function(){
        return $("#" + this.history_selector_id + " option:selected").val();
    },
    change: function(fn){
	$("#" + this.history_selector_id).bind('switch', fn);
    },
    val: function(data){
	$("#" + this.history_selector_id).val(data);
    }
});



/**
 * widget for loading data from a galaxy instance
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Data.Io.Galaxy.GalaxyLoadWidget = function(params){
    this.galaxy_connector = params.galaxy_connector || Provi.Data.Io.Galaxy.GalaxyConnector;
    params.heading = 'Galaxy Import';
    Widget.call( this, params );
    this.dataset_list_id = this.id + '_dataset_list';
    this.load_as_selector_widget_id = this.id + '_load_as';
    this.applet_selector_widget_id = this.id + '_applet';
    this.history_selector_widget_id = this.id + '_history';
    var content = '<div  class="control_group">' +
        '<div id="' + this.applet_selector_widget_id + '"></div>' +
        '<div id="' + this.load_as_selector_widget_id + '"></div>' +
        '<div id="' + this.history_selector_widget_id + '"></div>' +
        '<div class="control_row" id="' + this.dataset_list_id + '"></div>' +
    '</div>';
    $(this.dom).append( content );
    this.applet_selector = new Provi.Jmol.JmolAppletSelectorWidget({
        parent_id: this.applet_selector_widget_id,
        applet: params.applet,
        new_jmol_applet_parent_id: params.new_jmol_applet_parent_id,
        allow_new_applets: true
    });
    this.load_as_selector = new Provi.Jmol.JmolLoadAsSelectorWidget({
        parent_id: this.load_as_selector_widget_id
    });
    this.history_selector = new Provi.Data.Io.Galaxy.GalaxyHistorySelectorWidget({
        parent_id: this.history_selector_widget_id
    });
    this.init();
}
Provi.Data.Io.Galaxy.GalaxyLoadWidget.prototype = Utils.extend(Widget, /** @lends Provi.Data.Io.Galaxy.GalaxyLoadWidget.prototype */ {
    init: function(){
        var self = this;
        this.galaxy_connector.login(function(){
            self.update();
        });
        this.history_selector.change(function(){
            self.update();
        });
        Widget.prototype.init.call(this);
    },
    update: function() {
        this.dataset_list();
    },
    import_dataset: function(id, name, filename, type){
        var self = this;
        var params = {
            applet: this.applet_selector.get_value(),
            load_as: this.load_as_selector.get_value()
        }
        Provi.Data.Io.Galaxy.import_galaxy( id, name, filename, type, params, function(dataset){
            $('#' + self.dataset_list_id + '_' + id).attr("disabled", false).removeClass('ui-state-disabled').button( "option", "label", "import" );
        })
    },
    dataset_list: function(){
        var self = this;
        $.ajax({
            type: 'GET',
            url: '../../galaxy/dataset_list/',
            dataType: 'xml',
            success: function(data, textStatus, XMLHttpRequest) {
                $("#" + self.dataset_list_id).empty();
                var list = $('#' + self.dataset_list_id);
                if( !self.galaxy_connector.history_id ) self.galaxy_connector.set_history_id( $(data).find("history").attr("id") );
                $(data).find("history").find("data").each(function(){
                    var id = $(this).attr("id");
                    var state = $(this).attr("state");
                    var name = $(this).attr("name");
                    var button_id = self.dataset_list_id + '_' + id;
                    list.append( '<div>' +
                        '<button id="' + button_id + '">import</button>&nbsp;' +
                        '<span>' + $(this).attr("hid") + ': ' + name + ' (' + state + ')</span>' +
                    "</div>");
                    $("#" + button_id).button().attr("disabled", state != 'ok').addClass(state != 'ok' ? 'ui-state-disabled' : '').click(function() {
                        $(this).attr("disabled", true).addClass('ui-state-disabled').button( "option", "label", "importing..." );
                        self.import_dataset( id, name );
                    });
                });
                //.html(data);
            }
        });
    }
});


/**
 * widget for saving data to a example/local directory
 * @constructor
 * @extends Provi.Data.Io.SaveDataWidget
 * @param {object} params Configuration object, see also {@link Provi.Data.Io.SaveDataWidget} and {@link Provi.Widget.Widget}.
 */
Provi.Data.Io.Galaxy.SaveGalaxyWidget = function(params){
    params.heading = 'Save in Galaxy';
    Provi.Data.Io.SaveDataWidget.call( this, params );
    this.history_selector_widget_id = this.id + '_history_selector';
    this.dataset_name_id = this.id + '_dataset_name';
    $('#' + this.applet_selector_widget_id).after(
        '<div id="' + this.history_selector_widget_id + '"></div>' +
        '<div class="control_row">' +
            'Dataset name: ' +
            '<input id="' + this.dataset_name_id + '" type="text"/>' +
        '</div>'
    );
    this.history_selector = new Provi.Data.Io.Galaxy.GalaxyHistorySelectorWidget({
        parent_id: this.history_selector_widget_id
    })
}
Provi.Data.Io.Galaxy.SaveGalaxyWidget.prototype = Utils.extend(Provi.Data.Io.SaveDataWidget, /** @lends Provi.Data.Io.Galaxy.SaveGalaxyWidget.prototype */ {
    init: function(){
        Provi.Data.Io.SaveDataWidget.prototype.init.call( this );
    },
    backend_type: 'galaxy',
    save_data: function( data, name, encoding, type ){
        name = $('#' + this.dataset_name_id).val() || name;
        Provi.Data.Io.Galaxy.SaveDataWidget.prototype.save_data.call( this, data, name, encoding, type );
    }
});


})();