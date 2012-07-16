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


/**
 * @class Represents voronoia cavities, neighbours and packing data
 * @constructor
 * @extends Provi.Bio.Smcra.AbstractAtomPropertyMap
 * @param {array} atoms A list containing lists with atom packing data.
 * @param {array} cavities A list of cavities.
 */
Provi.Bio.Voronoia.Vol = function(atoms, cavities){
    // 0: chain_id, 1: residue_number, 2: residue_type, 3:atom_type, 4: packing_density,
    // 5: vdw_volume, 6: solv_ex_volume, 7: total_volume, 8: surface, 9: cavity_nb, 10: cavities
    this.atoms = atoms;
    this.cavities = cavities;
    this.cavity_neighbours_dict = {};
    this.init();
};
Provi.Bio.Voronoia.Vol.prototype = Provi.Utils.extend(Provi.Bio.Smcra.AbstractAtomPropertyMap, /** @lends Provi.Bio.Voronoia.Vol.prototype */ {
    key_length: 3,
    init: function( atoms, cavities, neighbours ){
        if(atoms) this.atoms = atoms;
        if(cavities) this.cavities = cavities;
        if(neighbours) this.neighbours = neighbours;
        if( this.atoms && this.cavities ){
            this._make_cavity_neighbours_dict();
        }
        if( this.atoms ){
            this._make_atoms_property_dict();
        }
    },
    _make_atoms_property_dict: function(){
        var self = this;
        this.property_dict = {};
        this.property_list = [];
        $.each( this.atoms, function(i, atom){
            var property = {
                packing_density: atom[4],
                vdw_volume: atom[5],
                solv_ex_volume: atom[6],
                total_volume: atom[7],
                surface: atom[8],
                cavity_nb: atom[9]
            }
            self.property_dict[ [ atom[0], atom[1], atom[3] ] ] = property;
            self.property_list.push( property );
        })
    },
    _make_cavity_neighbours_dict: function(){
        var self = this;
        if( this.neighbours ){
            _.each( this.neighbours, function(cav, i){
                self.cavity_neighbours_dict[ i+1 ] = cav;
            });
        }
    },
    _make_cavity_neighbours_dict2: function(){
        var self = this;
        if( this.atoms && this.cavities ){
            // console.log(this.atoms);
            // console.log(this.cavities);
            $.each( this.cavities, function(i){
                var cav = this;
                //console.log(cav);
                self.cavity_neighbours_dict[ cav[0] ] = [];
            });
            // console.log( self.cavity_neighbours_dict );
            $.each( this.atoms, function(i){
                var atom = this;
                if(atom[10].length){
                    $.each( atom[10], function(i){
                        var cav_id = parseInt(this) + 1;
                        self.cavity_neighbours_dict[ cav_id ].push( atom );
                    });
                }
            });
        }
    },
    _property_names: {
        packing_density: 'Packing density',
        vdw_volume: 'VdW volume',
        solv_ex_volume: 'Solvent ex. vol.',
        total_volume: 'Total vol.',
        surface: 'Surface',
        cavity_nb: 'Cavity number'
    },
    _html_template: (function(){
        return $.template('<ul>' +
            '<lh>Voronoia data</lh>' +
            '<li>Packing density: ${packing_density.toFixed(2)}</li>' +
            '<li>VdW volume: ${vdw_volume.toFixed(2)}</li>' +
            '<li>Solvent ex. vol.: ${solv_ex_volume.toFixed(2)}</li>' +
            '<li>Total vol.: ${total_volume.toFixed(2)}</li>' +
            '<li>Surface: ${surface}</li>' +
            '<li>Cavity number: ${cavity_nb}</li>' +
        '</ul>');
    })(),
    _html_data: function( property ){
        return property;
    }
});


/**
 * @class Represents voronoia cavities, neighbours and packing data
 * @constructor
 * @extends Provi.Bio.Smcra.AbstractResiduePropertyMap
 * @param {Provi.Bio.Voronoia.Vol} vol An object with voronoia vol atom data.
 */
