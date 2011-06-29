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
    java_arguments: "-Xmx512M"
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
    console.log( 'jmol_load_struct_callback', Provi.Jmol.get_applet_by_id( applet_name+'' ).evaluate('_modelNumber') );
    Provi.Jmol.get_applet_by_id( applet_name+'' )._load_struct_callback( fullPathName+'', fileName+'', modelName+'', ptLoad+'', previousCurrentModelNumberDotted+'', lastLoadedModelNumberDotted+'' );
};

/**
 * Function to delegate a jmol message callback to the corresponding applet wrapper.
 * Also available as a global function because Jmol would not accept it otherwise.
 * @memberOf Provi.Jmol
 */
var jmol_message_callback = function(applet_name, msg1, msg2, msg3, msg4){
    //console.log( applet_name+'', msg1+'', msg2+'', msg3+'', msg4+'' );
    Provi.Jmol.get_applet_by_id( applet_name+'' )._message_callback( msg1+'', msg2+'', msg3+'', msg4+'' );
};

/**
 * Function to delegate a jmol script callback to the corresponding applet wrapper.
 * Also available as a global function because Jmol would not accept it otherwise.
 * @memberOf Provi.Jmol
 */
var jmol_script_callback = function(applet_name, status, message, millisec, errorUntranslated){
    //console.log( applet_name+'', status+'', message+'', millisec+'', errorUntranslated+'' );
    Provi.Jmol.get_applet_by_id( applet_name+'' )._message_callback( status+'', message+'', millisec+'', errorUntranslated+'' );
};

/**
 * Function to delegate a jmol pick callback to the corresponding applet wrapper.
 * Also available as a global function because Jmol would not accept it otherwise.
 * @memberOf Provi.Jmol
 */
function jmol_pick_callback (applet_name, info, id){
    console.log('foo');
    //console.log( applet_name+'', info+'', id+'' );
    Provi.Jmol.get_applet_by_id( applet_name+'' )._pick_callback( info+'', id+'' );
};



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
Provi.Jmol._applet_dict.size = Utils.object_size_fn;




/**
 * Fired when an applet is fully loaded
 *
 * @name Provi.Jmol.Applet#load
 * @event
 * @param {object} event A jQuery event object.
 */

/**
 * Fired when there is a change in the display or composition of Jmol frames.
 *
 * @name Provi.Jmol.Applet#anim_frame
 * @event 
 * @param {object} event A jQuery event object.
 * @param {string} frameNo The current frame index number (starting with 0).
 * @param {string} fileNo The current file number (starting with 1)
 * @param {string} modelNo The current model number within the current file (starting with 1)
 * @param {string} firstNo The first frame of the animation range, expressed as fileNo x 1000000 + modelNo
 * @param {string} lastNo The last frame of the animation range, expressed as fileNo x 1000000 + modelNo
 * @param {string} isAnimationRunning 0 (animation is off) or 1 (animation is on)
 * @param {string} animationDirection The current animation direction, either 1 or -1
 * @param {string} currentDirection The current direction, either 1 (forward) or -1 (reverse)
 */

