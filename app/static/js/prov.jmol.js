


(function() {

Jmol = {}

Jmol.default_params = default_params = {
    width: 300,
    height: 300,
    css_class: 'jmol_applet',
};

Jmol.default_dir = '.';
Jmol.default_jar = 'JmolApplet.jar';
Jmol.archive_path = 'JmolApplet0.jar';

Jmol.init = function(codebase_directory){
    if( Jmol.initialized ) return;
    Jmol.initialized = true;
    Jmol.codebase = typeof(codebase_directory) != 'undefined' ? codebase_directory : '.';
};

Jmol.applet_dict = applet_dict = {};
applet_dict.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};


Jmol.get_applet_name_suffix = function(name_suffix){
    if( typeof(name_suffix) != 'undefined' ){
        if( applet_dict.hasOwnproperty(name_suffix) ){
            throw "name suffix '" + name_suffix + "' is already in use";
        }
    }else{
        name_suffix = toString( Jmol.applet_dict.size() + 1 );
    }
    return name_suffix;
};

var Applet = Jmol.Applet = function(params){
    
    this.name_suffix = Jmol.get_applet_name_suffix( params.name_suffix );
    this.width = typeof(params.width) != 'undefined' ? params.width : default_params.width;
    this.height = typeof(params.height) != 'undefined' ? params.height : default_params.height;
    this.css_class = typeof(params.css_class) != 'undefined' ? params.css_class : default_params.css_class;
    this.archive_path = Jmol.archive_path;
    this.codebase = Jmol.codebase;
    this.dom_parent_id = params.dom_parent_id;
    
    this._insert();
};

Applet.prototype = {
    _insert: function(){
        html = "<applet " +
            "name='jmol_applet_" + this.name_suffix + "' " +
            "id='jmol_applet_" + this.name_suffix + "' " +
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
        var child = this._get_dom_elm(html);
        if( typeof(this.dom_parent_id) != 'undefined' ){
            var dom_parent = document.getElementById(this.dom_parent_id);
        }else{
            var dom_parent = window;
        }
        dom_parent.appendChild(child);
    },
    _get_params: function(){
        params = {
            loadInline: "",
            script: "",
            boxbgcolor: "white",
            boxfgcolor: "black",
            progresscolor: "lightgreen",
            progressbar: "true"
        };
        var t = "";
        for (var i in params)
            if(params[i]!="")
                t+="  <param name='"+i+"' value='"+params[i]+"' />\n";
        return t
    },
    _get_dom_elm: function(data){
        var e = document.createElement("span")
	e.innerHTML = data
        return e;
    }
};




})();

function initJmol(){
    Jmol.init("../applet/jmol/11.8.22/");
    //jmolSetAppletColor("white");
}

function addJmolApplet(domId, width, height, script, nameSuffix){
    var my_jmol_applet = new Jmol.Applet({ dom_parent_id: domId, width: width, height: height })
    //jmolApplet(size, script, nameSuffix);
    //var currentDocument = _jmol.currentDocument;
    //jmolSetDocument(false);
    //$('#' + domId).html( jmolApplet(size, script, nameSuffix) );
    //jmolSetDocument(currentDocument);
}


/**
    @function
 */
function HistoryManager() {
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

/**
    @class
 */
var jmolEvalPrint = {
    log: undefined,
    input: undefined,
    
    init: function (input,log) {
        this.input = input;
        this.log = log;
        this.history = new HistoryManager();
        
        var self = this;
        this.input.keypress(function(event) {
            if (event.keyCode == 13 && this.value) {
                try {
                    var cmd = this.value;
                    self.print('> ' + cmd);
                    var out = jmolScriptWait(cmd);
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


function jmolWidget(parent, rect, id, anchors){
    console.log(parent);
    var content = '<div id="jmolCmd">' +
        '<label for="jmolCmdInput">Execute a Jmol command (<a href="http://chemapps.stolaf.edu/jmol/docs/" target="_blank">docu</a>):</label>' +
        '<input type="text" id="jmolCmdInput" class="ui-state-default" style="margin-top:0.2em; width:100%; border: 0px;"/>' +
        '<div id="jmolCmdLog" style="overflow:auto; max-height:300px; min-height:150px; margin-top:10px;  padding: 2px;" class="ui-state-default ui-state-disabled"></div>' +
    '</div>';
    
    widget( parent, content, rect, id, anchors );
    jmolEvalPrint.init( $('#jmolCmdInput'), $('#jmolCmdLog') );
}




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
    console.log(parent);
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


