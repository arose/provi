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
 * job class
 * @constructor
 */
Provi.Data.Job.Job = function(params){
    params = _.defaults( params, this.default_params );
    Provi.Data.Job.JobManager.add( this, function( job ){
        $(job).bind('status', Provi.Data.Job.JobManager.change );
    });

    var p = [ "applet", "tool", "submitted", "running", "check", "jobname" ];
    _.extend( this, _.pick( params, p ) );

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
    },
    set_jobname: function( jobname ){
        this.jobname = jobname;
        var tmp = jobname.split("_")
        this.tool = tmp[0];
        this.jobid = tmp[1];
        $(this).triggerHandler("jobname");
    },
    retrieve_status: function( force ){
        if( this.submitted && !this.running ){
            clearInterval( this.status_interval );
            if( !force ) return;
        }
        if( this.jobname ){
            $.ajax({
                dataType: "json",
                url: Provi.url_for( "/job/status/" + this.jobname ),
                success: _.bind( function( data ){
                    console.log(data);
                    this.check = data["check"];
                    this.running = data["running"];
                    $(this).triggerHandler("status");
                }, this )
            });
        }
    }
};


/**
 * A widget
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Data.Job.JobWidget = function(params){
    params = _.defaults( params, this.default_params );
    console.log('JobWidget', params);
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
                '<input type="hidden" name="type" value=""></input>' +
                '<button id="${eids.submit}">submit</button>' +
            '</form>' +
            '<iframe id="${eids.iframe}" name="${eids.iframe}" style="display:none;" src="" frameborder="0" vspace="0" hspace="0" marginwidth="0" marginheight="0" width="0" height="0"></iframe>' +
        '</div>' +
    '';
    
    this.add_content( template, params );
    this._init();
}
Provi.Data.Job.JobWidget.prototype = Provi.Utils.extend(Provi.Widget.Widget, {
    default_params: {
        // heading: 'Job',
        // persist_on_applet_delete: false
    },
    _init: function(){
        this.get_tools();
        this.elm('submit').button().hide().click( _.bind( this.submit, this ) );

        Provi.Widget.Widget.prototype.init.call(this);
    },
    submit: function(){
        Provi.Widget.ui_disable_timeout( this.elm('submit') );
        var job = new Provi.Data.Job.Job({ 
            applet: this.datalist.applet,
            submitted: true
        });

        var as_form = !_.some( this.tool, function( p, id ){
            return p.type=="file" && p.ext=="jmol"
        });

        if( as_form ){
            var elm = document.getElementById( this.eid('form') );
            var data = new FormData( elm );
            var form_elms = this.elm('form_elms');

            _.each( this.tool, function( p, id ){
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
            var params = $.param( this.elm('form').serializeArray() );
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
        $.ajax({
            dataType: "json",
            url: Provi.url_for( "/job/tools" ),
            success: _.bind( this.init_selector, this ),
        });
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
        console.log(id, elm);
        if( id=="tool_selector" ){
            var tool_name = elm.children("option:selected").val();
            this.init_tool( tool_name );
        }
    },
    init_tool: function( tool_name ){
        this.tool = this.tools[ tool_name ];
        this.elm("form_elms").empty();
        this.elm("submit").show();
        _.each( this.tool, _.bind( function( p, id ){
            var form_elm = Provi.Widget.form_builder( p, p.default_value, id, this );
            this.elm("form_elms").append( form_elm )
        }, this));
        this.elm('form').children('input[name=type]').val( tool_name );
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
    params_object: Provi.Data.Job.JobWidget,
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
        var job = Provi.Data.Job.JobManager.get( id );
        // return id.toString() + " - " + job.jobname;
        var e = new Provi.Data.Io.ExampleLoadWidget({
            collapsed: false,
            heading: false,
            all_buttons: false,
            directory_name: '__job__',
            root_dir: job.jobname + '/',
            applet: this.applet
        });
        console.log(e);
        return $('<div class="control_row"></div>').append(
            '<div>[' + id.toString() + "] " + job.jobname + '</div>',
            e.dom
        );
    }
});



})();