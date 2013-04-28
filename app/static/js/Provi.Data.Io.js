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
    params = _.defaults(
        params,
        Provi.Data.Io.PluploadLoadWidget.prototype.default_params
    );
    
    Provi.Widget.Widget.call( this, params );
    this._init_eid_manager([
        'input', 'container', 'filelist', 'picklist', 'uploadfiles',
        'type_selector', 'load_as_selector_widget', 'applet_selector_widget'
    ]);

    var template = '' +
        '<div class="control_group">' +
        '<div class="control_row">' +
            '<label for="${eids.type_selector}">Filetype:</label>' +
            '<select id="${eids.type_selector}" class="ui-state-default">' +
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
        '<div id="${eids.applet_selector_widget}"></div>' +
        '<div id="${eids.load_as_selector_widget}"></div>' +
        '<div class="control_row" id="${eids.container}">' +
            //'<label for="${eids.input}">Select file:</label>' +
            //'<input type="file" id="${eids.input}" />' +
            '<div id="${eids.filelist}">No runtime found.</div>' +
            '<br />' +
            '<a id="${eids.picklist}" href="#">[Select files]</a>' +
            '<a id="${eids.uploadfiles}" href="#">[Upload files]</a>' +
        '</div>' +
    '</div>';
    this.add_content( template, params );

    this.applet_selector = new Provi.Jmol.JmolAppletSelectorWidget({
        parent_id: this.eid('applet_selector_widget'),
        applet: params.applet,
        new_jmol_applet_parent_id: params.new_jmol_applet_parent_id,
        allow_new_applets: true
    });
    this.load_as_selector = new Provi.Bio.Structure.StructureParamsWidget({
        parent_id: this.eid('load_as_selector_widget')
    })
    this._init();
}
Provi.Data.Io.PluploadLoadWidget.prototype = Utils.extend(Widget, /** @lends Provi.Data.Io.PluploadLoadWidget.prototype */ {
    default_params: {
        heading: 'File Upload',
        collapsed: true
    },
    _init: function(){
        this._init_file_input();
        Provi.Widget.Widget.prototype.init.call(this);
    },
    _init_file_input: function(){
        var self = this;
        this.uploader = new plupload.Uploader({
            runtimes : 'html5,flash,silverlight',
            browse_button : this.eid('picklist'),
            container : this.eid('container'),
            max_file_size : '100mb',
            url : '../../plupload/index/?datatype=auto&provider=file',
            flash_swf_url : '../js/lib/plupload/js/plupload.flash.swf',
            silverlight_xap_url : '../js/lib/plupload/js/plupload.silverlight.xap'
        });

        this.uploader.bind('Init', function(up, params) {
            self.elm('filelist').html("<div>Current runtime: " + params.runtime + "</div>");
        });

        this.uploader.bind('FilesAdded', function(up, files) {
            //console.log(files);
            $.each(files, function(i, file) {
                file.dataset = new Provi.Data.Dataset({
                    name: file.name,
                    status: { local: null, server: 'queued for upload' },
                    plupload_id: file.id,
                    type: self.elm('type_selector').children("option:selected").val()
                });
                self.elm("filelist").append(
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

        this.elm("uploadfiles").click(function(e) {
            self.uploader.start();
            e.preventDefault();
        });
        
        this.uploader.bind('FileUploaded', function(up, file, res) {
            var response = $.parseJSON( res.response );
            console.log('FileUploaded', response, file);
            file.dataset.server_id = response.id;
            file.dataset.set_type( response.type );
            file.dataset.set_status( 'server', response.status );
            $( file.dataset ).triggerHandler( 'loaded' );
            file.dataset.init({
                applet: self.applet_selector.get_value(),
                load_as: self.load_as_selector.get_load_as(),
                filter: self.load_as_selector.get_filter(),
                lattice: self.load_as_selector.get_lattice()
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
Provi.Data.Io.import_example = function( directory_name, filename, type, params, no_init ){
    var self = this;
    var dataset = new Provi.Data.Dataset({
        name: filename,
        meta: {
            directory: directory_name,
            filename: filename
        },
        type: type || filename.split('.').pop(),
        url: window.location.protocol + '//' + window.location.host +
            '/example/data/' +
                '?directory_name=' + directory_name + 
                '&_id=' + (new Date().getTime()) +
                '&path=' + filename
            
    });
    if(!no_init) dataset.init( params );
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
    params.collapsed = true;
    this.directory_name = '';
    this.opened_dirs = {};
    Widget.call( this, params );
    this._build_element_ids([ 
        'directory_selector_widget', 'applet_selector_widget', 
        'dataset_list', 'dataset_list_open_all', 
        'dataset_list_close_all', 'js_tree' 
    ]);
    var content = '<div  class="control_group">' +
        '<div id="' + this.applet_selector_widget_id + '"></div>' +
        '<div id="' + this.directory_selector_widget_id + '"></div>' +
        '<div>' +
            '<div>' +
                '<span>Collapse directories: </span>' +
                '<button id="' + this.dataset_list_open_all_id + '">show all</button>' +
                '<button id="' + this.dataset_list_close_all_id + '">hide all</button>' +
            '</div>' +
            '<div class="control_row" id="' + this.dataset_list_id + '"></div>' +
        '</div>' +
        '<div class="control_row">' +
            '<div id="' + this.jstree_id + '"></div>' +
        '</div>' +
    '</div>';
    $(this.dom).append( content );
    this.applet_selector = new Provi.Jmol.JmolAppletSelectorWidget({
        parent_id: this.applet_selector_widget_id,
        applet: params.applet,
        new_jmol_applet_parent_id: params.new_jmol_applet_parent_id,
        allow_new_applets: true
    });
    this.directory_selector = new Provi.Data.Io.ExampleDirectorySelectorWidget({
        parent_id: this.directory_selector_widget_id
    })
    this.init();
}
Provi.Data.Io.ExampleLoadWidget.prototype = Utils.extend(Widget, /** @lends Provi.Data.Io.ExampleLoadWidget.prototype */ {
    init: function(){
        var self = this;
        this._popup = new Provi.Widget.PopupWidget({
            parent_id: self.parent_id,
            position_my: 'left top',
            position_at: 'bottom',
            template: '<div>{{html content}}</div>'
        });
        this.update();
        this.directory_name = this.directory_selector.get_value();
        this.directory_selector.change(function(){
            self.directory_name = self.directory_selector.get_value();
            self.update();
        });
        $('#' + this.dataset_list_open_all_id).button().click( function(){
            self.jstree.open_all();
        });
        $('#' + this.dataset_list_close_all_id).button().click( function(){
            self.jstree.close_all();
        });
        
        // LOAD //
        $( '#' + this.jstree_id + ' button[title="load"]' ).live( 'click', function(e, data){
            var ds = self.load_dataset(
                self.directory_name,
                $(this).parent().parent().data('path')
            );
        });

        // PARAMS //
        $( '#' + this.jstree_id + ' button[title="params"]' ).live( 'click', function(e, data){
            var ds = self.load_dataset(
                self.directory_name,
                $(this).parent().parent().data('path'),
                '',
                true
            );
            self._popup.empty();
            var dsw = new Provi.Data.DatasetWidget({
                parent_id: self._popup.data_id,
                dataset: ds
            });
            $(dsw).bind('loaded', function(){ 
                self._popup.hide();
            });
            self._popup.show( $(this).parent().children('ins') );
        });
        
        Widget.prototype.init.call(this);
    },
    update: function() {
        this._popup.hide();
        this.dataset_list();
    },
    load_dataset: function(directory_name, filename, type, no_init){
        var self = this;
        var params = {
            applet: this.applet_selector.get_value()
        }
        return Provi.Data.Io.import_example( 
            directory_name, filename, type, params, no_init
        );
    },
    dataset_list: function(){
        if( !this.directory_name ) return;
        var self = this;
        
        var get_url = function(node){
            var url = "../../example/dataset_list2/";
            if(node!=-1){
                url += '?path=' + $(node).data('path');
            }
            return url;
        }
        
        var jstree = $( '#' + this.jstree_id ).jstree({
            json_data: {
                ajax: {
                    url: get_url,
                    data: { directory_name: self.directory_name }
                }
            },
            core: { html_titles: true },
            themeroller: { item: "" },
            plugins: [ "json_data", 'themeroller', 'cookies' ]
        });
        
        this.jstree = $.jstree._reference( '#' + this.jstree_id );
        
        $( jstree ).bind( 'load_node.jstree', function(e, data){
            var nodes = data.inst._get_children(data.rslt.obj);
            $.each( nodes, function(i,n){
                var $n = $(n);
                if( !$n.data('dir') ){
                    $n.children('a').children('span').before(
                        '<button title="load">load</button>' +
                        '<button title="params">p</button>'
                    );
                    $n.children('a').children('button').button();
                }
            });
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
        url: '../../urlload/',
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
    params = _.defaults( params, this.default_params );
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
    this.load_as_selector = new Provi.Bio.Structure.StructureParamsWidget({
        parent_id: this.load_as_selector_widget_id
    })
    this.init();
}
Provi.Data.Io.UrlLoadWidget.prototype = Utils.extend(Widget, /** @lends Provi.Data.Io.UrlLoadWidget.prototype */ {
    input_label: 'Url',
    default_params: {
        heading: 'Url Import',
        collapsed: true
    },
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
            load_as: this.load_as_selector.get_load_as(),
            filter: this.load_as_selector.get_filter(),
            lattice: this.load_as_selector.get_lattice()
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
    params = _.defaults( params, this.default_params );
    Provi.Data.Io.UrlLoadWidget.call( this, params );
    $('#' + this.input_id).attr('size', '4');
}
Provi.Data.Io.PdbLoadWidget.prototype = Utils.extend(Provi.Data.Io.UrlLoadWidget, /** @lends Provi.Data.Io.PdbLoadWidget.prototype */ {
    input_label: 'Pdb id',
    default_params: {
        heading: 'PDB Import',
        collapsed: true
    },
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
    params.collapsed = true;
    params.backend_type = this.backend_type;
    Widget.call( this, params );
    
    this._init_eid_manager([
        'save_structure', 'save_structure_selected', 'save_image', 
        'save_state', 'save_isosurface', 'save_ndx', 'save_jmol',
        'ndx_group', 'applet_selector_widget', 'form', 'iframe', 'process_structure'
    ]);

    var template = '<div  class="control_group">' +
        '<div id="${eids.applet_selector_widget}"></div>' +
        '<div class="control_row">' +
            '<button id="${eids.save_structure}">save structure</button>' +
            '&nbsp;&nbsp;' +
            '<input id="${eids.save_structure_selected}" type="checkbox"/>' +
            '<label for="${eids.save_structure_selected}">selected</label>' +
            '&nbsp;&nbsp;' +
            '<input id="${eids.process_structure}" type="checkbox"/>' +
            '<label for="${eids.process_structure}">process</label>' +
        '</div>' +
        '<div class="control_row">' +
            '<button id="${eids.save_image}">save image</button>' +
        '</div>' +
        '<div class="control_row">' +
            '<button id="${eids.save_state}">save state</button>' +
        '</div>' +
        '<div class="control_row">' +
            '<button id="${eids.save_isosurface}">save isosurface</button>' +
        '</div>' +
        '<div class="control_row">' +
            '<button id="${eids.save_ndx}">save ndx</button>&nbsp;' +
            'Group name: ' +
            '<input id="${eids.ndx_group}" type="text"/>' +
        '</div>' +
        '<div class="control_row">' +
            '<button id="${eids.save_jmol}">save jmol</button>' +
        '</div>' +
        '<form id="${eids.form}" style="display:hidden;" method="post" action="../../save/${params.backend_type}/" target="${eids.iframe}">' +
            '<input type="hidden" name="name" value=""></input>' +
            '<input type="hidden" name="data" value=""></input>' +
            '<input type="hidden" name="type" value=""></input>' +
            '<input type="hidden" name="encoding" value=""></input>' +
        '</form>' +
        '<iframe id="${eids.iframe}" name="${eids.iframe}" style="display:none;" src="" frameborder="0" vspace="0" hspace="0" marginwidth="0" marginheight="0" width="0" height="0"></iframe>' +
    '</div>';
    this.add_content( template, params );
    
    this.applet_selector = new Provi.Jmol.JmolAppletSelectorWidget({
        parent_id: this.eid('applet_selector_widget'),
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

        _.each([ 'structure', 'image', 'state', 'isosurface', 'ndx', 'jmol' ], function(name, i){
            self.elm( 'save_' + name ).button().click(function() {
                $(this).attr("disabled", true).addClass('ui-state-disabled');
                setTimeout(function(){
                    self.elm( 'save_' + name ).attr("disabled", false).removeClass('ui-state-disabled');
                }, 3000);
                self[ 'save_' + name ]();
            });
        });

        Widget.prototype.init.call(this);
    },
    save_data: function( data, name, encoding, type ){
        var form = this.elm('form');
        form.children('input[name=name]').val( name );
        form.children('input[name=data]').val( data );
        form.children('input[name=encoding]').val( encoding || '' );
        form.children('input[name=type]').val( type || '' );
        form.submit();
    },
    save_structure: function(){
        var applet = this.applet_selector.get_value();
        var sele = this.elm('save_structure_selected').is(':checked') ? "selected" : "*";
        var data = applet.evaluate('provi_write_pdb({' + sele + '});');

        if( this.elm('process_structure').is(':checked') ){
            data = _.filter( data.split("\n"), function(line){
                return (line.slice(0,4)=="ATOM" || line.slice(0,6)=="HETATM") ? true : false;
            }).sort( function(a, b){
                if( a[21]==b[21] ){
                    if( parseInt(a.slice(22,26))==parseInt(b.slice(22,26)) ){
                        if( parseInt(a.slice(6,11))==parseInt(b.slice(6,11)) ){
                            return 0; // todo, occurs only with multiple models
                        }else{
                            return parseInt(a.slice(6,11))<parseInt(b.slice(6,11)) ? -1 : 1;
                        }
                    }else{
                        return parseInt(a.slice(22,26))<parseInt(b.slice(22,26)) ? -1 : 1;
                    }
                }else{
                    return a[21]<b[21] ? -1 : 1;
                }
            });
            data = _.map( data, function(line, i){
                return line.slice(0,6) + ("     "+(i+1)).slice(-5) + line.slice(11);
            }).join("\n");
        }

        this.save_data( data, 'structure.pdb' );
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
        var name = this.elm('ndx_group').val() || 'IndexGroup';
        var atomno = this.applet_selector.get_value().evaluate('{selected}.format("%[atomno]").join(" ")');
        var data = '[ ' + name + ' ]\n' +
            Provi.Utils.wordwrap( atomno, 80, '\n', false ) +
            '\n\n';
        console.log(data);
        this.save_data( data, 'index.ndx' );
    },
    save_jmol: function(){
        var s = '' +
            'write PNGJ ?.png' +
        '';
        console.log(s);
        var applet = this.applet_selector.get_value();
        applet.applet.script( s );
    }
});


/**
 * widget for saving data to a example/local directory
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Data.Io.SaveExampleWidget = function(params){
    params.heading = 'Save in local dir';
    Provi.Data.Io.SaveDataWidget.call( this, params );
    this._init_eid_manager([ 'directory_selector_widget', 'filename', 'append' ]);

    var template = '' +
        '<div id="${eids.directory_selector_widget}"></div>' +
        '<div class="control_row">' +
            'Filename: ' +
            '<input id="${eids.filename}" type="text"/>' +
        '</div>' +
        '<div class="control_row">' +
            '<input id="${eids.append}" type="checkbox"/>' +
            '<label for="${eids.append}">append (carefull!)</label>' +
        '</div>' +
    '';
    $.tmpl( template, { eids: this.eid_dict, params: params } )
        .insertAfter( this.elm('applet_selector_widget') )

    this.directory_selector = new Provi.Data.Io.ExampleDirectorySelectorWidget({
        parent_id: this.eid('directory_selector_widget')
    })
    this.elm('form').append(
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
        name = this.elm('filename').val() || name;
        append = this.elm('append').is(':checked');
        var form = this.elm('form');
        form.children('input[name=append]').val( append );
        form.children('input[name=directory_name]').val( this.get_directory_name() );
        Provi.Data.Io.SaveDataWidget.prototype.save_data.call( this, data, name, encoding, type );
    },
    get_directory_name: function(){
        return this.directory_selector.get_value();
    },
    save_jmol: function(){
        var applet = this.applet_selector.get_value();
        var name = this.elm('filename').val();
        var directory_name = this.get_directory_name();
        path = '../../save/jmol/' +
            '?POST?_PNGJBIN_&' +
            'name=' + name + '&' +
            'directory_name=' + directory_name +
        '';
        var s = 'print load("' + path + '");';
        console.log(s);
        applet.script( s );
    }
});


})();