/**
 * Fired when a structure is loaded into Jmol.
 *
 * @name Provi.Jmol.Applet#load_struct
 * @event
 * @param {object} event A jQuery event object.
 * @param {string} fullPathName The URL of the loaded file (full path+filename). 
 * @param {string} fileName The filename of the loaded file (without the path). 
 * @param {string} modelName The internal title of the model in the loaded file. 
 * @param {string} ptLoad A numeric code: 3 when the file loaded successfully, 0 when the model was zapped, -1 when the loading failed. 
 * @param {string} previousCurrentModelNumberDotted A text string with the frame number prior to loading the current model, in file.model syntax (for example, "3.1" or "1.1 - 3.31" if a whole range of models was framed). 
 * @param {string} lastLoadedModelNumberDotted A text string with the last frame number after loading the current model, in file.model syntax. 
 */



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
    this.selection_manager = new Provi.Selection.SelectionManager({ applet: this });
    
    this._init();
    if( typeof(Provi.Jmol._default_applet) == 'undefined' ){
	//Provi.Jmol.set_default_applet( this.name_suffix );
	Provi.Jmol._default_applet = this;
	Provi.Jmol.add_applet(this.name_suffix, this);
	$(Provi.Jmol).triggerHandler( 'default_applet_change' );
    }else{
	Provi.Jmol.add_applet(this.name_suffix, this);
    }
    
};
Provi.Jmol.Applet.prototype = /** @lends Provi.Jmol.Applet.prototype */ {
    default_params: {
	width: 300,
	height: 300,
	css_class: 'jmol_applet',
	sync_id: ("" + Math.random()).substring(3)
    },
    _init: function(){
	this._create_html();
	this._create_dom();
	$(this.selection_manager).bind('select', this.select);
    },
    select: function( e, selection, applet, selection_string ){
	applet.script_wait( 'selectionHalos On; select {' + selection_string + '};' );
    },
    _delete: function(){
	$('#' + this.widget.data_id).empty();
	$(this).triggerHandler('delete');
    },
    _create_html: function(){
        this.html = "<applet " +
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
        //var child = this._get_dom_elm(html);
        //if( typeof(this.dom_parent_id) != 'undefined' ){
        //    var dom_parent = document.getElementById(this.dom_parent_id);
        //}else{
        //    var dom_parent = window;
        //}
        //dom_parent.appendChild(child);
    },
    _get_params: function(){
        params = {
            loadInline: '',
	    //script: 'load ../data/3dqb.pdb;cartoon on;color cartoon structure',
	    //script: 'javascript "Jmol.set_applet_loaded(\\\"' + this.name_suffix + '\\\");"; ',
            //script: 'javascript "Provi.Jmol.set_applet_loaded(\\\"' + this.name_suffix + '\\\");"; unbind "_slideZoom"; set debug on;',
	    script:
		'javascript "Provi.Jmol.set_applet_loaded(\\\"' + this.name_suffix + '\\\");"; ' +
		(Provi.Debug.get_status() ? 'set debug on;' : ''),
	    //script: 'unbind "_slideZoom"; set debug on;',
            boxbgcolor: "white",
            boxfgcolor: "black",
            progresscolor: "lightgreen",
            progressbar: "true",
	    syncId: this.default_params.sync_id,
	    boxmessage: "Downloading JmolApplet ...",
	    java_arguments: "-Xmx512m -Ddisplay.speed=fps"
        };
        var t = "";
        for (var i in params)
            if(params[i]!="")
                t+="  <param name='"+i+"' value='"+params[i]+"' />\n";
	//console.log(t);
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
    },
    set_loaded: function(){
	if( this.loaded || this._determining_load_status  ) return;
	this._determining_load_status = true;
	var self = this;
	var count = 0;
	//console.log('pause start');
	//Utils.pause(5000);
	//console.log('pause end');
	Utils.wait(100,
            function(){
		console.log(count, ' count');
		if(count > 200) return true;
		++count;
                var applet = self.applet;
		//console.log(typeof(applet.script), $.isFunction(applet.script), typeof(applet.isActive), applet.isActive());
		console.log(count);
                if(applet &&
		   //typeof(applet.isActive) == 'function' && applet.isActive() &&
		   ($.isFunction(applet.script) || typeof(applet.script) == 'function' ) &&
		   ($.isFunction(applet.scriptWait) || typeof(applet.scriptWait) == 'function' ) &&
		   ($.isFunction(applet.getPropertyAsJSON) || typeof(applet.getPropertyAsJSON) == 'function' ) ){
		    return true;
                }else{
                    return false;
                }
            },
            function(){
		console.log('done loading');
		self._load();
            }
        );
    },
    _evalJSON: function(s,key){
	// from Jmol.js
	s=s+"";
	if(!s)return [];
	if(s.charAt(0)!="{"){
	       if(s.indexOf(" | ")>=0)s=s.replace(/\ \|\ /g, "\n");
	       return s;
	}
	
	try{
	    var A = eval("("+s+")");
	}catch(e){
	    console.log('evalJSON ERROR', e, s, key);
	}
	
	if(!A){
	    return undefined;
	}
	if(key && A[key]){
	    A=A[key];
	}
	return A;
    },
    _script: function(script, maintain_selection){
	if(maintain_selection) script = 'save selection tmp; ' + script + ' restore selection tmp;';
	try{
	    this.applet.script( script );
	}catch(e){
	    console.log(e, script);
	}
	return true;
    },
    /**
     * executes a jmol asynchronously
     */
    script: function(script, maintain_selection){
	if(this.loaded){
	    return this._script(script, maintain_selection);
	}else{
	    //console.log('defered');
	    var self = this;
	    $(this).bind('load', function(){ self.script(script, maintain_selection) });
	    return -1;
	}
    },
    _script_wait: function(script, maintain_selection){
	if(maintain_selection) script = 'save selection tmp; ' + script + ' restore selection tmp;';
	
	try{
	    var ret = this.applet.scriptWait(script);
	}catch(e){
	    console.log('scriptWait ERROR', e, script);
	}
	
	var s = ""
	if( ret ){
	    for(var i=ret.length;--i>=0;){
		for(var j=0;j< ret[i].length;j++){
		    s+=ret[i][j]+"\n"
		}
	    }
	}
	return s;
    },
    /**
     * executes a jmol script synchronously
     */
    script_wait: function(script, maintain_selection){
	//console.log( 'SCRIPT: ' + script );
	if(this.loaded){
	    return this._script_wait(script, maintain_selection);
	}else{
	    console.log('defered');
	    var self = this;
	    $(this).bind('load', function(){ self.script_wait(script, maintain_selection) });
	    return -1;
	}
    },
    _script_wait_output: function(script, maintain_selection){
	if(maintain_selection) script = 'save selection tmp; ' + script + ' restore selection tmp;';
	
	try{
	    var ret = this.applet.scriptWaitOutput(script);
	}catch(e){
	    console.log('scriptWaitOutput ERROR', e, script);
	}
	
	// remove first line and last two lines then return
	return ret.split('\n').slice(1,-3).join('\n')
    },
    /**
     * executes a jmol script synchronously and returns the output
     */
    script_wait_output: function(script, maintain_selection){
	//console.log( 'SCRIPT: ' + script );
	if(this.loaded){
	    //return this._script_wait_output(script, maintain_selection);
	    return this._script_wait_output(script, maintain_selection);
	}else{
	    console.log('defered');
	    var self = this;
	    $(this).bind('load', function(){ self.script_wait_output(script, maintain_selection) });
	    return -1;
	}
    },
    _load_inline: function(model, script, maintain_selection){
	script = typeof(script) != 'undefined' ? script : '';
	if(maintain_selection) script = 'save selection tmp; ' + script + ' restore selection tmp;';
	return this.applet.loadInlineString(model, script, false);
    },
    /**
     * loads a model given as a string, can execute a script afterwards
     */
    load_inline: function(model, script, maintain_selection){
	if(this.loaded){
	    return this._load_inline(model, script, maintain_selection);
	}else{
	    //console.log('defered');
	    var self = this;
	    $(this).bind('load', function(){ self.load_inline(model, script, maintain_selection) });
	    return -1;
	}
    },
    _load: function(){
	this.applet.script('set AnimFrameCallback "jmol_anim_frame_callback";');
	this.applet.script('set LoadStructCallback "jmol_load_struct_callback";');
	this.applet.script('set MessageCallback "jmol_message_callback";');
	this.applet.script('set ScriptCallback "jmol_script_callback";');
	this.applet.script('set PickCallback "jmol_pick_callback";');
	this.loaded = true;
	$(this).triggerHandler('load');
    },
    get_property: function(property, value){
	if(this.loaded) return this.applet.getProperty(property, value);
	return false;
    },
    get_property_as_json: function(property, value){
        if(this.loaded) return this.applet.getPropertyAsJSON(property, value) + '';
	return false;
    },
    get_property_as_string: function(property, value){
        if(this.loaded) return this.applet.getPropertyAsString(property, value) + '';
	return false;
    },
    get_property_as_array: function(property, value){
        if(this.loaded) return this._evalJSON( this.get_property_as_json(property, value), property );
	return false;
    },
    evaluate: function(molecular_math){
	if(!this.loaded) return false;
	// from Jmol.js
	var result = "" + this.get_property("evaluate", molecular_math);
	if( result == 'ERROR' ){
	    console.log('evaluate: ', molecular_math, result);
	}
	var s = result.replace(/\-*\d+/,"")
	if (s == "" && !isNaN(parseInt(result))) return parseInt(result);
	var s = result.replace(/\-*\d*\.\d*/,"")
	if (s == "" && !isNaN(parseFloat(result))) return parseFloat(result);
	return result;
    },
    atoms_property_map: function( format, selection ){
	//this.script_wait('show SELECTED;'); // needed, otherwise 'evaluate' sometimes chokes on the 'selected' variable
	//console.log(this.applet.evaluate('"[" + {' + 'selected' + '}.label("[' + format + ']").join(",") + "]"'));
	var map = this.evaluate('"[" + {' + selection + '}.label("[' + format + ']").join(",") + "]"');
	//console.log(map);
	try{
	    map = eval(map);
	}catch(e){
	    console.log('get_atom_property_map ERROR', map, format, selection);
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
	console.log('_load_struct_callback', 'XYZ');
	//setTimeout( function(){ console.log(self.evaluate('_lastFrame'), self.evaluate('_modelNumber')); }, 500 );
	console.log( fullPathName, fileName, modelName, ptLoad, previousCurrentModelNumberDotted, lastLoadedModelNumberDotted );
	$(this).triggerHandler('load_struct', [ fullPathName, fileName, modelName, ptLoad, previousCurrentModelNumberDotted, lastLoadedModelNumberDotted ]);
    },
    _message_callback: function( msg1, msg2, msg3 ){
	//console.log(msg1, msg2, msg3);
	$(this).triggerHandler('message', [ msg1, msg2, msg3 ]);
    },
    _script_callback: function( status, message, millisec, errorUntranslated ){
	//console.log(status, message, millisec, errorUntranslated);
	$(this).triggerHandler('script', [ status, message, millisec, errorUntranslated ]);
    },
    _pick_callback: function( info, id ){
	console.log( 'pick_callback', info, id );
	// [ARG]193:B.CZ #4197 40.248 -4.2279997 38.332996
	var parsedInfo = /\[\w.+\](\d+):([\w\d]+)\.(\w+) .*/.exec(info);
	var chain = parsedInfo[2];
	var res = parsedInfo[1];
	var atom = parsedInfo[3];
	console.log(chain, res, atom);
	//return;
	//this.selection_manager.select( 'resNo=' + res + ' ' + (chain ? 'and chain=' + chain : '') + ' and atomname=' + atom );
	//this.selection_manager.select( 'resNo=' + res + (chain ? ' and chain=' + chain : '') );
	//var sele = new Selection({ selection: 'resNo=' + res + (chain ? ' and chain=' + chain : ''), applet: this });
	//sele.select();
	//this.script_wait('show SELECTED;');
	$(this).triggerHandler('pick', [info, id]);
    },
    get_smcra: function(selection){
	return Provi.Bio.Sequence.jmol_to_smcra( this, selection );
    }
};


/**
 * Jmol widget class
 * @constructor
 */
Provi.Jmol.JmolWidget = function(params){
    params = $.extend( Provi.Jmol.JmolWidget.prototype.default_params, params );
    Widget.call( this, params );
    this.applet = new Provi.Jmol.Applet(params);
    this.applet.widget = this;
    this.applet_parent_id = this.id + '_applet';
    this.more_id = this.id + '_more';
    this.data_id = this.id + '_data';
    this.delete_id = this.id + '_delete';
    this.sequence_view_id = this.id + '_sequence_view';
    var content =
	'<div id="' + this.applet_parent_id + '" style="overflow:hidden; position:absolute; top:0px; bottom:32px; width:100%;"></div>' +
	'<div id="' + this.sequence_view_id + '" class="" style="overflow:auto; background:lightblue; position:absolute; height:62px; margin-bottom:0px; padding:6px; bottom:32px; left:0px; right:0px;">' +
	    //'<span>Sequence&nbsp;view&nbsp;Sequence&nbsp;view&nbsp;Sequence&nbsp;view&nbsp;Sequence&nbsp;view&nbsp;Sequence&nbsp;view&nbsp;Sequence&nbsp;view&nbsp;Sequence&nbsp;view&nbsp;Sequence&nbsp;view&nbsp;Sequence&nbsp;view&nbsp;Sequence&nbsp;view&nbsp;Sequence&nbsp;view&nbsp;Sequence&nbsp;view&nbsp;Sequence&nbsp;view&nbsp;Sequence&nbsp;view&nbsp;Sequence&nbsp;view&nbsp;Sequence&nbsp;view&nbsp;</span>' +
	'</div>' +
	'<div class="" style="overflow:hidden; background:lightyellow; position:absolute; height:20px; padding:6px; bottom:0px; left:0px; right:0px;">' +
	    '<span title="more views" class="ui-icon ui-icon-triangle-1-e" id="' + this.more_id + '"></span>&nbsp;' +
	    '<span>Applet: ' + this.applet.name_suffix + '</span>' +
	    '<span style="margin-left:20px; margin-right:10px; overflow:hidden;">Data: <span id="' + this.data_id + '" ></span></span>' +
	    '<span title="delete" class="ui-icon ui-icon-trash" style="cursor:pointer; position:absolute; right:6px; top:6px;" id="' + this.delete_id + '">delete</span>' +
	'</div>';
    $(this.dom).append( content );
    $(this.dom).addClass('ui-jmol')
    $(this.dom).removeClass( 'ui-container ui-widget' );
    
    //$(this.dom).height( typeof(params.height) != 'undefined' ? params.height : '100%' );
    //$(this.dom).width( typeof(params.width) != 'undefined' ? params.width : '100%' );
    //$(this.dom).css('position', 'inherit');
    $('#' + this.applet_parent_id).append( this.applet.dom );
    
    var self = this;
    $('#' + this.delete_id).tipsy({ gravity: 'e' }).click(function(){
	$(this).trigger('mouseout');
	$(self.dom).hide();
	$(self.dom).appendTo('#trash');
	Provi.Jmol.remove_applet( self.applet.name_suffix );
	
	//layout_main();
    });
    
    //$('#' + this.sequence_view_id).hide();
    $('#' + this.more_id).tipsy({ gravity: 'w' }).click(function(){
	self.toggle_sequence_view();
    });
    
    if( !params.no_sequence_view_widget ){
	this.sequence_view = new Provi.Bio.Sequence.SequenceViewWidget({
	    parent_id: this.sequence_view_id,
	    applet: this.applet
	});
    }else{
	self.toggle_sequence_view();
	$('#' + this.more_id).remove();
    }
    
    if( !params.no_selection_manager_widget ){
	this.selection_manager = new Provi.Selection.SelectionManagerWidget({
	    parent_id: Provi.defaults.dom_parent_ids.SELECTION_WIDGET,
	    selection_manager: this.applet.selection_manager,
	    applet: this.applet
	});
    }
    
    if( !params.no_tree_view_widget ){
	this.tree_widget = new Provi.Bio.Sequence.TreeViewWidget({
	    parent_id: Provi.defaults.dom_parent_ids.SELECTION_WIDGET,
	    applet: this.applet
	});
    }
    
    $('#' + this.more_id).trigger('click');
//    $(this.dom).resizable({
//	stop: layout_main
//    });
    layout_main();
};
Provi.Jmol.JmolWidget.prototype = Utils.extend(Widget, /** @lends Provi.Jmol.JmolWidget.prototype */ {
    default_params: {
        parent_id: null,
	no_sequence_view_widget: false,
	no_selection_manager_widget: false,
	no_tree_view_widget: false
    },
    toggle_sequence_view: function(){
	$('#' + this.more_id).toggleClass('ui-icon-triangle-1-e').toggleClass('ui-icon-triangle-1-n');
	if( $('#' + this.sequence_view_id).is(':visible') ){
	    $('#' + this.applet_parent_id).css('bottom', '32px');
	}else{
	    $('#' + this.applet_parent_id).css('bottom', '106px');
	}
	$('#' + this.sequence_view_id).toggle();
    }
});


/**
 * A widget to select a jmol applet
 * @constructor
 */
Provi.Jmol.JmolAppletSelectorWidget = function(params){
    this._jmol_applet = typeof(params.applet) != 'undefined' ? params.applet : null;
    this.new_jmol_applet_parent_id = params.new_jmol_applet_parent_id;
    this.show_default_applet = typeof(params.show_default_applet) != 'undefined' ? params.show_default_applet : true;
    params.tag_name = 'span';
    Widget.call( this, params );
    this.selector_id = this.id + '_applet';
    this.allow_new_applets = params.allow_new_applets;
    var content = '<span class="control_row">' +
            '<label for="' + this.selector_id + '">Jmol applet:</label>' +
            '<select id="' + this.selector_id + '" class="ui-state-default"></select>' +
        '</span>';
    $(this.dom).append( content );
    this._init();
};
Provi.Jmol.JmolAppletSelectorWidget.prototype = Utils.extend(Widget, /** @lends Provi.Jmol.JmolAppletSelectorWidget.prototype */ {
    _update: function(){
        var elm = $("#" + this.selector_id);
        var value = $("#" + this.selector_id + " option:selected").val();
	var default_applet_name = '';
	var applet = Provi.Jmol.get_default_applet();
	if(applet){
	    default_applet_name = ' (' + applet.name_suffix + ')';
	}
        elm.empty();
        elm.append(
	    (!this.show_default_applet && !this.allow_new_applets ? '<option value=""></option>' : '' ) +
            (this.show_default_applet ? '<option value="default">default' + default_applet_name + '</option>' : '' ) +
            (this.allow_new_applets ? '<option value="new">new</option><option value="new once">new once</option>' : '')
        );
        $.each(Provi.Jmol.get_applet_list(), function(){
            elm.append("<option value='" + this.name_suffix + "'>" + this.name_suffix + "</option>");
        });
        elm.val( value );
	elm.triggerHandler('change');
	//$(this).triggerHandler('change', [ this.get_value(true) ]);
    },
    _init: function(){
        this._update();
	var self = this;
        $(Provi.Jmol).bind('applet_list_change', function(){ self._update() });
	$('#' + this.selector_id).change( function(){
	    console.log( 'CHANGE_SELECTED' );
	    //$(self).triggerHandler('change_selected');
	    $(self).triggerHandler('change_selected', [ self.get_value(true) ]);
	});
	$(Provi.Jmol).bind('default_applet_change', function(){ self._update() });
    },
    get_value: function( do_not_force_new ){
        var applet_name = $("#" + this.selector_id + " option:selected").val();
        if(applet_name == 'default'){
	    return Provi.Jmol.get_default_applet( !do_not_force_new );
        }else if( !do_not_force_new &&
		  (applet_name == 'new' || applet_name == 'new once') ){
            var jw = new Provi.Jmol.JmolWidget({
                parent_id: this.new_jmol_applet_parent_id
            });
	    if(applet_name == 'new once'){
		$("#" + this.selector_id).val( jw.applet.name_suffix );
	    }
            return jw.applet;
        }else{
            return Provi.Jmol.get_applet(applet_name);
        }
    },
    set_value: function( value ){
	console.log( 'set_value ' + value );
	$("#" + this.selector_id).val( value );
    },
    change: function(fn){
	$("#" + this.selector_id).change(fn);
    }
});



/**
 * A widget to select a structure loading type
 * @constructor
 */
Provi.Jmol.JmolLoadAsSelectorWidget = function(params){
    Widget.call( this, params );
    this.target_selector_id = this.id + '_target';
    var content = '<div class="control_row">' +
	'<label for="' + this.target_selector_id + '">Structure loading type:</label>' +
	'<select id="' + this.target_selector_id + '" class="ui-state-default">' +
	    '<option value="new">new</option>' +
	    '<option value="append">append</option>' +
	    '<option value="trajectory">new trajectory</option>' +
	    '<option value="trajectory+append">append trajectory</option>' +
	'</select>' +
    '</div>';
    $(this.dom).append( content );
}
Provi.Jmol.JmolLoadAsSelectorWidget.prototype = Utils.extend(Widget, /** @lends Provi.Jmol.JmolLoadAsSelectorWidget.prototype */ {
    get_value: function(){
        return $("#" + this.target_selector_id + " option:selected").val();
    }
});


})();
