/**
 * @fileOverview This file contains the {@link Provi.Data} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * @namespace
 * Provi Data module
 */
Provi.Data = {};


(function() {

/** @exports Utils as Provi.Utils */
var Utils = Provi.Utils;

/** @exports Widget as Provi.Widget.Widget */
var Widget = Provi.Widget.Widget;


/**
 * mapping of file extension to Provi datatypes
 */
Provi.Data.types = {
    structure: ['pdb', 'gro', 'cif', 'mmcif', 'mol', 'sdf'],
    isosurface: ['jvxl', 'mrc', 'cub', 'ccp4', 'obj'],
    interface_contacts: ['sco', 'mbn']
}


/**
 * Fired when a {@link Provi.Data.Dataset} dataset is added to the dataset manager.
 *
 * @name Provi.Data.DatasetManager#add
 * @event
 * @param {object} event A jQuery event object.
 * @param {Provi.Data.Dataset} dataset The added dataset.
 */


/**
 * Singleton dataset manager object.
 * @class
 * @final
 */
Provi.Data.DatasetManager = {
    _dataset_dict: {},
    _dataset_list: [],
    _dataset_counter: 0,
    /**
     * Adds a dataset.
     * Fires the {@link Provi.Data.DatasetManager#event:add} event.
     * @param {Provi.Data.Dataset} dataset The dataset to be added.
     * @returns {int} The unique id of dataset.
     */
    add: function(dataset){
        this._dataset_counter += 1;
        var self = this;
        this._dataset_dict[this._dataset_counter] = dataset;
        this._dataset_list.push(dataset);
        $(this).triggerHandler('add', [dataset]);
        return this._dataset_counter;
    },
    get_list: function(){
        return this._dataset_list;
    },
    get: function( id ){
        return this._dataset_dict[ id ];
    }
};



/**
 * Fired when a dataset is changed.
 *
 * @name Provi.Data.Dataset#change
 * @event
 * @param {object} event A jQuery event object.
 */


/**
 * dataset class
 * @constructor
 */
Provi.Data.Dataset = function(params){
    this._status = params.status || { local: null, server: null };
    this._set_type( params.type );
    this.data = params.data;
    this.name = params.name;
    this.data_list = [];
    this.data_dict = {};
    //this.applet = params.applet;
    /** list of applets this dataset has been loaded into */
    this.applet_list = [];
    this.server_id = params.server_id;
    this.plupload_id = params.plupload_id;
    this.id = Provi.Data.DatasetManager.add( this );
    this._init();
};
Provi.Data.Dataset.prototype = /** @lends Provi.Data.Dataset.prototype */ {
    _init: function(){
	$(this).bind('change', function(){
	    $(Provi.Data.DatasetManager).triggerHandler('change');
	});
    },
    /**
     * get the status of the dataset
     * @returns {object} status object
     */
    get_status: function(){
        return this._status;
    },
    /**
     * Sets the status of the dataset.
     * Fires the {@link Provi.Data.Dataset#event:change} event.
     */
    set_status: function(status){
        if( arguments.length == 1 ){
            this._status = status;
        }else if( arguments.length == 2 ){
            this._status[ arguments[0] ] = arguments[1];
        }else{
            throw "Expect exactly one or two arguments";
        }
        $(this).triggerHandler('change');
    },
    /**
     * Sets the data/content of the dataset.
     * Fires the {@link Provi.Data.Dataset#event:change} event.
     */
    set_data: function(data){
        this.data = data;
        $(this).triggerHandler('change');
    },
    _set_type: function(type){
        this.type = type;
	Provi.Data.Controller.extend_by_type( this, type );
    },
    add_data: function( name, data ){
	this.data_list.push( data );
	this.data_dict[ name ] = data;
	$(this).triggerHandler('change');
    },
    get: function( name ){
	return this.data_dict[ name ];
    },
    get_list: function(){
	return [ this.data ].concat( this.data_list );
    },
    get_dict: function(){
	return $.extend( { main: this.data }, this.data_dict );
    },
    /**
     * Sets the type of the dataset.
     * Fires the {@link Provi.Data.Dataset#event:change} event.
     */
    set_type: function(type){
        this._set_type(type);
        $(this).triggerHandler('change');
    },
    retrieve_data: function(){
        var self = this;
        var get_params = { 'id': response.id+'' };
        $.getJSON( '../../data/get/', get_params, function(d){
            self.set_data( d );
        });
    },
    init: function( params ){
        if( params.applet ){
	    this.applet_list.push( params.applet );
            var name = this.name + ' (' + this.id + ')';
            if( $('#' + params.applet.widget.data_id).text() ){
                name = ', ' + name;
            }
            $('#' + params.applet.widget.data_id).append( name );
        }
    }
};


/**
 * widget class for managing a single dataset
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Data.DatasetWidget = function(params){
    this.load_params_widget = [];
    this.dataset = params.dataset;
    Widget.call( this, params );
    this.load_widget_id = this.id + '_load_widget';
    this.load_id = this.id + '_load';
    this.info_id = this.id + '_info';
    var content = '<div  class="control_group">' +
        '<div class="control_row" id="' + this.info_id + '"></div>' +
        '<div class="control_row" id="' + this.load_widget_id + '"></div>' +
    '</div>'
    $(this.dom).append( content );
    this.update();
    this.init();
}
Provi.Data.DatasetWidget.prototype = Utils.extend(Widget, /** @lends Provi.Data.DatasetWidget.prototype */ {
    init: function(){
        var self = this;
        $(this.dataset).bind('change', function(){
            self.update();
        });
    },
    update: function(){
        var self = this;
        var elm = $('#' + this.info_id);
        elm.empty();
        var status = this.dataset.get_status();
        elm.append(
            '<div style="background-color: ' + ( status.server == 'Ok' ? 'lightgreen' : 'lightgrey' ) + '; margin: 5px; padding: 3px;">' +
                '<div>' + this.dataset.id + '. ' + this.dataset.name + ' (' + this.dataset.type + ')</div>' +
                '<div>Local Status: ' + status.local + '&nbsp;|&nbsp;Server Status: ' + status.server + '</div>' +
            '</div>'
        );
        
        if( status.server == 'Ok'){
            if( !this.applet_selector ){
                this.applet_selector = new Provi.Jmol.JmolAppletSelectorWidget({
                    parent_id: this.load_widget_id,
                    allow_new_applets: ( $.inArray(this.dataset.type, Provi.Data.types.structure.concat(Provi.Data.types.isosurface)) >= 0 )
                });
            }
            if(this.dataset.load_params_widget && !this.load_params_widget.length){
		$.each(this.dataset.load_params_widget, function(i, lpw){
		    self.load_params_widget.push(
			new lpw.obj({ parent_id: self.load_widget_id })
		    );
		});
            }
            if( !this._load_button_initialized ){
                this._load_button_initialized = true;
                $('#' + this.load_widget_id).append(
                    '<button id="' + this.load_id + '">load</button>'
                );
                $("#" + this.load_id).button().click(function() {
                    var params = {
                        applet: self.applet_selector.get_value()
                    }
                    if(self.load_params_widget.length){
			$.each(self.load_params_widget, function(i, lpw){
			    var ds_lpw = self.dataset.load_params_widget[i];
			    if( ds_lpw.params ){
				$.each(ds_lpw.params, function(i, p){
				    console.log(p)
				    params[ p.name ] = lpw[ p.getter ]();
				});
			    }else{
				params[ ds_lpw.name ] = lpw[ ds_lpw.getter ]();
			    }
			});
                    }
		    console.log(params);
                    self.dataset.init( params );
                });
            }
        }
    }
});



/**
 * widget class for managing datasets
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Data.DatasetManagerWidget = function(params){
    this._widget_list = [];
    Widget.call( this, params );
    this.list_id = this.id + '_list';
    var content = '<div>' +
        '<div id="' + this.list_id + '"></div>' +
    '</div>';
    $(this.dom).append( content );
    this.init();
}
Provi.Data.DatasetManagerWidget.prototype = Utils.extend(Widget, /** @lends Provi.Data.DatasetManagerWidget.prototype */ {
    init: function(){
        $("#" + this.list_id).empty();
        var self = this;
        $.each( Provi.Data.DatasetManager.get_list(), function(){
            self.add( this );
        });
        $( Provi.Data.DatasetManager ).bind('add', function(event, dataset){
            self.add( dataset );
        });
    },
    add: function(dataset){
        this._widget_list.push( new Provi.Data.DatasetWidget({
            parent_id: this.list_id,
            dataset: dataset
        }));
    }
});


})();
