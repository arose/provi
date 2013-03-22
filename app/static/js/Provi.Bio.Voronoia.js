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
}
Provi.Bio.Voronoia.VoronoiaSelectionType.prototype = Utils.extend(Provi.Bio.AtomSelection.VariableSelectionType, /** @lends Provi.Bio.Voronoia.VoronoiaSelectionType.prototype */ {
    default_params: {
        resolution: 2.0,
        cavity_probe_radius: 0.6,
        exterior_probe_radius: 5.0,
        cavity_color: 'skyblue'
    },
    get_ids: function(sele){
        return this.ids;
    },
    get_data: function(id){
        var ids = (id=="all") ? this.get_ids() : [id];
        this.applet.script('' +
            'function provi_isosurface_test(ids){' +
                'var l = [];' +
                //'try{' +
                    'for(id in ids){' +
                        'l += (getProperty("shapeInfo", "Isosurface", "ID")' +
                            '.find(id+"_iso__no_widget__") & true)+0;' +
                    '}' +
                //'}catch(){}' +
                'return l.average;' +
            '};' +
            'function provi_hole_test(ids){' +
                //'try{' +
                    'var sele_l = [];' +
                    'var displayed_l = [];' +
                    'var cpk_l = [];' +
                    'var draw_l = [];' +
                    'var iso_l = [];' +
                    'for(id in ids){' +
                        'sele_l += provi_selection[id].selected.join("");' +
                        'var p = provi_selection[id];' +
                        // 'var s = {p} and {displayed};' +
                        // 'displayed_l += s.length.join("")/' +
                        //     'provi_selection[id].length.join("");' +
                        'cpk_l += provi_selection[id].cpk.join("");' +
                        'tmp = 0;' +
                        'var s = "tmp = ($"+id+"_draw__no_widget__ & true)+0";' +
                        'script INLINE @s;' +
                        'draw_l += tmp;' +
                        'tmp = 0;' +
                        'var s = "tmp = ($"+id+"_iso__no_widget__ & true)+0";' +
                        'script INLINE @s;' +
                        'iso_l += tmp;' +
                        // 'draw_l += (getProperty("shapeInfo", "Draw", "ID")' +
                        //     '.find(id+"_draw__no_widget__") & true)+0;' +
                        // 'iso_l += (getProperty("shapeInfo", "Isosurface", "ID")' +
                        //     '.find(id+"_iso__no_widget__") & true)+0;' +
                    '}' +
                //'}catch(){}' +
                'return [ sele_l.average, cpk_l.average, draw_l.average, iso_l.average ];' +
            '};' +
        '');
        var s = 'provi_hole_test(["' + ids.join('","') + '"]).join(",")';
        var a = this.applet.evaluate(s);
        if(a){
            a = a.split(",");
        }else{
            a = [0, 0, 0, 0];
        }
        // console.log(a);
        var selected = a[0];
        var neighbours = parseFloat(a[1]);
        var hole = parseFloat(a[2]);
        var cavity = parseFloat(a[3]);

        return [ selected, hole, cavity, neighbours ];
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
        var a = this.get_data(id);
        var selected = a[0];
        var hole = a[1];
        var cavity = a[2];
        var neighbours = a[3];
        var displayed = a[4];

        var $row = $('<div></div>');
        $row.append(
            this.selected_cell( id, selected ),
            //this.displayed_cell( id, displayed ),
            this.label_cell( label ),
            this.hole_cell( id, hole ),
            this.cavity_cell( id, cavity, this.ids.length>50 && id==="all" ),
            this.neighbours_cell( id, neighbours )
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
    show_hole: function(id, flag, callback){
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
    show_neighbours: function(id, flag, callback){
        this.applet.script_callback( this._show_neighbours(id, flag), { maintain_selection: true }, callback );
    },
    hole_cell: function(id, hole){
        var $hole = $('<span style="background:skyblue; float:right; width:22px;">' +
            '<input cell="hole" type="checkbox" ' + 
                ( hole ? 'checked="checked" ' : '' ) + 
            '/>' +
        '</span>');
        $hole.children().prop( 'indeterminate', hole > 0.0 && hole < 1.0 );
        $hole.children().data( 'id', id );
        var tt = (hole ? 'Hide' : 'Show') + (id==='all' ? ' all spheres' : ' sphere');
        $hole.tipsy({gravity: 'n', fallback: tt});
        return $hole;
    },
    cavity_cell: function(id, cavity, disabled){
        var $cavity = $('<span style="background:tomato; float:right; width:22px;">' +
            '<input cell="cavity" type="checkbox" ' + 
                ( cavity ? 'checked="checked" ' : '' ) + 
                ( disabled ? 'disabled="disabled" ' : '') +
            '/>' +
        '</span>');
        $cavity.children().prop( 'indeterminate', cavity > 0.0 && cavity < 1.0 );
        $cavity.children().data( 'id', id );
        var tt = (cavity ? 'Hide' : 'Show') + (id==='all' ? ' all cavities' : ' cavity');
        $cavity.tipsy({gravity: 'n', fallback: tt});
        return $cavity;
    },
    neighbours_cell: function(id, neighbours){
        neighbours = parseFloat(neighbours);
        var $neighbours = $('<span style="background:lightgreen; float:right; width:22px;">' +
            '<input cell="neighbours" type="checkbox" ' + 
                ( neighbours ? 'checked="checked" ' : '' ) + 
            '/>' +
        '</span>');
        $neighbours.children().prop( 'indeterminate', neighbours > 0.0 && neighbours < 0.2 );
        $neighbours.children().data( 'id', id );
        var tt = (neighbours ? 'Hide' : 'Show') + (id==='all' ? ' all neighbours' : ' neighbours');
        $neighbours.tipsy({gravity: 'n', fallback: tt});
        return $neighbours;
    }
});




})();