/**
 * @fileOverview This file contains the {@link Provi.Bio.Voronoia} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 *
 *
 *
 * Jmol ideas:
 *
 * 2xc2
 * isosurface ID "isosurface1" select {1.1} ignore {not 1.1} resolution 2.0 cavity 0.1 3.0 cap within 2.5 {2.1 and 1}
 * isosurface select {1.1 and (37,40,76)} ignore {not(1.1 and (37,40,76))} solvent 0.1 cap within 2.5 {2.1 and 1}
 *
 * 1u19
 * isosurface select {1.1 and (131,128,124,127,257,302,261,301)} ignore {not(1.1 and (131,128,124,127,257,302,261,301))} solvent 0.3 cap within 2.5 {2.1 and 8}
 *
 * draw voronoi data/edges???
 */


/**
 * @namespace
 * Voronoia module
 */
Provi.Bio.Voronoia = {};


(function() {

/** @exports Utils as Provi.Utils */
var Utils = Provi.Utils;

/** @exports Widget as Provi.Widget.Widget */
var Widget = Provi.Widget.Widget;



Provi.Bio.Voronoia.VoronoiaParamsWidget = function(params){
    console.log("Provi.Bio.Voronoia.VoronoiaParamsWidget", params);
    Provi.Widget.ParamsWidget.call( this, params );
}
Provi.Bio.Voronoia.VoronoiaParamsWidget.prototype = Utils.extend(Provi.Widget.ParamsWidget, {
    params_dict: {
        resolution: { 'default': 2.0, type: "float", 
            range: [ 0.5, 7.0 ], step: 0.5 },
        cavity_probe_radius: { 'default': 0.7, type: "float", 
            range: [ 0.1, 1.5 ], step: 0.1 },
        exterior_probe_radius: { 'default': 5.0, type: "float", 
            range: [ 1.0, 20.0 ], step: 1.0 },
        translucent: { 'default': 0.3, type: "float", 
            range: [ 0.0, 1.0 ], step: 0.1 },
        cavity_color: { 'default': "skyblue", type: "str", 
            options: [ "skyblue", "gold", "tomato" ] }
    }
});


Provi.Bio.Voronoia.VoronoiaDatalist = function(params){
    params = _.defaults( params, this.default_params );

    var p = [ 
        "resolution", "cavity_probe_radius", "exterior_probe_radius", 
        "cavity_color", "ids", "holes_ds", "translucent", "tmh_ds",
        "subset"
    ];
    _.extend( this, _.pick( params, p ) );

    this.columns = [
        { id: "id", name: "id", field: "id", width: 50, sortable: true },
        { id: "label", name: "label", field: "label", width: 200, sortable: true },
        { id: "neighbours", name: "neighbours", field: "neighbours", width: 30, cssClass: "center action",
            formatter: Provi.Widget.Grid.formatter_checkbox,
            action: _.bind( function( id, d ){
                var s = 'select ' + this.selection(d.id) + ';' +
                    'wireframe ' + (d[id] ? 'off' : '0.2') + ';' +
                    'cpk ' + (d[id] ? 'off' : '0.2') + ';';
                this.script( s, true );
            }, this ),
        },
        { id: "hole", name: "hole", field: "hole", width: 30, cssClass: "center action",
            formatter: Provi.Widget.Grid.formatter_checkbox,
            action: _.bind( function( id, d ){
                if( d[id] ){
                    var s = 'draw ID "' + d.id + '_draw*" delete;';
                }else{
                    var s = 'voronoia_hole( ' +
                        '"' + d.id + '", ' +
                        this.translucent + ', ' +
                        '"' + this.cavity_color + '" ' +
                    ')';
                }
                this.script( s, true );
            }, this ),
        },
        { id: "cavity", name: "cavity", field: "cavity", width: 30, cssClass: "center action",
            formatter: Provi.Widget.Grid.formatter_checkbox,
            action: _.bind( function( id, d ){
                if( d[id] ){
                    var s = 'isosurface ID "' + d.id + '_iso*" delete;';
                }else{
                    var s = 'voronoia_cavity( ' +
                        '"' + d.id + '", ' +
                        parseFloat(this.resolution).toFixed(2) + ', ' +
                        parseFloat(this.translucent).toFixed(2) + ', ' +
                        '"' + this.cavity_color + '", ' +
                        parseFloat(this.cavity_probe_radius).toFixed(2) + ', ' +
                        parseFloat(this.exterior_probe_radius).toFixed(2) + ' ' +
                    ')';
                }
                this.script( s, true );
            }, this ),
        },
    ];


    Provi.Data.Datalist2.call( this, params );
}
Provi.Bio.Voronoia.VoronoiaDatalist.prototype = Utils.extend(Provi.Data.Datalist2, {
    type: "VoronoiaDatalist",
    params_object: Provi.Bio.Voronoia.VoronoiaParamsWidget,
    default_params: {
        resolution: 3.0,
        cavity_probe_radius: 0.7,
        exterior_probe_radius: 5.0,
        cavity_color: 'skyblue',
        translucent: 0.3,
        subset: '*'
    },
    jspt_url: "../data/jmol_script/voronoia.jspt", 
    calculate: function(){
        if( this.holes_ds ){
            this.ids = this.holes_ds.bio.get_list();
        }

        var hole_types = {
            "1": "PARTLY",
            "2": "EMPTY",
            "3": "PARTLY_NO_HETS",
            "4": "FILLED_NO_HETS"
        }
        this.id_names = {};
        var cav_count = 1
        _.each( this.ids, function(id){
            this.id_names[id] = 'Cavity ' + cav_count;
            cav_count += 1;
            if( this.tmh_ds ){
                var tmh_tags = [];
                var tmh_count = 1;
                _.each( this.tmh_ds.bio.get_list(), function(id2){ 
                    var s = 'provi_sele_intersect(' +
                        '"' + id + '", "' + id2 + '"' +
                    ');';
                    var d = this.applet.evaluate( s );
                    if(d>0){
                        tmh_tags.push( tmh_count );
                    }
                    tmh_count += 1;
                }, this);
                if( tmh_tags.length ){
                    this.id_names[id] += " (TMH " + tmh_tags.join(", ") + ")";
                }
            }
            id2 = id.split("_");
            if( id2.length==5 ){
                this.id_names[id] += " [" + hole_types[id2[3]] + "]";
            }
        }, this );

        this.set_ready();
        console.log("voro dl ready");
    },
    selection: function( id ){
        return '@{ provi_selection["' + id + '"] }';
    },
    DataItem: function( row ){
        this.id = row[0];
        this.label = row[1];
        this.neighbours = row[2] / 0.2;
        this.hole = row[3] ? 1.0 : 0.0;
        this.cavity = row[4] ? 1.0 : 0.0;
    },
    on_grid_creation: function( grid ){
        var s = 'voronoia_hole_all( ' +
            "['" + this.ids.join("','") + "'], " +
            this.translucent + ", " +
            "'" + this.cavity_color + "' " +
        ')';
        this.script( s, true );
    },
    load_data: function( from, to, sortcol, sortdir ){
        if( !this.ready ) return null;
        var shape_info = this.applet.get_property_as_array('shapeInfo');
        var draw = shape_info["Draw"] || {};
        var iso = shape_info["Isosurface"] || {};
        var draw_dict = _.object( 
            _.pluck( draw, "ID" ), _.pluck( draw, "scale" )
        );
        var iso_dict = _.object( 
            _.pluck( iso, "ID" ), _.pluck( iso, "visible" )
        );

        var s = "getVoronoiaData(" + 
            "['" + this.ids.join("','") + "']" +
        ")";
        var resp = this.applet.variable( s );

        var data = _.map( this.ids, function( id, i ){
            return [ 
                id,
                this.id_names[id],
                resp[i][0],
                draw_dict[String(id).toLowerCase()+"_draw__no_widget__"],
                iso_dict[String(id).toLowerCase()+"_iso__no_widget__"]
            ];
        }, this );
        console.log(data);
        if( sortdir=="DESC" ) data.reverse();
        var hits = data.length;
        data = data.slice( from, to+1 );

        return { results: data, start: from, hits: hits };
    }
});







})();