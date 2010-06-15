


(function() {

Jmol = {
    default_dir: '.',
    default_jar: 'JmolApplet.jar',
    archive_path: 'JmolApplet0.jar',
    _applet_dict: {},
    _applet_list: [],
    _default_applet: undefined,
    init: function(codebase_directory){
	if( this.initialized ) return;
	this.initialized = true;
	this.codebase = typeof(codebase_directory) != 'undefined' ? codebase_directory : '.';
    },
    get_applet: function(name_suffix){
	return this._applet_dict[name_suffix];
    },
    get_applet_list: function(){
	return this._applet_list;
    },
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
	console.log('set_applet_loaded', name_suffix);
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
    
    this._init();
    if( typeof(Jmol._default_applet) == 'undefined' ){
	//Jmol.set_default_applet( this.name_suffix );
	Jmol._default_applet = this;
    }
    Jmol.add_applet(this.name_suffix, this);
};
Applet.prototype = {
    default_params: {
	width: 300,
	height: 300,
	css_class: 'jmol_applet'
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
            script: 'javascript "Jmol.set_applet_loaded(\\\"' + this.name_suffix + '\\\");";',
            boxbgcolor: "white",
            boxfgcolor: "black",
            progresscolor: "lightgreen",
            progressbar: "true",
	    syncId: ("" + Math.random()).substring(3),
	    boxmessage: "Downloading JmolApplet ..."
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
		console.log(count, ' count');
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
    script: function(script){
	if(this.loaded){
	    return this._script(script);
	}else{
	    //console.log('defered');
	    this.on_load( this._script, this, [script] );
	    return -1;
	}
    },
    _script_wait: function(script){
	var ret = this.applet.scriptWait(script);
	ret = this._evalJSON( ret, "jmolStatus" );
	var s = ""
	for(var i=ret.length;--i>=0;){
	    for(var j=0;j< ret[i].length;j++){
		s+=ret[i][j]+"\n"
	    }
	}
	return s;
    },
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
	console.log('loaded...');
	console.log(this._on_load_fn_list);
        $.each(this._on_load_fn_list, function(){
	    this.fn.apply( this.fn_this, this.fn_args );
	});
    }
};



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


JmolAppletSelectorWidget = function(params){
    this._jmol_applet = typeof(params.applet) != 'undefined' ? params.applet : null;
    this.new_jmol_applet_parent_id = params.new_jmol_applet_parent_id;
    Widget.call( this, params );
    this.selector_id = this.id + '_applet';
    this.allow_new_applets = params.allow_new_applets;
    var content = '<div class="control_row">' +
            '<label for="' + this.selector_id + '">Jmol applet:</label>' +
            '<select id="' + this.selector_id + '" class="ui-state-default"></select>' +
        '</div>';
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
            (this.allow_new_applets ? '<option value="new">new</option>' : '')
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
    get_value: function(){
        var applet_name = $("#" + this.selector_id + " option:selected").val();
        if(applet_name == 'default'){
	    if( typeof(Jmol.get_default_applet()) == 'undefined' ){
		return ( new JmolWidget({}) ).applet;
	    }else{
		return this._jmol_applet ? this._jmol_applet : Jmol.get_default_applet();
	    }
        }else if(applet_name == 'new'){
            var jw = new JmolWidget({
                parent_id: this.new_jmol_applet_parent_id
            });
            return jw.applet;
        }else{
            return Jmol.get_applet(applet_name);
        }
    },
    change: function(fn){console.log();
	$("#" + this.selector_id).change(fn);
    }
});


/**
    @function
 */
var HistoryManager = function() {
    this.curr = -1;
    this.entries = [];
}

/**
    @class
    @constructor
 */
HistoryManager.prototype = {
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


var JmolConsole = function(input, log, applet){
    this.input = input;
    this.log = log;
    this.applet = applet;
    this._init();
}
JmolConsole.prototype = {
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



JmolConsoleWidget = function(params){
    Widget.call( this, params );
    this.input_id = this.id + '_input';
    this.log_id = this.id + '_log';
    this.applet_selector_widget_id = this.id + '_applet';
    var content = '<div class="control_group">' +
	'<div id="' + this.applet_selector_widget_id + '"></div>' +
        '<label for="jmolCmdInput">Execute a Jmol command (<a href="http://chemapps.stolaf.edu/jmol/docs/" target="_blank">docu</a>):</label>' +
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
JmolConsoleWidget.prototype = Utils.extend(Widget,{
    _init: function(){
	var self = this;
	this.applet_selector.change(function(event){
	    self.console.applet = self.applet_selector.get_value();
	});
    }
});

})();


/**
    @class
 */
var display = {
    styleCmd: 'cartoon ONLY; wireframe 0.015;',
    
    init: function (styleSelectorId) {
        this.styleSelectorId = styleSelectorId;
        
        var self = this;
        $("#" + this.styleSelectorId).change( function() {
            self.setStyle();
        });
    },
    
    setStyle: function (){
        switch($("#" + this.styleSelectorId + " option:selected").val()){
            case 'backbone':
                this.styleCmd = 'backbone ONLY; backbone 0.3;';
                break;
            case 'wireframe':
                this.styleCmd = 'wireframe ONLY; wireframe 0.2;';
                break;
            case 'wireframe+backbone':
                this.styleCmd = 'wireframe ONLY; backbone 0.3; wireframe 0.01;';
                break;
            case 'cartoon+wireframe':
                this.styleCmd = 'cartoon ONLY; wireframe 0.015;';
                break;
            case 'cartoon':
            default:
                this.styleCmd = 'cartoon ONLY;';
                break;
        }
        jmolScript('select all; ' + this.styleCmd);
    }
}

/**
    @class
 */
var clipping = {
    
    depth: 0,
    slab: 100,
    state: false,
    
    init: function(){
        this.state = $("#clipping_state").is(':checked');
        this.update();
        
        var self = this;
        
        $("#clipping_state").bind('change click', function(){
            self.state = $("#clipping_state").is(':checked');
            self.update();
        });
        $("#clipping_slider").slider({
            values: [this.depth, this.slab],
            range: true,
            min: 0, max: 100,
            slide: function(event, ui){
                //console.log(ui, ui.values);
                self.depth  = ui.values[0];
                self.slab= ui.values[1];
                self.update();
            }
        });
        $("#clipping_slider").mousewheel( function(event, delta){
            //console.log(event, delta);
            self.slab = Math.round(self.slab + 2*delta);
            self.depth = Math.round(self.depth + 2*delta);
            if(self.slab > 100) self.slab = 100;
            if(self.slab < 0) self.slab = 0;
            if(self.depth > 100) self.depth = 100;
            if(self.depth < 0) self.depth = 0;
            $("#clipping_slider").slider('values', 0, self.depth);
            $("#clipping_slider").slider('values', 1, self.slab);
            self.update();
        });
        //$("#clipping_slider").slider('option', 'values', [this.depth, this.slab]);
    },
    
    update: function(){
        //console.log(this.depth, this.slab);
        if(this.state){
            jmolScript('slab on;');
        }else{
            jmolScript('slab off;');
        }
        jmolScript('depth ' + this.depth + '; slab ' + this.slab + ';');
    }
}


function styleWidget(parent, rect, id, anchors){
    var content = '<div class="control_group">' +
        '<div class="control_row">' +
            '<label for="style">style</label>' +
            '<select id="style" class="ui-state-default">' +
                '<option value="backbone">backbone</option>' +
                '<option value="wireframe">wireframe</option>' +
                '<option value="cartoon">cartoon</option>' +
                '<option value="wireframe+backbone">wireframe & backbone</option>' +
                '<option value="cartoon+wireframe" selected="selected">cartoon & wireframe</option>' +
            '</select>' +
        '</div>' +
        '<div class="control_row">' +
            '<label id="clipping_slider_label" for="clipping_slider" style="display:block;">clipping</label>' +
            '<input id="clipping_state" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
            '<div id="clipping_slider"></div>' +
        '</div>' +
        '<div class="control_row">' +
            '<button class="fg-button ui-state-default ui-corner-all" id="center_protein">center protein</button>' +
        '</div>' +
    '</div>';
    
    widget( parent, content, rect, id, anchors );
    display.init("style");
    clipping.init();
    $('#center_protein').click(function(){
        jmolScript('zoom(all) 100;');
    });
}


