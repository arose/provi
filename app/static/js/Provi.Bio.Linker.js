/**
 * @fileOverview This file contains the {@link Provi.Bio.Linker} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * @namespace
 * Linker module
 */
Provi.Bio.Linker = {};

(function() {

/** @exports Utils as Provi.Utils */
var Utils = Provi.Utils;

/** @exports Widget as Provi.Widget.Widget */
var Widget = Provi.Widget.Widget;



Provi.Bio.Linker.LinkerDatalist = function(params){
    var self = this;
    
    var p = [ "pdb_ds", "linker_ds" ];
    _.extend( this, _.pick( params, p ) );

    Provi.Bio.AtomSelection.SelectionDatalist.call( this, params );
    this.handler = _.defaults({
        "show_linker": {
            "selector": 'input[cell="linker"]',
            "click": this.show_linker,
            label: function(linker, id){
                if( !linker && id!=='all' ){
                    return 'Show linker';
                }else if( !linker && id==='all' ){
                    return 'Hide all linker';
                }
            }
        }
    }, this.handler );
}
Provi.Bio.Linker.LinkerDatalist.prototype = Utils.extend(Provi.Bio.AtomSelection.SelectionDatalist, {
    type: "LinkerDatalist",
    params_object: undefined,
    _init: function(){
        console.log("pdb_ds", this.pdb_ds);
        console.log("linker_ds", this.linker_ds);

        var data = _.map( this.linker_ds.raw_data, function(v, k){
            return [k].concat( v );
        });
        data =_.sortBy( data, function(x){ return x[1]; });
        data.reverse();

        this.ids = [];
        this.data = {};
        _.each( data, function(elm){
            this.ids.push( elm[0] );
            this.data[ elm[0] ] = elm.slice(1);
        }, this);

        var s = 'provi_datasets[' + this.pdb_ds.id + '];';
        this.fileno = this.applet.evaluate( s );
        console.log("LinkerDatalist file", this.fileno);

        this.initialized = false;
        this.set_ready();
        // var s = 'script "../data/jmol_script/interface_contacts.jspt";';
        // this.applet.script_callback( s, {}, _.bind( this.set_ready, this ) );
    },
    get_ids: function(sele){
        return this.ids;
    },
    get_data: function(id){
        return [0];
        // if( !this.ready ) return 0;
        // // test
        // var s = 'provi_datasets[' + this.pdb_ds.id + '];';
        // var a = this.applet.evaluate(s);
        // return a;
    },
    make_row: function(id){
        if(id==='all'){
            var label = 'Linker';
        }else{
            var d = _.map( this.data[id].slice(0,-1), function(x){ 
                return x.toFixed(3);
            });
            var label = "[" + id + "] " + d.join(', ');

        }
        var a = this.get_data(id); // selected, consurf, intersurf

        var $row = $('<div></div>').append(
            this.label_cell( label, id ),
            this.linker_cell( id, this.shown_linker_id===id )
        );
        return $row;
    },
    _show_linker: function(id, flag){
        if( flag || id =="all" ){
            return '';
        }
        return '' +
            'display add ' + this.fileno + '.' + id + ';' +
        '';
    },
    show_linker: function(id, flag, params){
        if(flag){
            this.shown_linker_id = undefined;
        }else{
            this.shown_linker_id = id;
        }
        var s = this._show_linker(id, flag);
        this.script( s, true );
    },
    linker_cell: function(id, linker){
        var $linker = $('<span style="background:lightgreen; float:right; width:22px;">' +
            '<input cell="linker" type="radio" ' + 
                ( linker ? 'checked="checked" ' : '' ) + 
            '/>' +
        '</span>');
        $linker.children().data( 'id', id );
        return $linker;
    },
    make_details: function(id){
        var d = _.map( this.data[id].slice(0,-1), function(x){ 
            return x.toFixed(3);
        });
        var $row = $('<div></div>').append(
            '<div>[' + id + '] ' + d[0].toFixed(3) + ', ' + d[1].toFixed(3) + '</div>',
            '<div>' + this.data[id][-1].slice(1,-1) + '</div>'
        );
        return $row;
    },
    selection: function(id){
        if( id==='all' ){
            return 'within(MODEL, ' + this.filtered() + ')';
        }else{
            return this.fileno + '.' + id;
        }
    }
});



})();