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
            $.each(files, function(i, file) {
                file.dataset = new Provi.Data.Dataset({
                    name: file.name,
                    status: { local: null, server: 'queued for upload' },
                    plupload_id: file.id,
                    type: self.elm('type_selector').children("option:selected").val()
                });
                self.elm("filelist").append(
                    '<div id="' + file.id + '">' +
                        'File: ' + file.name + ' ' +
                        '(' + plupload.formatSize(file.size) + ') ' +
                        '<b></b>' +
                    '</div>'
                );
            });
        });

        this.uploader.bind('UploadProgress', function(up, file) {
            if( !file ) return;
            $('#' + file.id + " b").html(file.percent + "%");
        });

        this.elm("uploadfiles").click(function(e) {
            self.uploader.start();
            e.preventDefault();
        });
        
        this.uploader.bind('FileUploaded', function(up, file, res) {
            var response = $.parseJSON( res.response );
            if( !response ) return;
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
    }
});



/**
 * function to import a dataset from from a example/local data directory
 * @returns {Provi.Data.Dataset} dataset instance
 */
Provi.Data.Io.import_example = function( directory_name, filename, type, params, no_init ){
    var dataset = new Provi.Data.Dataset({
        name: filename,
        meta: {
            directory: directory_name,
            filename: filename
        },
        type: type || Provi.Data.Io.type_from_filename( filename ),
        url: Provi.url_for( '/example/data/' +
            '?directory_name=' + directory_name + 
            '&_id=' + (new Date().getTime()) +
            '&path=' + filename
        )
    });
    if(!no_init) dataset.init( params );
    return dataset;
}


