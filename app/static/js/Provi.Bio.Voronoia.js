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


Provi.Bio.Voronoia.register = function( params ){
    var holes_ds = params.holes_ds;
    console.log( holes_ds );
    Provi.Bio.AtomSelection.SelectionTypeRegistry.add(
        'voronoia', Provi.Bio.Voronoia.VoronoiaSelectionTypeFactory(
            _.pluck( holes_ds.get().get_list(), 'name' )
        )
    )
}



Provi.Bio.Voronoia.VoronoiaSelectionTypeFactory = function(ids){
    return function(params){
        params.ids = ids;
        return new Provi.Bio.Voronoia.VoronoiaSelectionType(params);
    }
}

Provi.Bio.Voronoia.VoronoiaSelectionType = function(params){
    params = _.defaults(
        params,
        Provi.Bio.Voronoia.VoronoiaSelectionType.prototype.default_params
    );
    this.resolution = params.resolution;
    this.cavity_probe_radius = params.cavity_probe_radius;
    this.exterior_probe_radius = params.exterior_probe_radius;
    this.cavity_color = params.cavity_color;
    this.ids = params.ids;
    Provi.Bio.AtomSelection.SelectionType.call( this, params );
    this.handler = _.defaults({
        "show_hole": {
            "selector": 'input[cell="hole"]',
            "click": this.show_hole,
            "label": "sphere"
        },
        "show_cavity": {
            "selector": 'input[cell="cavity"]',
            "click": this.show_cavity,
            "label": "cavity"
        },
        "show_neighbours": {
            "selector": 'input[cell="neighbours"]',
            "click": this.show_neighbours,
            "label": "neighbours"
        }
    }, this.handler );
}
Provi.Bio.Voronoia.VoronoiaSelectionType.prototype = Utils.extend(Provi.Bio.AtomSelection.VariableSelectionType, /** @lends Provi.Bio.Voronoia.VoronoiaSelectionType.prototype */ {
    default_params: {
        resolution: 2.0,
        cavity_probe_radius: 0.6,
        exterior_probe_radius: 5.0,
        cavity_color: 'skyblue'
    },
    _init: function(grid){
        var self = this;
        this.initialized = false;
        this.applet.script_callback('' +
            'script "../data/jmol_script/voronoia.jspt";' +
        '', {}, function(){
            self.initialized = true;
            $(self).trigger("init_ready");
        });
        $(this).bind("calculate_ready", function(){
            self.show_hole( 'all', undefined, {}, _.bind( grid.invalidate, grid ) );
        });
    },
    get_ids: function(sele){
        return this.ids;
    },
    get_data: function(id){
        if( !this.ready ) return [0, 0, 0, 0];
        var ids = (id=="all") ? this.get_ids() : [id];
        var s = 'provi_hole_test(["' + ids.join('","') + '"]).join(",")';
        var a = this.applet.evaluate(s);
        a = a ? a.split(",") : [0, 0, 0, 0];
        // console.log(a);
        return _.map( a, parseFloat );
    },
    make_row: function(id){
        if(id==='all'){
            if( !this.ids || !this.ids.length ){
                return 'No cavities';
            }
            var label = 'Cavities'
        }else{
            var label = 'Cavity ' + id.split('_')[2];
        }
        var a = this.get_data(id); // selected, neighbours, hole, cavity

        var $row = $('<div></div>').append(
            this.selected_cell( id, a[0] ),
            this.label_cell( label ),
            this.hole_cell( id, a[2] ),
            this.cavity_cell( id, a[3], this.ids.length>50 && id==="all" ),
            this.neighbours_cell( id, a[1] )
        );
        return $row;
    },
    _show_hole: function(id, flag){
        var self = this;
        var color = this.cavity_color;
        var ids = (id==='all') ? this.get_ids() : [ id ];
        if(flag){
            return _.map( ids, function(id){
                var hole_id = id;
                return 'draw ID "' + hole_id + '_draw*" delete;';
            }).join(' ');
        }else{
            return _.map( ids, function(id){
                var hole_id = id;
                return 'sele = ' + self.selection(id, true) + ';' +
                    'set drawHover true;' +
                    'try{' +
                        'dia = 2*(sele.X.stddev + sele.Y.stddev + sele.Z.stddev)/3;' +
                        'draw ID ' + hole_id + '_draw__no_widget__ "Cavity ' + hole_id.split('_')[2] + '" ' +
                            'DIAMETER @dia ' +
                            'COLOR ' + color + ' ' +
                            '@sele;' +
                    '}catch(e){' +
                        'print "ERROR: " + e' +
                    '}';
            }).join(' ');
        }
    },
    show_hole: function(id, flag, params, callback){
        this.applet.script_callback( this._show_hole(id, flag), { maintain_selection: true }, callback );
    },
    _show_cavity: function(id, flag, params){
        params = params || {};
        var resolution = params.resolution || this.resolution;
        var cavity_probe_radius = params.cavity_probe_radius || this.cavity_probe_radius;
        var exterior_probe_radius = params.exterior_probe_radius || this.exterior_probe_radius;
        var color = params.cavity_color || this.cavity_color;
        var self = this;
        var ids = (id==='all') ? this.get_ids() : [ id ];
        if(flag){
            return _.map( ids, function(id){
                var hole_id = id;
                return 'isosurface id "' + hole_id + '_iso__no_widget__" delete;';
            }).join(' ');
        }else{
            return _.map( ids, function(id){
                var hole_id = id;
                return 'set drawHover true;' +
                    'isosurface id "' + hole_id + '_iso__no_widget__" ' +
                        //'"Hole ' + hole_id.split('_')[2] + '" ' +
                    'select {' + self.selection(id) + '} ' +
                    'ignore { not ' + self.selection(id) + '} ' +
                    'resolution ' + resolution + ' ' +
                    'color ' + color + ' ' +
                    'cavity ' + cavity_probe_radius + ' ' + 
                        exterior_probe_radius + ';' +
                    // 'isosurface id "' + hole_id + '_iso__no_widget__" ' +
                    //     'triangles; ' +
                '';
            }).join(' ');
        }
    },
    show_cavity: function(id, flag, params, callback){
        this.applet.script_callback( this._show_cavity(id, flag, params), { maintain_selection: true }, callback );
    },
    _show_neighbours: function(id, flag){
        return 'select ' + this.selection(id) + ';' +
            'wireframe ' + (flag ? 'off' : '0.2') + ';' +
            'cpk ' + (flag ? 'off' : '0.2') + ';';
    },
    show_neighbours: function(id, flag, params, callback){
        this.applet.script_callback( this._show_neighbours(id, flag), { maintain_selection: true }, callback );
    },
    hole_cell: Provi.Bio.AtomSelection.CellFactory({
        "name": "hole", "color": "skyblue"
    }),
    cavity_cell: Provi.Bio.AtomSelection.CellFactory({
        "name": "cavity", "color": "tomato"
    }),
    neighbours_cell: Provi.Bio.AtomSelection.CellFactory({
        "name": "neighbours", "color": "lightgreen"
    })
});




})();