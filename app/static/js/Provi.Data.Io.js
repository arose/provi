/**
 * @fileOverview This file contains the {@link Provi.Data.Io} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * @namespace
 * Provi Data Io module
 */
Provi.Data.Io = {};


(function() {

/** @exports Utils as Provi.Utils */
var Utils = Provi.Utils;

/** @exports Widget as Provi.Widget.Widget */
var Widget = Provi.Widget.Widget;


/**
 * widget class for loading datasets
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Data.Io.PluploadLoadWidget = function(params){
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
    this.applet_selector = new Provi.Jmol.JmolAppletSelectorWidget({
        parent_id: this.applet_selector_widget_id,
        applet: params.applet,
        new_jmol_applet_parent_id: params.new_jmol_applet_parent_id,
        allow_new_applets: true
    });
    this.load_as_selector = new Provi.Jmol.JmolLoadAsSelectorWidget({
        parent_id: this.load_as_selector_widget_id
    })
    this._init();
}
Provi.Data.Io.PluploadLoadWidget.prototype = Utils.extend(Widget, /** @lends Provi.Data.Io.PluploadLoadWidget.prototype */ {
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
                file.dataset = new Provi.Data.Dataset({
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
 * function to import a dataset from from a example/local data directory
 * @returns {Provi.Data.Dataset} dataset instance
 */
Provi.Data.Io.import_example = function( directory_name, filename, type, params, success, no_init ){
    var self = this;
    var dataset = new Provi.Data.Dataset({
        name: filename,
        status: { local: null, server: 'importing' }
    });
    var extra_files = '';
    console.log( 'ext: ', filename.substring( filename.lastIndexOf('.') ) );
    // handling of MSMS .vert/.face files
    // example of handling datasets comprised of multiple files
    if( filename.substring( filename.lastIndexOf('.') ) == '.vert' ){
	extra_files = 'data.face:' + filename.slice( 0, filename.lastIndexOf('.') ) + '.face';
	console.log( 'extra_files: ', extra_files );
    }
    $.ajax({
        url: '../../example/import_example/',
        data: { directory_name: directory_name, filename: filename, datatype: type, extra_files: extra_files },
        success: function(response){
            response = $.parseJSON( response );
            dataset.server_id = response.id;
            dataset.set_type( response.type );
            dataset.set_status( 'server', response.status );
	    console.log(response);
	    if( dataset && !no_init ){
		dataset.init( params );
	    }
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
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Data.Io.ExampleDirectorySelectorWidget = function(params){
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
Provi.Data.Io.ExampleDirectorySelectorWidget.prototype = Utils.extend(Widget, /** @lends Provi.Data.Io.ExampleDirectorySelectorWidget.prototype */ {
    _init: function(){
        var self = this;
	//if( $.cookie('example_directory_name') ) $("#" + self.directory_selector_id).val( $.cookie('example_directory_name') );
        this._update();
        $("#" + this.directory_selector_id).change(function(){
            self.directory_name = $("#" + this.directory_selector_id).val();
	    //console.log(self.directory_name,'sds');
	    //$.cookie('example_directory_name', self.directory_name);
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
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Data.Io.ExampleLoadWidget = function(params){
    params.heading = 'Example/Local Data';
    this.directory_name = '';
    Widget.call( this, params );
    this._build_element_ids([ 'directory_selector_widget', 'load_as_selector_widget', 'applet_selector_widget', 'dataset_list', 'dataset_list_collapse_all', 'dataset_list_collapse_none' ]);
    var content = '<div  class="control_group">' +
        '<div id="' + this.applet_selector_widget_id + '"></div>' +
        '<div id="' + this.load_as_selector_widget_id + '"></div>' +
        '<div id="' + this.directory_selector_widget_id + '"></div>' +
	'<div>' +
	    '<div>' +
		'<span>Collapse directories: </span>' +
		'<button id="' + this.dataset_list_collapse_all_id + '">show all</button>' +
		'<button id="' + this.dataset_list_collapse_none_id + '">hide all</button>' +
	    '</div>' +
	    '<div class="control_row" id="' + this.dataset_list_id + '"></div>' +
	'</div>' +
    '</div>';
    $(this.dom).append( content );
    this.applet_selector = new Provi.Jmol.JmolAppletSelectorWidget({
        parent_id: this.applet_selector_widget_id,
        applet: params.applet,
        new_jmol_applet_parent_id: params.new_jmol_applet_parent_id,
        allow_new_applets: true
    });
    this.load_as_selector = new Provi.Jmol.JmolLoadAsSelectorWidget({
        parent_id: this.load_as_selector_widget_id
    })
    this.directory_selector = new Provi.Data.Io.ExampleDirectorySelectorWidget({
        parent_id: this.directory_selector_widget_id
    })
    this.init();
}
Provi.Data.Io.ExampleLoadWidget.prototype = Utils.extend(Widget, /** @lends Provi.Data.Io.ExampleLoadWidget.prototype */ {
    init: function(){
        var self = this;
	this._directories = [];
	this._directory_collapsed = {};
	this._directory_collapsed[ this.directory_name ] = {};
	this._popup = new Provi.Widget.PopupWidget({
	    parent_id: self.parent_id,
	    position_my: 'left top',
	    position_at: 'left bottom',
	    template: '<div>{{html content}}</div>'
	});
        this.update();
        this.directory_name = this.directory_selector.get_value();
        this.directory_selector.change(function(){
            self.directory_name = self.directory_selector.get_value();
	    if(!self._directory_collapsed[self.directory_name]) self._directory_collapsed[self.directory_name] = {};
            self.update();
        });
	$('#' + this.dataset_list_collapse_all_id).button().click( function(){
	    var dir_col = self._directory_collapsed[self.directory_name];
	    $.each(self._directories, function(key,id){
		$("#" + id).next().show();
		$("#" + id).children('.ui-icon').addClass('ui-icon-triangle-1-s').removeClass('ui-icon-triangle-1-e');
		dir_col[id] = dir_col[id] ? false : true;
	    });
	});
	$('#' + this.dataset_list_collapse_none_id).button().click( function(){
	    var dir_col = self._directory_collapsed[self.directory_name];
	    $.each(self._directories, function(key,id){
		$("#" + id).next().hide();
		$("#" + id).children('.ui-icon').addClass('ui-icon-triangle-1-e').removeClass('ui-icon-triangle-1-s');
		dir_col[id] = dir_col[id] ? false : true;
	    });
	});
        Widget.prototype.init.call(this);
    },
    update: function() {
	this._popup.hide();
        this.dataset_list();
    },
    import_dataset: function(id, directory_name, filename, type, no_init){
        var self = this;
        var params = {
            applet: this.applet_selector.get_value(),
            load_as: this.load_as_selector.get_value()
        }
        return Provi.Data.Io.import_example( directory_name, filename, type, params, function(dataset){
            $('#' + self.dataset_list_id + '_' + id).attr("disabled", false).removeClass('ui-state-disabled').button( "option", "label", "import" );
        }, no_init);
    },
    dataset_list: function(){
        var self = this;
	var dir_col = self._directory_collapsed[self.directory_name];
        $.ajax({
            url: '../../example/dataset_list/',
            data: { directory_name: self.directory_name },
            dataType: 'json',
            success: function(data, textStatus, XMLHttpRequest) {
                var list = $('#' + self.dataset_list_id);
                list.empty();
		var tree = {};
                $.each(data.file_list, function(id,name){
		    var name_list = name.split('/').reverse();
		    var cur_name = name_list.pop();
		    var cur_subtree = tree;
		    while( cur_name ){
			if( name_list.length > 0 ){
			    if( !cur_subtree[cur_name] ){
				cur_subtree[cur_name] = { '__path__': name+name_list.length };
			    }
			    cur_subtree = cur_subtree[cur_name];
			}else{
			    cur_subtree[ cur_name ] = [id, name];
			}
			cur_name = name_list.pop();
		    }
                });
		
		self._directories = [];
		
		function tree_to_html( tree, level ){
		    html = '';
		    $.each(tree, function(key,data){
			if( $.isArray(data) ){
			    var id = data[0];
			    var button_id = self.dataset_list_id + '_' + id;
			    var params_id = self.dataset_list_id + '_params_' + id;
			    html += '<div style="padding-left:0px;">' +
				'<button id="' + button_id + '">import</button>' +
				'<button id="' + params_id + '">params</button>&nbsp;' +
				'<span>' + key + '</span>' +
			    "</div>";
			}else if( data['__path__'] ){
			    var dir_id = self.dataset_list_id + '_dir_' + data['__path__'].replace( new RegExp( "[^A-Za-z0-9_]", "gi" ), "_" );
			    html += '' +
				'<div style="padding-top:5px; padding-bottom:5px; " id="' + dir_id + '">' +
				    '<span class="ui-icon ui-icon-triangle-1-' + (dir_col ? 's' : 'e') + '"></span>' +
				    '<span style="font-weight: bold;">' + key + '</span>' +
				'</div>' +
				tree_to_html( data, level+1 );
			    self._directories.push( dir_id );
			}
		    });
		    return '<div style="' + (level>0 ? 'padding-left:20px;' : '') + 'position:relative;">' + html + '</div>';
		}
		
		var html = tree_to_html( tree, 0 );
		list.append( html );
		
		// register on click handlers to show subtrees
		$.each(self._directories, function(key,id){
		    $("#" + id).click(function() {
			$("#" + id).next().toggle();
			$("#" + id).children('.ui-icon').toggleClass('ui-icon-triangle-1-s').toggleClass('ui-icon-triangle-1-e');
			dir_col[id] = dir_col[id] ? false : true;
		    });
		    
		    if( !dir_col[id] ){
			$("#" + id).next().toggle();
			$("#" + id).children('.ui-icon').toggleClass('ui-icon-triangle-1-s').toggleClass('ui-icon-triangle-1-e');
		    }
		});
		
		// register on click handlers to import datasets and show import params
		$.each(data.file_list, function(id,name){
		    var button_id = self.dataset_list_id + '_' + id;
		    $("#" + button_id).button().click(function() {
			$(this).attr("disabled", true).addClass('ui-state-disabled').button( "option", "label", "importing..." );
			self.import_dataset( id, self.directory_name, name );
		    });
		    var params_id = self.dataset_list_id + '_params_' + id;
		    $('#' + params_id).button({
			text: false,
			icons: {
			    primary: 'ui-icon-script'
			}
		    }).click(function(){
			self._popup.hide();
			$(this).attr("disabled", true).addClass('ui-state-disabled');
			//var ds = self.import_dataset( id, self.directory_name, name, undefined, true );
			var ds = Provi.Data.Io.import_example(
			    self.directory_name, name, undefined, {},
			    function(dataset){
				$('#' + params_id).attr("disabled", false).removeClass('ui-state-disabled');
			    },
			    true
			);
			var dsw = new Provi.Data.DatasetWidget({
			    parent_id: self._popup.data_id,
			    dataset: ds
			});
			$(dsw).bind('loaded', function(){ 
			    self._popup.hide();
			});
			self._popup.show( $("#" + button_id) );
			
			//console.log( params_id );
			//self._popup.hide();
			//var tmp_ds = new Provi.Data.Dataset({
			//    name: id,
			//    type: 'pdb',
			//    status: { local: 'temporary', server: null }
			//});
			//console.log( tmp_ds.load_params_widget, self._popup.data_id );
			//if(tmp_ds.load_params_widget){
			//    $.each(tmp_ds.load_params_widget, function(i, lpw){
			//	console.log(i, lpw);
			//	new lpw.obj({ parent_id: self._popup.data_id })
			//    });
			//}
			//self._popup.show( $("#" + button_id) );
		    });
		});
            }
        });
    }
});



/**
 * function to import a dataset from some url
 * @returns {Provi.Data.Dataset} dataset instance
 */
Provi.Data.Io.import_url = function(url, name, type, params, success, no_init){
    var self = this;
    var dataset = new Provi.Data.Dataset({
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
            if( dataset && !no_init ) dataset.init( params );
            if( $.isFunction(success) ){
                success( dataset );
            }
        }
    });
    return dataset;
}


Provi.Data.Io.get_pdb_url = function(id){
    return 'http://www.rcsb.org/pdb/files/' + id + '.pdb';
}


/**
 * function to import a dataset from the pdb
 * @returns {Provi.Data.Dataset} dataset instance
 */
Provi.Data.Io.import_pdb = function(id, params, success, no_init){
    return Provi.Data.Io.import_url( Provi.Data.Io.get_pdb_url(id), id + '.pdb', 'pdb', params, success, no_init );
}



/**
 * widget for loading data from a url
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Data.Io.UrlLoadWidget = function(params){
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
    this.applet_selector = new Provi.Jmol.JmolAppletSelectorWidget({
        parent_id: this.applet_selector_widget_id,
        applet: params.applet,
        new_jmol_applet_parent_id: params.new_jmol_applet_parent_id,
        allow_new_applets: true
    });
    this.load_as_selector = new Provi.Jmol.JmolLoadAsSelectorWidget({
        parent_id: this.load_as_selector_widget_id
    })
    this.init();
}
Provi.Data.Io.UrlLoadWidget.prototype = Utils.extend(Widget, /** @lends Provi.Data.Io.UrlLoadWidget.prototype */ {
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
        Provi.Data.Io.import_url( url, name, type, params, function(dataset){
            $('#' + self.load_button_id).attr("disabled", false).removeClass('ui-state-disabled').button( "option", "label", "import" );
            $('#' + self.input_id).val('');
        })
    }
});


/**
 * widget for loading data from the pdb
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Data.Io.PdbLoadWidget = function(params){
    Provi.Data.Io.UrlLoadWidget.call( this, params );
    $('#' + this.input_id).attr('size', '4');
}
Provi.Data.Io.PdbLoadWidget.prototype = Utils.extend(Provi.Data.Io.UrlLoadWidget, /** @lends Provi.Data.Io.PdbLoadWidget.prototype */ {
    widget_name: 'Pdb Import',
    input_label: 'Pdb id',
    get_url: function(){
        return Provi.Data.Io.get_pdb_url( $('#' + this.input_id).val() );
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
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Data.Io.SaveDataWidget = function(params){
    params.heading = params.heading || 'Download data';
    params.collapsed = false;
    Widget.call( this, params );
    this._build_element_ids([
	'save_structure', 'save_structure_selected', 'save_image', 'save_state', 'save_isosurface', 'save_ndx',
	'ndx_group', 'applet_selector_widget', 'form', 'iframe'
    ]);
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
	'<div class="control_row">' +
            '<button id="' + this.save_isosurface_id + '">save isosurface</button>' +
        '</div>' +
	'<div class="control_row">' +
            '<button id="' + this.save_ndx_id + '">save ndx</button>&nbsp;' +
            'Group name: ' +
            '<input id="' + this.ndx_group_id + '" type="text"/>' +
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
    
    
    this.applet_selector = new Provi.Jmol.JmolAppletSelectorWidget({
        parent_id: this.applet_selector_widget_id,
        applet: params.applet,
        allow_new_applets: false
    });
    this.init();
}
Provi.Data.Io.SaveDataWidget.prototype = Utils.extend(Widget, /** @lends Provi.Data.Io.SaveDataWidget.prototype */ {
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
	$("#" + this.save_isosurface_id).button().click(function() {
            $(this).attr("disabled", true).addClass('ui-state-disabled').button( "option", "label", "saving..." );
            setTimeout(function(){
                $("#" + self.save_isosurface_id).attr("disabled", false).removeClass('ui-state-disabled').button( "option", "label", "save isosurface" );
            }, 3000);
            self.save_isosurface();
        });
	$("#" + this.save_ndx_id).button().click(function() {
            $(this).attr("disabled", true).addClass('ui-state-disabled').button( "option", "label", "saving..." );
            setTimeout(function(){
                $("#" + self.save_ndx_id).attr("disabled", false).removeClass('ui-state-disabled').button( "option", "label", "save ndx" );
            }, 3000);
            self.save_ndx();
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
	applet.script_wait('save selection tmp' + this.id + ';');
        if( !$("#" + this.save_structure_selected_id).is(':checked') ){
            applet.script_wait('select *;');
        }
        var data = applet.evaluate('write("coords","pdb").split("\n")');
        //var data = this.applet_selector.get_value().evaluate('write("ramachandran","r").split("\n")');
        //var data = this.applet_selector.get_value().get_property_as_string("fileContents", '');
        //console.log(data);
        this.save_data( data, 'structure.pdb' );
	applet.script_wait('restore selection tmp' + this.id + ';');
    },
    save_image: function(){
        var data = this.applet_selector.get_value().get_property_as_string("image", '');
        this.save_data( data, 'image.jpg', 'base64' );
    },
    save_state: function(){
        var data = this.applet_selector.get_value().get_property_as_string("stateInfo", '');
        this.save_data( data, 'state.jspt' );
    },
    save_isosurface: function(){
        var data = this.applet_selector.get_value().evaluate("script('show isosurface')");
	console.log(data);
        this.save_data( data, 'isosurface.jvxl' );
    },
    save_ndx: function(){
	var name = $('#' + this.ndx_group_id).val() || 'IndexGroup';
	var atomno = this.applet_selector.get_value().evaluate('{selected}.format("%[atomno]").join(" ")');
        var data = '[ ' + name + ' ]\n' +
	    Provi.Utils.wordwrap( atomno, 80, '\n', false ) +
	    '\n\n';
	console.log(data);
        this.save_data( data, 'index.ndx' );
    }
});


/**
 * widget for saving data to a example/local directory
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Data.Io.SaveExampleWidget = function(params){
    params.heading = 'Save in example/local dir';
    Provi.Data.Io.SaveDataWidget.call( this, params );
    this._build_element_ids([ 'directory_selector_widget', 'filename', 'append' ]);
    $('#' + this.applet_selector_widget_id).after(
        '<div id="' + this.directory_selector_widget_id + '"></div>' +
        '<div class="control_row">' +
            'Filename: ' +
            '<input id="' + this.filename_id + '" type="text"/>' +
        '</div>' +
	'<div class="control_row">' +
            '<input id="' + this.append_id + '" type="checkbox"/>' +
            '<label for="' + this.append_id + '">append (carefull!)</label>' +
        '</div>'
    );
    this.directory_selector = new Provi.Data.Io.ExampleDirectorySelectorWidget({
        parent_id: this.directory_selector_widget_id
    })
    $('#' + this.form_id).append(
	'<input type="hidden" name="append" value=""></input>' +
        '<input type="hidden" name="directory_name" value=""></input>'
    );
}
Provi.Data.Io.SaveExampleWidget.prototype = Utils.extend(Provi.Data.Io.SaveDataWidget, /** @lends Provi.Data.Io.SaveExampleWidget.prototype */ {
    init: function(){
        Provi.Data.Io.SaveDataWidget.prototype.init.call( this );
    },
    backend_type: 'local',
    save_data: function( data, name, encoding, type ){
        name = $('#' + this.filename_id).val() || name;
	append = $("#" + this.append_id).is(':checked');
        var form = $('#' + this.form_id);
	form.children('input[name=append]').val( append );
        form.children('input[name=directory_name]').val( this.get_directory_name() );
        Provi.Data.Io.SaveDataWidget.prototype.save_data.call( this, data, name, encoding, type );
    },
    get_directory_name: function(){
        return this.directory_selector.get_value();
    }
});


})();

