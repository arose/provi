

(function() {

/**
 * The global Data object
 * @name Data
 * @namespace
 */
Data = {
    types: {
        structure: ['pdb', 'gro', 'cif', 'mmcif'],
        isosurface: ['jvxl', 'mrc', 'cub', 'ccp4'],
        interface_contacts: ['sco', 'mbn']
    }
}



/**
 * global dataset manager object
 * 
 */
DatasetManager = {
    _dataset_dict: {},
    _dataset_list: [],
    _change_fn_list: [],
    _dataset_counter: 0,
    change: function(fn, fn_this){
	this._change_fn_list.push( {fn: fn, fn_this: fn_this} );
    },
    _change: function( msg ){
        $.each(this._change_fn_list, function(){
	    this.fn.call( this.fn_this, msg );
	});
    },
    add: function(dataset){
        this._dataset_counter += 1;
        var self = this;
        this._dataset_dict[this._dataset_counter] = dataset;
        this._dataset_list.push(dataset);
        this._change( {'add': dataset} );
        dataset.change( function(){ self._change( {'update': dataset} ); } );
        return this._dataset_counter;
    },
    update: function(){
        this._change();
    },
    get_list: function(){
        return this._dataset_list;
    },
    get: function( id ){
        return this._dataset_dict[ id ];
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
    this.id = DatasetManager.add( this );
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
        }else if( $.inArray(type, Data.types.interface_contacts) >= 0 ){
            $.extend( this, InterfaceContactsMixin );
        }else if( type == 'mplane' ){
            $.extend( this, MplaneMixin );
        }else if( $.inArray(type, Data.types.isosurface) >= 0 ){
            $.extend( this, IsosurfaceMixin );
        }else if( type == 'jspt' ){
            $.extend( this, ScriptMixin );
        }else if( type == 'tmhelix' ){
            $.extend( this, TmHelicesMixin );
        }else if( type == 'anal' ){
            $.extend( this, HbondsMixin );
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
    init: function( params ){
        if( params.applet ){
            var name = this.name + ' (' + this.id + ')';
            if( $('#' + params.applet.widget.data_id).text() ){
                name = ', ' + name;
            }
            $('#' + params.applet.widget.data_id).append( name );
        }
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
        Dataset.prototype.init.call(this, params);
    },
    retrieve_data: function( onload ){
        var get_params = { 'id': this.server_id+'', 'data_action': 'get_planes' };
        $.getJSON( '../../data/get/', get_params, onload );
    }
}

var TmHelicesMixin = {
    available_widgets: {
        'TmHelicesWidget': TmHelicesWidget
    },
    init: function( params ){
        var self = this;
        this.retrieve_data( function(d){
            self.set_data( new Bio.TmHelices( d ) );
            if( params.applet ){
                new TmHelicesWidget({
                    parent_id: 'tab_widgets',
                    dataset: self,
                    applet: params.applet
                });
            }
        });
        Dataset.prototype.init.call(this, params);
    },
    retrieve_data: function( onload ){
        var get_params = { 'id': this.server_id+'', 'data_action': 'get_tm_helices' };
        $.getJSON( '../../data/get/', get_params, onload );
    }
}

var HbondsMixin = {
    available_widgets: {
        'HbondsWidget': HbondsWidget
    },
    init: function( params ){
        var self = this;
        this.retrieve_data( function(d){
            self.set_data( new Bio.Hbonds( d ) );
            if( params.applet ){
                new HbondsWidget({
                    parent_id: 'tab_widgets',
                    dataset: self,
                    applet: params.applet
                });
            }
        });
        Dataset.prototype.init.call(this, params);
    },
    retrieve_data: function( onload ){
        var get_params = { 'id': this.server_id+'', 'data_action': 'get_hbonds' };
        $.getJSON( '../../data/get/', get_params, onload );
    }
}

var ScriptMixin = {
    available_widgets: {},
    init: function( params ){
        var self = this;
        this.retrieve_data( function(d){
            self.set_data( d );
            if( params.applet ){
                self.load( params.applet );
            }
        });
        Dataset.prototype.init.call(this, params);
    },
    retrieve_data: function( onload ){
        var get_params = { 'id': this.server_id+'' };
        $.get( '../../data/get/', get_params, onload, 'text' );
    },
    load: function(applet){
        applet.script( this.data );
    }
}

var IsosurfaceMixin = {
    available_widgets: {},
    init: function( params ){
        if( params.applet ){
            this.load( params.applet );
        }
        Dataset.prototype.init.call(this, params);
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
        Dataset.prototype.init.call(this, params);
    },
    load: function( applet, load_as ){
	var self = this;
        var params = '?id=' + this.server_id;
        var type = this.type;
        if( $.inArray(this.type, ['pdb', 'sco', 'mbn']) >= 0 ){
            params += '&data_action=get_pdb';
            type = 'pdb';
        }
        var jmol_types = {
            pdb: 'PDB',
            gro: 'GROMACS'
        };
        type = jmol_types[type];
        if(load_as == 'trajectory'){
            applet._delete();
            applet.script('load TRAJECTORY "' + type + '::../../data/get/' + params + '";');
        }else if(load_as == 'append'){
            applet.script('load APPEND "' + type + '::../../data/get/' + params + '"; ');
        //}else if(load_as == 'new'){
        }else{
            applet._delete();
            // color cartoon structure; color structure; 
            applet.script('load "' + type + '::../../data/get/' + params + '"; ' +
		'select all; spacefill off; wireframe off; backbone off; cartoon on; ' +
		'select ligand; wireframe 0.16; spacefill 0.5; color cpk; ' +
		'select (dmpc or dmp or popc or pop); wireframe 0.1; '
	    );
        }
    },
    jmol_load: function(){
        var selection = 'protein and {*}';
        var format = '\'%[group]\',\'%[sequence]\',%[resno],\'%[chain]\',\'%[atomName]\',%[atomNo],\'%[model]\'';
        var protein_data = applet.evaluate('"[" + {' + selection + '}.label("[' + format + ']").join(",") + "]"');
        //console.log( protein_data );
        protein_data = protein_data.replace(/\'\'/g,"'");
        //console.log( protein_data );
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
    }
}

var InterfaceContactsMixin = $.extend(true, {}, StructureMixin, /** @lends StructureMixin.prototype */ {
    available_widgets: {
        'InterfaceContactsWidget': InterfaceContactsWidget
    },
    init: function( params ){
        var self = this;
        self.set_data( new Bio.InterfaceContacts( {}, [] ) );
        this.retrieve_data( function(d){
            self.data.names = d;
            if( params.applet ){
                new InterfaceContactsWidget({
                    parent_id: 'tab_widgets',
                    dataset: self,
                    applet: params.applet
                });
            }
        });
        StructureMixin.init.call( this, params );
    },
    load: function(applet, load_as){
        StructureMixin.load.call( this, applet, load_as );
    },
    retrieve_data: function( onload ){
        var get_params = { 'id': this.server_id+'', 'data_action': 'get_helix_interface_names' };
        $.getJSON( '../../data/get/', get_params, onload );
    },
    get_atoms: function( interface_ids, interface_names, cutoff, onload ){
        var self = this;
        //console.log( cutoff );
        this.get_interface_atoms( interface_ids, interface_names, cutoff, function( interface_data ){
            self.get_structure_atoms( interface_names, function( structure_data ){
                onload( interface_data, structure_data );
            })
        })
    },
    get_interface_atoms: function( interface_ids, interface_names, cutoff, onload ){
        var get_params = {
            'id': this.server_id+'',
            'data_action': 'get_helix_interface_atoms',
            'interface_ids': interface_ids,
            'interface_names': interface_names,
            'cutoff': cutoff
        };
        $.getJSON( '../../data/get/', get_params, onload );
    },
    get_structure_atoms: function( structure_name, onload ){
        var get_params = {
            'id': this.server_id+'',
            'data_action': 'get_structure_atoms',
            'structure_name': structure_name
        };
        $.getJSON( '../../data/get/', get_params, onload );
    }
});




/**
 * widget class for loading datasets
 * @constructor
 * @extends Widget
 */
PluploadLoadWidget = function(params){
    params.heading = 'File Upload';
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
        Widget.prototype.init.call(this);
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
Data.import_galaxy = function(id, name, filename, type, params, success, no_init){
    var self = this;
    var dataset = new Dataset({
        name: name,
        status: { local: null, server: 'importing' }
    });
    $.ajax({
        url: '../../galaxy/import_dataset/',
        data: { id: id, name: name, filename: filename || 'index', datatype: type },
        success: function(response){
            response = $.parseJSON( response );
            dataset.server_id = response.id;
            dataset.set_type( response.type );
            dataset.set_status( 'server', response.status );
            if( !no_init ) dataset.init( params );
            if( $.isFunction(success) ){
                success( dataset );
            }
        }
    });
    return dataset;
}

GalaxyConnector = {
    history_id: false,
    set_history_id: function( id ){
        this.history_id = id;
        $(this).triggerHandler( 'switch' );
    },
    login: function( onsuccess ){
        var self = this;
        $.ajax({
            url: '../../galaxy/login/',
            data: { galaxysession: $.cookie('galaxysession') || '' },
            success: function(){
                if( $.isFunction(onsuccess) ) onsuccess();
            }
        });
    },
    update_history_id: function( onsuccess ){
        var self = this;
        $.ajax({
            type: 'GET',
            url: '../../galaxy/dataset_list/',
            dataType: 'xml',
            success: function(data, textStatus, XMLHttpRequest) {
                $("#" + self.dataset_list_id).empty();
                var list = $('#' + self.dataset_list_id);
                self.set_history_id( $(data).find("history").attr("id") );
                if( $.isFunction(onsuccess) ) onsuccess();
            }
        });
    },
    history_list: function( onsuccess ){
        var self = this;
        $.ajax({
            type: 'GET',
            url: '../../galaxy/history_list/',
            dataType: 'xml',
            success: function(data, textStatus, XMLHttpRequest) {
                onsuccess( data, textStatus, XMLHttpRequest );
            }
        });
    },
    switch_history: function( history_id, onsuccess ){
        var self = this;
        $.ajax({
            url: '../../galaxy/switch_history/',
            data: { history_id: history_id },
            success: function(data){
                onsuccess( data );
                self.set_history_id( history_id );
            }
        });
    },
    onswitch: function(fn){
        $(this).bind('switch', fn);
    }
};

/**
 * A widget to select a Galaxy history
 * @constructor
 */
GalaxyHistorySelectorWidget = function(params){
    params.tag_name = 'span';
    this.galaxy_connector = params.galaxy_connector || GalaxyConnector;
    Widget.call( this, params );
    this.history_selector_id = this.id + '_history';
    this.refresh_id = this.id + '_refresh';
    var content = '<span class="control_row">' +
            '<label for="' + this.history_selector_id + '">History:</label>&nbsp;' +
            '<select id="' + this.history_selector_id + '" class="ui-state-default"></select>&nbsp;' +
            '<span title="refresh" class="ui-icon ui-icon-refresh" style="cursor:pointer;" id="' + this.refresh_id + '">refresh</span>' +
        '</span>';
    $(this.dom).append( content );
    this._init();
};
GalaxyHistorySelectorWidget.prototype = Utils.extend(Widget,{
    _init: function(){
        var self = this;
        this.galaxy_connector.login(function(){
            self._update();
        });
        this.galaxy_connector.onswitch(function(){
            $("#" + self.history_selector_id).val( self.galaxy_connector.history_id );
            //self._update();
            $("#" + self.history_selector_id).triggerHandler('switch');
        });
        $("#" + this.history_selector_id).change(function(){
            self.galaxy_connector.switch_history( $("#" + self.history_selector_id + " option:selected").val(), function(){
                //$("#" + self.history_selector_id).triggerHandler('switch');
            });
        });
        $('#' + this.refresh_id).click(function(){
            self._update();
            self.galaxy_connector.update_history_id();
            //$("#" + self.history_selector_id).triggerHandler('switch');
        });
    },
    _update: function(){
        var self = this;
        this.galaxy_connector.history_list(function(data, textStatus, XMLHttpRequest) {
            var elm = $("#" + self.history_selector_id);
            //var value = $("#" + self.history_selector_id + " option:selected").val();
            elm.empty();
            $(data).find("history_ids").find("data").each(function(){
                elm.append("<option value='" + $(this).attr("id") + "'>" + $(this).attr("hid") + ":&nbsp;" + $(this).attr("name") + "&nbsp;(" + $(this).attr("num") + ")</option>");
            });
            elm.val( self.galaxy_connector.history_id );
        });
    },
    get_value: function(){
        return $("#" + this.history_selector_id + " option:selected").val();
    },
    change: function(fn){
	$("#" + this.history_selector_id).bind('switch', fn);
    },
    val: function(data){
	$("#" + this.history_selector_id).val(data);
    }
});



/**
 * widget for loading data from a galaxy instance
 * @constructor
 * @extends Widget
 */
GalaxyLoadWidget = function(params){
    this.galaxy_connector = params.galaxy_connector || GalaxyConnector;
    params.heading = 'Galaxy Import';
    Widget.call( this, params );
    this.dataset_list_id = this.id + '_dataset_list';
    this.load_as_selector_widget_id = this.id + '_load_as';
    this.applet_selector_widget_id = this.id + '_applet';
    this.history_selector_widget_id = this.id + '_history';
    var content = '<div  class="control_group">' +
        '<div id="' + this.applet_selector_widget_id + '"></div>' +
        '<div id="' + this.load_as_selector_widget_id + '"></div>' +
        '<div id="' + this.history_selector_widget_id + '"></div>' +
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
    });
    this.history_selector = new GalaxyHistorySelectorWidget({
        parent_id: this.history_selector_widget_id
    });
    this.init();
}
GalaxyLoadWidget.prototype = Utils.extend(Widget, /** @lends GalaxyLoadWidget.prototype */ {
    init: function(){
        var self = this;
        this.galaxy_connector.login(function(){
            self.update();
        });
        this.history_selector.change(function(){
            self.update();
        });
        Widget.prototype.init.call(this);
    },
    update: function() {
        this.dataset_list();
    },
    import_dataset: function(id, name, filename, type){
        var self = this;
        var params = {
            applet: this.applet_selector.get_value(),
            load_as: this.load_as_selector.get_value()
        }
        Data.import_galaxy( id, name, filename, type, params, function(dataset){
            $('#' + self.dataset_list_id + '_' + id).attr("disabled", false).removeClass('ui-state-disabled').button( "option", "label", "import" );
        })
    },
    dataset_list: function(){
        var self = this;
        $.ajax({
            type: 'GET',
            url: '../../galaxy/dataset_list/',
            dataType: 'xml',
            success: function(data, textStatus, XMLHttpRequest) {
                $("#" + self.dataset_list_id).empty();
                var list = $('#' + self.dataset_list_id);
                if( !self.galaxy_connector.history_id ) self.galaxy_connector.set_history_id( $(data).find("history").attr("id") );
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
    }
});


/**
 * function to import a dataset from from a example/local data directory
 * @returns {Dataset} dataset instance
 */
Data.import_example = function( directory_name, filename, type, params, success, no_init){
    var self = this;
    var dataset = new Dataset({
        name: filename,
        status: { local: null, server: 'importing' }
    });
    $.ajax({
        url: '../../example/import_example/',
        data: { directory_name: directory_name, filename: filename, datatype: type },
        success: function(response){
            response = $.parseJSON( response );
            dataset.server_id = response.id;
            dataset.set_type( response.type );
            dataset.set_status( 'server', response.status );
            if( !no_init ) dataset.init( params );
            if( $.isFunction(success) ){
                success( dataset );
            }
        }
    });
    return dataset;
}



/**
 * A widget to select an example/local data directory
 * @constructor
 */
ExampleDirectorySelectorWidget = function(params){
    params.tag_name = 'span';
    Widget.call( this, params );
    this.directory_selector_id = this.id + '_directory';
    this.refresh_id = this.id + '_refresh';
    var content = '<span class="control_row">' +
            '<label for="' + this.directory_selector_id + '">Directory:</label>&nbsp;' +
            '<select id="' + this.directory_selector_id + '" class="ui-state-default"></select>&nbsp;' +
            '<span title="refresh" class="ui-icon ui-icon-refresh" style="cursor:pointer;" id="' + this.refresh_id + '">refresh</span>' +
        '</span>';
    $(this.dom).append( content );
    this._init();
};
ExampleDirectorySelectorWidget.prototype = Utils.extend(Widget,{
    _init: function(){
        var self = this;
        this._update();
        $("#" + this.directory_selector_id).change(function(){
            self.directory_name = $("#" + this.directory_selector_id).val();
        });
        $('#' + this.refresh_id).click(function(){
            self._update();
        });
    },
    _update: function(  ){
        var self = this;
        $.ajax({
            url: '../../example/directory_list/',
            dataType: 'json',
            success: function(data, textStatus, XMLHttpRequest) {
                var elm = $("#" + self.directory_selector_id);
                self.directory_name = elm.val();
                elm.empty();
                $.each(data, function(i){
                    elm.append("<option value='" + this + "'>" + this + "</option>");
                });
                if(self.directory_name) elm.val( self.directory_name );
                elm.triggerHandler('change');
            }
        });
    },
    get_value: function(){
        return $("#" + this.directory_selector_id + " option:selected").val();
    },
    change: function(fn){
	$("#" + this.directory_selector_id).change(fn);
    }
});


/**
 * widget for loading example/local data
 * @constructor
 * @extends Widget
 */
ExampleLoadWidget = function(params){
    params.heading = 'Example/Local Data';
    this.directory_name = '';
    Widget.call( this, params );
    this.directory_selector_widget_id = this.id + '_directory_selector';
    this.dataset_list_id = this.id + '_dataset_list';
    this.load_as_selector_widget_id = this.id + '_load_as';
    this.applet_selector_widget_id = this.id + '_applet';
    var content = '<div  class="control_group">' +
        '<div id="' + this.applet_selector_widget_id + '"></div>' +
        '<div id="' + this.load_as_selector_widget_id + '"></div>' +
        '<div id="' + this.directory_selector_widget_id + '"></div>' +
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
    this.directory_selector = new ExampleDirectorySelectorWidget({
        parent_id: this.directory_selector_widget_id
    })
    this.init();
}
ExampleLoadWidget.prototype = Utils.extend(Widget, /** @lends ExampleLoadWidget.prototype */ {
    init: function(){
        var self = this;
        this.update();
        this.directory_name = this.directory_selector.get_value();
        this.directory_selector.change(function(){
            self.directory_name = self.directory_selector.get_value();
            self.update();
        });
        Widget.prototype.init.call(this);
    },
    update: function() {
        this.dataset_list();
    },
    import_dataset: function(id, directory_name, filename, type){
        var self = this;
        var params = {
            applet: this.applet_selector.get_value(),
            load_as: this.load_as_selector.get_value()
        }
        Data.import_example( directory_name, filename, type, params, function(dataset){
            $('#' + self.dataset_list_id + '_' + id).attr("disabled", false).removeClass('ui-state-disabled').button( "option", "label", "import" );
        })
    },
    dataset_list: function(){
        var self = this;
        $.ajax({
            url: '../../example/dataset_list/',
            data: { directory_name: self.directory_name },
            dataType: 'json',
            success: function(data, textStatus, XMLHttpRequest) {
                var list = $('#' + self.dataset_list_id);
                list.empty();
                //self.directory_name = data.directory_name;
                $.each(data.file_list, function(id,name){
                    var button_id = self.dataset_list_id + '_' + id;
                    list.append( '<div>' +
                        '<button id="' + button_id + '">import</button>&nbsp;' +
                        '<span>' + name + '</span>' +
                    "</div>");
                    $("#" + button_id).button().click(function() {
                        $(this).attr("disabled", true).addClass('ui-state-disabled').button( "option", "label", "importing..." );
                        self.import_dataset( id, self.directory_name, name );
                    });
                });
            }
        });
    }
});


/**
 * function to import a dataset from some url
 * @returns {Dataset} dataset instance
 */
Data.import_url = function(url, name, type, params, success, no_init){
    var self = this;
    var dataset = new Dataset({
        name: name,
        status: { local: null, server: 'importing' }
    });
    $.ajax({
        url: '../../urlload/index/',
        data: { url: url, name: name, datatype: type },
        success: function(response){
            response = $.parseJSON( response );
            dataset.server_id = response.id;
            dataset.set_type( response.type );
            dataset.set_status( 'server', response.status );
            if( !no_init ) dataset.init( params );
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
Data.import_pdb = function(id, params, success, no_init){
    return Data.import_url( Data.get_pdb_url(id), id + '.pdb', 'pdb', params, success, no_init );
}



/**
 * widget for loading data from a url
 * @constructor
 * @extends Widget
 */
UrlLoadWidget = function(params){
    params.heading = this.widget_name;
    params.collapsed = true;
    Widget.call( this, params );
    this.input_id = this.id + '_input';
    this.load_as_selector_widget_id = this.id + '_load_as';
    this.applet_selector_widget_id = this.id + '_applet';
    this.load_button_id = this.id + '_load_button';
    var content = '<div  class="control_group">' +
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
        Widget.prototype.init.call(this);
    },
    get_url: function(){
        return $('#' + this.input_id).val();
    },
    get_name: function(){
        return $('#' + this.input_id).val();
    },
    get_type: function(){
        return '';
    },
    import_url: function(){
        var url = this.get_url();
        var name = this.get_name();
        var type = this.get_type();
        var self = this;
        var params = {
            applet: this.applet_selector.get_value(),
            load_as: this.load_as_selector.get_value()
        }
        Data.import_url( url, name, type, params, function(dataset){
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
    },
    get_type: function(){
        return 'pdb';
    }
});




/**
 * widget for saving data
 * @constructor
 * @extends Widget
 */
SaveDataWidget = function(params){
    params.heading = params.heading || 'Download data';
    params.collapsed = false;
    Widget.call( this, params );
    this.applet_selector_widget_id = this.id + '_applet';
    this.form_id = this.id + '_form';
    this.iframe_id = this.id + '_iframe';
    this.save_structure_id = this.id + '_save_structure';
    this.save_structure_selected_id = this.id + '_save_structure_selected';
    this.save_image_id = this.id + '_save_image';
    this.save_state_id = this.id + '_save_state';
    var content = '<div  class="control_group">' +
        '<div id="' + this.applet_selector_widget_id + '"></div>' +
        '<div class="control_row">' +
            '<button id="' + this.save_structure_id + '">save structure</button>' +
            '<input id="' + this.save_structure_selected_id + '" type="checkbox"/>' +
            '<label for="' + this.save_structure_selected_id + '">save only selected</label>' +
        '</div>' +
        '<div class="control_row">' +
            '<button id="' + this.save_image_id + '">save image</button>' +
        '</div>' +
        '<div class="control_row">' +
            '<button id="' + this.save_state_id + '">save state</button>' +
        '</div>' +
        '<form id="' + this.form_id + '" style="display:hidden;" method="post" action="../../save/' + this.backend_type + '/" target="' + this.iframe_id + '">' +
            '<input type="hidden" name="name" value=""></input>' +
            '<input type="hidden" name="data" value=""></input>' +
            '<input type="hidden" name="type" value=""></input>' +
            '<input type="hidden" name="encoding" value=""></input>' +
        '</form>' +
        '<iframe id="' + this.iframe_id + '" name="' + this.iframe_id + '" style="display:none;" src="" frameborder="0" vspace="0" hspace="0" marginwidth="0" marginheight="0" width="0" height="0"></iframe>' +
    '</div>';
    $(this.dom).append( content );
    
    
    this.applet_selector = new JmolAppletSelectorWidget({
        parent_id: this.applet_selector_widget_id,
        applet: params.applet,
        allow_new_applets: false
    });
    this.init();
}
SaveDataWidget.prototype = Utils.extend(Widget, /** @lends SaveDataWidget.prototype */ {
    backend_type: 'download',
    extra_input_fields: '',
    init: function(){
        var self = this;
        
        $("#" + this.save_structure_id).button().click(function() {
            $(this).attr("disabled", true).addClass('ui-state-disabled').button( "option", "label", "saving..." );
            setTimeout(function(){
                $("#" + self.save_structure_id).attr("disabled", false).removeClass('ui-state-disabled').button( "option", "label", "save structure" );
            }, 3000);
            self.save_structure();
        });
        $("#" + this.save_image_id).button().click(function() {
            $(this).attr("disabled", true).addClass('ui-state-disabled').button( "option", "label", "saving..." );
            setTimeout(function(){
                $("#" + self.save_image_id).attr("disabled", false).removeClass('ui-state-disabled').button( "option", "label", "save image" );
            }, 3000);
            self.save_image();
        });
        $("#" + this.save_state_id).button().click(function() {
            $(this).attr("disabled", true).addClass('ui-state-disabled').button( "option", "label", "saving..." );
            setTimeout(function(){
                $("#" + self.save_state_id).attr("disabled", false).removeClass('ui-state-disabled').button( "option", "label", "save state" );
            }, 3000);
            self.save_state();
        });
        Widget.prototype.init.call(this);
    },
    save_data: function( data, name, encoding, type ){
        var form = $('#' + this.form_id);
        form.children('input[name=name]').val( name );
        form.children('input[name=data]').val( data );
        form.children('input[name=encoding]').val( encoding || '' );
        form.children('input[name=type]').val( type || '' );
        form.submit();
    },
    save_structure: function(){
        var applet = this.applet_selector.get_value();
        if( !$("#" + this.save_structure_selected_id).is(':checked') ){
            applet.script_wait('select *;');
        }
        var data = applet.evaluate('write("coords","pdb").split("\n")');
        //var data = this.applet_selector.get_value().evaluate('write("ramachandran","r").split("\n")');
        //var data = this.applet_selector.get_value().get_property_as_string("fileContents", '');
        //console.log(data);
        this.save_data( data, 'structure.pdb' );
    },
    save_image: function(){
        var data = this.applet_selector.get_value().get_property_as_string("image", '');
        this.save_data( data, 'image.jpg', 'base64' );
    },
    save_state: function(){
        var data = this.applet_selector.get_value().get_property_as_string("stateInfo", '');
        this.save_data( data, 'state.jspt' );
    }
});


/**
 * widget for saving data to a example/local directory
 * @constructor
 * @extends SaveDataWidget
 */
SaveExampleWidget = function(params){
    params.heading = 'Save in example/local dir';
    SaveDataWidget.call( this, params );
    this.directory_selector_widget_id = this.id + '_directory_selector';
    this.filename_id = this.id + '_filename';
    $('#' + this.applet_selector_widget_id).after(
        '<div id="' + this.directory_selector_widget_id + '"></div>' +
        '<div class="control_row">' +
            'Filename: ' +
            '<input id="' + this.filename_id + '" type="text"/>' +
        '</div>'
    );
    this.directory_selector = new ExampleDirectorySelectorWidget({
        parent_id: this.directory_selector_widget_id
    })
    $('#' + this.form_id).append(
        '<input type="hidden" name="directory_name" value=""></input>'
    );
}
SaveExampleWidget.prototype = Utils.extend(SaveDataWidget, /** @lends SaveDataWidget.prototype */ {
    init: function(){
        SaveDataWidget.prototype.init.call( this );
    },
    backend_type: 'local',
    save_data: function( data, name, encoding, type ){
        name = $('#' + this.filename_id).val() || name;
        var form = $('#' + this.form_id);
        form.children('input[name=directory_name]').val( this.get_directory_name() );
        SaveDataWidget.prototype.save_data.call( this, data, name, encoding, type );
    },
    get_directory_name: function(){
        return this.directory_selector.get_value();
    }
});


/**
 * widget for saving data to a example/local directory
 * @constructor
 * @extends SaveDataWidget
 */
SaveGalaxyWidget = function(params){
    params.heading = 'Save in Galaxy';
    SaveDataWidget.call( this, params );
    this.history_selector_widget_id = this.id + '_history_selector';
    this.dataset_name_id = this.id + '_dataset_name';
    $('#' + this.applet_selector_widget_id).after(
        '<div id="' + this.history_selector_widget_id + '"></div>' +
        '<div class="control_row">' +
            'Dataset name: ' +
            '<input id="' + this.dataset_name_id + '" type="text"/>' +
        '</div>'
    );
    this.history_selector = new GalaxyHistorySelectorWidget({
        parent_id: this.history_selector_widget_id
    })
}
SaveGalaxyWidget.prototype = Utils.extend(SaveDataWidget, /** @lends SaveDataWidget.prototype */ {
    init: function(){
        SaveDataWidget.prototype.init.call( this );
    },
    backend_type: 'galaxy',
    save_data: function( data, name, encoding, type ){
        name = $('#' + this.dataset_name_id).val() || name;
        SaveDataWidget.prototype.save_data.call( this, data, name, encoding, type );
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
                '<div>' + this.dataset.id + '. ' + this.dataset.name + ' (' + this.dataset.type + ')</div>' +
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