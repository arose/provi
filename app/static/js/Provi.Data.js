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
    params = _.defaults( params, this.default_params );
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
    bio_object: undefined,
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
    this.dataset = params.dataset;
    Widget.call( this, params );
    this._init_eid_manager( ['ds_info', 'load_widget', 'load'] );

    var template = '<div  class="control_group">' +
        '<div class="control_row" id="${eids.ds_info}"></div>' +
        '<div class="control_row" id="${eids.load_widget}"></div>' +
    '</div>'
    this.add_content( template, params );
    
    this.init();
}
Provi.Data.DatasetWidget.prototype = Utils.extend(Widget, /** @lends Provi.Data.DatasetWidget.prototype */ {
    init: function(){
        var self = this;
        this.update();
        $(this.dataset).bind('initialized loaded', function(){
            self.update();
        });
    },
    update: function(){
        var self = this;
        var bgcolor = this.dataset.loaded ? 'lightgreen' : ( this.dataset.initialized ? 'lightsalmon' : 'lightgrey' );

        this.elm("ds_info").empty().append(
            '<div style="background-color: ' + bgcolor + '; margin: 5px; padding: 3px;">' +
                '<div>' + this.dataset.id + '. ' + this.dataset.name + ' (' + this.dataset.type + ')</div>' +
                '<div>Initialized: ' + this.dataset.initialized + '&nbsp;|&nbsp;Ready: ' + this.dataset.loaded + '</div>' +
            '</div>'
        );
        
        if( !this.applet_selector ){
            this.applet_selector = new Provi.Jmol.JmolAppletSelectorWidget({
                parent_id: this.eid("load_widget"),
                allow_new_applets: ( $.inArray(this.dataset.type, Provi.Data.types.structure.concat(Provi.Data.types.isosurface)) >= 0 )
            });
        }
        if( this.dataset.params_object && !this.load_params_widget ){
            this.load_params_widget = new this.dataset.params_object({
                parent_id: this.eid("load_widget"),
                dataset: this.dataset
            })
        }
        if( !this._load_button_initialized ){
            this._load_button_initialized = true;
            this.elm("load_widget").append(
                '<button id="' + this.eid("load") + '">load</button>'
            );
            this.elm("load").button().click(function() {
                Provi.Widget.ui_disable_timeout( $(this) );
                
                var params = self.load_params_widget ? self.load_params_widget.params : {};
                params.applet = self.applet_selector.get_value();

                console.log("DatasetWidget", params, self.load_params_widget ? _.clone( self.load_params_widget.params ) : {});

                self.dataset.init( params );
                $(self).triggerHandler('loaded');
            });
        }
    }
});



/**
 * A widget
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Data.DatasetSelectorWidget = function(params){
    params = _.defaults( params, this.default_params );
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




/**
 * Singleton datalist manager object.
 * @class
 * @final
 */
Provi.Data.DatalistManager = {
    _datalist_dict: {},
    _datalist_list: [],
    _datalist_counter: 0,
    add: function( datalist ){
        this._datalist_counter += 1;
        this._datalist_dict[this._datalist_counter] = datalist;
        this._datalist_list.push(datalist);
        datalist.name = this._datalist_counter + "_" + datalist.type;
        $(this).triggerHandler('add', [datalist]);
        return this._datalist_counter;
    },
    get_list: function( params ){
        params = params || {};

        if( params.name_list ){
            return _.filter( this._datalist_list, function(dl, i){
                return _.include( params.name_list, dl.name );
            });
        }else{
            return this._datalist_list;
        }
    },
    get: function( id ){
        return this._datalist_dict[ id ];
    }
};



Provi.Data.Datalist = function(params){
    var p = [ "applet" ];
    _.extend( this, _.pick( params, p ) );

    // also sets this.name = this.id + "_" + this.type;
    this.id = Provi.Data.DatalistManager.add( this );

    if( params.load_struct ){
        $(this.applet).bind( "load_struct", _.bind( this.calculate, this ) );
    }
    $(this).bind("init_ready", _.bind( this.calculate, this ) );

    if( !params.no_init ) this._init();
}
Provi.Data.Datalist.prototype = {
    type: "Datalist",
    handler: {},
    params_object: undefined,
    _init: function(){
        console.log( this.name, "_init" );
        if( this.applet.loaded ){
            this.initialized = true;
            $(this).trigger("init_ready");
        }else{
            $(this.applet).bind("load", _.bind( this._init, this ))
        }
    },
    calculate: function(){
        console.log( this.name, "calculate" );
        if( this.initialized ){
            this.ready = true;
            $(this).trigger("calculate_ready");
        }
    },
    get_ids: function(){},
    make_row: function(id){
        return id.toString();
    },
    invalidate: function(){
        $(this).triggerHandler('invalidate');
    }
};


// fill with IsosurfaceDatalist + ParseDatalist + VariableDatalist + ModelindexDatalist
Provi.Data.ObjectDatalist = function(params){
    Provi.Data.Datalist.call( this, params );
}
Provi.Data.ObjectDatalist.prototype = Utils.extend(Provi.Data.Datalist, {
    type: "ObjectDatalist",
    get_ids: function(){
        return this.ids;
    },
    get_data: function(id){
        return id[0].get_data.apply( id[o], id[1] );
    },
    make_row: function(id){
        return id[0].make_row.apply( id[o], id[1] );
    }
});




})();
