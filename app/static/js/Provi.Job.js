/**
 * @fileOverview This file contains the {@link Provi.Job} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * @namespace
 * Provi Job module
 */
Provi.Job = {};


(function() {

/** @exports Utils as Provi.Utils */
var Utils = Provi.Utils;

/** @exports Widget as Provi.Widget.Widget */
var Widget = Provi.Widget.Widget;


/**
 * A widget
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Job.JobWidget = function(params){
    params = _.defaults( params, this.default_params );
    console.log('JobWidget', params);
    Provi.Widget.Widget.call( this, params );
    this._init_eid_manager([ 
        "tool_selector", "form_elms", "form", "submit", "iframe"
    ]);
    
    var p = [ "applet" ];
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
Provi.Job.JobWidget.prototype = Provi.Utils.extend(Provi.Widget.Widget, /** @lends Provi.Job.JobWidget.prototype */ {
    default_params: {
        heading: 'Job',
        persist_on_applet_delete: false
    },
    _init: function(){
        this.get_tools();
        this.elm('submit').button().click( _.bind( this.submit, this ) );
    },
    submit: function(){
        Provi.Widget.ui_disable_timeout( this.elm('submit') );
        this.elm('form').submit();
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
            var tool = elm.children("option:selected").val();
            this.init_tool( tool );
        }
    },
    init_tool: function( tool ){
        this.elm("form_elms").empty();
        console.log(this.tools[tool], tool);
        _.each( this.tools[tool], _.bind( function( p, id ){
            var form_elm = Provi.Widget.form_builder( p, p.default_value, id, this );
            this.elm("form_elms").append( form_elm )
        }, this));
        this.elm('form').children('input[name=type]').val( tool );
    }
});


})();