Provi.Bio.Voronoia.VolResidueMap = function( vol ){
    this.vol = vol;
    this.init();
};
Provi.Bio.Voronoia.VolResidueMap.prototype = Provi.Utils.extend(Provi.Bio.Smcra.AbstractResiduePropertyMap, /** @lends Provi.Bio.Voronoia.VolResidueMap.prototype */ {
    key_length: 2,
    init: function(  ){
    this._make_property_dict();
    console.log( 'VolResidueMap', this );
    },
    _make_property_dict: function(){
        var self = this;
        
        var by_res_vol_dict = {};
        $.each( this.vol.get_dict(), function(key, property){
            var res_key = key.split(',').slice(0,2);
            //console.log(res_key, key);
            if( !by_res_vol_dict[ res_key ] ) by_res_vol_dict[ res_key ] = [];
            by_res_vol_dict[ res_key ].push( property );
        });
        
        this.property_dict = {};
        this.property_list = [];
        //console.log('by_res_vol_dict', by_res_vol_dict);
        $.each( by_res_vol_dict, function(key, property_list){
            var property = {
                packing_density: pv.mean( property_list, function(p){ return p['packing_density'] } ),
                vdw_volume: pv.sum( property_list, function(p){ return p['vdw_volume'] } ),
                solv_ex_volume: pv.sum( property_list, function(p){ return p['solv_ex_volume'] } ),
                total_volume: pv.sum( property_list, function(p){ return p['total_volume'] } )
            }
            self.property_dict[ key ] = property;
            self.property_list.push( property );
        });
    },
    _property_names: {
        packing_density: 'Packing density mean',
        vdw_volume: 'VdW volume sum',
        solv_ex_volume: 'Solvent ex. vol. sum',
        total_volume: 'Total vol. sum'
    },
    _html_template: (function(){
        return $.template('<ul>' +
            '<lh>Voronoia residue data</lh>' +
            '<li>Packing density mean: ${packing_density.toFixed(2)}</li>' +
            '<li>VdW volume sum: ${vdw_volume.toFixed(2)}</li>' +
            '<li>Solvent ex. vol. sum: ${solv_ex_volume.toFixed(2)}</li>' +
            '<li>Total vol. sum: ${total_volume.toFixed(2)}</li>' +
        '</ul>');
    })(),
    _html_data: function( property ){
        return property;
    }
});



var principal_axes = function(m){
    m = numeric.clone(m);
    var means = _.map(_.range(m[0].length), function(i){
        return _.reduce(m, function(memo,x){
            return x[i]+memo;
        }, 0) / m.length;
    });
    // substract means
    _.each(m, function(d,i){
        _.each(means, function(me,j){
            m[i][j] -= me;
        });
    });
    var svd = numeric.svd(m);
    // scale axes
    var axes = _.map(svd.S, function(s, i){
        return _.map(svd.V, function(v){
            return v[i]*s;
        });
    });
    return axes;
};

var geometric_center = function(coords){
    return _.map(_.range(3), function(i){
        return _.reduce(coords, function(sum, x){ 
            return sum + x[i]; 
        }, 0) / coords.length;
    });
}

var standard_deviation = function(coords, center){
    center = center || geometric_center(coords);
    return _.map(_.range(3), function(i){
        return Math.sqrt( _.reduce(coords, function(sum, x){
            return sum + Math.pow(x[i] - center[i], 2); 
        }, 0) / coords.length );
    });
}

var distance_to_center = function(coords, center){
    center = center || geometric_center(coords);
    return _.map(coords, function(d){
        var diff = _.map(_.range(3), function(i){
            return Math.pow( Math.abs(d[i]-center[i]), 2 );
        });
        return Math.sqrt( _.reduce(diff, function(sum, x){ return sum + x; }, 0) );
    });
}

