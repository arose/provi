

(function() {

Data = {
    types: {
        structure: ['pdb', 'sco', 'mbn', 'gro', 'cif', 'mmcif'],
        isosurface: ['jvxl', 'mrc', 'cub']
    }
}

/**
 * global dataset manager object
 * 
 */
DatasetManager = {
    _dataset_list: [],
    _change_fn_list: [],
    change: function(fn, fn_this){
	this._change_fn_list.push( {fn: fn, fn_this: fn_this} );
    },
    _change: function( msg ){
        $.each(this._change_fn_list, function(){
	    this.fn.call( this.fn_this, msg );
	});
    },
    add: function(dataset){
        this._dataset_list.push(dataset);
        this._change( {'add': dataset} );
    },
    update: function(){
        this._change();
    },
    get_list: function(){
        return this._dataset_list;
    }
};

/**
 * dataset class
 * @constructor
 */
Dataset = function(params){
    this._change_fn_list = [];
    this._status = params.status || { local: null, server: null };
    this._set_type( params.type );
    this.data = params.data;
    this.name = params.name;
    this.applet = params.applet;
    this.server_id = params.server_id;
    this.plupload_id = params.plupload_id;
    DatasetManager.add( this );
};
Dataset.prototype = /** @lends Dataset.prototype */ {
    /**
     * get the status of the dataset
     * @returns {object} status object
     */
    get_status: function(){
        return this._status;
    },
    set_status: function(status){
        if( arguments.length == 1 ){
            this._status = status;
        }else if( arguments.length == 2 ){
            this._status[ arguments[0] ] = arguments[1];
        }else{
            throw "Expect exactly one or two arguments";
        }
        this._change();
    },
    set_data: function(data){
        this.data = data;
        this._change();
    },
    _set_type: function(type){
        this.type = type;
        if( $.inArray(type, Data.types.structure) >= 0 ){
            $.extend( this, StructureMixin );
        }else if( type == 'mplane' ){
            $.extend( this, MplaneMixin );
        }else if( $.inArray(type, Data.types.isosurface) >= 0 ){
            $.extend( this, IsosurfaceMixin );
        }else{
            //console.log('unkown file type');
        }
    },
    set_type: function(type){
        this._set_type(type);
        this._change();
    },
    _change_fn_list: [],
    change: function(fn, fn_this){
	this._change_fn_list.push( {fn: fn, fn_this: fn_this} );
    },
    _change: function(){
        $.each(this._change_fn_list, function(){
	    this.fn.call( this.fn_this );
	});
    },
    retrieve_data: function(){
        var self = this;
        var get_params = { 'id': response.id+'' };
        $.getJSON( '../../data/get/', get_params, function(d){
            self.set_data( d );
        });
    },
    init: function(){
        
    }
};

var MplaneMixin = {
    available_widgets: {
        'MplaneWidget': MplaneWidget
    },
    init: function( params ){
        var self = this;
        this.retrieve_data( function(d){
            self.set_data( new Bio.MembranePlanes( d[0], d[1], d[2] ) );
            if( params.applet ){
                new MplaneWidget({
                    parent_id: 'tab_widgets',
                    dataset: self,
                    applet: params.applet
                });
            }
        });
    },
    retrieve_data: function( onload ){
        var get_params = { 'id': this.server_id+'', 'data_action': 'get_planes' };
        $.getJSON( '../../data/get/', get_params, onload );
    }
}

var IsosurfaceMixin = {
    available_widgets: {},
    init: function( params ){
        if( params.applet ){
            this.load( params.applet );
        }
    },
    load: function(applet){
        applet.script('isosurface color black "../../data/get/?id=' + this.server_id + '" mesh nofill;');
    }
}

var StructureMixin = {
    available_widgets: {},
    load_params_widget: {
        name: 'load_as',
        obj: JmolLoadAsSelectorWidget,
        getter: 'get_value'
    },
    init: function(params){
        if( typeof(params) == 'object' && params.applet && params.load_as ){
            this.load( params.applet, params.load_as );
        }
    },
    load: function( applet, load_as ){
	var self = this;
        var params = '?id=' + this.server_id;
        if( $.inArray(this.type, ['pdb', 'sco', 'mbn']) >= 0 ){
            params += '&data_action=get_pdb';
        }
        if(load_as == 'trajectory'){
            applet.script('load TRAJECTORY "../../data/get/' + params + '";');
        }else if(load_as == 'append'){
            applet.script('load APPEND "../../data/get/' + params + '"; select *; zoom(selected) 20;');
        //}else if(load_as == 'new'){
        }else{
            applet.script('load "../../data/get/' + params + '";');
	    
	    setTimeout(function(){
		var selection = 'protein and {*/1.1}';
		var format = '\'%[group]\',\'%[sequence]\',%[resno],\'%[chain]\',\'%[atomName]\',%[atomNo],\'%[model]\'';
		protein_data = applet.evaluate('"[" + {' + selection + '}.label("[' + format + ']").join(",") + "]"');
		//console.log( protein_data );
		protein_data = protein_data.replace(/\'\'/g,"'");
		protein_data = eval( protein_data );
		
		var s = new Bio.Pdb.Structure('1');
		var m = new Bio.Pdb.Model('1');
		s.add( m );
		
		$.each(protein_data, function() {
		    //console.log(this);
		    var atom = this;
		    //console.log(atom);
		    var group = atom[0],
			sequence = atom[1],
			resno = atom[2],
			chain = atom[3],
			atomName = atom[4],
			atomNo = atom[5];
		    
		    var c = m.get( chain );
		    //console.log('chain', chain, c);
		    if( !c ){
			c = new Bio.Pdb.Chain( chain );
			m.add( c );
		    }
		    
		    var r = c.get( resno );
		    //console.log('residue', resno, r);
		    if( !r ){
			r = new Bio.Pdb.Residue( resno, group );
			c.add( r );
		    }
		    
		    var a = new Bio.Pdb.Atom( atomName, [], 0, 0, "", atomName, atomNo, "" );
		    try{
			r.add( a );
		    }catch(err){
			//console.log(err);
		    }
		});
		
		//console.log(m);
		self.set_data( s );
		new TreeViewWidget({
		    parent_id: 'tab_tree',
		    dataset: self
		});
	    }, 1000 );
        }
    }
}






/**
 * widget class for loading datasets
 * @constructor
 * @extends Widget
 */
PluploadLoadWidget = function(params){
    Widget.call( this, params );
    this.input_id = this.id + '_input';
    this.container_id = this.id + '_container';
    this.filelist_id = this.id + '_filelist';
    this.pickfiles_id = this.id + '_pickfiles';
    this.uploadfiles_id = this.id + '_uploadfiles';
    this.type_selector_id = this.id + '_type';
    this.load_as_selector_widget_id = this.id + '_load_as';
    this.applet_selector_widget_id = this.id + '_applet';
    var content = '<div class="control_group">' +
        '<h3>File Upload</h3>' +
        '<div class="control_row">' +
            '<label for="' + this.type_selector_id + '">Filetype:</label>' +
            '<select id="' + this.type_selector_id + '" class="ui-state-default">' +
                '<option value="auto">determine automatically</option>' +
                '<option value="cif">cif</option>' +
                '<option value="cub">cube</option>' +
                '<option value="gro">gromacs</option>' +
                '<option value="jvxl">Jmol voxel</option>' +
                '<option value="mbn">mbn</option>' +
                '<option value="mmcif">mmCIF</option>' +
                '<option value="mplane">mplane</option>' +
                '<option value="mrc">mrc density map</option>' +
                '<option value="pdb">pdb</option>' +
                '<option value="sco">sco</option>' +
            '</select>' +
        '</div>' +
        '<div id="' + this.applet_selector_widget_id + '"></div>' +
        '<div id="' + this.load_as_selector_widget_id + '"></div>' +
        '<div class="control_row" id="' + this.container_id + '">' +
            //'<label for="' + this.input_id + '">Select file:</label>' +
            //'<input type="file" id="' + this.input_id + '" />' +
            '<div id="' + this.filelist_id + '">No runtime found.</div>' +
            '<br />' +
            '<a id="' + this.pickfiles_id + '" href="#">[Select files]</a>' +
            '<a id="' + this.uploadfiles_id + '" href="#">[Upload files]</a>' +
        '</div>' +
    '</div>';
    $(this.dom).append( content );
    this.applet_selector = new JmolAppletSelectorWidget({
        parent_id: this.applet_selector_widget_id,
        applet: params.applet,
        new_jmol_applet_parent_id: params.new_jmol_applet_parent_id,
        allow_new_applets: true
    });
    this.load_as_selector = new JmolLoadAsSelectorWidget({
        parent_id: this.load_as_selector_widget_id
    })
    this._init();
}
PluploadLoadWidget.prototype = Utils.extend(Widget, /** @lends PluploadLoadWidget.prototype */ {
    _init: function(){
        this._init_file_input();
    },
    _init_file_input: function(){
        var self = this;
        this.uploader = new plupload.Uploader({
            runtimes : 'html5,flash,silverlight',
            browse_button : this.pickfiles_id,
            container : this.container_id,
            max_file_size : '100mb',
            url : '../../plupload/index/?datatype=auto&provider=file',
            flash_swf_url : '../js/lib/plupload/js/plupload.flash.swf',
            silverlight_xap_url : '../js/lib/plupload/js/plupload.silverlight.xap'
	});

	this.uploader.bind('Init', function(up, params) {
	    $('#' + self.filelist_id).html("<div>Current runtime: " + params.runtime + "</div>");
	});

	this.uploader.bind('FilesAdded', function(up, files) {
            //console.log(files);
            $.each(files, function(i, file) {
                file.dataset = new Dataset({
                    name: file.name,
                    status: { local: null, server: 'queued for upload' },
                    plupload_id: file.id,
                    type: $("#" + self.type_selector_id + " option:selected").val()
                });
                $('#' + self.filelist_id).append(
                    '<div id="' + file.id + '">' +
                        'File: ' + file.name + ' (' + plupload.formatSize(file.size) + ') <b></b>' +
                    '</div>'
                );
            });
	});

	this.uploader.bind('UploadProgress', function(up, file) {
            if(!file.dataset.server_id){
                file.dataset.set_status('server', file.percent + '% uploaded');
            }
	    $('#' + file.id + " b").html(file.percent + "%");
	});

	$('#' + this.uploadfiles_id).click(function(e) {
            self.uploader.start();
            e.preventDefault();
	});
        
        this.uploader.bind('FileUploaded', function(up, file, res) {
            var response = $.parseJSON( res.response );
            file.dataset.server_id = response.id;
            file.dataset.set_type( response.type );
            file.dataset.set_status( 'server', response.status );
            file.dataset.init({
                applet: self.applet_selector.get_value(),
                load_as: self.load_as_selector.get_value()
            });
            up.refresh();
	});
        
	this.uploader.init();
        //$('#'+this.input_id).change(function(){
        //    console.log(this.files);
        //    self._file_reader_load(this);
        //});
    }
    //_file_reader_load: function(input){
    //    var self = this;
    //    var reader = new FileReader();  
    //    reader.onload = function(e) {
    //        console.log('data loaded');
    //        var add_data_url = "../../data/add/";
    //        var data_to_post = {'datatype': 'pdb', 'provider': 'file', 'data': e.target.result};
    //        $.post( add_data_url, data_to_post, function(post_response_data){
    //            console.log('add data response:', post_response_data);
    //            $.get( '../../data/get/', {'id': post_response_data}, function(get_response_data){
    //                self.get_jmol_applet().load_inline(get_response_data);
    //            });
    //            DatasetManager.update();
    //            //init_pdb_tree( "../../data/get/?id=" + post_response_data + "&data_action=get_tree" );
    //        });
    //    };
    //    reader.readAsText(input.files[0]);
    //},
    //_poster_load: function(){
    //    
    //}
});



/**
 * function to import a dataset from galaxy
 * @returns {Dataset} dataset instance
 */
Data.import_galaxy = function(id, name, params, success){
    var self = this;
    var dataset = new Dataset({
        name: name,
        status: { local: null, server: 'importing' }
    });
    $.ajax({
        url: '../../galaxy/import_dataset/',
        data: { id: id, name: name },
        success: function(response){
            response = $.parseJSON( response );
            dataset.server_id = response.id;
            dataset.set_type( response.type );
            dataset.set_status( 'server', response.status );
            dataset.init( params );
            if( $.isFunction(success) ){
                success( dataset );
            }
        }
    });
    return dataset;
}



/**
 * widget for loading data from a galaxy instance
 * @constructor
 * @extends Widget
 */
GalaxyLoadWidget = function(params){
    Widget.call( this, params );
    this.history_selector_id = this.id + '_history_selector';
    this.dataset_list_id = this.id + '_dataset_list';
    this.load_as_selector_widget_id = this.id + '_load_as';
    this.applet_selector_widget_id = this.id + '_applet';
    var content = '<div  class="control_group">' +
        '<h3>Galaxy Import</h3>' +
        '<div id="' + this.applet_selector_widget_id + '"></div>' +
        '<div id="' + this.load_as_selector_widget_id + '"></div>' +
        '<div class="control_row">' +
            '<label for="' + this.history_selector_id + '">History:</label>' +
            '<select id="' + this.history_selector_id + '" class="ui-state-default"></select>' +
        '</div>' +
        '<div class="control_row" id="' + this.dataset_list_id + '"></div>' +
    '</div>';
    $(this.dom).append( content );
    this.applet_selector = new JmolAppletSelectorWidget({
        parent_id: this.applet_selector_widget_id,
        applet: params.applet,
        new_jmol_applet_parent_id: params.new_jmol_applet_parent_id,
        allow_new_applets: true
    });
    this.load_as_selector = new JmolLoadAsSelectorWidget({
        parent_id: this.load_as_selector_widget_id
    })
    this.init();
}
GalaxyLoadWidget.prototype = Utils.extend(Widget, /** @lends GalaxyLoadWidget.prototype */ {
    init: function(){
        var self = this;
        this.login();
        $("#" + this.history_selector_id).change(function(){
            self.switch_history( $("#" + self.history_selector_id + " option:selected").val() );
        });
    },
    update: function() {
        this.history_list();
        this.dataset_list();
    },
    login: function(){
        var self = this;
        $.ajax({
            url: '../../galaxy/login/',
            data: { galaxysession: $.cookie('galaxysession') },
            success: function(){
                self.update();
            }
        });
    },
    import_dataset: function(id, name){
        var self = this;
        var params = {
            applet: this.applet_selector.get_value(),
            load_as: this.load_as_selector.get_value()
        }
        Data.import_galaxy( id, name, params, function(dataset){
            $('#' + self.dataset_list_id + '_' + id).attr("disabled", false).removeClass('ui-state-disabled').button( "option", "label", "import" );
        })
    },
    dataset_list: function(){
        $("#" + this.dataset_list_id).empty();
        var self = this;
        $.ajax({
            type: 'GET',
            url: '../../galaxy/dataset_list/',
            dataType: 'xml',
            success: function(data, textStatus, XMLHttpRequest) {
                var list = $('#' + self.dataset_list_id);
                self.history_id = $(data).find("history").attr("id");
                $("#" + self.history_selector_id).val( self.history_id );
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
    },
    history_list: function(){
        var self = this;
        $.ajax({
            type: 'GET',
            url: '../../galaxy/history_list/',
            dataType: 'xml',
            success: function(data, textStatus, XMLHttpRequest) {
                var elm = $("#" + self.history_selector_id);
                //var value = $("#" + self.history_selector_id + " option:selected").val();
                elm.empty();
                $(data).find("history_ids").find("data").each(function(){
                    elm.append("<option value='" + $(this).attr("id") + "'>" + $(this).attr("hid") + ":&nbsp;" + $(this).attr("name") + "&nbsp;(" + $(this).attr("num") + ")</option>");
                });
                elm.val( self.history_id );
            }
        });
    },
    switch_history: function( history_id ){
        var self = this;
        $.ajax({
            url: '../../galaxy/switch_history/',
            data: { history_id: history_id },
            success: function(data){
                self.update();
            }
        });
    }
});


/**
 * function to import a dataset from some url
 * @returns {Dataset} dataset instance
 */
Data.import_url = function(url, name, params, success){
    var self = this;
    var dataset = new Dataset({
        name: name,
        status: { local: null, server: 'importing' }
    });
    $.ajax({
        url: '../../urlload/index/',
        data: { url: url, name: name },
        success: function(response){
            response = $.parseJSON( response );
            dataset.server_id = response.id;
            dataset.set_type( response.type );
            dataset.set_status( 'server', response.status );
            dataset.init( params );
            if( $.isFunction(success) ){
                success( dataset );
            }
        }
    });
    return dataset;
}


Data.get_pdb_url = function(id){
    return 'http://www.rcsb.org/pdb/files/' + id + '.pdb';
}


/**
 * function to import a dataset from the pdb
 * @returns {Dataset} dataset instance
 */
Data.import_pdb = function(id, params, success){
    return Data.import_url( Data.get_pdb_url(id), id + '.pdb', params, success );
}



/**
 * widget for loading data from a url
 * @constructor
 * @extends Widget
 */
UrlLoadWidget = function(params){
    Widget.call( this, params );
    this.input_id = this.id + '_input';
    this.load_as_selector_widget_id = this.id + '_load_as';
    this.applet_selector_widget_id = this.id + '_applet';
    this.load_button_id = this.id + '_load_button';
    var content = '<div  class="control_group">' +
        '<h3>' + this.widget_name + '</h3>' +
        '<div id="' + this.applet_selector_widget_id + '"></div>' +
        '<div id="' + this.load_as_selector_widget_id + '"></div>' +
        '<div class="control_row">' +
            '<label for="' + this.input_id + '">' + this.input_label + ':&nbsp;</label>' +
            '<input type="text" id="' + this.input_id + '" class="ui-state-default"></input>&nbsp;' +
            '<button id="' + this.load_button_id + '">import</button>' +
        '</div>' +
    '</div>';
    $(this.dom).append( content );
    this.applet_selector = new JmolAppletSelectorWidget({
        parent_id: this.applet_selector_widget_id,
        applet: params.applet,
        new_jmol_applet_parent_id: params.new_jmol_applet_parent_id,
        allow_new_applets: true
    });
    this.load_as_selector = new JmolLoadAsSelectorWidget({
        parent_id: this.load_as_selector_widget_id
    })
    this.init();
}
UrlLoadWidget.prototype = Utils.extend(Widget, /** @lends UrlLoadWidget.prototype */ {
    widget_name: 'Url Import',
    input_label: 'Url',
    init: function(){
        var self = this;
        
        $("#" + this.load_button_id).button().click(function() {
            $(this).attr("disabled", true).addClass('ui-state-disabled').button( "option", "label", "importing..." );
            self.import_url();
        });
    },
    get_url: function(){
        return $('#' + this.input_id).val();
    },
    get_name: function(){
        return $('#' + this.input_id).val();
    },
    import_url: function(){
        var url = this.get_url();
        var name = this.get_name();
        var self = this;
        var params = {
            applet: this.applet_selector.get_value(),
            load_as: this.load_as_selector.get_value()
        }
        Data.import_url( url, name, params, function(dataset){
            $('#' + self.load_button_id).attr("disabled", false).removeClass('ui-state-disabled').button( "option", "label", "import" );
            $('#' + self.input_id).val('');
        })
    }
});


/**
 * widget for loading data from the pdb
 * @constructor
 * @extends UrlLoadWidget
 */
PdbLoadWidget = function(params){
    UrlLoadWidget.call( this, params );
    $('#' + this.input_id).attr('size', '4');
}
PdbLoadWidget.prototype = Utils.extend(UrlLoadWidget, /** @lends PdbLoadWidget.prototype */ {
    widget_name: 'Pdb Import',
    input_label: 'Pdb id',
    get_url: function(){
        return Data.get_pdb_url( $('#' + this.input_id).val() );
    },
    get_name: function(){
        return $('#' + this.input_id).val() + '.pdb';
    }
});



/**
 * widget class for managing a single dataset
 * @constructor
 * @extends Widget
 */
DatasetWidget = function(params){
    this.dataset = params.dataset;
    this.dataset.change(this.update, this);
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
}
DatasetWidget.prototype = Utils.extend(Widget, /** @lends DatasetWidget.prototype */ {
    update: function(){
        var self = this;
        var elm = $('#' + this.info_id);
        elm.empty();
        var status = this.dataset.get_status();
        elm.append(
            '<div style="background-color: ' + ( status.server == 'Ok' ? 'lightgreen' : 'lightgrey' ) + '; margin: 5px; padding: 3px;">' +
                '<div>' + this.dataset.name + ' (' + this.dataset.type + ')</div>' +
                '<div>Local Status: ' + status.local + '&nbsp;|&nbsp;Server Status: ' + status.server + '</div>' +
            '</div>'
        );
        
        if( status.server == 'Ok'){
            if( !this.applet_selector ){
                this.applet_selector = new JmolAppletSelectorWidget({
                    parent_id: this.load_widget_id,
                    allow_new_applets: ( $.inArray(this.dataset.type, Data.types.structure.concat(Data.types.isosurface)) >= 0 )
                });
            }
            if(this.dataset.load_params_widget && !this.load_params_widget){
                this.load_params_widget = new this.dataset.load_params_widget.obj({
                    parent_id: this.load_widget_id
                })
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
                    if(self.load_params_widget){
                        var ds_lpw = self.dataset.load_params_widget;
                        params[ ds_lpw.name ] = self.load_params_widget[ ds_lpw.getter ]();
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
 * @extends Widget
 */
DatasetManagerWidget = function(params){
    this._widget_list = [];
    DatasetManager.change(this.update, this);
    Widget.call( this, params );
    this.list_id = this.id + '_list';
    var content = '<div>' +
        '<div id="' + this.list_id + '"></div>' +
    '</div>';
    $(this.dom).append( content );
    this.init();
}
DatasetManagerWidget.prototype = Utils.extend(Widget, /** @lends DatasetManagerWidget.prototype */ {
    init: function(){
        $("#" + this.list_id).empty();
        var self = this;
        $.each( DatasetManager.get_list(), function(){
            self._widget_list.push( new DatasetWidget({
                parent_id: self.list_id,
                dataset: this
            }));
        });
    },
    update: function(msg){
        if( msg['add'] ){
            this._widget_list.push( new DatasetWidget({
                parent_id: this.list_id,
                dataset: msg.add
            }));
        }
    }
});





})();



/**
function loadDataWidget(parent, rect, id, anchors){
    console.log(parent);
    var content = '<div id="load" class="control_group">' +
        '<input type="file" id="load_file" />' +
        '<div id="data_list"></div>' +
    '</div>';
    
    widget( parent, content, rect, id, anchors );
    updateDataList();
    
    $('#load_file').change(function(){
        var reader = new FileReader();  
        reader.onload = function(e) {
            console.log('data loaded');
            //jmolLoadInline(e.target.result);
            var add_data_url = "../../data/add/";
            var data_to_post = {'datatype': 'pdb', 'provider': 'file', 'data': e.target.result};
            $.post( add_data_url, data_to_post, function(post_response_data){
                console.log('add data response:', post_response_data);
                $.get( '../../data/get/', {'id': post_response_data}, function(get_response_data){
                    jmolLoadInline(get_response_data);
                });
                updateDataList();
                init_pdb_tree( "../../data/get/?id=" + post_response_data + "&data_action=get_tree" );
            });
        };
        reader.readAsText(this.files[0]);
    });
}
*/