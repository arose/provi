/**
 * @fileOverview This file contains the {@link Provi.Widget} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * @namespace
 * Widget base
 */
Provi.Widget.Grid = {};

(function() {

var Utils = Provi.Utils;
var Widget = Provi.Widget.Widget;





Provi.Widget.Grid.RowWidget = function(params){

}



/**
 * A widget
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Widget.Grid.GridWidget = function(params){
    this.invalidate = _.throttle( this._invalidate, 100, false );
    params = _.defaults( params, this.default_params );

    Provi.Widget.Widget.call( this, params );

    this._init_eid_manager([ 
        'grid', 'update', 'widgets', 'calc', 'init', 'selector'
    ]);
    
    var p = [ "datalist", "datalist_list" ];
    _.extend( this, _.pick( params, p ) );

    var template = '' +
        '<div class="control_row">' +
            '<button id="${eids.update}">update</button>&nbsp;' +
            '<button id="${eids.calc}">calc</button>&nbsp;' +
            '<button id="${eids.init}">init</button>&nbsp;' +
        '</div>' +
        '<div class="control_row" id="${eids.selector}"></div>' +
        '<div class="control_row" id="${eids.widgets}"></div>' +
        '<div class="control_row">' +
            '<div style="height:500px;" id="${eids.grid}"></div>' +
        '</div>' +
    '';
    this.add_content( template, params );

    this._init();
}
Provi.Widget.Grid.GridWidget.prototype = Utils.extend(Provi.Widget.Widget, /** @lends Provi.Widget.Grid.GridWidget.prototype */ {
    default_params: {
        heading: 'Grid',
        collapsed: false,
        persist_on_applet_delete: false,
        lists: []
    },
    _init: function(){

        if( this.datalist_list=="all" ){
            $( Provi.Data.DatalistManager )
                .bind( "add", _.bind( this.init_selector, this ) );
        }else if( this.datalist_list ){
            this.datalist_list = [ this.datalist ].concat( this.datalist_list );
            this.init_selector();
        }else{
            this.elm("selector").hide();
        }

        this.create_grid();
        this.init_datalist();

        var self = this;
        this.elm('update').button().click( _.bind( this.update_grid, this ) );
        this.elm('calc').button().click( this.datalist.calculate );
        this.elm('init').button().click( function(){ self.datalist._init( self ) } );
        
        Provi.Widget.Widget.prototype.init.call(this);
    },
    set: function(e){
        var elm = $(e.currentTarget);
        var id = elm.data('id');
        console.log(id, elm);
        if( id=="DatalistSelector" ){
            var datalist_id = elm.children("option:selected").val().split("_")[0];
            this.datalist = Provi.Bio.AtomSelection.DatalistManager.get( datalist_id );
            this.init_datalist();
        }
    },
    init_selector: function(){
        var dl_list = this.datalist_list;
        if( dl_list=="all" ){
            dl_list = Provi.Data.DatalistManager.get_list();
        }
        console.log(dl_list, "dl_list");
        var p = { type: "select", options: _.pluck( dl_list, "name" ) };
        var select = Provi.Widget.form_builder( p, "", "DatalistSelector", this );
        this.elm("selector").empty().show().append( select );
    },
    create_grid: function(){
        var self = this;

        var render_row = function(cellNode, row, dataContext, colDef) {
            var row = self.datalist.make_row( dataContext.id );
            $(cellNode).empty().append( row );
        }
        
        var columns = [{ 
            id:"id", name:"Id", field:"id", width:350,
            rerenderOnResize: true,
            asyncPostRender: render_row
        }];
        
        var options = {
            enableCellNavigation: false,
            enableColumnReorder: false,
            enableAsyncPostRender: true,
            asyncPostRenderDelay: 1,
            showHeaderRow: true,
            headerRowHeight: 25,
            topPanelHeight: 25,
            autoHeight: false
        };
        
        this.grid = new Slick.Grid( this.eid('grid', true), [], columns, options);
    },
    _invalidate: function(){
        this.grid.invalidate();
        this.header();
        this.grid.resizeCanvas();
    },
    header: function(){
        var header = this.grid.getHeaderRowColumn('id');
        $(header).empty().append(
            this.datalist.make_row('all')
        );
        $(header).css('padding', '1px 3px 2px 1px');
    },
    init_datalist: function(){

        var datalist = this.datalist;

        if( !datalist || !datalist.ready ){
            $(datalist).bind("calculate_ready", _.bind( this.init_datalist, this ) );
            return;
        }

        // watch for changes
        $(datalist).bind('invalidate', _.bind( this.invalidate, this ) );

        // params widget
        this.elm("widgets").empty();
        if( datalist.params_object ){
            this.datalist_params = new datalist.params_object({
                parent_id: this.eid("widgets")
            });
            $(this.datalist_params).bind("change", _.bind( function(){ 
                _.extend( datalist, this.datalist_params.params );
                this.update_grid(); 
            }, this) );
        }

        // register handlers
        var invalidate = _.bind( this.invalidate, this );
        this.elm('grid').off( 'click.grid' );
        _.each( datalist.handler, function(d, i){
            this.elm('grid').on( 'click.grid', d["selector"], function(e){
                var elm = $(e.currentTarget);
                elm.qtip('hide');
                var id = elm.data("id");
                var flag = !elm.prop('checked');
                d["click"].apply( datalist, [ id, flag, {}, invalidate ]);
            });

            if( !_.isFunction(d["label"]) ){
                var label = d["label"];
                d["label"] = function(value, id){
                    var l = label ? ' ' + label : '';
                    if( id==='all' ){
                        l = ' all' + ( l ? _.pluralize( l ) : '' );
                    }
                    return (value ? 'Hide' : 'Show') + l;
                }
            }

            this.elm('grid').on( 'mouseover', d["selector"], function(e){
                var elm = $(e.originalEvent.target);
                elm.qtip({
                    overwrite: false,
                    content: '?',
                    show: { event: event.type, ready: true }
                }, e);
                elm.qtip('option', 'content.text', d["label"]( elm.prop('checked'), elm.data("id") ) );
            });
        }, this);

        this.update_grid();
    },
    update_grid: function(){
        var ids = this.datalist.get_ids();
        var data = _.map( ids, function(val){ return { id: val } });
        // console.log( this.datalist.name, "update_grid", data );
        this.grid.setData( data );
        this.grid.updateRowCount();
        this.grid.render();
        this.header();
        this.grid.resizeCanvas();
    }
});


Provi.Widget.Grid.CellFactory = function( p ){
    p.color = p.color || "none";
    p.position = p.position || "right";
    return function(id, value, disabled){
        var $elm = $(
            '<span style="background:' + p.color + '; float:' + p.position + '; width:22px;">' +
                '<input cell="' + p.name + '" type="checkbox" ' + 
                    ( disabled ? 'disabled="disabled" ' : '') +
                    ( value ? 'checked="checked" ' : '' ) + 
                '/>' +
            '</span>'
        );
        $elm.children().prop( 'indeterminate', value > 0.0 && value < 1.0 );
        $elm.children().data( 'id', id );
        return $elm;
    }
}





})();