var draw_center = function(coords, applet, name, dim, all_coords){
    dim = dim || 0;
    name = name || "center";
    var center = geometric_center(coords);
    var std = standard_deviation(coords, center);
    var center_dists = distance_to_center(coords, center);
    if(Array.isArray(dim)){
        var vec = $V(dim);
        var proj = _.map(_.range(3), function(i){
            var ax = [0, 0, 0];
            ax[i] = 1;
            return Math.abs( std[i] * Math.cos(vec.angleFrom(ax)) );
        });
        std = _.reduce(proj, function(d, sum){ return sum + d; }, 0) / proj.length;
    }else if(dim=="mindist"){
        var center_dists_all = distance_to_center(all_coords, center);
        std = _.min(center_dists_all) - 1.7;
    }else{
        std = _.include(["min", "max"], dim) ? _[dim](std) : std[dim];
    }
    if(typeof std === "number" && std > 0.3 && std!="Infinity"){
        var s = 'draw id "' + name + '_' + dim + '" ' +
            '{' + center.join(' ') + '} radius ' + std + ' color orange translucent;'
        console.log(s);
        applet.script_wait( s );
    }
    return [ _.max(center_dists) - _.min(center_dists), std ];
}

var split_coords = function(coords, plane){
    var a = [];
    var b = [];
    _.each(coords, function(d,i){
        var dist = plane.distanceFrom(d);
        var point = plane.pointClosestTo(d);
        var vec = point.subtract(d);
        var dir = vec.dot(plane.normal);
        var o = [d, dist];
        dir > 0 ? a.push(o) : b.push(o);
    });
    var groups = []
    var split_dist = 2;
    _.each([a,b], function(x){
        var max = _.max(x, function(val){ return val[1]; })[1];
        var min = _.min(x, function(val){ return val[1]; })[1];
        var max2 = max/2;
        var max3 = max/3;
        var max4 = max/4;
        if(max4 > split_dist){
            var g1 = [];
            var g2 = [];
            var g3 = [];
            var g4 = [];
            _.each(x, function(v){
                if( v[1]<=max4 ){
                    g1.push(v[0])   
                }else if( v[1]<= (2*max4) ){
                    g2.push(v[0])
                }else if( v[1]<= (3*max4) ){
                    g3.push(v[0])
                }else{
                    g4.push(v[0])
                }
            });
            groups.push(g1);
            groups.push(g2);
            groups.push(g3);
            groups.push(g4);
        }else if(max3 > split_dist){
            var g1 = [];
            var g2 = [];
            var g3 = [];
            _.each(x, function(v){
                if( v[1]<=max3 ){
                    g1.push(v[0])   
                }else if( v[1]<= (2*max3) ){
                    g2.push(v[0])
                }else{
                    g3.push(v[0])
                }
            });
            groups.push(g1);
            groups.push(g2);
            groups.push(g3);
        }else if(max2 > split_dist){
            var g1 = [];
            var g2 = [];
            _.each(x, function(v){
                v[1]>max2 ? g1.push(v[0]) : g2.push(v[0]);
            });
            groups.push(g1);
            groups.push(g2);
        }else{
            groups.push( _.map(x, function(v){ return v[0]; }) );
        }
    });
    return groups;
}



Provi.Bio.Voronoia.VoronoiaSelectionTypeFactory = function(ids){
    return function(params){
        params.ids = ids;
        return new Provi.Bio.Voronoia.VoronoiaSelectionType(params);
    }
}

