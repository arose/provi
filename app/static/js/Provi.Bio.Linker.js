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
    var p = [ "pdb_ds", "linker_ds" ];
    _.extend( this, _.pick( params, p ) );

    this.columns = [
        { id: "id", name: "id", field: "id", width: 50, sortable: true },
        { id: "correl", name: "correl", field: "correl", width: 50, sortable: true },
        { id: "goodness", name: "goodness", field: "goodness", width: 50, sortable: true },
        { id: "score", name: "score", field: "score", width: 50, sortable: true },
        { id: "seq", name: "org. seq", field: "seq", width: 100, sortable: true, formatter: Provi.Widget.Grid.formatter_verbatim },
        { id: "pdb", name: "pdb", field: "pdb", width: 50, sortable: true },
        { id: "show", name: "show", field: "show", width: 30, cssClass: "center action",
            formatter: Provi.Widget.Grid.formatter_radio,
            action: _.bind( function( id, d ){
                var sele = this.selection( d[ this.columns[0].field ] );
                this.script( 'display add ' + sele, true );
            }, this ),
        },
        { id: "download", name: "download", field: "download", width: 30, cssClass: "center action",
            formatter: Provi.Widget.Grid.FormatterIconFactory("download"),
            action: _.bind( function( id, d, grid_widget, e ){
                var sele = this.selection( d[ this.columns[0].field ] ) +
                    " and not ( GLY and ( resno==1000 or resno==2000 ) )";
                var data = Provi.Data.Io.get_structure( sele, this.applet, true );
                var title = "TITLE     Linker " + 
                    [ d.id, d.pdb, d.seq ].join(", ") +
                "\n";
                Provi.Data.Io.download( 
                    title + data,  "linker_" + d.id + ".pdb"
                );
            }, this )
        },
    ];

    Provi.Data.Datalist2.call( this, params );
}
Provi.Bio.Linker.LinkerDatalist.prototype = Utils.extend(Provi.Data.Datalist2, {
    type: "LinkerDatalist",
    jspt_url: "../data/jmol_script/atomsele.jspt", 
    // params_object: Provi.Bio.AtomSelection.AtomindexParamsWidget,
    calculate: function(){
        this.data = _.map( this.linker_ds.raw_data, function(v, k){
            return [ parseInt(k) ].concat( v );
        });

        var s = 'provi_datasets[' + this.pdb_ds.id + '];';
        this.fileno = this.applet.evaluate( s );
        
        this.has_cross_correl = this.data[0].length==6;
        if( !this.has_cross_correl ) this.columns.splice( 1, 1 );

        this.set_ready();
    },
    selection: function( id ){
        return this.fileno + '.' + id;
    },
    DataItem: function( row ){
        var i = 0;
        if( row.length==7 ){
            i = 1;
            this.correl = row[1];
        }
        this.id = row[0];
        this.goodness = row[i+1];
        this.score = row[i+2];
        this.seq = row[i+3];
        this.pdb = row[i+4];
        this.show = row[i+5];
    },
    on_grid_creation: function( grid ){
        grid.setColumns( this.columns );
        this.column_action( grid, "show", grid.getDataItem( 0 ) );
    },
    load_data: function( from, to, sortcol, sortdir ){
        var data = this.data;
        var cols = [ "id", "correl", "goodness", "score", "seq", "pdb" ];
        if( !this.has_cross_correl ) cols.splice( 1, 1 );

        if( sortcol ){
            var sortidx = _.indexOf( cols, sortcol );
            if( sortidx==-1 ) sortidx = 0;
            data =_.sortBy( data, function(x){ return x[sortidx]; });
        }
        if( sortdir=="DESC" ) data.reverse();
        var hits = data.length;
        data = data.slice( from, to+1 );

        model = this.applet.evaluate(
            "{file=" + this.fileno + "}.model"
        );
        data = _.map( data, function(d){
            return d.concat([ d[0]==model ? 1.0 : 0.0 ]);
        });

        return { results: data, start: from, hits: hits };
    }
});




})();