/**
 * @fileOverview This file contains the {@link Provi.Jmol} Module.
 * The Jmol Applet event documentation for {@link Provi.Jmol.Applet} based on
 * <a href="http://jmol.sourceforge.net/jslibrary/#jmolSetCallback">http://jmol.sourceforge.net/jslibrary/#jmolSetCallback</a>
 * 
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */



/**
 * @namespace
 * Jmol namespace
 */
Provi.Jmol = {};


/**
 * Global variable required by Jmol to work at all
 * @see Provi.Jmol
 */
var _jmol = {
    java_arguments: "-Xmx1024M"
};

/**
 * Function to delegate a jmol animation frame callback to the corresponding applet wrapper.
 * Also available as a global function because Jmol would not accept it otherwise.
 * @memberOf Provi.Jmol
 */
var jmol_anim_frame_callback = function( applet_name, frameNo, fileNo, modelNo, firstNo, lastNo, isAnimationRunning, animationDirection, currentDirection ){
    console.log( 'jmol_anim_frame_callback', applet_name+'' );
    Provi.Jmol.get_applet_by_id( applet_name+'' )._anim_frame_callback( frameNo+'', fileNo+'', modelNo+'', firstNo+'', lastNo+'', isAnimationRunning+'', animationDirection+'', currentDirection+'' );
    //console.log( frameNo+'', fileNo+'', modelNo+'', firstNo+'', lastNo+'', isAnimationRunning+'', animationDirection+'', currentDirection+'' );
};
Provi.Jmol.jmol_anim_frame_callback = jmol_anim_frame_callback;

/**
 * Function to delegate a jmol structure loaded callback to the corresponding applet wrapper.
 * Also available as a global function because Jmol would not accept it otherwise.
 * @memberOf Provi.Jmol
 */
var jmol_load_struct_callback = function(applet_name, fullPathName, fileName, modelName, ptLoad, previousCurrentModelNumberDotted, lastLoadedModelNumberDotted){
    //console.log( 'jmol_load_struct_callback', Provi.Jmol.get_applet_by_id( applet_name+'' ).evaluate('_modelNumber'), fullPathName+'', fileName+'', modelName+'', ptLoad+'', previousCurrentModelNumberDotted+'', lastLoadedModelNumberDotted+'' );
    Provi.Jmol.get_applet_by_id( applet_name+'' )._load_struct_callback( fullPathName+'', fileName+'', modelName+'', ptLoad+'', previousCurrentModelNumberDotted+'', lastLoadedModelNumberDotted+'' );
};


/**
 * Function to delegate a jmol pick callback to the corresponding applet wrapper.
 * Also available as a global function because Jmol would not accept it otherwise.
 * @memberOf Provi.Jmol
 */
function jmol_pick_callback (applet_name, info, id){
    console.log('foo');
    console.log( applet_name+'', info+'', id+'' );
    Provi.Jmol.get_applet_by_id( applet_name+'' )._pick_callback( info+'', id+'' );
};

function jmol_hover_callback (applet_name, text, foo, id, x, y, z){
    //console.log( applet_name+'', text+'', id+'', x+'', y+'', z+'' );
    Provi.Jmol.get_applet_by_id( applet_name+'' )._hover_callback( text+'', id+'', x+'', y+'', z+'' );
};

/**
 * Function to delegate a jmol applet ready callback to the corresponding applet wrapper.
 * Also available as a global function because Jmol would not accept it otherwise.
 * @memberOf Provi.Jmol
 */
function jmol_applet_ready_callback (applet_name, id, status, applet){
    console.log( applet_name+'', id+'', status+'', applet );
    Provi.Jmol.get_applet_by_id( applet_name+'' )._applet_ready_callback( status+'', applet );
};

function jmol_dataset_loaded( dataset_id, status ){
    Provi.Data.DatasetManager.get( dataset_id ).set_loaded();
};

function jmol_script_callback( id ){
    $(Provi.Jmol).triggerHandler('script_callback', [id]);
}

function jmol_error( error ){
    console.error( error );
}