Provi.Bio.Voronoia.VoronoiaSelectionType = function(params){
    this.ids = params.ids;
    Provi.Bio.AtomSelection.SelectionType.call( this, params );
}
Provi.Bio.Voronoia.VoronoiaSelectionType.prototype = Utils.extend(Provi.Bio.AtomSelection.VariableSelectionType, /** @lends Provi.Bio.Voronoia.VoronoiaSelectionType.prototype */ {
    get_ids: function(sele){
        return this.ids;
    },
    get_data: function(id){
        var ids = (id=="all") ? this.get_ids() : [id];
        this.applet.script_wait('' +
            'function provi_isosurface_test(ids){' +
                'var l = [];' +
                'for(id in ids){' +
                    'l += (getProperty("shapeInfo", "Isosurface", "ID")' +
                        '.find(id+"_iso__no_widget__") & true)+0;' +
                '}' +
                'return l.average;' +
            '};' +
            'function provi_hole_test(ids){' +
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
                'return [ sele_l.average, cpk_l.average, draw_l.average, iso_l.average, displayed_l.average ];' +
            '};' +
        '');
        var s = 'provi_hole_test(["' + ids.join('","') + '"]).join(",")';
        var a = this.applet.evaluate(s).split(",");
        console.log(a);
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
                            'COLOR skyblue ' +
                            '@sele;' +
                    '}catch(e){' +
                        'print "ERROR: " + e' +
                    '}';
            }).join(' ');
        }
    },
    show_hole: function(id, flag){
        this.applet.script_wait( this._show_hole(id, flag), true );
    },
    _show_cavity: function(id, flag, params){
        params = params || {};
        var resolution = params.resolution || 2.0;
        var cavity_probe_radius = params.cavity_probe_radius || 0.6;
        var exterior_probe_radius = params.exterior_probe_radius || 5.0;
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
                    'color skyblue ' +
                    'cavity ' + cavity_probe_radius + ' ' + 
                        exterior_probe_radius + ';' +
                    // 'isosurface id "' + hole_id + '_iso__no_widget__" ' +
                    //     'triangles; ' +
                '';
            }).join(' ');
        }
    },
    show_cavity: function(id, flag, params){
        this.applet.script_wait( this._show_cavity(id, flag, params), true );
    },
    _show_neighbours: function(id, flag){
        return 'select ' + this.selection(id) + ';' +
            'wireframe ' + (flag ? 'off' : '0.2') + ';' +
            'cpk ' + (flag ? 'off' : '0.2') + ';';
    },
    show_neighbours: function(id, flag){
        this.applet.script_wait( this._show_neighbours(id, flag), true );
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


/**
 * A widget to view voronoia data: cavities, their neighbours and packing data
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Bio.Voronoia.Voronoia2Widget = function(params){
    params = _.defaults(
        params,
        Provi.Bio.Voronoia.Voronoia2Widget.prototype.default_params
    );
    this.applet = params.applet;
    
    this.holes_selections = params.holes_selections;
    this.vol_properties = params.vol_properties;

    this.resolution = params.resolution;
    this.cavity_probe_radius = params.cavity_probe_radius;
    this.exterior_probe_radius = params.exterior_probe_radius;

    Provi.Widget.Widget.call( this, params );
    this._init_eid_manager([ 
        'resolution', 'cavity_probe_radius', 'exterior_probe_radius', 
        'jstree'
    ]);
    var template = '' +
        '<div class="control_row">' +
            '<label for="${eids.resolution}">resolution</label>' +
            '<select id="${eids.resolution}" class="ui-state-default">' +
                '<option value="1.0">1.0</option>' +
                '<option value="1.5">1.5</option>' +
                '<option value="2.0">2.0</option>' +
                '<option value="2.5">2.5</option>' +
                '<option value="3.0">3.0</option>' +
                '<option value="3.5">3.5</option>' +
                '<option value="4.0">4.0</option>' +
            '</select>' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="${eids.cavity_probe_radius}">cavity probe radius</label>' +
            '<select id="${eids.cavity_probe_radius}" class="ui-state-default">' +
                '<option value="0.2">0.2</option>' +
                '<option value="0.3">0.3</option>' +
                '<option value="0.4">0.4</option>' +
                '<option value="0.5">0.5</option>' +
                '<option value="0.6">0.6</option>' +
                '<option value="0.7">0.7</option>' +
                '<option value="0.8">0.8</option>' +
                '<option value="0.9">0.9</option>' +
                '<option value="1.0">1.0</option>' +
                '<option value="1.1">1.1</option>' +
                '<option value="1.2">1.2</option>' +
                '<option value="1.3">1.3</option>' +
                '<option value="1.4">1.4</option>' +
                '<option value="1.5">1.5</option>' +
                '<option value="1.6">1.6</option>' +
            '</select>' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="${eids.exterior_probe_radius}">exterior probe radius</label>' +
            '<select id="${eids.exterior_probe_radius}" class="ui-state-default">' +
                '<option value="3.0">3.0</option>' +
                '<option value="4.0">4.0</option>' +
                '<option value="5.0">5.0</option>' +
                '<option value="6.0">6.0</option>' +
                '<option value="7.0">7.0</option>' +
            '</select>' +
        '</div>' +
        '<div class="control_row">' +
            '<div id="${eids.jstree}"></div>' +
        '</div>' +
    '';
    this.add_content( template, params );
    this._init();
}
Provi.Bio.Voronoia.Voronoia2Widget.prototype = Utils.extend(Widget, /** @lends VProvi.Bio.Voronoia.oronoia2Widget.prototype */ {
    default_params: {
        resolution: "2.0",
        cavity_probe_radius: "0.6",
        exterior_probe_radius: "5.0",
        heading: 'Voronoia2'
    },
    _init: function(){
        var self = this;
        this.elm('resolution').val( this.resolution );
        this.elm('resolution').bind('change', function(){
            self.resolution = self.elm('resolution').children("option:selected").val();
        });
        this.elm('cavity_probe_radius').val( this.cavity_probe_radius );
        this.elm('cavity_probe_radius').bind('change', function(){
            self.cavity_probe_radius = 
                self.elm('cavity_probe_radius').children("option:selected").val();
        });
        this.elm('exterior_probe_radius').val( this.exterior_probe_radius );
        this.elm('exterior_probe_radius').bind('change', function(){
            self.exterior_probe_radius = 
                self.elm('exterior_probe_radius').children("option:selected").val();
        });
        this.tree_view();
        Provi.Widget.Widget.prototype.init.call(this);
    },
    tree_view: function(){
        var self = this;
        
        if( !this.holes_selections ) return;

        var jstree_data = [];
        var jstree_data_by_chain = {};
        _.each( this.holes_selections.get_list(), function(hole, i){
            var hole_node = {
                data: hole.name,
                metadata: {
                    type: 'hole',
                    hole_id: i+1
                }
            };
            jstree_data.push( hole_node );
        });

        // console.log( jstree_data );
        this.jstree = this.elm('jstree').jstree({
            json_data: {
                data: {
                    data : "Holes",
                    metadata: {
                        type: 'holes'
                    },
                    children : jstree_data
                },
                progressive_render: true
            },
            core: {
                html_titles: false,
                animation: 0
            },
            themes: {
                icons: false
            },
            checkbox_grid: {
                columns: 3
            },
            plugins: [ "json_data", "themes", "checkbox_grid" ]
        });
        this.jstree = $.jstree._reference( this.eid('jstree') );
        this.elm('jstree').bind("check_node.jstree uncheck_node.jstree", function(event, data){
            self.__tree_trigger_selection_update(event, data);
        });
    },
    __tree_trigger_selection_update: function(event, data){
        var self = this;
        console.log( event, data );
        var node = data.args[0];
        var column = data.args[1];
        var toggle = event.type === "check_node";
        var selected = toggle ? data.inst.get_checked( node, column ) : data.inst.get_unchecked( node, column );
        console.log(selected);
        var sele_hole = [];
        selected.each( function(i, elm){
            var $elm = $(elm);
            if( $elm.data('type')=='hole' ){
                sele_hole.push( $elm.data('hole_id') );
            }else if( $elm.data('type')=='holes' ){
                sele_hole = _.range( 0, self.holes_selections.get_list().length );
            }
        });

        if(sele_hole){
            var script_all = '';
            _.each( sele_hole, function(hole_id, i){
                var sele = self.holes_selections.get_list()[hole_id].sele();
                var sele2 = self.holes_selections.get_list()[hole_id].sele(true);
                var s = '';
                if(column==3){
                    s = 'select ' + sele + ';' +
                        'wireframe ' + (toggle ? '0.2' : 'off') + ';' +
                        'cpk ' + (toggle ? '0.2' : 'off') + ';';
                    script_all += s;
                    // self.applet.script_wait(s, true);
                }
                if( toggle ){
                    if(column==1){
                        s = 'isosurface id "' + hole_id + '_iso__no_widget__" ' +
                                'select {' + sele + '} ' +
                                'ignore { not ' + sele + '} ' +
                                'resolution ' + self.resolution + ' ' +
                                'color skyblue ' +
                                'cavity ' + self.cavity_probe_radius + ' ' + 
                                    self.exterior_probe_radius + ';';
                        // script_all += s;
                        self.applet.script_wait(s, true);
                    }
                    if(column==2){
                        s = 'sele = ' + sele2 + ';' +
                            'dia = 2*(sele.X.stddev + sele.Y.stddev + sele.Z.stddev)/3;' +
                            'draw ID "' + hole_id + '_draw__no_widget__" ' +
                                'DIAMETER @dia ' +
                                'COLOR skyblue ' +
                                '@sele;';
                        script_all += s;
                        //self.applet.script_wait(s, true);
                    }
                }else{
                    if(column==1){
                        s = 'draw id "' + hole_id + '_iso__no_widget__" off;' +
                            'isosurface id "' + hole_id + '_iso__no_widget__" off;';
                        script_all += s;
                        //self.applet.script_wait(s, true);
                    }
                    if(column==2){
                        s = 'draw id "' + hole_id + '_draw*" off;' +
                            'isosurface id "' + hole_id + '_draw" off;';
                        script_all += s;
                        //self.applet.script_wait(s, true);
                    }
                }
            });
            if(script_all){
                self.applet.script( script_all, true );
            };
        }
    }
});

