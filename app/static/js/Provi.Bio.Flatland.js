/**
 * @fileOverview This file contains the {@link Provi.Bio.Flatland} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * @namespace
 * Structure module
 */
Provi.Bio.Flatland = {};


(function() {

/** @exports Utils as Provi.Utils */
var Utils = Provi.Utils;
/** @exports Widget as Provi.Widget.Widget */
var Widget = Provi.Widget.Widget;


/**
 * Represents flatland flatview
 * @constructor
 */
Provi.Bio.Flatland.Flatview = function(){
    this.init();
};
Provi.Bio.Flatland.Flatview.prototype = /** @lends Provi.Bio.Flatland.Flatview.prototype */ {
    init: function(){
        var self = this;
    }
};


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

/**
 * A widget
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Bio.Flatland.FlatlandWidget = function(params){
    params = $.extend(
        Provi.Bio.Flatland.FlatlandWidget.prototype.default_params,
        params
    );
    console.log('FLATLAND', params);
    if( params.applet ){
        params.persist_on_applet_delete = false;
    }else{
        params.persist_on_applet_delete = true;
    }
    //params.collapsed = false;
    Provi.Widget.Widget.call( this, params );
    this._init_eid_manager([
        'applet_selector_widget', 'chart', 'render'
    ]);
    
    this.dataset = params.dataset;
    this.applet = params.applet;
    
    
    var template = '' +
        '<div class="control_row" id="${eids.applet_selector_widget}"></div>' +
        '<div class="control_row" id="${eids.chart}" style="width:520px; height:520px;"></div>' +
        '<div class="control_row">' +
            '<button id="${eids.render}">render</button>' +
        '</div>' +
	'';
    this.add_content( template, params );

    if( !this.applet ){
        this.applet_selector = new Provi.Jmol.JmolAppletSelectorWidget({
            parent_id: this.eid('applet_selector_widget')
        });
    }

    this._init();
};
Provi.Bio.Flatland.FlatlandWidget.prototype = Utils.extend(Provi.Widget.Widget, /** @lends Provi.Bio.Structure.StructureWidget.prototype */ {
    default_params: {
        heading: 'Flatland'
    },
    get_applet: function(){
        if( this.applet ){
            return this.applet;
        }else{
            return this.applet_selector.get_value(true);
        }
    },
    _init: function(){
        var self = this;
        
        this.elm('render').button().click( function(){
            self.render();
        });

        Provi.Widget.Widget.prototype.init.call(this);
    },
    get_jmol_data: function(){
        var applet = this.get_applet();
        if( !applet ) return;
        var self = this;
        console.log('FOOFLATLAND');

        // var sele = '1332';
        var sele = '340-347';
        var format = "'%[atomno]',%[resno],'%[chain]','%[model]','%[file]','%x','%y','%z'";
        var apm = applet.atoms_property_map( format, sele );

        var coords = _.map(apm, function(d,i){
            return _.map([d[5], d[6], d[7]], function(x){ return parseFloat(x); });
        });
        console.log(coords);
        
        var axes = principal_axes(coords);

        applet.script( '' +
            'draw id "fc" {' + sele + '} radius 0.3 color tomato;' +
            'draw id "svd1" vector {' + sele + '} {' + axes[0].join(' ') + '} color pink;' +
            'draw id "svd2" vector {' + sele + '} {' + axes[1].join(' ') + '} color pink;' +
            'draw id "svd3" vector {' + sele + '} {' + axes[2].join(' ') + '} color pink;' +
        '');

        //return;

        $.ajax({
            url: '../data/jmol_script/helix_plane.jspt',
            cache: false,
            dataType: 'text',
            success: function(script){
                //console.log(script);
                script = script.replace('###plane###',
                    'p = plane({' + sele + '}.XYZ, @{{' + sele + '}.XYZ + point(' + axes[0].join(', ') + ')}, @{{' + sele + '}.XYZ + point(' + axes[1].join(', ') + ')});');
                script = script.replace('###sele###', sele);
                var data = applet.script_wait_output( script );
                console.log(data);
                data = $.parseJSON(data);

                focus_data = _.map( data[0], function(d,i){
                    var bonds = _.map(d[1], function(b,j){
                        return { atomno: b[0], dist: b[1] };
                    });
                    var bonds2 = _.map(d[5], function(b,j){
                        return { atomno: b[0], dist: b[1] };
                    });
                    var bonds3 = _.map(d[6], function(b,j){
                        return { atomno: b[0], dist: b[1] };
                    });
                    return {
                        atomno: d[0],
                        bonds: bonds,
                        bonds2: bonds2,
                        bonds3: bonds3,
                        original_coords: d[2],
                        projected_coords: d[3],
                        color: _.map( d[4], function(c){ return parseInt(c, 10); }),
                        //fixed: true,
                        x: d[3][1],
                        y: d[3][2]
                        // px: d[3][1],
                        // py: d[3][2]
                    };
                });

                vdw_data = _.map( data[2], function(d,i){
                    var nbs = _.map(d[4], function(b,j){
                        return {
                            resno: b[0],
                            dist: b[1]
                        };
                    });
                    return {
                        resno: d[0],
                        mindist: d[1],
                        original_coords: d[2],
                        projected_coords: d[3],
                        color: (d[5]<60) ? [128, 0, 0] : [0, 200, 0],
                        //fixed: true,
                        x: d[3][1],
                        y: d[3][2],
                        nbs: nbs,
                        angle: d[5]
                    };
                });

                console.log(data);

                focus_data_dict = {};
                _.each( focus_data, function(d,i){
                    focus_data_dict[ d.atomno ] = d;
                });

                vdw_data_dict = {};
                _.each( vdw_data, function(d,i){
                    vdw_data_dict[ d.resno ] = d;
                });

                self.focus_data = focus_data;
                self.focus_data_dict = focus_data_dict;

                self.vdw_data = vdw_data;
                self.vdw_data_dict = vdw_data_dict;
                console.log(vdw_data,vdw_data_dict);

                // var m1 = [];
                // var m = [];
                // _.each(focus_data, function(d,i){
                //     m.push( _.map(d.original_coords,_.identity) );
                //     m1.push( _.map(d.original_coords,_.identity) );
                // });
                // console.log( 'M', m, m1 );

                // var means = _.map(_.range(3), function(i){
                //     return _.reduce(m, function(memo,x){
                //         return x[i]+memo;
                //     }, 0) / m.length;
                // });
                // _.each(m, function(d,i){
                //     _.each(means, function(me,j){
                //         m[i][j] -= me;
                //     });
                // });
                // console.log( 'M', m, means );

                // var svd = numeric.svd(m);
                // console.log( 'M', m, svd );


                // applet.script( '' +
                //     'draw id "fc" {191 and sidechain} radius 0.3 color tomato;' +
                //     'draw id "svd1" vector {191 and sidechain} {' + _.map(svd.V[0], function(x){return x*10;}).join(' ') + '} color pink;' +
                //     'draw id "svd2" vector {191 and sidechain} {' + _.map(svd.V[1], function(x){return x*10;}).join(' ') + '} color pink;' +
                //     'draw id "svd3" vector {191 and sidechain} {' + _.map(svd.V[2], function(x){return x*10;}).join(' ') + '} color pink;' +
                // '');

                // applet.script( '' +
                //     'draw id "fc" {191 and sidechain} radius 0.3 color tomato;' +
                //     'draw id "svd1" vector {191 and sidechain} {' + _.map(svd.V[0], function(x){return x*svd.S[0];}).join(' ') + '} color pink;' +
                //     'draw id "svd2" vector {191 and sidechain} {' + _.map(svd.V[1], function(x){return x*svd.S[1];}).join(' ') + '} color pink;' +
                //     'draw id "svd3" vector {191 and sidechain} {' + _.map(svd.V[2], function(x){return x*svd.S[2];}).join(' ') + '} color pink;' +
                // '');

                // applet.script( '' +
                //     'draw id "fc" {191 and sidechain} radius 0.3 color tomato;' +
                //     'draw id "svd1" vector {191 and sidechain} {' + _.map(svd.U[0], function(x){return x*10;}).join(' ') + '} color pink;' +
                //     'draw id "svd2" vector {191 and sidechain} {' + _.map(svd.U[1], function(x){return x*10;}).join(' ') + '} color pink;' +
                //     'draw id "svd3" vector {191 and sidechain} {' + _.map(svd.U[2], function(x){return x*10;}).join(' ') + '} color pink;' +
                //     'draw id "svd4" vector {191 and sidechain} {' + _.map(svd.U[3], function(x){return x*10;}).join(' ') + '} color pink;' +
                //     'draw id "svd5" vector {191 and sidechain} {' + _.map(svd.U[4], function(x){return x*10;}).join(' ') + '} color pink;' +
                //     'draw id "svd6" vector {191 and sidechain} {' + _.map(svd.U[5], function(x){return x*10;}).join(' ') + '} color pink;' +
                //     'draw id "svd7" vector {191 and sidechain} {' + _.map(svd.U[6], function(x){return x*10;}).join(' ') + '} color pink;' +
                //     'draw id "svd8" vector {191 and sidechain} {' + _.map(svd.U[7], function(x){return x*10;}).join(' ') + '} color pink;' +
                // '');

                // applet.script( '' +
                //     'draw id "fc" {1332} radius 0.3 color tomato;' +
                //     'draw id "svd1" vector {1332} {' + svd.V[0][0]*svd.S[0] + ' ' + svd.V[1][0]*svd.S[0] + '' + svd.V[2][0]*svd.S[0] + '} color pink;' +
                //     'draw id "svd2" vector {1332} {' + svd.V[0][1]*svd.S[1] + ' ' + svd.V[1][1]*svd.S[1] + '' + svd.V[2][1]*svd.S[1] + '} color pink;' +
                //     'draw id "svd3" vector {1332} {' + svd.V[0][2]*svd.S[2] + ' ' + svd.V[1][2]*svd.S[2] + '' + svd.V[2][2]*svd.S[2] + '} color pink;' +
                // '');

                self._render();
            }
        });
    },
    render: function(){
        this.get_jmol_data();
    },
    _render: function(){
        var applet = this.get_applet();
        if( !applet ) return;
        var self = this;

        var w = 500;
        var h = 500;
        var p = 30;
        var fill = d3.scale.category10();
        //var nodes = d3.range(70).map(Object);
        var nodes = this.focus_data.concat( this.vdw_data );
        var links = [];
        _.each( this.focus_data, function(d,i){
            _.each( d.bonds, function(b,j){
                links.push({
                    source: d,
                    target: self.focus_data_dict[ b.atomno ],
                    dist: b.dist
                });
                // _.each( self.focus_data_dict[ b.atomno ].bonds, function(b2,k){
                //     if(d.atomno!==b2.atomno && b.atomno!==b2.atomno){
                //         links.push({
                //             source: d,
                //             target: self.focus_data_dict[ b2.atomno ],
                //             hidden: true,
                //             neighbour: true,
                //             lone: d.bonds.length===1
                //         });
                //     }
                // });
            });
            _.each( d.bonds2, function(b,j){
                links.push({
                    source: d,
                    target: self.focus_data_dict[ b.atomno ],
                    dist: b.dist,
                    hidden: true,
                    neighbour: true
                });
            });
            _.each( d.bonds3, function(b,j){
                links.push({
                    source: d,
                    target: self.focus_data_dict[ b.atomno ],
                    dist: b.dist,
                    hidden: true,
                    neighbour: true,
                    lone: true
                });
            });
        });
        _.each( this.vdw_data, function(d,i){
            links.push({
                source: d,
                target: self.focus_data_dict[ d.mindist[2] ],
                dist: d.mindist[0],
                vdw: true,
                hidden: true
            });
            _.each( d.nbs, function(nb,i){
                if(nb.dist < 5 ){
                    links.push({
                        source: d,
                        target: self.vdw_data_dict[ nb.resno ],
                        dist: nb.dist,
                        nb: true,
                        vdw: true,
                        hidden: true
                    });
                }
            });
        });
        console.log(nodes);
        console.log(links);
        
        var max_x = _.max(nodes, function(d){ return d.x; }).x;
        var min_x = _.min(nodes, function(d){ return d.x; }).x;
        var max_y = _.max(nodes, function(d){ return d.y; }).y;
        var min_y = _.min(nodes, function(d){ return d.y; }).y;
        var range_x = Math.abs(max_x - min_x);
        var range_y = Math.abs(max_y - min_y);
        var range_max = _.max([range_x, range_y]);
        var ratio_x = range_x/range_max;
        var ratio_y = range_y/range_max;
        console.log( max_x, min_x, range_x, max_y, min_y, range_y, range_max, ratio_x, ratio_y );

        var x = d3.scale.linear()
            .domain([ min_x, max_x ])
            .range([0, w*ratio_x-2*p]);

        var y = d3.scale.linear()
            .domain([ min_y ,max_y ])
            .range([0, h*ratio_y-2*p]);
        
        _.each(nodes, function(d,i){
            nodes[i].x = x(d.x);
            nodes[i].y = y(d.y);
        });

        this.elm('chart').empty();
        //if(!this.vis){
        
            this.vis = d3.select( this.eid('chart', 1) ).append("svg")
                .attr("width", w)
                .attr("height", h)
              .append("g")
                .attr("transform", "translate(" + p + "," + p + ")");
        //}
        var vis = this.vis;

        var force = d3.layout.force()
            .charge(-30)
            .gravity(0.00)
            .friction(0.3)
            .theta(1.0)
            //.distance(10)
            .linkDistance(function(d){
                return d.dist * 19.5;
            })
            .linkStrength(function(d){
                if(d.nb){
                    return 0.01;
                }else if(d.lone){
                    return 2.5;
                }else{
                    return d.hidden ? 3 : 5;
                }
            })
            .nodes(nodes)
            .links(links)
            .size([w, h]);

        var link = vis.selectAll("line.link")
            .data(links)
          .enter().append("line")
            .attr("class", "link")
            //.style("visibility", function(d){ return d.hidden ? 'hidden' : 'visible'; })
            .style("stroke-width", function(d){ return d.hidden ? 0.2 : 1.5; })
            .style("stroke", function(d){
                if( d.lone || d.vdw ){
                    return d.nb ? 'yellow' : 'orange';
                }else{
                    return d.hidden ? 'red' : 'black';
                }
            })
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        var node = vis.selectAll("circle.node")
            .data(nodes)
          .enter().append("circle")
            .attr("class", "node")
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; })
            .attr("r", 4)
            .style("fill", function(d){
                var c = d3.rgb(d.color[0], d.color[1], d.color[2]);
                return c.toString();
            })
            .style("stroke-width", 1.5)
            .call(force.drag);

        function get_center(){
            var fnodes = _.filter(nodes, function(d){ return !d.resno; });
            var c = _.reduce(fnodes, function(memo,d){
                return {
                    x: memo.x + d.x,
                    y: memo.y + d.y
                };
            }, {x:0, y:0});
            var n = fnodes.length;
            var x = c.x/n;
            var y = c.y/n;
            var axes = principal_axes( _.map(fnodes, function(d){ return [d.x, d.y]; }) );
            return [
                { x: x, y: y },
                { x: x + axes[0][0]/2, y: y + axes[0][1]/2 },
                { x: x + axes[1][0]/2, y: y + axes[1][1]/2 },
                { x: x - axes[0][0]/2, y: y - axes[0][1]/2 },
                { x: x - axes[1][0]/2, y: y - axes[1][1]/2 }
            ];
        }

        var center = vis.selectAll("circle.center")
            .data( get_center() )
          .enter().append("circle")
            .attr("class", "center")
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; })
            .attr("r", 6)
            .style("fill", 'blue')
            .style("visibility", 'hidden')
            .style("fill-opacity", 0.3);

        var paxes = get_center();

        var axes = vis.selectAll("line.axis")
            .data([ {i: 0}, {i: 1} ])
          .enter().append("line")
            .attr("class", "axis")
            //.style("visibility", function(d){ return d.hidden ? 'hidden' : 'visible'; })
            .style("stroke-width", 10)
            .style("stroke", "blue")
            .style("stroke-opacity", 0.1)
            .attr("x1", function(d) { return paxes[d.i+1].x; })
            .attr("y1", function(d) { return paxes[d.i+1].y; })
            .attr("x2", function(d) { return paxes[d.i+3].x; })
            .attr("y2", function(d) { return paxes[d.i+3].y; });

        vis.style("opacity", 1e-6)
          .transition()
            .duration(100)
            .style("opacity", 1);

        vis.selectAll("line.link")
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        vis.selectAll("circle.node")
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });

        force.on("tick", function(e) {
            link.attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });

            node.attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; });

            center.data( get_center() );
            center.attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; });

            paxes = get_center();
            axes.attr("x1", function(d) { return paxes[d.i+1].x; })
                .attr("y1", function(d) { return paxes[d.i+1].y; })
                .attr("x2", function(d) { return paxes[d.i+3].x; })
                .attr("y2", function(d) { return paxes[d.i+3].y; });
        });

        // d3.select("body").on("click", function() {
        //     force.resume();
        // });

        force.start();
    }
});



})();