(function() {

var Utils = Provi.Utils;
var Widget = Provi.Widget.Widget;

/**
 * @name Provi.Jmol#applet_list_change
 * @event Fired when the list of applets is changed, that is when an applet is added or removed.
 * @param {object} event object
 */

/**
 * @name Provi.Jmol#applet_added
 * @event Fired when a new applet is added.
 * @param {object} event object
 * @param {Provi.Jmol.Applet} applet instance
 */


Provi.Jmol = $.extend(Provi.Jmol, /** @lends Provi.Jmol */ {
    /** The default path to the directory where the Jmol Applet .jar files are located. */
    default_dir: '.',
    /** The default name of the main Jmol Applet .jar file. */
    default_jar: 'JmolApplet.jar',
    /** The default name of the Jmol archive */
    archive_path: 'JmolApplet0.jar',
    //archive_path: 'JmolAppletSigned0.jar',
    /** @private A dictionary of all instantiated Jmol Applets. */
    _applet_dict: {},
    /** @private A list of all instantiated Jmol Applets. */
    _applet_list: [],
    /** @private The current default Jmol Applet instance */
    _default_applet: undefined,
    /** @private The number of instantiated Jmol Applets. */
    _applet_counter: 0,
    /** Initialization of the {@link Provi.Jmol} singleton. */
    init: function(codebase_directory, use_signed_applet){
        if( this.initialized ) return;
        this.initialized = true;
        this.codebase = typeof(codebase_directory) != 'undefined' ? codebase_directory : '.';
        if( use_signed_applet ) this.archive_path = 'JmolAppletSigned0.jar';
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
        this._applet_list = _.reject(this._applet_list, function(applet){
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
     * @param {boolean} allow_new If true and if no default applet exists, a new Jmol applet (inside a new {@link Provi.Jmol.JmolWidget}) is created.
     * @returns {Provi.Jmol.Applet|undefined} A Jmol applet if available.
     */
    get_default_applet: function( allow_new ){
        if( typeof(this._default_applet) == 'undefined' && allow_new ){
            return ( new Provi.Jmol.JmolWidget({}) ).applet;
        }else{
            return this._default_applet;
        }
    },
    set_default_applet: function(name_suffix_or_applet){
        if( name_suffix_or_applet instanceof Provi.Jmol.Applet ){
            this._default_applet = name_suffix_or_applet;
        }else if( typeof(name_suffix_or_applet) == 'undefined' ){
            this._default_applet = name_suffix_or_applet;
        }else{
            this._default_applet = this._applet_dict[name_suffix_or_applet];
        }
        $(Provi.Jmol).triggerHandler( 'default_applet_change' );
    }
});





/**
 * Jmol Applet class
 * @constructor
 */
Provi.Jmol.Applet = function(params){
    var default_params = Provi.Jmol.Applet.prototype.default_params;
    /** tells weather the applet is loaded and ready to recive comands. */
    this.loaded = false;
    /** a pointer to the actual html applet */
    this.applet = null;
    this.name_suffix = Provi.Jmol.get_applet_name_suffix( params.name_suffix );
    this.id = "jmol_applet_" + this.name_suffix;
    this.width = typeof(params.width) != 'undefined' ? params.width : default_params.width;
    this.height = typeof(params.height) != 'undefined' ? params.height : default_params.height;
    this.css_class = typeof(params.css_class) != 'undefined' ? params.css_class : default_params.css_class;
    this.archive_path = Provi.Jmol.archive_path;
    this.codebase = Provi.Jmol.codebase;
    this.widget = false;
    
    this._determining_load_status = false;
    
    this._init();
    if( typeof(Provi.Jmol._default_applet) == 'undefined' ){
        Provi.Jmol._default_applet = this;
        Provi.Jmol.add_applet(this.name_suffix, this);
        $(Provi.Jmol).triggerHandler( 'default_applet_change' );
    }else{
        Provi.Jmol.add_applet(this.name_suffix, this);
    }
    
};
Provi.Jmol.Applet.prototype = /** @lends Provi.Jmol.Applet.prototype */ {
    default_params: {
        width: "100%",
        height: "100%",
        css_class: 'jmol_applet',
        sync_id: ("" + Math.random()).substring(3)
    },
    _init: function(){
        this._create_html();
        this._create_dom();
        $(this.selection_manager).bind('select', $.proxy(this.select, this));
    },
    _delete: function(){
        var self = this;        
        $('#' + this.widget.data_id).empty();
        this.script_callback('provi_selection = {}; provi_data = {};', {}, function(){
            $(self).triggerHandler('delete');
        });
    },
    _create_html: function(){
        this.html = "<applet " +
            "type=\"application/x-java-applet\" " +
            "name='jmol_applet_" + this.name_suffix + "' " +
            "id='" + this.id + "' " +
            "class='" + this.css_class + "' " +
            "code='JmolApplet' " +
            "archive='" + this.archive_path + "' " +
            "codebase='" + this.codebase + "' " +
            "width='" + this.width + "' " +
            "height='" + this.height + "' " +
            "mayscript='true'" +
        ">\n" +
            this._get_params(); +
        "</applet>\n";
    },
    _get_params: function(){
        params = {
            loadInline: '',
            script: '',
            name: "jmol_applet_" + this.name_suffix,
            archive: this.archive_path,
            mayscript: "true",
            codebase: this.codebase,
            code: "JmolApplet",
            appletReadyCallback: "jmol_applet_ready_callback",
            animFrameCallback: "jmol_anim_frame_callback",
            loadStructCallback: "jmol_load_struct_callback",
            pickCallback: "jmol_pick_callback",
            // hoverCallback: "jmol_hover_callback",
            boxbgcolor: "white",
            boxfgcolor: "white",
            progresscolor: "lightgreen",
            progressbar: "true",
            syncId: this.default_params.sync_id,
            boxmessage: "Downloading Jmol Applet ...",
            java_arguments: "-Xmx1024m"
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
    set_loaded: function(){
        if( this.loaded || this._determining_load_status  ) return;
        this._determining_load_status = true;
        console.log('done loading');
        this._load();
    },
    _prepare_script: function( script, params ){
        params = _.defaults( params || {}, {
            maintain_selection: false,
            echo_message: "",
            try_catch: false
        });
        if( !script ) script = '';
        if(params.maintain_selection){
            script = '' +
                'save selection provi_tmp; ' +
                script + ' ' +
                'restore selection provi_tmp;' +
            '';
        }
        if(false && params.echo_message){
            script = 'set echo top left; font echo 20 sansserif;color echo red; ' +
                'echo "' + message + '";' + script + ' set echo off;';
        }
        if(params.try_catch){
            // script = 'try{ ' + script + ' }catch(e){ javascript "jmol_error(\'" + e + "\')"; }';
            script = 'try{ ' + script + ' }catch(){}';
        }
        return script;
    },
    _script: function(script, params){
        var self = this;
        script = this._prepare_script( script, params );
        try{
            self.applet.script( script );
        }catch(e){
            console.error('Jmol.script ERROR', e, script);
        }
        return true;
    },
    /**
     * executes a jmol asynchronously
     */
    script: function(script, params){
        if(this.loaded || params.force){
            return this._script(script, params);
        }else{
            console.warn('Jmol script DEFERED');
            var self = this;
            $(this).bind('load', function(){
                self.script(script, params);
            });
            return -1;
        }
    },
    script_callback: function(script, params, callback){
        var id = Provi.Utils.uuid();
        script += '; ' +
            'var js = "jmol_script_callback(\'' + id + '\')"; ' +
            'print "callback ' + id + '"; ' +
            'javascript @js;' + 
        '';
        var handler = function(e, script_id){
            if( id==script_id ){
                if(!callback){
                    console.error('missing callback', script, params);
                }else{
                    callback();
                }
                $(Provi.Jmol).unbind('script_callback', handler);
            }
        }
        $(Provi.Jmol).bind('script_callback', handler);
        if(this.loaded || params.force){
            return this._script(script, params);
        }else{
            $(this).bind('load', _.bind( function(){
                  this.script(script, params);
            }, this ) );
            return -1;
        }
    },
    _load: function(){
        var self = this;
        var prevent_cache = '?_id=' + (new Date().getTime());
        var s = '' +
            'cache remove all; ' +
            'script "../data/jmol_script/provi.jspt' + prevent_cache + '"; ' +
            'provi_init();' +
        '';
        this.script_callback(s, { force: true }, function(){
            self.loaded = true;
            console.log("applet loaded");
            $(self).triggerHandler('load');
        });
    },
    get_property: function(property, value){
        if(!value) value = '';
        if(this.loaded){
            try{
                return this.applet.getProperty(property, value);
            }catch(e){
                console.error('ERROR', e);
                return false;
            }
        }
        return false;
    },
    get_property_as_json: function(property, value){
        if(!value) value = '';
        if(this.loaded){
            try{
                return $.parseJSON( this.applet.getPropertyAsJSON(property, value) + '' );
            }catch(e){
                console.error('ERROR', e);
            }
        }
        return '';
    },
    get_property_as_string: function(property, value){
        if(!value) value = '';
        console.warn('get_property_as_string', property, value);
        if(this.loaded){
            try{
                return this.applet.getPropertyAsString(property, value) + '';
            }catch(e){
                console.error('ERROR', e);
            }
        }
        return '';
    },
    get_property_as_array: function(property, value){
        if(!value) value = '';
        if(this.loaded){
            try{
                return this.get_property_as_json(property, value)[ property ];
            }catch(e){
                console.error('ERROR', e);
            }
        }
        return {};
    },
    evaluate: function(molecular_math){
        if(!this.loaded) return false;
        // from Jmol.js
        var result = "" + this.get_property("evaluate", molecular_math);
        if( result == 'ERROR' ){
            console.error('ERROR evaluate: ', molecular_math, result);
            return false;
        }
        if( result == "true" ) return true;
        if( result == "false" ) return false;
        var s = result.replace(/\-*\d+/,"")
        if (s == "" && !isNaN(parseInt(result))) return parseInt(result);
        var s = result.replace(/\-*\d*\.\d*/,"")
        if (s == "" && !isNaN(parseFloat(result))) return parseFloat(result);
        return result;
    },
    atoms_property_map: function( format, selection, first, sort_column ){
        if(first){
            var ev = '"[" + {' + selection + '}[1].label("[' + format + ']").join(",") + "]"';
        }else{
            var ev = '"[" + {' + selection + '}.label("[' + format + ']").join(",") + "]"';
        }
        var map = this.evaluate(ev);
        try{
            map = eval(map);
        }catch(e){
            console.error('get_atom_property_map ERROR', map, format, selection);
        }
        return map;
    },
    /** Triggers the {@link Provi.Jmol.Applet#anim_frame} event. */
    _anim_frame_callback: function( frameNo, fileNo, modelNo, firstNo, lastNo, isAnimationRunning, animationDirection, currentDirection ){
           console.log(frameNo, fileNo, modelNo, firstNo, lastNo, isAnimationRunning, animationDirection, currentDirection);
        $(this).triggerHandler('anim_frame', [ frameNo, fileNo, modelNo, firstNo, lastNo, isAnimationRunning, animationDirection, currentDirection ]);
    },
    /** Triggers the {@link Provi.Jmol.Applet#load_struct} event. */
    _load_struct_callback: function( fullPathName, fileName, modelName, ptLoad, previousCurrentModelNumberDotted, lastLoadedModelNumberDotted ){
        //console.log( fullPathName, fileName, modelName, ptLoad, previousCurrentModelNumberDotted, lastLoadedModelNumberDotted );
        $(this).triggerHandler('load_struct', [ fullPathName, fileName, modelName, ptLoad, previousCurrentModelNumberDotted, lastLoadedModelNumberDotted ]);
    },
    _pick_callback: function( info, id ){
           console.log( 'pick_callback', info, id );
        // [ARG]193:B.CZ #4197 40.248 -4.2279997 38.332996
        var parsedInfo = /\[\w+\](\d+):(\w+)\.(\w+)\/?(\d\.\d)? .*/.exec(info);
        var chain = parsedInfo[2];
        var res = parsedInfo[1];
        var atom = parsedInfo[3];
        console.log(parsedInfo, chain, res, atom);
        $(this).triggerHandler('pick', [info, id]);
    },
    _hover_callback: function( info, id, x, y, z ){
        $(this).triggerHandler('hover', [info, id]);
    },
    _applet_ready_callback: function( status, applet ){
        console.log(status);
        if( status ){
            this.applet = applet;
            this.set_loaded();
        }
        $(this).triggerHandler('ready', [ status ]);
    },
    large_atom_count: function(){
        return this.evaluate( 'provi_get("largeAtomCount");' );
    }
};


/**
 * Jmol widget class
 * @constructor
 */
Provi.Jmol.JmolWidget = function(params){
    params = _.defaults( params, this.default_params );
    Widget.call( this, params );
    this.applet = new Provi.Jmol.Applet(params);
    this.applet.widget = this;
    this.applet_parent_id = this.id + '_applet';
    this.more_id = this.id + '_more';
    this.data_id = this.id + '_data';
    this.picking_id = this.id + '_picking';
    this.delete_id = this.id + '_delete';
    var content =
        '<div id="' + this.applet_parent_id + '" style="overflow:hidden; position:absolute; top:0px; bottom:32px; width:100%;"></div>' +

        '<div class="" style="overflow:hidden; background:lightyellow; position:absolute; height:20px; padding:6px; bottom:0px; left:0px; right:0px;">' +
            '<span>Applet: ' + this.applet.name_suffix + '</span>' +
            '<span style="margin-left:20px; margin-right:10px; overflow:hidden;">Data: <span id="' + this.data_id + '" ></span></span>' +
            '<span style="position:absolute; right:26px; top:3px;">' +
                '<select id="' + this.picking_id + '" class="ui-state-default">' +
                    '<option value=""></option>' +
                    '<option value="atom">select atom</option><option value="group">select group</option>' +
                    '<option value="chain">select chain</option><option value="molecule">select molecule</option>' +
                '</select>' +
            '</span>' +
            '<span title="delete" class="ui-icon ui-icon-trash" style="cursor:pointer; position:absolute; right:6px; top:6px;" id="' + this.delete_id + '">delete</span>' +
        '</div>';
    $(this.dom).append( content );
    $(this.dom).addClass('ui-jmol')
    $(this.dom).removeClass( 'ui-container ui-widget' );
    
    $('#' + this.applet_parent_id).append( this.applet.dom );
    
    var self = this;
    $('#' + this.picking_id).bind('click change', function(){
        var picking = $('#' + self.picking_id).children("option:selected").val();
        self.applet.script( 'set picking ' + picking + ';' );
    });
    
    
    $('#' + this.delete_id).qtip({ position: {my: 'right center', at: 'left center'} }).click(function(){
        $(this).trigger('mouseout');
        $(self.dom).hide();
        $(self.dom).appendTo('#trash');
        Provi.Jmol.remove_applet( self.applet.name_suffix );
        //layout_main();
    });
    
    if( params.no_data_info ){
        $('#' + this.data_id).parent().hide();
    }
    
    if( !params.no_grid_widget ){

        this.datalist_list = [];
        var datalist_classes = [
            Provi.Bio.AtomSelection.GroupindexDatalist,
            Provi.Bio.AtomSelection.ChainlabelDatalist,
            Provi.Bio.AtomSelection.ModelindexDatalist,
            Provi.Bio.AtomSelection.VariableDatalist,
            Provi.Bio.AtomSelection.StrucnoDatalist,
            // Provi.Bio.HydrogenBonds.HbondsDatalist,
            Provi.Bio.AtomSelection.AtomindexDatalist,
            Provi.Bio.Isosurface.IsosurfaceDatalist
            // Provi.Bio.Helix.HelixorientDatalist,
            // Provi.Bio.Helix.HelixcrossingDatalist
        ];
        _.each( datalist_classes, _.bind( function( cl ){
            this.datalist_list.push( new cl({ 
                applet: this.applet, sele: "*", load_struct: true 
            }));
        }, this ));

        this.grid_widget = new Provi.Widget.Grid.GridWidget({
            parent_id: Provi.defaults.dom_parent_ids.SELECTION_WIDGET,
            datalist: this.datalist_list[0],
            datalist_list: "all"
        });

        this.job_datalist = new Provi.Data.Job.JobDatalist({ applet: this.applet });
        this.job_widget = new Provi.Widget.Grid.GridWidget({
            parent_id: Provi.defaults.dom_parent_ids.JOBS_WIDGET,
            datalist: this.job_datalist,
            heading: "Jobs",
            grid_height: "300px"
        });

        this.settings_datalist = new Provi.Jmol.Settings.SettingsDatalist({ applet: this.applet });
        this.settings_widget = new Provi.Widget.Grid.GridWidget({
            parent_id: Provi.defaults.dom_parent_ids.SETTINGS_WIDGET,
            datalist: this.settings_datalist
        });
    }
    
    if( !params.no_plot_widget ){
        this.plot_widget = new Provi.Jmol.Analysis.PlotWidget({
            parent_id: Provi.defaults.dom_parent_ids.SELECTION_WIDGET,
            applet: this.applet
        });
    }
};
Provi.Jmol.JmolWidget.prototype = Utils.extend(Widget, /** @lends Provi.Jmol.JmolWidget.prototype */ {
    default_params: {
        parent_id: undefined,
        no_grid_widget: false,
        no_data_info: true
    }
});


/**
 * A widget to select a jmol applet
 * @constructor
 */
Provi.Jmol.JmolAppletSelectorWidget = function(params){
    params = _.defaults( params, this.default_params );
    Provi.Widget.Widget.call( this, params );
    this._init_eid_manager([ "selector" ]);

    var p = [ 
        "applet", "new_jmol_applet_parent_id", "show_default_applet",
        "allow_new_applets"
    ];
    _.extend( this, _.pick( params, p ) );

    var template = '' +
        '<span class="control_row">' +
            '<label for="${eids.selector}">Jmol applet:</label>' +
            '<select id="${eids.selector}" class="ui-state-default"></select>' +
        '</span>' +
    '';
    
    this.add_content( template, params );
    this._init();
};
Provi.Jmol.JmolAppletSelectorWidget.prototype = Utils.extend(Widget, {
    default_params: {
        show_default_applet: true,
        tag_name: 'span'
    },
    _update: function(){
        var elm = this.elm("selector");
        var value = elm.children("option:selected").val();
        var default_applet_name = '';
        var applet = Provi.Jmol.get_default_applet();
        if(applet){
            default_applet_name = ' (' + applet.name_suffix + ')';
        }
        if( !value ){
            value = "default";
        }
        elm.empty();
        elm.append(
            (this.show_default_applet ? '<option value="default">default' + default_applet_name + '</option>' : '' ) +
            (this.allow_new_applets ? '<option value="new">new</option><option value="new once">new once</option>' : '')
        );
        var applet_list = Provi.Jmol.get_applet_list();
        _.each(applet_list, function( applet ){
            elm.append("<option value='" + applet.name_suffix + "'>" + applet.name_suffix + "</option>");
        });
        elm.val( value );
        $(this).triggerHandler('change');
        
        // hide applet selector, if only one option is available
        if( !this.allow_new_applets && applet_list.length <= 1 ){
            this.hide();
        }else{
            this.show();
        }
    },
    _init: function(){
        this._update();
        $(Provi.Jmol).bind(
            'applet_list_change', _.bind( this._update, this )
        );
        this.elm("selector").change( _.bind( function(){
            console.log( 'CHANGE_SELECTED' );
            $(this).triggerHandler('change_selected', [ this.get_value(true) ]);
        }, this ) );
        $(Provi.Jmol).bind(
            'default_applet_change', _.bind( this._update, this )
        );
        Provi.Widget.Widget.prototype.init.call(this);
    },
    get_value: function( do_not_force_new ){
        var applet_name = this.elm("selector").children("option:selected").val();
        if(applet_name == 'default'){
            return Provi.Jmol.get_default_applet( !do_not_force_new );
        }else if( !do_not_force_new &&
                  (applet_name == 'new' || applet_name == 'new once') ){
            var jw = new Provi.Jmol.JmolWidget({
                parent_id: this.new_jmol_applet_parent_id
            });
            if(applet_name == 'new once'){
                this.elm("selector").val( jw.applet.name_suffix );
            }
            return jw.applet;
        }else{
            return Provi.Jmol.get_applet(applet_name);
        }
    },
    set_value: function( value ){
        this.elm("selector").val( value );
    }
});



})();
