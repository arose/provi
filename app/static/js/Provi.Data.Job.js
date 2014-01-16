/**
 * @fileOverview This file contains the {@link Provi.Job} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * @namespace
 * Provi Job module
 */
Provi.Data.Job = {};


(function() {


/**
 * Singleton job manager object.
 */
Provi.Data.Job.JobManager = new Provi.Utils.ObjectManager();


/**
 * Tool list.
 */
Provi.Data.Job.Tools = {
    init: function(){
        this.ready = false;
        this.tools = {};
        this.retrieve_tools();
    },
    retrieve_tools: function(){
        $.ajax({
            dataType: "json",
            url: Provi.url_for( "/job/tools" ),
            success: _.bind( this.init_tools, this ),
        });
    },
    init_tools: function( tools ){
        this.tools = tools;
        this.ready = true;
    },
    get: function( name ){
        return this.tools[ name ];
    }
};
Provi.Data.Job.Tools.init();


/**
 * job class
 * @constructor
 */
Provi.Data.Job.Job = function(params){
    console.log( "JOB", params );
    params = _.defaults( params, this.default_params );
    Provi.Data.Job.JobManager.add( this, function( job ){
        $(job).bind('status', Provi.Data.Job.JobManager.change );
    });

    var p = [ 
        "applet", "tool", "submitted", "running", "check",
        "jobname", "dataset", "make_widget", "autoload", "name"
    ];
    _.extend( this, _.pick( params, p ) );

    // submit based on dataset
    if( this.dataset ){
        var job = this;
        var d = this.dataset.raw_data;
        var p = d.params;
        p.__type__ = d.type;
        $.ajax({
            url: '../../job/submit/',
            data: p,
            cache: false,
            type: 'POST',
            success: function(data){
                job.set_jobname( data["jobname"] );
            }
        });
        this.make_widget = d.make_widget;
        this.autoload = d.autoload;
        this.name = d.name;
        this.submitted = true;
    }

    if( this.make_widget ){
        new Provi.Data.Job.JobWidget( _.defaults({
            "job_id": job.id,
            "parent_id": Provi.defaults.dom_parent_ids.DATASET_WIDGET,
            "applet": this.applet,
            "heading": this.name
        }, this.make_widget ) );
    }

    /*
        if( this.dataset ){
            var job = this;
            var ds_dat = this.dataset.raw_data;
            var par = ds_dat.params;
            var tool = Provi.Data.Job.Tools.get( ds_dat.type );
            
            var form_data = new FormData();
            form_data.append( "__type__", ds_dat.type );
            deferred_list = []

            _.each( par, function( p, id ){
                if( !tool.args[ id ] ) return;
                console.log( p, id );
                if( tool.args[ id ].type=="file" ){
                    console.log("csdssc FILE");
                    var content = "";
                    deferred_list.push( 
                        $.ajax({
                            url: p,
                            dataType: "text",
                            success: function (response) {
                                var blob = new Blob(
                                    [ response ], { "type" : "text/plain" }
                                );
                                form_data.append( id, blob, "file.dat" );
                            }
                        })
                    );
                }else{
                    form_data.append( id, p );
                }
            }, this);

            $.when.apply( $, deferred_list ).then( _.bind( function() {
                $.ajax({
                    url: '../../job/submit/',
                    data: form_data,
                    cache: false,
                    contentType: false,
                    processData: false,
                    type: 'POST',
                    success: function(data){
                        job.set_jobname( data["jobname"] );
                    }
                });

                if( ds_dat.make_widget ){
                    new Provi.Data.Job.JobWidget({
                        "job_id": job.id,
                        "parent_id": Provi.defaults.dom_parent_ids.DATASET_WIDGET,
                        "applet": this.applet
                    })
                }
                this.submitted = true;
            }, this ) );
        }
    */

    this.check = false;
    if( this.submitted ){
        this.running = true;
        this.status_interval = setInterval( _.bind( function(){
            this.retrieve_status();
        }, this ), 1000);
    }else{
        this.running = false;
    }
};
Provi.Data.Job.Job.prototype = {
    default_params: {
        submitted: false,
        tool: false,
        jobname: false,
        make_widget: false,
        autoload: false
    },
    set_jobname: function( jobname ){
        this.jobname = jobname;
        var tmp = jobname.split("_")
        this.tool = tmp[0];
        this.jobid = tmp[1];
        if( this.dataset ){
            this.dataset.set_loaded();
        }
        $(this).triggerHandler("jobname");
    },
    retrieve_status: function( force ){
        console.log("retrieve_status")
        if( this.submitted && !this.running ){
            console.log( "job stopped running" );
            clearInterval( this.status_interval );
            $(this).triggerHandler("finished");
            if( this.autoload ){
                this.do_autoload();
            }
            if( !force ) return;
        }
        if( this.jobname ){
            $.ajax({
                dataType: "json",
                url: Provi.url_for( "/job/status/" + this.jobname ),
                cache: false,
                success: _.bind( function( data ){
                    console.log(data);
                    this.check = data["check"];
                    this.running = data["running"];
                    $(this).triggerHandler("status");
                }, this )
            });
        }
    },
    do_autoload: function(){
        var tool = Provi.Data.Job.Tools.get( this.tool );
        if( tool.attr.provi_file ){
            var filename = this.jobname + '/' + tool.attr.provi_file;
            Provi.Data.Io.import_example( 
                '__job__', filename, 'provi', {}, false 
            );
        }
    }
};


Provi.Data.Job.JobWidget = function(params){
    params = _.defaults( params, this.default_params );
    console.log('JobWidget', params);
    Provi.Widget.Widget.call( this, params );
    this._init_eid_manager([ 
        "jobname", "file_tree_widget"
    ]);
    
    var p = [ "job_id" ];
    _.extend( this, _.pick( params, p ) );
    
    var template = '' +
        '<div class="control_row" id="${eids.jobname}"></div>' +
        '<div class="control_row" id="${eids.file_tree_widget}"></div>' +
    '';
    this.add_content( template, params );

    this.job = Provi.Data.Job.JobManager.get( this.job_id );
    this._init();
}
Provi.Data.Job.JobWidget.prototype = Provi.Utils.extend(Provi.Widget.Widget, {
    default_params: {
        // heading: 'Job',
        persist_on_applet_delete: true
    },
    _init: function(){
        this._heading = this.heading;
        if( this.job.jobname ){
            this.init_file_tree();
            this.init_header();
        }else{
            $(this.job).bind( 
                "jobname", _.bind( this.init_file_tree, this )
            );
            $(this.job).bind( 
                "jobname", _.bind( this.init_header, this )
            );
        }

        $(this.job).bind( 
            "finished", _.bind( this.init_file_tree, this )
        );
        
        Provi.Widget.Widget.prototype.init.call(this);
    },
    init_header: function(){
        this.elm("jobname").append( '<div>' + 
            '[' + this.job_id.toString() + "] " + this.job.jobname + 
        '</div>');
    },
    init_file_tree: function(){
        // check if the widget is still available
        // TODO properly destroy widgets and their bindings
        if( $('#' + this.id).length == 0 ) return;

        if( this._heading ){
            var prefix = "[Job Done] ";
            if( this.job.running ){
                prefix = "[Job Running] ";
            }
            this.set_heading( prefix + this._heading );
        }

        this.elm("file_tree_widget").empty();
        new Provi.Data.Io.ExampleLoadWidget({
            collapsed: false,
            heading: false,
            all_buttons: false,
            directory_name: '__job__',
            root_dir: this.job.jobname + '/',
            applet: this.applet,
            parent_id: this.eid("file_tree_widget")
        });
    }
});


/**
 * A widget
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Data.Job.FormWidget = function(params){
    params = _.defaults( params, this.default_params );
    console.log('FormWidget', params);
    Provi.Widget.Widget.call( this, params );
    this._init_eid_manager([ 
        "tool_selector", "form_elms", "form", "submit", "iframe"
    ]);
    
    var p = [ "datalist" ];
    _.extend( this, _.pick( params, p ) );
    
    var template = '' +
        '<div class="control_row" id="${eids.tool_selector}"></div>' +
        '<div class="control_row">' +
            '<form id="${eids.form}" style="display:hidden;" method="post" action="../../job/submit/" target="${eids.iframe}" enctype="multipart/form-data">' +
                '<div class="control_row" id="${eids.form_elms}"></div>' +
                '<input type="hidden" name="__type__" value=""></input>' +
                '<button id="${eids.submit}">submit</button>' +
            '</form>' +
            '<iframe id="${eids.iframe}" name="${eids.iframe}" style="display:none;" src="" frameborder="0" vspace="0" hspace="0" marginwidth="0" marginheight="0" width="0" height="0"></iframe>' +
        '</div>' +
    '';
    
    this.add_content( template, params );
    this._init();
}
Provi.Data.Job.FormWidget.prototype = Provi.Utils.extend(Provi.Widget.Widget, {
    default_params: {
        // heading: 'Job',
        // persist_on_applet_delete: false
    },
    _init: function(){
        this.get_tools();
        this.elm('submit').button().hide()
            .click( _.bind( this.submit, this ) );

        Provi.Widget.Widget.prototype.init.call(this);
    },
    submit: function(){
        Provi.Widget.ui_disable_timeout( this.elm('submit') );
        var job = new Provi.Data.Job.Job({ 
            applet: this.datalist.applet,
            submitted: true
        });

        console.log(this.tool.args);
        var as_form = !_.some( this.tool.args, function( p, id ){
            return p.type=="file" && p.ext=="jmol"
        });

        if( as_form ){
            var elm = document.getElementById( this.eid('form') );
            var data = new FormData( elm );
            var form_elms = this.elm('form_elms');

            _.each( this.tool.args, function( p, id ){
                if( p.type=="file" && p.ext=="pdb" ){

                    var sele = form_elms.find("input[name=__sele__" + id + "]").val() || "*";
                    var pdb = this.datalist.applet.evaluate('provi_write_pdb({' + sele + '});');
                    var blob = new Blob([ pdb ], { "type" : "text/plain" });
                    data.append( id, blob, "file.pdb" );
                }
            }, this);

            $.ajax({
                url: '../../job/submit/',
                data: data,
                cache: false,
                contentType: false,
                processData: false,
                type: 'POST',
                success:function(data){
                    job.set_jobname( data["jobname"] );
                }
            });
        }else{
            var params = $.param( this.elm('form').serializeArray() ) +
                '&_id=' + (new Date().getTime());
            var s = 'load("../../job/submit/?POST?_PNGJBIN_&' + params + '");';
            var data = JSON.parse( this.datalist.applet.evaluate( s ) );
            console.log( s, "_PNGJBIN_", data );
            job.set_jobname( data["jobname"] );
            // TODO non blocking
            // this.datalist.applet.script_callback( s, {}, function(d){
            //     console.log( "_PNGJBIN_", d )
            //     // job.set_jobname( data["jobname"] );
            // });
        }
    },
    get_tools: function(){
        if( Provi.Data.Job.Tools.ready ){
            this.init_selector( Provi.Data.Job.Tools.tools );
        }else{
            $(Provi.Data.Job.Tools)
                .bind("tools_ready", _.bind( this.get_tools, this ) );
        }
    },
    init_selector: function( tools ){
        this.tools = tools;
        var p = { type: "select", options: [""].concat( _.keys(tools) ) };
        var select = Provi.Widget.form_builder( p, "", "tool_selector", this );
        this.elm("tool_selector").append( select );
    },
    set: function(e){
        var elm = $(e.currentTarget);
        var id = elm.data('id');
        if( id=="tool_selector" ){
            var tool_name = elm.children("option:selected").val();
            this.init_tool( tool_name );
        }
    },
    init_tool: function( tool_name ){
        this.tool = this.tools[ tool_name ];
        this.elm("form_elms").empty();
        this.elm("submit").show();
        _.each( this.tool.args, _.bind( function( p, id ){
            if( !p.group ){
                var form_elm = Provi.Widget.form_builder( 
                    p, p['default'], id, this 
                );
                this.elm("form_elms").append( form_elm );
            }
        }, this));
        this.elm('form').children('input[name=__type__]')
            .val( tool_name );
    }
});


Provi.Data.Job.JobDatalist = function(params){
    Provi.Data.Datalist.call( this, params );
    this.handler = _.defaults({
        "details": {
            "selector": 'span[cell="label"]',
            "click": this.details,
            "label": "Show details"
        }
    }, this.handler);
    $(Provi.Data.Job.JobManager).bind("add", _.bind( this.update, this ) );
    $(Provi.Data.Job.JobManager).bind("change", _.bind( this.invalidate, this ) );
}
Provi.Data.Job.JobDatalist.prototype = Provi.Utils.extend(Provi.Data.Datalist, {
    type: "JobDatalist",
    params_object: Provi.Data.Job.FormWidget,
    get_ids: function(){
        var job_list = Provi.Data.Job.JobManager.get_list();
        _.invoke( job_list, "retrieve_status", true );
        return _.pluck( job_list, "id" );
    },
    make_row: function(id){
        if( id=="all" ) return;
        var job = Provi.Data.Job.JobManager.get( id );
        var label = "[" + job.id + "] " +
            "tool: " + job.tool + ", " +
            "running: " + job.running + ", " +
            "check: " + job.check +
        "";

        var $row = $('<div></div>').append(
            this.label_cell( label, id )
        );
        return $row;
    },
    label_cell: function(label, id){
        var $label = $('<span cell="label" style="float:left; width:120px;">' +
            label +
        '</span>').data( 'id', id );
        return $label;
    },
    make_details: function(id){
        var e = new Provi.Data.Job.JobWidget({ 
            "job_id": id,
            "applet": this.applet
        });
        return e.dom;
    }
});



})();