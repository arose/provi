
var jmol_anim_frame_callback = function( applet_name, frameNo, fileNo, modelNo, firstNo, lastNo, isAnimationRunning, animationDirection, currentDirection ){
    //console.log( applet_name+'' );
    Jmol.get_applet_by_id( applet_name+'' )._anim_frame_callback( frameNo+'', fileNo+'', modelNo+'', firstNo+'', lastNo+'', isAnimationRunning+'', animationDirection+'', currentDirection+'' );
    //console.log( frameNo+'', fileNo+'', modelNo+'', firstNo+'', lastNo+'', isAnimationRunning+'', animationDirection+'', currentDirection+'' );
};

var jmol_load_struct_callback = function(applet_name, url, get_params, msg, foo){
    Jmol.get_applet_by_id( applet_name+'' )._load_struct_callback( url+'', get_params+'', msg+'', foo+'' );
};


(function() {

/**
 * The global Jmol object
 * @name Jmol
 * @namespace
 */
Jmol = {
    default_dir: '.',
    default_jar: 'JmolAppletSigned.jar',
    archive_path: 'JmolAppletSigned0.jar',
    _applet_dict: {},
    _applet_list: [],
    _default_applet: undefined,
    init: function(codebase_directory){
	if( this.initialized ) return;
	this.initialized = true;
	this.codebase = typeof(codebase_directory) != 'undefined' ? codebase_directory : '.';
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
     * add an applet to the global list of applets
     */
    add_applet: function(name_suffix, applet){
        if( typeof(this._applet_dict[name_suffix]) != 'undefined' ){
            throw "name_suffix '" + name_suffix + "' is already in use";
        }
        this._applet_dict[name_suffix] = applet;
        this._applet_list.push(applet);
	this._applet_list_change();
    },
    get_applet_name_suffix: function(name_suffix){
	if( typeof(name_suffix) != 'undefined' ){
            if( typeof(this._applet_dict[name_suffix]) != 'undefined' ){
                throw "name_suffix '" + name_suffix + "' is already in use";
            }
        }else{
            name_suffix = this._applet_list.length;
        }
        return name_suffix;
    },
    set_applet_loaded: function(name_suffix){
	//console.log('set_applet_loaded', name_suffix);
	this.get_applet(name_suffix).set_loaded();
    },
    get_default_applet: function(){
	return this._default_applet;
    },
    set_default_applet: function(name_suffix){
	this._default_applet = this._applet_dict[name_suffix];
    },
    _on_applet_list_change_fn_list: [],
    on_applet_list_change: function(fn, fn_this){
	this._on_applet_list_change_fn_list.push( {fn: fn, fn_this: fn_this} );
    },
    _applet_list_change: function(){
        $.each(this._on_applet_list_change_fn_list, function(){
	    this.fn.call( this.fn_this );
	});
    }
};
Jmol._applet_dict.size = Utils.object_size_fn;

/**
 * Jmol Applet class
 * @name Jmol.Applet
 * @constructor
 */
var Applet = Jmol.Applet = function(params){
    var default_params = Applet.prototype.default_params;
    this.loaded = false;
    this.applet = null;
    this.name_suffix = Jmol.get_applet_name_suffix( params.name_suffix );
    this.id = "jmol_applet_" + this.name_suffix;
    this.width = typeof(params.width) != 'undefined' ? params.width : default_params.width;
    this.height = typeof(params.height) != 'undefined' ? params.height : default_params.height;
    this.css_class = typeof(params.css_class) != 'undefined' ? params.css_class : default_params.css_class;
    this.archive_path = Jmol.archive_path;
    this.codebase = Jmol.codebase;
    
    this._determining_load_status = false;
    this._on_load_fn_list = [];
    this._anim_frame_callback_fn_list = [];
    
    this._init();
    if( typeof(Jmol._default_applet) == 'undefined' ){
	//Jmol.set_default_applet( this.name_suffix );
	Jmol._default_applet = this;
    }
    Jmol.add_applet(this.name_suffix, this);
};
Applet.prototype = /** @lends Jmol.Applet.prototype */ {
    default_params: {
	width: 300,
	height: 300,
	css_class: 'jmol_applet',
	sync_id: ("" + Math.random()).substring(3)
    },
    _init: function(){
	this._create_html();
	this._create_dom();
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
            script: 'javascript "Jmol.set_applet_loaded(\\\"' + this.name_suffix + '\\\");";',
            boxbgcolor: "white",
            boxfgcolor: "black",
            progresscolor: "lightgreen",
            progressbar: "true",
	    syncId: this.default_params.sync_id,
	    boxmessage: "Downloading JmolApplet ...",
	    java_arguments: "-Xmx512m"
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
	$(e).css('min-width', '10px');
	$(e).css('min-height', '10px');
        this.dom = e;
	this.applet = e.firstChild;
	$(this.applet).css('min-width', '10px');
	$(this.applet).css('min-height', '10px');
    },
    dom: function(){
	return this.dom;
    },
    set_loaded: function(){
	if( this.loaded || this._determining_load_status  ) return;
	this._determining_load_status = true;
	var self = this;
	var count = 0;
	Utils.wait(1000,
            function(){
		//console.log(count, ' count');
		if(count > 20) return true;
                var applet = self.applet;
		//console.log(typeof(applet.script), $.isFunction(applet.script));
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
		//console.log('done loading');
                self.loaded = true;
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
	var A = eval("("+s+")");
	if(!A){
	    return undefined;
	}
	if(key && A[key]){
	    A=A[key];
	}
	return A;
    },
    _script: function(script){
	return this.applet.script(script);
    },
    /**
     * executes a jmol asynchronously
     */
    script: function(script){
	if(this.loaded){
	    return this._script(script);
	}else{
	    //console.log('defered');
	    this.on_load( this._script, this, [script] );
	    return -1;
	}
    },
    script_wait_json: function(script){
	return this.applet.scriptWait(script);
    },
    _script_wait: function(script){
	var ret = this.script_wait_json(script);
	ret = this._evalJSON( ret, "jmolStatus" );
	var s = ""
	for(var i=ret.length;--i>=0;){
	    for(var j=0;j< ret[i].length;j++){
		s+=ret[i][j]+"\n"
	    }
	}
	return s;
    },
    /**
     * executes a jmol script synchronously
     */
    script_wait: function(script){
	if(this.loaded){
	    return this._script_wait(script);
	}else{
	    //console.log('defered');
	    this.on_load( this._script_wait, this, [script] );
	    return -1;
	}
    },
    _load_inline: function(model, script){
	script = typeof(script) != 'undefined' ? script : '';
	return this.applet.loadInlineString(model, script, false);
    },
    /**
     * loads a model given as a string, can execute a script afterwards
     */
    load_inline: function(model, script){
	if(this.loaded){
	    return this._load_inline(model, script);
	}else{
	    //console.log('defered');
	    this.on_load( this._load_inline, this, [model, script] );
	    return -1;
	}
    },
    on_load: function(fn, fn_this, fn_args){
	this._on_load_fn_list.push( {fn: fn, fn_this: fn_this, fn_args: fn_args} );
    },
    _load: function(){
	this.applet.script('set AnimFrameCallback "jmol_anim_frame_callback"');
	this.applet.script('set LoadStructCallback "jmol_load_struct_callback"');
        $.each(this._on_load_fn_list, function(){
	    this.fn.apply( this.fn_this, this.fn_args );
	});
    },
    get_property: function(property, value){
	if(this.loaded){
	    return this.applet.getProperty(property, value);
	}
	return false;
    },
    get_property_as_json: function(property, value){
        return this.applet.getPropertyAsJSON(property, value) + '';
    },
    get_property_as_string: function(property, value){
        return this.applet.getPropertyAsString(property, value) + '';
    },
    get_property_as_array: function(property, value){
        return this._evalJSON( this.get_property_as_json(property, value), property );
    },
    evaluate: function(molecular_math){
	// from Jmol.js
	var result = "" + this.get_property("evaluate", molecular_math);
	var s = result.replace(/\-*\d+/,"")
	if (s == "" && !isNaN(parseInt(result))) return parseInt(result);
	var s = result.replace(/\-*\d*\.\d*/,"")
	if (s == "" && !isNaN(parseFloat(result))) return parseFloat(result);
	return result;
    },
    anim_frame_callback: function( fn ){
	this._anim_frame_callback_fn_list.push( fn );
    },
    _anim_frame_callback: function( frameNo, fileNo, modelNo, firstNo, lastNo, isAnimationRunning, animationDirection, currentDirection ){
	//console.log(frameNo, fileNo, modelNo, firstNo, lastNo, isAnimationRunning, animationDirection, currentDirection);
        $.each(this._anim_frame_callback_fn_list, function(){
	    this( frameNo, fileNo, modelNo, firstNo, lastNo, isAnimationRunning, animationDirection, currentDirection );
	});
    },
    _load_struct_callback: function( url, get_params, msg, foo ){
	//console.log( url, get_params, msg, foo );
    }
};


/**
 * Jmol widget class
 * @constructor
 */
JmolWidget = function(params){
    var default_params = JmolWidget.prototype.default_params;
    params.parent_id = typeof(params.parent_id) != 'undefined' ? params.parent_id : default_params.parent_id;
    Widget.call( this, params );
    this.applet = new Jmol.Applet(params);
    //$(this.dom).height( typeof(params.height) != 'undefined' ? params.height : '100%' );
    //$(this.dom).width( typeof(params.width) != 'undefined' ? params.width : '100%' );
    this.dom.appendChild( this.applet.dom );
};
JmolWidget.prototype = Utils.extend(Widget,{
    default_params: {
        parent_id: null
    }
});


/**
 * A widget to select a jmol applet
 * @constructor
 */
JmolAppletSelectorWidget = function(params){
    this._jmol_applet = typeof(params.applet) != 'undefined' ? params.applet : null;
    this.new_jmol_applet_parent_id = params.new_jmol_applet_parent_id;
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
JmolAppletSelectorWidget.prototype = Utils.extend(Widget,{
    _update: function(){
        var elm = $("#" + this.selector_id);
        var value = $("#" + this.selector_id + " option:selected").val();
        elm.empty();
        elm.append(
            '<option value="default">default</option>' +
            (this.allow_new_applets ? '<option value="new">new</option><option value="new once">new once</option>' : '')
        );
        $.each(Jmol.get_applet_list(), function(){
            elm.append("<option value='" + this.name_suffix + "'>" + this.name_suffix + "</option>");
        });
        elm.val( value );
	elm.triggerHandler('change');
    },
    _init: function(){
        this._update();
        Jmol.on_applet_list_change( this._update, this );
    },
    get_value: function( do_not_force_new ){
        var applet_name = $("#" + this.selector_id + " option:selected").val();
        if(applet_name == 'default'){
	    if( typeof(Jmol.get_default_applet()) == 'undefined' && !do_not_force_new ){
		return ( new JmolWidget({}) ).applet;
	    }else{
		return this._jmol_applet ? this._jmol_applet : Jmol.get_default_applet();
	    }
        }else if(applet_name == 'new' || applet_name == 'new once'){
            var jw = new JmolWidget({
                parent_id: this.new_jmol_applet_parent_id
            });
	    if(applet_name == 'new once'){
		$("#" + this.selector_id).val( jw.applet.name_suffix );
	    }
            return jw.applet;
        }else{
            return Jmol.get_applet(applet_name);
        }
    },
    change: function(fn){
	$("#" + this.selector_id).change(fn);
    }
});



/**
 * A widget to select a structure loading type
 * @constructor
 */
JmolLoadAsSelectorWidget = function(params){
    Widget.call( this, params );
    this.target_selector_id = this.id + '_target';
    var content = '<div class="control_row">' +
	'<label for="' + this.target_selector_id + '">Structure loading type:</label>' +
	'<select id="' + this.target_selector_id + '" class="ui-state-default">' +
	    '<option value="new">new</option>' +
	    '<option value="append">append</option>' +
	    '<option value="trajectory">new trajectory</option>' +
	'</select>' +
    '</div>';
    $(this.dom).append( content );
}
JmolLoadAsSelectorWidget.prototype = Utils.extend(Widget, /** @lends JmolLoadAsSelectorWidget.prototype */ {
    get_value: function(){
        return $("#" + this.target_selector_id + " option:selected").val();
    }
});


/**
 * A class that save items in historical order and provides access to them
 * @name HistoryManager
 * @constructor
 */
var HistoryManager = function() {
    this.curr = -1;
    this.entries = [];
}
// foo
HistoryManager.prototype = /** @lends HistoryManager.prototype */ {
    push: function(item) {
        if (this.entries.length && this.entries[0] == item) return;
        if (item.match(/^\s*$/)) return;
        this.entries.unshift(item);
        this.curr = -1;
    },
    scroll: function(direction) {
        var moveTo = this.curr + (direction == 'prev' ? 1 : -1);
        if (moveTo >= 0 && moveTo < this.entries.length) {
            this.curr = moveTo;
            return this.entries[this.curr];
        } else if (moveTo == -1) {
            this.curr = moveTo;
            return '';
        } else {
            return null;
        }
    }
};


/**
 * A class representing a console for a jmol applet
 * @name JmolConsole
 * @constructor
 */
var JmolConsole = function(input, log, applet){
    this.input = input;
    this.log = log;
    this.applet = applet;
    this._init();
}
JmolConsole.prototype = /** @lends JmolConsole.prototype */ {
    _init: function() {
        this.history = new HistoryManager();
        var self = this;
        this.input.keypress(function(event) {
            if (event.which == 13 && this.value) {
                try {
                    var cmd = this.value;
                    self.print('> ' + cmd);
                    var out = self.applet.script_wait(cmd);
                    if( out.search(/ERROR/) != -1 ){
                        var error = /.*ERROR: (.*)\n.*/.exec(out);
                        if(error.length){
                            self.print(error[1] , '#FF0000');
                        }else{
                            self.print(out , '#FF0000');
                        }
                    }else{
                        var echo = /.*scriptEcho,0,(.*)\n.*/.exec(out);
                        if(echo && echo.length){
                            self.print(echo[1] , 'green');
                        }
                    }
                } catch (e) {
                    self.print(e.toString(), '#ff0000');
                } finally {
                    self.history.push(cmd);
                    this.value = '';
                }
            }
        });
        
        this.input.keydown(function(event) {
            var valid = {38: 'prev', 40: 'next'};
            if (event.keyCode in valid) {
                var curr = self.history.scroll(valid[event.keyCode]);
                if (curr !== null) this.value = curr;
            }
        });
    },
    
    print: function (text, color) {
        this.log.append($('<div/>').css({'color': color || 'black', margin: 0, padding: 0}).text(text));
        this.log[0].scrollTop = this.log[0].scrollHeight;
    }
}


/**
 * A widget holding a jmol console and a jmol applet selector
 * @constructor
 */
JmolConsoleWidget = function(params){
    Widget.call( this, params );
    this.input_id = this.id + '_input';
    this.log_id = this.id + '_log';
    this.applet_selector_widget_id = this.id + '_applet';
    var content = '<div class="control_group">' +
	'<div class="control_row" id="' + this.applet_selector_widget_id + '"></div>' +
        '<label for="' + this.input_id + '">Execute a Jmol command (<a href="http://chemapps.stolaf.edu/jmol/docs/" target="_blank">docu</a>):</label>' +
        '<input type="text" id="' + this.input_id + '" class="ui-state-default" style="margin-top:0.2em; width:100%; border: 0px;"/>' +
        '<div id="' + this.log_id + '" style="overflow:auto; max-height:300px; min-height:150px; margin-top:10px;  padding: 2px;" class="ui-state-default ui-state-disabled"></div>' +
    '</div>';
    $(this.dom).append( content );
    this.applet_selector = new JmolAppletSelectorWidget({
        parent_id: this.applet_selector_widget_id,
        applet: params.applet
    });
    this.console = new JmolConsole( $('#'+this.input_id), $('#'+this.log_id), params.applet );
    this._init();
}
JmolConsoleWidget.prototype = Utils.extend(Widget, /** @lends JmolConsoleWidget.prototype */ {
    _init: function(){
	var self = this;
	this.applet_selector.change(function(event){
	    self.console.applet = self.applet_selector.get_value();
	});
    }
});


/**
 * A widget holding a global jmol controls
 * @constructor
 */
JmolGlobalControlWidget = function(params){
    this.sync_mouse = false;
    Widget.call( this, params );
    this.sync_mouse_id = this.id + '_sync_mouse';
    this.sync_orientation_id = this.id + '_sync_orientation';
    this.applet_selector_sync_orientation_id = this.id + '_applet_sync_orientation';
    var content = '<div class="control_group">' +
        '<div class="control_row">' +
            '<input id="' + this.sync_mouse_id + '" type="checkbox" style="float:left; margin-top: 0.0em;"/>' +
            '<label for="' + this.sync_mouse_id + '">sync mouse</label>' +
        '</div>' +
        '<div class="control_row">' +
            '<button id="' + this.sync_orientation_id + '">sync orientation</button>' +
            '<span id="' + this.applet_selector_sync_orientation_id + '"></span>' +
        '</div>' +
    '</div>';
    $(this.dom).append( content );
    this.applet_selector_sync_orientation = new JmolAppletSelectorWidget({
        parent_id: this.applet_selector_sync_orientation_id
    });
    this._init();
}
JmolGlobalControlWidget.prototype = Utils.extend(Widget, /** @lends JmolGlobalControlWidget.prototype */ {
    _init: function(){
	this.sync_mouse = $("#" + this.sync_mouse_id).is(':checked');
        this.update_sync_mouse();
        var self = this;
        
        $("#" + this.sync_mouse_id).bind('change', function() {
            self.sync_mouse = $("#" + self.sync_mouse_id).is(':checked');
            self.update_sync_mouse();
        });
        $("#" + this.sync_orientation_id).button().click(function() {
            self.sync_orientation();
        });
    },
    update_sync_mouse: function(){
        var s = '';
        if( this.sync_mouse ){
            s += 'sync * on; sync * "set syncMouse on";';
        }else{
            s += 'sync * off;';
        }
        var applet = Jmol.get_default_applet();
        if(applet){
            applet.script(s);
        }
    },
    sync_orientation: function(){
        var applet = this.applet_selector_sync_orientation.get_value();
        if(applet){
            var s = 'sync * on;';
            s += 'sync > "' + applet.get_property_as_array('orientationInfo').moveTo.replace(/1\.0/,"0") + '";';
            s += 'sync * off;';
            applet.script(s);
        }
        this.update_sync_mouse();
    }
});


/**
 * A widget holding jmol display related controls
 * @constructor
 */
JmolDisplayWidget = function(params){
    this.style_cmd = 'cartoon ONLY; wireframe 0.015;';
    this.zshade = false;
    this.clipping_depth = 0;
    this.clipping_slab = 100;
    this.clipping_state = false;
    Widget.call( this, params );
    this.zshade_id = this.id + '_zshade';
    this.style_id = this.id + '_style';
    this.clipping_slider_id = this.id + '_clipping_slider';
    this.clipping_state_id = this.id + '_clipping_state';
    this.center_id = this.id + '_center';
    this.applet_selector_widget_id = this.id + '_applet';
    var content = '<div class="control_group">' +
        '<div class="control_row" id="' + this.applet_selector_widget_id + '"></div>' +
        '<div class="control_row">' +
            '<label for="' + this.style_id + '">style</label>' +
            '<select id="' + this.style_id + '" class="ui-state-default">' +
                '<option value="backbone">backbone</option>' +
                '<option value="wireframe">wireframe</option>' +
                '<option value="cartoon">cartoon</option>' +
                '<option value="wireframe+backbone">wireframe & backbone</option>' +
                '<option value="cartoon+wireframe" selected="selected">cartoon & wireframe</option>' +
            '</select>' +
        '</div>' +
        '<div class="control_row">' +
            '<input id="' + this.quality_id + '" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
            '<label for="' + this.quality_id + '" style="display:block;">high quality</label>' +
        '</div>' +
        '<div class="control_row">' +
            '<input id="' + this.zshade_id + '" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
            '<label for="' + this.zshade_id + '" style="display:block;">zshade (fog)</label>' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="' + this.clipping_state_id + '" style="display:block;">clipping</label>' +
            '<input id="' + this.clipping_state_id + '" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
            '<div id="' + this.clipping_slider_id + '"></div>' +
        '</div>' +
        '<div class="control_row">' +
            '<button id="' + this.center_id + '">center protein</button>' +
        '</div>' +
    '</div>';
    $(this.dom).append( content );
    this.applet_selector = new JmolAppletSelectorWidget({
        parent_id: this.applet_selector_widget_id
    });
    this._init();
}
JmolDisplayWidget.prototype = Utils.extend(Widget, /** @lends JmolDisplayWidget.prototype */ {
    _init: function(){
        var self = this;
        
        // init quality
        this.quality = $("#" + this.quality_id).is(':checked');
        $('#' + this.quality_id).click(function(){
            self.quality = $("#" + self.quality_id).is(':checked');
            self.update_quality();
        });
        
        // init zshade
        this.zshade = $("#" + this.zshade_id).is(':checked');
        //this.update_zshade();
        $('#' + this.zshade_id).click(function(){
            self.zshade = $("#" + self.zshade_id).is(':checked');
            self.update_zshade();
        });
        
        // init style
        $("#" + this.style_id).bind('change click', function() {
            self.set_style();
        });
	this.set_style();
        
        // init centering
        $('#' + this.center_id).button().click(function(){
            var applet = self.applet_selector.get_value();
            if(applet){
                applet.script('center *; zoom(all) 100;');
            }
        });
        
        // init clipping
        $("#" + this.clipping_slider_id).slider('option', 'values', [this.clipping_depth, this.clipping_slab]);
        this.clipping_state = $("#" + this.clipping_state_id).is(':checked');
        //this.update_clipping();
        $("#" + this.clipping_state_id).bind('change click', function(){
            self.clipping_state = $("#" + self.clipping_state_id).is(':checked');
            self.update_clipping();
        });
        $("#" + this.clipping_slider_id).slider({
            values: [this.clipping_depth, this.clipping_slab],
            range: true,
            min: 0, max: 100,
            slide: function(event, ui){
                //console.log(ui, ui.values);
                self.clipping_depth  = ui.values[0];
                self.clipping_slab= ui.values[1];
                self.update_clipping();
            }
        });
        $("#" + this.clipping_slider_id).mousewheel( function(event, delta){
            //console.log(event, delta);
            self.clipping_slab = Math.round(self.clipping_slab + 2*delta);
            self.clipping_depth = Math.round(self.clipping_depth + 2*delta);
            if(self.clipping_slab > 100) self.clipping_slab = 100;
            if(self.clipping_slab < 0) self.clipping_slab = 0;
            if(self.clipping_depth > 100) self.clipping_depth = 100;
            if(self.clipping_depth < 0) self.clipping_depth = 0;
            $("#" + this.clipping_slider_id).slider('values', 0, self.clipping_depth);
            $("#" + this.clipping_slider_id).slider('values', 1, self.clipping_slab);
            self.update_clipping();
        });
    },
    update_quality: function(){
        var applet = this.applet_selector.get_value();
        if(applet){
            var s = '';
            if( this.quality ){
                s = 'set highresolution ON; set hermitelevel 10; set antialiasDisplay On; set antialiasTranslucent ON;';
            }else{
                s = 'set highresolution OFF; set hermitelevel 0; set antialiasDisplay OFF; set antialiasTranslucent OFF;';
            }
            applet.script( s );
        }
    },
    update_zshade: function(){
        var applet = this.applet_selector.get_value();
        if(applet){
            var s = '';
            if( this.zshade ){
                s = 'set zShade ON;';
            }else{
                s = 'set zShade OFF;';
            }
            applet.script( s );
        }
    },
    set_style: function (){
        switch($("#" + this.style_id + " option:selected").val()){
            case 'backbone':
                this.style_cmd = 'backbone ONLY; backbone 0.3;';
                break;
            case 'wireframe':
                this.style_cmd = 'wireframe ONLY; wireframe 0.2;';
                break;
            case 'wireframe+backbone':
                this.style_cmd = 'wireframe ONLY; backbone 0.3; wireframe 0.01;';
                break;
            case 'cartoon+wireframe':
                this.style_cmd = 'cartoon ONLY; wireframe 0.015;';
                break;
            case 'cartoon':
            default:
                this.style_cmd = 'cartoon ONLY;';
                break;
        }
        var applet = this.applet_selector.get_value(true);
        if(applet){
            applet.script('select all; ' + this.style_cmd + ' select none;');
        }
    },
    update_clipping: function(){
        var applet = this.applet_selector.get_value();
        if(applet){
            var s = '';
            if(this.clipping_state){
                s += 'slab on;';
            }else{
                s += 'slab off;';
            }
            s += 'depth ' + this.clipping_depth + '; slab ' + this.clipping_slab + ';';
            applet.script(s);
        }
    }
});


/**
 * A widget holding jmol animation related controls
 * @constructor
 */
JmolAnimationWidget = function(params){
    Widget.call( this, params );
    
    this.mode_id = this.id + '_mode';
    this.mode_loop_id = this.mode_id + '_loop';
    this.mode_once_id = this.mode_id + '_once';
    this.mode_palindrome_id = this.mode_id + '_palindrome';
    
    this.play_id = this.id + '_play';
    this.stop_id = this.id + '_stop';
    this.next_id = this.id + '_next';
    this.previous_id = this.id + '_previous';
    this.first_id = this.id + '_first';
    this.last_id = this.id + '_last';
    this.current_frame_id = this.id + '_current_frame';
    
    this.applet_selector_widget_id = this.id + '_applet';
    
    var content = '<div class="control_group">' +
        '<div class="control_row" id="' + this.applet_selector_widget_id + '"></div>' +
        '<div class="control_row">' +
            '<span>' +
		'<button id="' + this.first_id + '">first frame</button>' +
		'<button id="' + this.previous_id + '">previous frame</button>' +
		'<button id="' + this.play_id + '">play</button>' +
		'<button id="' + this.stop_id + '">stop frame</button>' +
		'<button id="' + this.next_id + '">next frame</button>' +
		'<button id="' + this.last_id + '">last frame</button>' +
		'<span id="' + this.mode_id + '">' +
		    '<input type="radio" value="loop" id="' + this.mode_loop_id + '" name="' + this.mode_id + '" checked="checked" /><label for="' + this.mode_loop_id + '">Loop</label>' +
		    '<input type="radio" value="once" id="' + this.mode_once_id + '" name="' + this.mode_id + '" /><label for="' + this.mode_once_id + '">Once</label>' +
		    '<input type="radio" value="palindrome" id="' + this.mode_palindrome_id + '" name="' + this.mode_id + '" /><label for="' + this.mode_palindrome_id + '">Palindrome</label>' +
		'</span>' +
            '</span>' +
        '</div>' +
	'<div class="control_row">' +
	    'Frame <span id="' + this.current_frame_id + '"></span>' + 
	'</div>' +
    '</div>';
    $(this.dom).append( content );
    this.applet_selector = new JmolAppletSelectorWidget({
        parent_id: this.applet_selector_widget_id
    });
    this._init();
}
JmolAnimationWidget.prototype = Utils.extend(Widget, /** @lends JmolAnimationWidget.prototype */ {
    _init: function(){
        var self = this;
        
	this._init_anim_callback();
	this.applet_selector.change( function() {
            self._init_anim_callback();
        });
	
        $('#' + this.first_id).button({
            text: false,
            icons: {
                primary: 'ui-icon-seek-start'
            }
        }).click(function(){
            var s = 'frame REWIND;';
            self.update_animation(s);
        });
        
        $('#' + this.previous_id).button({
            text: false,
            icons: {
                primary: 'ui-icon-seek-prev'
            }
        }).click(function(){
            var s = 'frame PREVIOUS;';
            self.update_animation(s);
        });
        
        $('#' + this.play_id).button({
            text: false,
            icons: {
                primary: 'ui-icon-play'
            }
        })
        .click(function() {
            var options;
            var s = '';
            if ($(this).text() == 'play') {
                options = {
                    label: 'pause',
                    icons: {
                        primary: 'ui-icon-pause'
                    }
                };
                s = 'frame PLAY;';
            } else {
                options = {
                    label: 'play',
                    icons: {
                        primary: 'ui-icon-play'
                    }
                };
                s = 'frame PAUSE;';
            }
            self.update_animation(s);
        });
        
        $('#' + this.stop_id).button({
            text: false,
            icons: {
                primary: 'ui-icon-stop'
            }
        })
        .click(function() {
            $('#' + self.play_id).button('option', {
                label: 'play',
                icons: {
                    primary: 'ui-icon-play'
                }
            });
            var s = 'frame PAUSE; frame REWIND;';
            self.update_animation(s);
        });
        
        $('#' + this.next_id).button({
            text: false,
            icons: {
                primary: 'ui-icon-seek-next'
            }
        }).click(function(){
            var s = 'frame NEXT;';
            self.update_animation(s);
        });
        
        $('#' + this.last_id).button({
            text: false,
            icons: {
                primary: 'ui-icon-seek-end'
            }
        }).click(function(){
            var s = 'frame LAST;';
            self.update_animation(s);
        });
        
        $("#" + this.mode_id).buttonset().change(function(){
            self.set_animation_mode();
        });
    },
    _init_anim_callback: function(){
        var applet = this.applet_selector.get_value(true);
	if(applet){
	    var self = this;
	    applet.anim_frame_callback(function( frameNo, fileNo, modelNo, firstNo, lastNo, isAnimationRunning, animationDirection, currentDirection ){
		$('#' + self.current_frame_id).html( frameNo +'' );
	    });
	}
    },
    update_animation: function(script){
        this.set_animation_mode();
        var applet = this.applet_selector.get_value(true);
        if(applet){
            applet.script(script);
        }
    },
    set_animation_mode: function(script){
        var applet = this.applet_selector.get_value(true);
        if(applet){
            var s = '';
            var mode = $("#" + this.mode_id + " input[name=" + this.mode_id + "]:radio:checked").val();
            if(mode == 'palindrome'){
                s = 'animation mode PALINDROME';
            }else if(mode == 'once'){
                s = 'animation mode ONCE';
            }else{
                s = 'animation mode LOOP';
            }
            applet.script(s);
        }
    }
});



/**
 * A widget to create ramachandran plots from molecular data
 * @constructor
 */
RamachandranPlotWidget = function(params){
    Widget.call( this, params );
    this.canvas_id = this.id + '_canvas';
    this.favored_angles_id = this.id + '_favored_angles';
    this.do_ramachandran_plot_id = this.id + '_do_plot';
    this.applet_selector_widget_id = this.id + '_applet';

    var content = '<div class="control_group">' +
	'<div class="control_row" id="' + this.applet_selector_widget_id + '"></div>' +
        '<div class="control_row">' +
            '<label for="' + this.style_id + '">favored angles</label>' +
            '<select id="' + this.favored_angles_id + '" class="ui-state-default">' +
                '<option value="General" selected="selected">General</option>' +
                '<option value="Glycine">Glycine</option>' +
                '<option value="Pre-Pro">Pre-Pro</option>' +
                '<option value="Proline">Proline</option>' +
            '</select>' +
            '<button id="' + this.do_ramachandran_plot_id + '">ramachandran plot</button>' +
        '</div>' +
	'<div class="control_row">' +
            '<div id="' + this.canvas_id + '" style="width:300px;height:300px"></div>' +
        '</div>' +
    '</div>';
    $(this.dom).append( content );
    this.applet_selector = new JmolAppletSelectorWidget({
        parent_id: this.applet_selector_widget_id
    });
    this._init();
}
RamachandranPlotWidget.prototype = Utils.extend(Widget, /** @lends RamachandranPlotWidget.prototype */ {
    _init: function(){
	this.ramachandran_plot();
        var self = this;
        
	$("#" + this.do_ramachandran_plot_id).button().click(function() {
            self.ramachandran_plot();
        });
	
	// init favored angle contour overlay
        $("#" + this.favored_angles_id).change( function() {
            self.ramachandran_plot();
        });
	
	this.applet_selector.change( function() {
            self.ramachandran_plot();
        });
    },
    /**
     * draw a ramachandran plot
     */
    ramachandran_plot: function(){
        var applet = this.applet_selector.get_value(true);
	var ramachandran_data = [];
	
        if(applet && applet.loaded){
	    var selection = 'protein and {*.ca}';
	    var format = '%[phi],%[psi],\'%[group]\', \'%[resNo]\', \'%[chain]\'';
	    ramachandran_data = applet.evaluate('"[" + {' + selection + '}.label("[' + format + ']").join(",") + "]"');
	    ramachandran_data = ramachandran_data.replace(/%\[psi\]/g,"");
	    ramachandran_data = ramachandran_data.replace(/%\[phi\]/g,"");
	    ramachandran_data = eval(ramachandran_data.replace(/\,\]/g,",null]"));
	    //console.log( ramachandran_data );
	}
	
	
	/* Sizing and scales. */
	var w = 270,
	    h = 270,
	    kx = 180,
	    ky = 180,
	    x = pv.Scale.linear(-180, 180).range(0, w),
	    y = pv.Scale.linear(-180, 180).range(0, h);
	
	//var img = vis.add(pv.Panel)
	var vis = new pv.Panel()
	    .canvas(this.canvas_id)
	    .width(w)
	    .height(h)
	    .top(5).left(30).right(5).bottom(15);
	  
	var img = vis.add(pv.Panel).overflow("hidden").add(pv.Image)
	    .left(x)
	    .bottom(y)
	    .url("../img/ramachandran_plot_empty_" + $("#" + this.favored_angles_id + " option:selected").val() + ".png");
	
	/* X-axis and ticks. */
	vis.add(pv.Rule)
	    .data(x.ticks())
	    .left(x)
	    .strokeStyle(function(d){ return d ? "#eee" : "#000"; })
	  .anchor("bottom").add(pv.Label)
	    .text(x.tickFormat);
	
	/* Y-axis and ticks. */
	vis.add(pv.Rule)
	    .data(y.ticks())
	    .top(y)
	    .strokeStyle(function(d){ return d ? "#eee" : "#000"; })
	  .anchor("left").add(pv.Label)
	    .text(y.tickFormat);
	
	/** Update the x- and y-scale domains per the new transform.
	 * @private
	*/
	function transform() {
	    var t = this.transform();
	    var ti = t.invert();
	    x.domain(ti.x / w * 2 * kx - kx, (ti.k + ti.x / w) * 2 * kx - kx);
	    y.domain(ti.y / h * 2 * ky - ky, (ti.k + ti.y / h) * 2 * ky - ky);
	    var ih = h * t.k;
	    var iw = w * t.k;
	    img.height(ih).width(iw).top(t.y).left(t.x);
	    vis.render();
	}
	
	/* Use an invisible panel to capture pan & zoom events. */
	vis.add(pv.Panel)
	    .events("all")
	    .event("mousedown", pv.Behavior.pan())
	    .event("mousewheel", pv.Behavior.zoom())
	    .event("pan", transform)
	    .event("zoom", transform);
	
	/* The dot plot! */
	vis.add(pv.Panel)
	    .overflow("hidden")
	  .add(pv.Dot)
	    .data(ramachandran_data)
	    .left(function(d){ return x(d[0]); })
	    .top(function(d){ return y(-d[1]); })
	    .size(3)
	    .lineWidth(0)
	    .text(function(d){ return d[2]; })
	    .event("mouseover", pv.Behavior.tipsy({gravity: "s", fade: true}))
	    .event("mouseup", function(d) {
		applet.script(
		    'select none; selectionHalos ON; ' +
		    'select {resNo=' + d[3] + '}' +
		    (d[4] ? 'and chain=' + d[4] : '')
		);
            })
	    .fillStyle("black");
	

	
	vis.render();
    }
});



})();

