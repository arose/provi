/**
 * @fileOverview This file contains the {@link Provi.Jalview} Module.
 *  
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */



/**
 * @namespace
 * Jalview namespace
 */
Provi.Jalview = {};


/**
 * Function to delegate a jalview applet ready callback to the corresponding applet wrapper.
 * Also available as a global function because Jalview would not accept it otherwise.
 * @memberOf Provi.Jalview
 */
function jalview_applet_ready_callback (applet_name, id, status, applet){
    console.log('jalview ready', applet_name+'', id+'', status+'', applet );
    layout_main();
};


(function() {

var Utils = Provi.Utils;
var Widget = Provi.Widget.Widget;


Provi.Jalview = $.extend(Provi.Jalview, /** @lends Provi.Jalview */ {
    /** The default path to the directory where the Jalview Applet .jar files are located. */
    default_dir: '.',
    /** The default name of the main Jalview Applet .jar file. */
    default_jar: 'jalviewApplet.jar',
    /** The default name of the Jalview archive */
    archive_path: 'jalviewApplet.jar',
    /** @private A dictionary of all instantiated Jalview Applets. */
    _applet_dict: {},
    /** @private A list of all instantiated Jalview Applets. */
    _applet_list: [],
    /** @private The current default Jalview Applet instance */
    _default_applet: undefined,
    /** @private The number of instantiated Jalview Applets. */
    _applet_counter: 0,
    /** Initialization of the {@link Provi.Jalview} singleton. */
    init: function(codebase_directory, use_signed_applet){
        if( this.initialized ) return;
        this.initialized = true;
        this.codebase_directory = typeof(codebase_directory) != 'undefined' ? codebase_directory : '.';
        this.archive_path = codebase_directory + this.archive_path;
    },
    /**
     * Get an applet by its name suffix
     */
    get_applet: function(name_suffix){
        return this._applet_dict[name_suffix];
    },
    /**
     * Get an applet by its name suffix
     */
    get_applet_by_id: function(id){
        // "jmol_applet_"
        //console.log( id.substring(12) );
        return this.get_applet( id.substring(12) );
    },
    /**
     * Get the list of all available applets
     */
    get_applet_list: function(){
        return this._applet_list;
    },
    /**
     * Adds an applet to the global list of applets.
     *
     * Triggers the events {@link Provi.Jmol#event:applet_list_change} and {@link Provi.Jmol#event:applet_added}.
     */
    add_applet: function(name_suffix, applet){
        this._applet_counter += 1;
        if( typeof(this._applet_dict[name_suffix]) != 'undefined' ){
            throw "name_suffix '" + name_suffix + "' is already in use";
        }
        this._applet_dict[name_suffix] = applet;
        this._applet_list.push(applet);
        $(this).triggerHandler('applet_list_change');
        $(this).triggerHandler('applet_added', applet);
    },
    remove_applet: function(name_suffix){
        this._applet_list.removeItems(name_suffix, function(applet, name_suffix){
            return name_suffix == applet.name_suffix;
        });
        this._applet_dict[name_suffix]._delete();
        delete this._applet_dict[name_suffix];
        
        if(this._default_applet.name_suffix == name_suffix){
            if(this._applet_list.length){
                this.set_default_applet( this._applet_list[0] );
            }else{
                this.set_default_applet( undefined );
            }
        }
        $(this).triggerHandler('applet_list_change');
    },
    get_applet_name_suffix: function(name_suffix){
        if( typeof(name_suffix) != 'undefined' ){
            if( typeof(this._applet_dict[name_suffix]) != 'undefined' ){
                throw "name_suffix '" + name_suffix + "' is already in use";
            }
        }else{
            var self = this;
            var name_suffices_as_ints = $.map(self._applet_list, function(x){ console.log(x); return [parseInt(x.name_suffix)]; });
            //console.log( name_suffices_as_ints, self._applet_list, name_suffices_as_ints.length );
            name_suffix = 0;
            if( name_suffices_as_ints.length ){
                name_suffix = 1 + Math.max.apply(Math, name_suffices_as_ints );
            }
            name_suffix = this._applet_counter + 1;
        }
        return name_suffix;
    },
    set_applet_loaded: function(name_suffix){
        //console.log('set_applet_loaded', name_suffix);
        this.get_applet(name_suffix).set_loaded();
    },
    /**
     * Get the default applet
     *
     * @param {boolean} allow_new If true and if no default applet exists, a new Jalview applet (inside a new {@link Provi.Jalview.JalviewWidget}) is created.
     * @returns {Provi.Jalview.Applet|undefined} A Jalview applet if available.
     */
    get_default_applet: function( allow_new ){
        if( typeof(this._default_applet) == 'undefined' && allow_new ){
            return ( new Provi.Jalview.JalviewWidget({}) ).applet;
        }else{
            return this._default_applet;
        }
    },
    set_default_applet: function(name_suffix_or_applet){
        if( name_suffix_or_applet instanceof Provi.Jalview.Applet ){
            this._default_applet = name_suffix_or_applet;
        }else if( typeof(name_suffix_or_applet) == 'undefined' ){
            this._default_applet = name_suffix_or_applet;
        }else{
            this._default_applet = this._applet_dict[name_suffix_or_applet];
        }
        $(Provi.Jalview).triggerHandler( 'default_applet_change' );
    }
});
Provi.Jalview._applet_dict.size = Utils.object_size_fn;



/**
 * Jalview Applet class
 * @constructor
 */
Provi.Jalview.Applet = function(params){
    var default_params = Provi.Jalview.Applet.prototype.default_params;
    /** tells weather the applet is loaded and ready to recive comands. */
    this.loaded = false;
    /** a pointer to the actual html applet */
    this.applet = null;
    this.file = params.file;
    this.name_suffix = Provi.Jalview.get_applet_name_suffix( params.name_suffix );
    this.id = "jmol_applet_" + this.name_suffix;
    this.width = typeof(params.width) != 'undefined' ? params.width : default_params.width;
    this.height = typeof(params.height) != 'undefined' ? params.height : default_params.height;
    this.css_class = typeof(params.css_class) != 'undefined' ? params.css_class : default_params.css_class;
    this.archive_path = Provi.Jalview.archive_path;
    this.codebase = Provi.Jalview.codebase;
    this.widget = false;
    
    this._determining_load_status = false;

    this._init();
    if( typeof(Provi.Jalview._default_applet) == 'undefined' ){
        //Provi.Jalview.set_default_applet( this.name_suffix );
        Provi.Jalview._default_applet = this;
        Provi.Jalview.add_applet(this.name_suffix, this);
        $(Provi.Jalview).triggerHandler( 'default_applet_change' );
    }else{
           Provi.Jalview.add_applet(this.name_suffix, this);
    }
    
};
Provi.Jalview.Applet.prototype = /** @lends Provi.Jalview.Applet.prototype */ {
    default_params: {
           width: 300,
           height: 300,
           css_class: 'jalview_applet',
           sync_id: ("" + Math.random()).substring(3)
    },
    _init: function(){
           this._create_html();
           this._create_dom();
           $(this.selection_manager).bind('select', $.proxy(this.select, this));
    },
    select: function( e, selection, applet, selection_string ){
           applet.script_wait( 'select {' + selection_string + '};' );
    },
    _delete: function(){
           $('#' + this.widget.data_id).empty();
           $(this).triggerHandler('delete');
    },
    _create_html: function(){
        this.html = "<applet " +
            //"type=\"application/x-java-applet\" " +
            "name='jalview_applet_" + this.name_suffix + "' " +
            "id='" + this.id + "' " +

            //"class='" + this.css_class + "' " +
            "code='jalview.bin.JalviewLite' " +
            "archive='" + this.archive_path + "' " +
            "width='" + this.width + "' " +
            "height='" + this.height + "' " +
        ">\n" +
            this._get_params(); +
        "</applet>\n";
    },
    _get_params: function(){
        params = {
            embedded: 'true',
            file: this.file,
            mayscript: 'True',
            scriptable: 'True',
            nojmol: 'True',
            debug: 'True',
            showbutton: 'False',
            oninit: 'jalview_applet_ready_callback'

        };
        var t = "";
        for (var i in params){
            if(params[i]!=""){
                t+="  <param name='"+i+"' value='"+params[i]+"' />\n";
           }
        }
        return t;
    },
    _create_dom: function(){
        var e = document.createElement("span");
        e.innerHTML = this.html;
            this.dom = e;
        this.applet = e.firstChild;
    },
    dom: function(){
           return this.dom;
    }
};






/**
 * The Jalview widget
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Jalview.JalviewWidget = function(params){
    params = _.defaults( params, this.default_params );
    
    Provi.Widget.Widget.call( this, params );
    this.applet = new Provi.Jalview.Applet(params);

    this._init_eid_manager([
        'applet_parent', 'delete', 'data'
    ]);
    
    this.flatland = params.flatland;

    var template = '' +
        '<div id="${eids.applet_parent}" style="overflow:hidden; position:absolute; top:0px; bottom:32px; width:100%;"></div>' +
        '<div class="" style="overflow:hidden; background:lightyellow; position:absolute; height:20px; padding:6px; bottom:0px; left:0px; right:0px;">' +
            '<span>Jalview: ' + this.applet.name_suffix + '</span>' +
            '<span style="margin-left:20px; margin-right:10px; overflow:hidden;">Data: <span id="${eids.data}" ></span></span>' +
            '<span title="delete" class="ui-icon ui-icon-trash" style="cursor:pointer; position:absolute; right:6px; top:6px;" id="${eids.delete}">delete</span>' +
        '</div>';
    '';
    this.add_content( template, params );
    $(this.dom).removeClass( 'ui-container ui-widget' );
    $(this.dom).children().eq(1).removeClass( 'my-content' );

    this.elm("applet_parent").append( this.applet.dom );

    this._init();
};
Provi.Jalview.JalviewWidget.prototype = Utils.extend(Provi.Widget.Widget, /** @lends Provi.Jalview.JalviewWidget.prototype */ {
    default_params: {
        
    },
    _init: function(){
        var self = this;
        this.elm('delete').tipsy({ gravity: 'e' }).click(function(){
            $(this).trigger('mouseout');
            $(self.dom).hide();
            $(self.dom).appendTo('#trash');
            Provi.Jalview.remove_applet( self.applet.name_suffix );
            layout_main();
        });
    }
});




})();