Provi.Data.Io.type_from_filename = function( filename ){
    // remove suffixes added by dowser|gromacs to superseeded files
    filename = filename.replace(/(_\d+|\.\d+#)$/, '');
    return filename.split('.').pop();
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
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Data.Io.ExampleLoadWidget = function(params){
    params = _.defaults( params, this.default_params );

    Provi.Widget.Widget.call( this, params );

    this._init_eid_manager([ 
        'directory_selector_widget', 'applet_selector_widget', 
        'dataset_list', 'dataset_list_open_all', 
        'dataset_list_close_all', 'jstree'
    ]);

    var p = [ "all_buttons", "directory_name", "root_dir" ];
    _.extend( this, _.pick( params, p ) );
    
    var template = '' +
        '<div id="${eids.applet_selector_widget}"></div>' +
        '<div id="${eids.directory_selector_widget}"></div>' +
        '<div>' +
            '<div>' +
                '<span>Collapse directories: </span>' +
                '<button id="${eids.dataset_list_open_all}">show all</button>' +
                '<button id="${eids.dataset_list_close_all}">hide all</button>' +
            '</div>' +
            '<div class="control_row" id="${eids.dataset_list}"></div>' +
        '</div>' +
        '<div class="control_row">' +
            '<div id="${eids.jstree}"></div>' +
        '</div>' +
    '';
    this.add_content( template, params );

    if( !this.applet ){
        this.applet_selector = new Provi.Jmol.JmolAppletSelectorWidget({
            parent_id: this.eid('applet_selector_widget'),
            applet: params.applet,
            allow_new_applets: true
        });
    }
    if( !this.directory_name ){
        this.directory_selector = new Provi.Data.Io.ExampleDirectorySelectorWidget({
            parent_id: this.eid('directory_selector_widget')
        });
    }
    this.init();
}
Provi.Data.Io.ExampleLoadWidget.prototype = Provi.Utils.extend( Provi.Widget.Widget, {
    default_params: {
        heading: 'Local Data',
        collapsed: true,
        persist_on_applet_delete: true,
        all_buttons: true,
        directory_name: false,
        root_dir: false
    },
    init: function(){
        console.log("ExampleLoadWidget");
        this._popup = new Provi.Widget.PopupWidget({
            parent_id: this.parent_id,
            position_my: 'left top',
            position_at: 'bottom',
            template: '<div>{{html content}}</div>'
        });

        if( this.applet ){
            this.elm('applet_selector_widget').hide();
        }

        if( this.directory_name ){
            this.elm('directory_selector_widget').hide();
            this.update( this.directory_name );
        }else{
            this.directory_selector.change( _.bind( function(){ this.update() }, this ) );
        }

        if( this.all_buttons ){
            this.elm('dataset_list_open_all').button().click( _.bind( function(){ this.jstree.open_all() }, this ) );
            this.elm('dataset_list_close_all').button().click( _.bind( function(){ this.jstree.close_all() }, this ) );
        }else{
            this.elm('dataset_list_open_all').parent().hide();
        }
        
        // LOAD //
        this.elm('jstree').on( 'click', 'button[title="load"]', _.bind( function(e, data){
            var elm = $(e.currentTarget);
            Provi.Widget.ui_disable_timeout( elm );
            var ds = this.load_dataset(
                this.directory_name,
                elm.parent().parent().data('path')
            );
        }, this ) );

        // PARAMS //
        this.elm('jstree').on( 'click', 'button[title="params"]', _.bind( function(e, data){
            var elm = $(e.currentTarget);
            this._popup.empty();
            var ds = this.load_dataset(
                this.directory_name,
                elm.parent().parent().data('path'),
                true
            );
            var dsw = new Provi.Data.DatasetWidget({
                parent_id: this._popup.eid('data'),
                dataset: ds
            });
            $(ds).bind('loaded', _.bind( function(){ this._popup.hide() }, this ) );
            this._popup.show( elm.parent().children('ins') );
        }, this ) );
        
        // DOWNLOAD //
        this.elm('jstree').on( 'click', 'button[title="download"]', _.bind( function(e, data){
            var elm = $(e.currentTarget);
            var url = Provi.url_for( '/example/data/' +
                '?directory_name=' + this.directory_name + 
                '&path=' + elm.parent().parent().data('path')
            );
            window.location.assign( url );
        }, this ) );

        Provi.Widget.Widget.prototype.init.call(this);
    },
    update: function( directory_name ) {
        this._popup.hide();
        this.directory_name = directory_name || this.directory_selector.get_value();
        this.dataset_list();
    },
    load_dataset: function(directory_name, filename, no_init){
        var params = {
            applet: this.applet || this.applet_selector.get_value()
        }
        return Provi.Data.Io.import_example( 
            directory_name, filename, '', params, no_init
        );
    },
    dataset_list: function(){
        if( !this.directory_name ) return;
        
        var root_dir = this.root_dir;
        var get_url = function(node){
            var url = "../../example/dataset_list2/";
            if(node!=-1){
                url += '?path=' + $(node).data('path');
            }else if( root_dir ){
                url += '?path=' + root_dir;
            }
            return url;
        }
        
        var jstree = this.elm('jstree').jstree({
            json_data: {
                ajax: {
                    url: get_url,
                    data: { directory_name: this.directory_name }
                }
            },
            core: { html_titles: true },
            themeroller: { item: "" },
            plugins: [ "json_data", 'themeroller', 'cookies' ]
        });
        
        this.jstree = $.jstree._reference( this.eid('jstree', true) );
        
        $( jstree ).bind( 'load_node.jstree', function(e, data){
            var nodes = data.inst._get_children(data.rslt.obj);
            _.each( nodes, function(n){
                var $n = $(n);
                if( !$n.data('dir') ){
                    $n.children('a').children('span').before(
                        '<button title="load">load</button>' +
                        '<button title="params">p</button>' +
                        '<button title="download">d</button>'
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
Provi.Data.Io.import_url = function( url, name, type, params, no_init ){
    var dataset = new Provi.Data.Dataset({
        name: url,
        meta: { url: url },
        type: type || url.split('.').pop(),
        url: Provi.url_for( '/urlload' ) +
            '?_id=' + (new Date().getTime()) +
            '&url=' + url
    });
    if(!no_init) dataset.init( params );
    return dataset;
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
    params.input_label = this.input_label;

    this._init_eid_manager([
        "input", "load_params_widget", "applet_selector_widget", "load"
    ]);

    var template = '<div  class="control_group">' +
        '<div id="${eids.applet_selector_widget}"></div>' +
        '<div id="${eids.load_params_widget}"></div>' +
        '<div class="control_row">' +
            '<label for="${input}">${params.input_label}:&nbsp;</label>' +
            '<input type="text" id="${eids.input}" class="ui-state-default"></input>&nbsp;' +
            '<button id="${eids.load}">import</button>' +
        '</div>' +
    '</div>';
    this.add_content( template, params );
    
    this.applet_selector = new Provi.Jmol.JmolAppletSelectorWidget({
        parent_id: this.eid('applet_selector_widget'),
        applet: params.applet,
        new_jmol_applet_parent_id: params.new_jmol_applet_parent_id,
        allow_new_applets: true
    });

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
        this.elm("load").button().click(function() {
            Provi.Widget.ui_disable_timeout( $(this) );
            self.import_url();
        });
        Widget.prototype.init.call(this);
    },
    get_url: function(){
        return this.elm("input").val();
    },
    get_name: function(){
        return this.elm("input").val();
    },
    get_type: function(){
        return '';
    },
    get_params: function(){
        return {};
    },
    import_url: function(){
        var url = this.get_url();
        var name = this.get_name();
        var type = this.get_type();
        var params = this.get_params();
        params.applet = this.applet_selector.get_value();
        Provi.Data.Io.import_url( url, name, type, params );
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
    this.load_params_widget = new Provi.Bio.Structure.StructureParamsWidget({
        parent_id: this.eid('load_params_widget')
    })
    this.elm("input").attr('size', '4');
}
Provi.Data.Io.PdbLoadWidget.prototype = Utils.extend(Provi.Data.Io.UrlLoadWidget, /** @lends Provi.Data.Io.PdbLoadWidget.prototype */ {
    input_label: 'Pdb id',
    default_params: {
        heading: 'PDB Import',
        collapsed: true
    },
    get_url: function(){
        return 'http://www.rcsb.org/pdb/files/' + this.elm("input").val() + '.pdb';
    },
    get_name: function(){
        return this.elm("input").val() + '.pdb';
    },
    get_type: function(){
        return 'pdb';
    },
    get_params: function(){
        return this.load_params_widget.params;
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
                Provi.Widget.ui_disable_timeout( self.elm( 'save_' + name ) );
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

