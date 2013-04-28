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
    structure: ['pdb', 'ent', 'pqr', 'gro', 'cif', 'mmcif', 'mol', 'mol2', 'sdf', 'xyzr', 'xyzrn'],
    isosurface: ['jvxl', 'obj', 'vert'],
    volume: ['cube', 'mrc', 'cub', 'ccp4', 'dx', 'map'],
    interface_contacts: ['sco', 'mbn'],
    jmol: ['jmol', 'png']
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
    add: function( dataset ){
        this._dataset_counter += 1;
        var self = this;
        this._dataset_dict[this._dataset_counter] = dataset;
        this._dataset_list.push(dataset);
        $(this).triggerHandler('add', [dataset]);
        return this._dataset_counter;
    },
    get_list: function( params ){
        params = params || {};

        if( params.ext_list ){
            return _.filter( this._dataset_list, function(ds, i){
                return _.include( params.ext_list, ds.type );
            });
        }else{
            return this._dataset_list;
        }
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
    params = _.defaults(
        params,
        Provi.Data.Dataset.prototype.default_params
    );
    this.raw_data = params.raw_data;
    this.name = params.name;
    this.url = params.url;
    this.type = params.type;

    // can be polluted by other functions for temp storage, i.e.
    // plupload_id for the plupload widget
    this.meta = params.meta;

    this.initialized = false;
    this.loaded = false;

    this.id = Provi.Data.DatasetManager.add( this );
    
    this.detect_type();
};
Provi.Data.Dataset.prototype = /** @lends Provi.Data.Dataset.prototype */ {
    bio_object: Provi.Bio.Data.Data,
    raw_type: false, // [ false, "text", "json" ]
    default_params: {
        name: "unnamed",
    },
    detect_type: function(){
        if( !this.type ){
            // from this.url
            // fallback: dat
        }
        Provi.Data.Controller.extend_by_type( this, this.type );
    },
    retrieve_raw_data: function( params ){
        var self = this;
        $.ajax({
            dataType: this.raw_type,
            url: this.url,
            success: function( d ){
                self.raw_data = d;
                self._init( params );
            },
            error: function(e){ console.error(e); }
        });
    },
    set_loaded: function(){
        // must be called e.g. when Jmol has finished loading the dataset
        this.loaded = true;
        $(this).triggerHandler("loaded");
    },
    _init: function( params ){
        params.dataset = this;
        this.bio = new this.bio_object( params );
        this.initialized = true;
        $(this).triggerHandler("initialized");
    },
    init: function( params ){
        if( this.raw_type ){
            this.retrieve_raw_data( params );
        }else{
            this._init( params );
        }
    },
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
    this.load_params_values = params.load_params_values || {};
    console.log( "ds load params", this.load_params_values );
    Widget.call( this, params );
    this.load_widget_id = this.id + '_load_widget';
    this.load_id = this.id + '_load';
    this.ds_info_id = this.id + '_ds_info';
    var content = '<div  class="control_group">' +
        '<div class="control_row" id="' + this.ds_info_id + '"></div>' +
        '<div class="control_row" id="' + this.load_widget_id + '"></div>' +
    '</div>'
    $(this.dom).append( content );
    this.update();
    this.init();
}
Provi.Data.DatasetWidget.prototype = Utils.extend(Widget, /** @lends Provi.Data.DatasetWidget.prototype */ {
    init: function(){
        var self = this;
        $(this.dataset).bind('initialized loaded', function(){
            self.update();
        });
    },
    update: function(){
        var self = this;
        var elm = $('#' + this.ds_info_id);
        var bgcolor = this.dataset.loaded ? 'lightgreen' : ( this.dataset.initialized ? 'orange' : 'lightgrey' );
        elm.empty();
        elm.append(
            '<div style="background-color: ' + bgcolor + '; margin: 5px; padding: 3px;">' +
                '<div>' + this.dataset.id + '. ' + this.dataset.name + ' (' + this.dataset.type + ')</div>' +
                '<div>Initialized: ' + this.dataset.initialized + '&nbsp;|&nbsp;Ready: ' + this.dataset.loaded + '</div>' +
            '</div>'
        );
        
        if( true || this.dataset.initialized ){
            if( !this.applet_selector ){
                this.applet_selector = new Provi.Jmol.JmolAppletSelectorWidget({
                    parent_id: this.load_widget_id,
                    allow_new_applets: ( $.inArray(this.dataset.type, Provi.Data.types.structure.concat(Provi.Data.types.isosurface)) >= 0 )
                });
            }
            if(this.dataset.load_params_widget && !this.load_params_widget.length){
                $.each(this.dataset.load_params_widget, function(i, lpw){
                    self.load_params_widget.push(
                        new lpw.obj({ parent_id: self.load_widget_id, dataset: self.dataset, load_params_values: self.load_params_values })
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
                    //console.log('DS LOAD PARAMS', params);
                    self.dataset.init( params );
                    $(self).triggerHandler('loaded');
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






/**
 * A widget
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Data.DatasetSelectorWidget = function(params){
    params = _.defaults(
        params,
        Provi.Data.DatasetSelectorWidget.prototype.default_params
    );
    params.persist_on_applet_delete = true;
    
    //params.collapsed = false;
    Provi.Widget.Widget.call( this, params );
    this._init_eid_manager([
        'selector'
    ]);
    
    this.ext_list = params.ext_list
    
    var template = '' +
        '<div>' + 
            '<label for="${eids.selector}">${params.selector_label}:</label>' +
            '<select id="${eids.selector}" class="ui-state-default"></select>' +
        '</div>' +
    '';
    this.add_content( template, params );

    this._init();
}
Provi.Data.DatasetSelectorWidget.prototype = Utils.extend(Provi.Widget.Widget, /** @lends Provi.Bio.Structure.StructureWidget.prototype */ {
    default_params: {
        ext_list: [],
        selector_label: 'Dataset'
    },
    _init: function(){
        var self = this;
        $(Provi.Data.DatasetManager).bind('change', function(){ self.render(); });
        this.elm('selector').bind('change', function(){ 
            $(self).triggerHandler('change') 
        });
        this.render();
        Provi.Widget.Widget.prototype.init.call(this);
    },
    render: function(){
        var elm = this.elm('selector');
        var value = this.elm('selector').children("option:selected").val();
        elm.empty();
        elm.append( '<option value=""></option>' );
        var ds_list = Provi.Data.DatasetManager.get_list({ext_list: this.ext_list});
        _.each(ds_list, function(ds, i){
            var label = ds.id + '. ' + ds.name + ' (' + ds.type + ')';
            elm.append("<option value='" + ds.id + "'>" + label + "</option>");
        });
        elm.val( value );
        if( !_.any( ds_list, function(ds){ return ds.id === value } ) ){
            $(this).triggerHandler('change');
        }
    },
    get_ds: function(){
        var ds_id = this.elm('selector').children("option:selected").val();
        return Provi.Data.DatasetManager.get( ds_id );
    }
});


})();
