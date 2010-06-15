

(function() {
    
DatasetManager = {
    _dataset_list: [],
    _change_fn_list: [],
    change: function(fn, fn_this){
	this._change_fn_list.push( {fn: fn, fn_this: fn_this} );
    },
    _change: function(){
        $.each(this._change_fn_list, function(){
	    this.fn.call( this.fn_this );
	});
    },
    add: function(dataset){
        this._dataset_list.push(dataset);
        this._change();
    },
    update: function(){
        this._change();
    },
    get_list: function(){
        return this._dataset_list;
    }
};


Dataset = function(params){
    this._status = params.status || { local: null, server: null };
    this.type = params.type;
    this.data = params.data;
    this.name = params.name;
    this.server_id = params.server_id;
    this.plupload_id = params.plupload_id;
    DatasetManager.add( this );
};
Dataset.prototype = {
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
        DatasetManager.update();
    }
};


DatasetLoadWidget = function(params){
    Widget.call( this, params );
    this.input_id = this.id + '_input';
    this.container_id = this.id + '_container';
    this.filelist_id = this.id + '_filelist';
    this.pickfiles_id = this.id + '_pickfiles';
    this.uploadfiles_id = this.id + '_uploadfiles';
    this.target_selector_id = this.id + '_target';
    this.type_selector_id = this.id + '_type';
    this.applet_selector_widget_id = this.id + '_applet';
    var content = '<div class="control_group">' +
        '<div class="control_row">' +
            '<label for="' + this.type_selector_id + '">Filetype:</label>' +
            '<select id="' + this.type_selector_id + '" class="ui-state-default">' +
                '<option value="auto">determine automatically</option>' +
                '<option value="pdb">pdb</option>' +
                '<option value="mplane">membrane planes</option>' +
            '</select>' +
        '</div>' +
        '<div id="' + this.applet_selector_widget_id + '"></div>' +
        '<div class="control_row">' +
            '<label for="' + this.target_selector_id + '">Structure loading type</label>' +
            '<select id="' + this.target_selector_id + '" class="ui-state-default">' +
                '<option value="append">append</option>' +
                '<option value="new">new</option>' +
                '<option value="trajectory">new trajectory</option>' +
            '</select>' +
        '</div>' +
        '<form method="post" action="examples_dump.php">' +
            '<div class="control_row" id="' + this.container_id + '">' +
                //'<label for="' + this.input_id + '">Select file:</label>' +
                //'<input type="file" id="' + this.input_id + '" />' +
                '<div id="' + this.filelist_id + '">No runtime found.</div>' +
                '<br />' +
                '<a id="' + this.pickfiles_id + '" href="#">[Select files]</a>' +
                '<a id="' + this.uploadfiles_id + '" href="#">[Upload files]</a>' +
            '</div>' +
        '</form>' +
    '</div>';
    $(this.dom).append( content );
    this.applet_selector = new JmolAppletSelectorWidget({
        parent_id: this.applet_selector_widget_id,
        applet: params.applet,
        new_jmol_applet_parent_id: params.new_jmol_applet_parent_id,
        allow_new_applets: true
    });
    this._init();
}
DatasetLoadWidget.prototype = Utils.extend(Widget,{
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
            file.dataset.type = response.type;
            file.dataset.set_status( 'server', response.status );
            console.log(response.type);
            var type = response.type;
            var applet = self.applet_selector.get_value();
            console.log('applet', applet);
            
            if( $.inArray(type, ['pdb', 'sco', 'mbn', 'gro', 'cif', 'mmcif']) >= 0 ){
            
                var load_as = $("#" + self.target_selector_id + " option:selected").val();
                console.log(load_as);
                if(load_as == 'trajectory'){
                    applet.script('load TRAJECTORY "../../data/get/?id=' + response.id + '";');
                }else if(load_as == 'append'){
                    applet.script('load APPEND "../../data/get/?id=' + response.id + '"; select *; zoom(selected) 20;');
                }else if(load_as == 'new'){
                    var get_params = { 'id': response.id+'' };
                    if( $.inArray(type, ['pdb', 'sco', 'mbn']) >= 0 ){
                        get_params.data_action = 'get_pdb';
                    }
                    //console.log('struc', get_params);
                    $.get( '../../data/get/', get_params, function(get_response_data){
                        applet.load_inline(get_response_data);
                    });
                }
            
            }else if( type == 'mplane' ){
                var get_params = { 'id': response.id+'', 'data_action': 'get_planes' };
                $.getJSON( '../../data/get/', get_params, function(get_response_data){
                    var s = 'draw plane1 color TRANSLUCENT 0.6 blue plane 500 ' + get_response_data[0] + '; draw plane2 color TRANSLUCENT 0.6 blue plane 500 ' + get_response_data[1] + ';';
                    console.log(get_response_data, s);
                    applet.script(s);
                });
            }else if( $.inArray(type, ['jvxl', 'mrc']) >= 0 ){
                applet.script('isosurface color black "../../data/get/?id=' + response.id + '" mesh nofill;');
            }else{
                console.log('unkonwn file type');
            }
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





DatasetManagerWidget = function(params){
    DatasetManager.change(this.update, this);
    Widget.call( this, params );
    this.list_id = this.id + '_list';
    var content = '<div class="control_group">' +
        '<div id="' + this.list_id + '"></div>' +
    '</div>';
    $(this.dom).append( content );
    this.update();
}
DatasetManagerWidget.prototype = Utils.extend(Widget,{
    update: function(){
        var elm = $("#" + this.list_id);
        elm.empty();
        $.each( DatasetManager.get_list(), function(){
            var status = this.get_status();
            elm.append(
                '<div class="control_row" style="background-color: lightgreen; margin: 5px; padding: 3px;">' +
                    '<div>Name: ' + this.name + '</div>' +
                    '<div>Type: ' + this.type + '</div>' +
                    '<div>Local Status: ' + status.local + '</div>' +
                    '<div>Server Status: ' + status.server + '</div>' +
                '</div>'
            );
        });
        //$('#'+this.list_id).load('../../data/index/', function() {
        //    console.log('data list loaded');
        //});
    }
});


})();


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