/**
 * A widget to view voronoia data: cavities, their neighbours and packing data
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Bio.Voronoia.VoronoiaWidget = function(params){
    params = _.defaults(
        params,
        Provi.Bio.Voronoia.VoronoiaWidget.prototype.default_params
    );
    this.applet = params.applet;
    this.dataset = params.dataset;
    this.cavities_model_number = params.cavities_model_number;
    this.resolution = params.resolution;
    this.cavity_probe_radius = params.cavity_probe_radius;
    this.exterior_probe_radius = params.exterior_probe_radius;
    Provi.Widget.Widget.call( this, params );
    this._init_eid_manager([ 
        'resolution', 'cavity_probe_radius', 'exterior_probe_radius', 
        'jstree'
    ]);
    var template = '' +
        '<div class="control_row">' +
            '<label for="${eids.resolution}">resolution</label>' +
            '<select id="${eids.resolution}" class="ui-state-default">' +
                '<option value="1.0">1.0</option>' +
                '<option value="1.5">1.5</option>' +
                '<option value="2.0">2.0</option>' +
                '<option value="2.5">2.5</option>' +
                '<option value="3.0">3.0</option>' +
                '<option value="3.5">3.5</option>' +
                '<option value="4.0">4.0</option>' +
            '</select>' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="${eids.cavity_probe_radius}">cavity probe radius</label>' +
            '<select id="${eids.cavity_probe_radius}" class="ui-state-default">' +
                '<option value="0.2">0.2</option>' +
                '<option value="0.3">0.3</option>' +
                '<option value="0.4">0.4</option>' +
                '<option value="0.5">0.5</option>' +
                '<option value="0.6">0.6</option>' +
                '<option value="0.7">0.7</option>' +
                '<option value="0.8">0.8</option>' +
                '<option value="0.9">0.9</option>' +
                '<option value="1.0">1.0</option>' +
                '<option value="1.1">1.1</option>' +
                '<option value="1.2">1.2</option>' +
                '<option value="1.3">1.3</option>' +
                '<option value="1.4">1.4</option>' +
                '<option value="1.5">1.5</option>' +
                '<option value="1.6">1.6</option>' +
            '</select>' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="${eids.exterior_probe_radius}">exterior probe radius</label>' +
            '<select id="${eids.exterior_probe_radius}" class="ui-state-default">' +
                '<option value="3.0">3.0</option>' +
                '<option value="4.0">4.0</option>' +
                '<option value="5.0">5.0</option>' +
                '<option value="6.0">6.0</option>' +
                '<option value="7.0">7.0</option>' +
            '</select>' +
        '</div>' +
        '<div class="control_row">' +
            '<div id="${eids.jstree}"></div>' +
        '</div>' +
    '';
    this.add_content( template, params );
    this._init();
}
Provi.Bio.Voronoia.VoronoiaWidget.prototype = Utils.extend(Widget, /** @lends VProvi.Bio.Voronoia.oronoiaWidget.prototype */ {
    default_params: {
        resolution: "2.0",
        cavity_probe_radius: "0.6",
        exterior_probe_radius: "5.0",
        heading: 'Voronoia'
    },
    _init: function(){
        var self = this;
        this.elm('resolution').val( this.resolution );
        this.elm('resolution').bind('change', function(){
            self.resolution = self.elm('resolution').children("option:selected").val();
        });
        this.elm('cavity_probe_radius').val( this.cavity_probe_radius );
        this.elm('cavity_probe_radius').bind('change', function(){
            self.cavity_probe_radius = 
                self.elm('cavity_probe_radius').children("option:selected").val();
        });
        this.elm('exterior_probe_radius').val( this.exterior_probe_radius );
        this.elm('exterior_probe_radius').bind('change', function(){
            self.exterior_probe_radius = 
                self.elm('exterior_probe_radius').children("option:selected").val();
        });
        this.tree_view();
        Provi.Widget.Widget.prototype.init.call(this);
    },
    tree_view: function(){
        var self = this;
        
        var raw_data = this.get_data();
        if( !raw_data ) return;

        var jstree_data = [];
        var jstree_data_by_chain = {};
        _.each( raw_data, function(cav, i){
            var cav_node = {
                data: (i+1) + ' (' + cav[7] + ' \u212B)',
                metadata: {
                    type: 'cav',
                    cav_id: i+1
                }
            };
            jstree_data.push( cav_node );
        });

        console.log( jstree_data );
        this.jstree = this.elm('jstree').jstree({
            json_data: {
                data: {
                    data : "Cavities",
                    metadata: {
                        type: 'cavities'
                    },
                    children : jstree_data
                },
                progressive_render: true
            },
            core: {
                html_titles: false,
                animation: 0
            },
            themes: {
                icons: false
            },
            checkbox_grid: {
                columns: 3
            },
            plugins: [ "json_data", "themes", "checkbox_grid" ]
        });
        this.jstree = $.jstree._reference( this.eid('jstree') );
        this.elm('jstree').bind("check_node.jstree uncheck_node.jstree", function(event, data){
            self.__tree_trigger_selection_update(event, data);
        });
    },
    __tree_trigger_selection_update: function(event, data){
        var self = this;
        console.log( event, data );
        var node = data.args[0];
        var column = data.args[1];
        var toggle = event.type === "check_node";
        var selected = toggle ? data.inst.get_checked( node, column ) : data.inst.get_unchecked( node, column );
        console.log(selected);
        var sele_cav = [];
        selected.each( function(i, elm){
            var $elm = $(elm);
            if( $elm.data('type')=='cav' ){
                sele_cav.push( $elm.data('cav_id') );
            }else if( $elm.data('type')=='cavities' ){
                sele_cav = _.range( 1, self.dataset.data.neighbours.length+1 );
            }
        });

        if(sele_cav){
            _.each( sele_cav, function(cav_id, i){
                var sele = [];
                _.each( self.dataset.data.cavity_neighbours_dict[ cav_id ], function(atom, i){
                    sele.push( 'atomIndex<100000 and @' + (atom+1) + '' );
                });
                sele = 'not ' + self.cavities_model_number + ' and (' + sele.join(' or ') + ')';
                if(column==3){
                    var s = 'select {' + sele + '};' +
                        'wireframe ' + (toggle ? '0.2' : 'off') + ';' +
                        'cpk ' + (toggle ? '0.2' : 'off') + ';';
                    self.applet.script_wait( s, true );
                }
                if( toggle ){
                    if(column==1){
                        self.applet.script_wait( '' +
                            'isosurface id "' + cav_id + '_iso__no_widget__" ' +
                                'select {' + sele + ' and 1.1} ' +
                                'ignore { not ' + sele + ' or 2.1 } ' +
                                'resolution ' + self.resolution + ' ' +
                                'color skyblue ' +
                                'cavity ' + self.cavity_probe_radius + ' ' + 
                                    self.exterior_probe_radius + ';' +
                        '');
                    }
                    if(column==2){
                        self.applet.script_wait( '' +
                            'display displayed or {' + cav_id + '/' + self.cavities_model_number + '};' +
                        '');
                    }
                }else{
                    if(column==1){
                        self.applet.script_wait( 
                            'draw id "' + cav_id + '_*" off;' +
                            'isosurface id "' + cav_id + '_iso" off;' +
                        '');
                    }
                    if(column==2){
                        self.applet.script_wait( 
                            'hide hidden or {' + cav_id + '/' + self.cavities_model_number + '};' +
                        '');
                    }
                }
            });
        }
    },
    get_data: function(){
        return this.dataset.data.cavities;
    },
    select: function( selection, applet ){
        
    }
});

})();