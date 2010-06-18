

(function() {

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
    this.type = params.type;
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
    _change_fn_list: [],
    change: function(fn, fn_this){
	this._change_fn_list.push( {fn: fn, fn_this: fn_this} );
    },
    _change: function(){
        $.each(this._change_fn_list, function(){
	    this.fn.call( this.fn_this );
	});
    }
};

/**
 * widget class for loading datasets
 * @constructor
 * @extends Widget
 */
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
        '<div class="control_row">' +
            '<label for="' + this.target_selector_id + '">Structure loading type:</label>' +
            '<select id="' + this.target_selector_id + '" class="ui-state-default">' +
                '<option value="new">new</option>' +
                '<option value="append">append</option>' +
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
DatasetLoadWidget.prototype = Utils.extend(Widget, /** @lends DatasetLoadWidget.prototype */ {
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
            var type = response.type;
            var applet = self.applet_selector.get_value();
            file.dataset.applet = applet;
            
            if( $.inArray(type, ['pdb', 'sco', 'mbn', 'gro', 'cif', 'mmcif']) >= 0 ){
            
                var load_as = $("#" + self.target_selector_id + " option:selected").val();
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
                $.getJSON( '../../data/get/', get_params, function(d){
                    var mp = new Bio.MembranePlanes( d[0], d[1], d[2] );
                    file.dataset.set_data( mp );
                    new MplaneWidget({
                        parent_id: 'tab_data',
                        dataset: file.dataset
                    });
                });
            }else if( $.inArray(type, ['jvxl', 'mrc', 'cub']) >= 0 ){
                applet.script('isosurface color black "../../data/get/?id=' + response.id + '" mesh nofill;');
            }else{
                console.log('unkown file type');
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



/**
 * widget class for managing a single dataset
 * @constructor
 * @extends Widget
 */
DatasetWidget = function(params){
    this.dataset = params.dataset;
    this.dataset.change(this.update, this);
    Widget.call( this, params );
    //var content = '<div class="control_group">' +
    //'</div>';
    //$(this.dom).append( content );
    this.update();
}
DatasetWidget.prototype = Utils.extend(Widget, /** @lends DatasetWidget.prototype */ {
    update: function(){
        var elm = $(this.dom);
        elm.empty();
        var status = this.dataset.get_status();
        elm.append(
            '<div class="control_row" style="background-color: lightgreen; margin: 5px; padding: 3px;">' +
                '<div>Name: ' + this.dataset.name + '</div>' +
                '<div>Type: ' + this.dataset.type + '</div>' +
                '<div>Local Status: ' + status.local + '</div>' +
                '<div>Server Status: ' + status.server + '</div>' +
            '</div>'
        );
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
    var content = '<div class="control_group">' +
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




/**
 * widget class for controlling a mplane dataset
 * @constructor
 * @extends Widget
 */
MplaneWidget = function(params){
    this.dataset = params.dataset;
    this.color = "blue";
    this.translucency = 0.6;
    this.size = 500;
    this.visibility = true;
    Widget.call( this, params );
    this.size_id = this.id + '_size';
    this.size_slider_id = this.id + '_size_slider';
    this.size_slider_option_id = this.id + '_size_slider_option';
    this.visibility_id = this.id + '_visibility';
    var content = '<div class="control_group">' +
        '<div class="control_row">' +
            '<label for="' + this.size_id + '">membrane plane size</label>' +
            '<select id="' + this.size_id + '" class="ui-state-default">' +
                '<option value="1">hide</option>' +
                '<option id="' + this.size_slider_option_id + '" value="1">slider</option>' +
                '<option value="100">100</option>' +
                '<option value="200">200</option>' + 
                '<option value="300">300</option>' +
                '<option value="400">400</option>' +
                '<option value="500" selected="selected">500</option>' +
                '<option value="600">600</option>' +
                '<option value="700">700</option>' +
                '<option value="800">800</option>' +
                '<option value="1000">1000</option>' +
                '<option value="1200">1200</option>' +
                '<option value="1400">1400</option>' +
            '</select>' +
        '</div>' +
        '<div class="control_row">' +
            '<input id="' + this.visibility_id + '" type="checkbox" checked="checked" style="float:left; margin-top: 0.5em;"/>' +
            '<div id="' + this.size_slider_id + '"></div>' +
        '</div>' +
        '<i>the membrane planes are shown in blue and are semi transparent</i>' +
    '</div>'
    $(this.dom).append( content );
    this._init();
}
MplaneWidget.prototype = Utils.extend(Widget, /** @lends MplaneWidget.prototype */ {
    _init: function () {
        this.visibility = $("#" + this.visibility_id).is(':checked');
        $("#" + this.size_slider_option_id).hide();
        $("#" + this.size_id).val(this.size);
        this.draw();
        var self = this;
        
        $("#" + this.visibility_id).bind('change click', function() {
            self.visibility = $("#" + self.visibility_id).is(':checked');
            self.draw();
        });
        $("#" + this.size_id).change( function() {
            self.size = $("#" + self.size_id + " option:selected").val();
            $("#" + self.size_slider_id).slider('option', 'value', self.size);
            $("#" + self.size_slider_option_id).hide();
            self.draw();
        });
        $("#" + this.size_slider_id).slider({min: 1, max: 1400, slide: function(event, ui){
            self.size = ui.value;
            self.update_size_slider();
        }});
        $("#" + this.size_slider_id).mousewheel( function(event, delta){
            self.size = Math.round(self.size + 20*delta);
            if(self.size > 1400) self.size = 1400;
            if(self.size < 1) self.size = 1;
            $("#" + self.size_slider_id).slider('option', 'value', self.size);
            self.update_size_slider();
        });
        $("#" + this.size_slider_id).slider('option', 'value', this.size);
    },
    update_size_slider: function(){
        if($("#" + this.size_id + " option:contains(" + this.size + ")").size()){
            $("#" + this.size_slider_option_id).hide();
        }else{
            $("#" + this.size_slider_option_id).show();
            $("#" + this.size_slider_option_id).val(this.size);
            $("#" + this.size_slider_option_id).text(this.size);
            
            Array.prototype.sort.call(
                $("#" + this.size_id + " option"),
                function(a,b) {
                    return parseInt($(a).val()) >= parseInt($(b).val()) ? 1 : -1;
                }
            ).appendTo("#" + this.size_id); 
        }
        $("#" + this.size_id).val(this.size);
        this.draw();
    },
    draw: function(){
        if(this.visibility){
            var mp = this.dataset.data;
            var mp_f = mp.format_as_jmol_planes();
            var s = 'draw plane' + this.id + '_1 color TRANSLUCENT ' + this.translucency + ' ' + this.color + ' plane ' + this.size + ' ' + mp_f[0] + '; draw plane' + this.id + '_2 color TRANSLUCENT ' + this.translucency + ' ' + this.color + ' plane ' + this.size + ' ' + mp_f[1] + ';';
            s += 'draw dist arrow {' + mp.plane1[2].join(',') + '} {' + mp.plane2[2].join(',') + '} "' + mp.distance.toFixed(2) + ' A";';
            this.dataset.applet.script(s);
        }else{
            this.dataset.applet.script('draw plane' + this.id + '_* off;');
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