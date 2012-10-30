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


    // // apply gravity forces
    // if (k = alpha * gravity) {
    //   x = size[0] / 2;
    //   y = size[1] / 2;
    //   i = -1; if (k) while (++i < n) {
    //     o = nodes[i];
    //     if(o.resno && force.axes){
    //       o.x -= (force.axes[0].x - o.x) * k * 5;
    //       o.y -= (force.axes[0].y - o.y) * k * 5;
    //     }else{
    //       o.x += (x - o.x) * k;
    //       o.y += (y - o.y) * k;
    //     }
    //   }
    // }


/**
 * A widget
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Bio.Flatland.FlatlandWidget = function(params){
    params = _.defaults(
        params,
        Provi.Bio.Flatland.FlatlandWidget.prototype.default_params
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
        'applet_selector_widget', 'chart', 'render', 'resume', 'selection', 'current_alpha',
        'alpha', 'gravity', 'friction', 'theta', 'hull_alpha',
        'show_helper_links', 'show_center', 'show_axes', 'show_hull', 'color_tension'
    ]);
    
    this.dataset = params.dataset;
    this.applet = params.applet;
    this.sele = params.sele;
    this.show_helper_links = params.show_helper_links;
    this.show_center = params.show_center;
    this.show_axes = params.show_axes;
    this.show_hull = params.show_hull;
    this.color_tension = params.color_tension;
    this.alpha = params.alpha;
    this.gravity = params.gravity;
    this.friction =params.friction;
    this.theta = params.theta;
    this.hull_alpha = params.hull_alpha;
    
    
    var template = '' +
        '<div class="control_row" id="${eids.applet_selector_widget}"></div>' +
        '<div class="control_row" id="${eids.chart}" style="width:550px; height:550px; border:solid grey 2px"></div>' +
        '<div class="control_row">' +
            '<span id="${eids.selection}"></span>' +
        '</div>' +
        '<div class="control_row">' +
            '<div>' +
                '<input id="${eids.alpha}" type="text" style="width: 3em;"/>&nbsp;' +
                '<label for="${eids.alpha}">alpha</label>' +
                '&nbsp;&nbsp;&nbsp;' +
                '<input id="${eids.gravity}" type="text" style="width: 3em;"/>&nbsp;' +
                '<label for="${eids.gravity}">gravity</label>' +
            '</div>' +
            '<div>' +
                '<input id="${eids.friction}" type="text" style="width: 3em;"/>&nbsp;' +
                '<label for="${eids.friction}">friction</label>' +
                '&nbsp;&nbsp;&nbsp;' +
                '<input id="${eids.theta}" type="text" style="width: 3em;"/>&nbsp;' +
                '<label for="${eids.theta}">theta</label>' +
            '</div>' +
            '<div>' +
                '<input id="${eids.hull_alpha}" type="text" style="width: 3em;"/>&nbsp;' +
                '<label for="${eids.hull_alpha}">hull alpha</label>' +
                '&nbsp;&nbsp;&nbsp;' +
            '</div>' +
        '</div>' +
        '<div class="control_row">' +
            '<div>' +
                '<input id="${eids.show_helper_links}" type="checkbox" style="margin-top: 0.5em;"/>' +
                '<label for="${eids.show_helper_links}">show helper links</label>' +
            '</div>' +
            '<div>' +
                '<input id="${eids.show_center}" type="checkbox" style="margin-top: 0.5em;"/>' +
                '<label for="${eids.show_center}">show center</label>' +
            '</div>' +
            '<div>' +
                '<input id="${eids.show_axes}" type="checkbox" style="margin-top: 0.5em;"/>' +
                '<label for="${eids.show_axes}"">show axes</label>' +
            '</div>' +     
            '<div>' +
                '<input id="${eids.show_hull}" type="checkbox" style="margin-top: 0.5em;"/>' +
                '<label for="${eids.show_hull}"">show hull</label>' +
            '</div>' +        
            '<div>' +
                '<input id="${eids.color_tension}" type="checkbox" style="margin-top: 0.5em;"/>' +
                '<label for="${eids.color_tension}"">color links by tension</label>' +
            '</div>' +        
        '</div>' +
        '<div class="control_row">' +
            'alpha: <span id="${eids.current_alpha}"></span>' +
        '</div>' +
        '<div class="control_row">' +
            '<button id="${eids.render}">render</button>' +
            '&nbsp;&nbsp;&nbsp;' +
            '<button id="${eids.resume}">resume</button>' +
        '</div>' +
	'';
    this.add_content( template, params );

    if( !this.applet ){
        this.applet_selector = new Provi.Jmol.JmolAppletSelectorWidget({
            parent_id: this.eid('applet_selector_widget')
        });
    }

    this.selection = new Provi.Selection.SelectorWidget({
        parent_id: this.eid('selection'),
        applet: this.applet
    });

    this._init();
};
Provi.Bio.Flatland.FlatlandWidget.prototype = Utils.extend(Provi.Widget.Widget, /** @lends Provi.Bio.Structure.StructureWidget.prototype */ {
    default_params: {
        heading: 'Flatland',
        sele: 'RET',
        show_helper_links: true,
        show_center: true,
        show_axes: true,
        show_hull: true,
        color_tension: true,
        alpha: 0.06,
        gravity: 0.0,
        friction: 0.3,
        theta: 1.0,
        hull_alpha: 120
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
        
        if(!this.applet && this.applet_selector){
            $( this.applet_selector ).bind('change_selected', function(event, applet){
                _.each( Provi.Jmol.get_applet_list(), function(applet, i){
                    $(applet).unbind('.'+self.id);
                });
                self.selection.set_applet( applet );
                // $(applet).bind('load_struct.'+self.id, function(){
                //     self.example();
                // });
            });
        }
        this.selection.set_applet( this.get_applet() );
        this.selection.set_input( this.sele );

        // $( this.get_applet() ).bind('load_struct.'+self.id, function(){
        //     self.example();
        // });

        this.elm('selection').find('input[type=text]').bind('keypress', function(event) {
            if (event.which == 13 && this.value) {
                self.render();
            }
        });

        _.each(['alpha', 'gravity', 'friction', 'theta', 'hull_alpha'], function(name){
            self.elm( name ).val( self[ name ]);
            self.elm( name ).bind('keypress', function(event) {
                if (event.which == 13 && this.value) {
                    self[ name ] = self.elm( name ).val();
                    self.render();
                }
            });
        });

        this.elm('render').button().click( function(){
            self.render();
        });

        this.elm('resume').button().click( function(){
            self.resume();
        });

        _.each(['show_helper_links', 'show_center', 'show_axes', 'show_hull', 'color_tension'], function(name){
            self.elm( name ).attr('checked', self[ name ]);
            self.elm( name ).bind('click', function(e){
                self[ name ] = self.elm( name ).is(':checked');
                self.render(true);
            });
        });

        Provi.Widget.Widget.prototype.init.call(this);
    },
    example: function(){
        //this.selection.set_input('347-350');
        this.selection.set_input('296');
        this.render();
    },
    get_jmol_data: function(){
        var applet = this.get_applet();
        if( !applet ) return;
        var self = this;
        console.log('FOOFLATLAND');

        //var sele = '1332';
        // var sele = '340-347';
        var sele = this.selection.get().selection;
        console.log('FOOFLATLAND SELE', sele);
        var format = "'%[atomno]',%[resno],'%[chain]','%[model]','%[file]','%x','%y','%z'";
        var apm = applet.atoms_property_map( format, sele );

        var coords = _.map(apm, function(d,i){
            return _.map([d[5], d[6], d[7]], function(x){ return parseFloat(x); });
        });
        console.log(coords);
        
        var axes = principal_axes(coords);
        // var axes = [[2, 1, 1], [1, 2, 1], [1, 1, 2]];

        applet.script_wait( '' +
            'draw id "fc" {' + sele + '} radius 0.3 color tomato;' +
            'draw id "svd1" vector {' + sele + '} {' + axes[0].join(' ') + '} color pink;' +
            'draw id "svd2" vector {' + sele + '} {' + axes[1].join(' ') + '} color pink;' +
            'draw id "svd3" vector {' + sele + '} {' + axes[2].join(' ') + '} color pink;' +
        '');

        //return;

        //Provi.Utils.pause(3000);

        $.ajax({
            url: '../data/jmol_script/helix_plane.jspt',
            cache: false,
            dataType: 'text',
            success: function(script){
                var applet = self.get_applet();
                if( !applet ) return;
                
                //console.log(script);
                console.log('../data/jmol_script/helix_plane.jspt');
                script = script.replace('###plane###',
                    'p = plane({' + sele + '}.XYZ, @{{' + sele + '}.XYZ + point(' + axes[0].join(', ') + ')}, @{{' + sele + '}.XYZ + point(' + axes[1].join(', ') + ')});');
                script = script.replace('###sele###', sele);

                //script = "selectionHalos off; function foo(){ select *; color green; }; foo(); print 111;";

                // var foo = applet.script_wait( script );
                // foo = applet.script_wait( script );
                // foo = applet.script_wait( script );
                // foo = applet.script_wait( script );

                //return;
                // console.log( foo );
                // var foo2 = foo.replace("''''", '"').replace("'''", '"').replace("''", '"').replace('|', '\n');
                // console.log( foo2 );
                // console.log( $.parseJSON( foo2 ) );

                var data = applet.script_wait_output( script );
                console.log(data);
                data = data.split('\n').slice(0,-1).join('\n');
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
                    var bonds4 = _.map(d[7], function(b,j){
                        return { atomno: b[0], dist: b[1] };
                    });
                    var bonds5 = _.map(d[8], function(b,j){
                        return { atomno: b[0], dist: b[1] };
                    });
                    
                    return {
                        atomno: d[0],
                        bonds: bonds,
                        bonds2: bonds2,
                        bonds3: bonds3,
                        bonds4: bonds4,
                        bonds5: bonds5,
                        ring: d[9]==1 ? true : false,
                        backbone: d[10]==1 ? true : false,
                        original_coords: d[2],
                        projected_coords: d[3],
                        color: _.map( d[4], function(c){ return parseInt(c, 10); }),
                        x: d[3][1],
                        y: d[3][2]
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

                self._render();
            }
        });
    },
    resume: function(){
        if( this.force ){
            this.force.start();
            //this.force.alpha(0.1);
        }
    },
    render: function(preserve){
        if(preserve){
            //this._render();
            this.update();
        }else{
            this.get_jmol_data();
        }
    },
    _render: function(){
        var applet = this.get_applet();
        if( !applet ) return;
        var self = this;

        var w = 550;
        var h = 550;
        var p = 0;
        var fill = d3.scale.category10();
        var alpha = this.hull_alpha;
        self.alpha_asq = alpha*alpha;
        //var nodes = d3.range(70).map(Object);
        //var nodes = this.focus_data.concat( this.vdw_data );
        var nodes = this.focus_data;
        var links = [];
        _.each( this.focus_data, function(d,i){
            _.each( d.bonds, function(b,j){
                links.push({
                    source: d,
                    target: self.focus_data_dict[ b.atomno ],
                    dist: b.dist,
                    lone: d.bonds.length===1
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
                    neighbour: true,
                    lone: d.bonds.length===1
                });
            });
            _.each( d.bonds3, function(b,j){
                links.push({
                    source: d,
                    target: self.focus_data_dict[ b.atomno ],
                    dist: b.dist,
                    hidden: true,
                    neighbour: true,
                    lone: d.bonds.length===1
                });
            });
            // _.each( d.bonds4, function(b,j){
            //     links.push({
            //         source: d,
            //         target: self.focus_data_dict[ b.atomno ],
            //         dist: b.dist,
            //         hidden: true,
            //         neighbour: true,
            //         lone: d.bonds.length===1
            //     });
            // });
            // _.each( d.bonds5, function(b,j){
            //     links.push({
            //         source: d,
            //         target: self.focus_data_dict[ b.atomno ],
            //         dist: b.dist,
            //         hidden: true,
            //         neighbour: true,
            //         lone: true
            //     });
            // });
        });
        _.each( this.vdw_data, function(d,i){
            // links.push({
            //     source: d,
            //     target: self.focus_data_dict[ d.mindist[2] ],
            //     dist: d.mindist[0],
            //     vdw: true,
            //     hidden: true
            // });
            // _.each( d.nbs, function(nb,i){
            //     if(nb.dist < 5 ){
            //         links.push({
            //             source: d,
            //             target: self.vdw_data_dict[ nb.resno ],
            //             dist: nb.dist,
            //             nb: true,
            //             vdw: true,
            //             hidden: true
            //         });
            //     }
            // });
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

        var groups = [nodes];//d3.nest().key(function(d) { return d & 3; }).entries(nodes);

        this.elm('chart').empty();
        //if(!this.vis){
        
            var svg = d3.select( this.eid('chart', 1) ).append("svg")
                .attr("width", w)
                .attr("height", h);
        //}

        var zoom = d3.behavior.zoom();
        zoom.x(x);
        zoom.y(y);

        vis2 = svg.append("g");

        svg.append("svg:rect")
            .attr("style", "fill:rgba(255,255,255,0)")
            .attr("width", '100%')
            .attr("height", '100%')
            .call(zoom.on("zoom", function(){
                vis.attr("transform", "translate(" + d3.event.translate[0] + "," + d3.event.translate[1] + ")scale(" + d3.event.scale + ")");
                vis2.attr("transform", "translate(" + d3.event.translate[0] + "," + d3.event.translate[1] + ")scale(" + d3.event.scale + ")");
            }));

        vis = svg.append("g");
        
        //vis.attr("transform","scale()");

        this.vis = vis;
        this.nodes = nodes;

        var force = d3.layout.force()
            .charge(function(d){
                return d.resno ? -600 : -120;
            })
            // .gravity(function(d){
            //     console.log('GRAVITY');
            //     return d.resno ? -10 : 0.02;
            // })
            // TODO: use code from d3.layout that implements the gravity
            // force and use it to get a repulsive force from the center
            // applied onto the vdw nodes
            .gravity( this.gravity )
            .friction( this.friction )
            .theta( this.theta )
            //.distance(10)
            .linkDistance(function(d){
                return (d.hidden ? d.dist : 1.6) * 25.5;
            })
            .linkStrength(function(d){
                if(d.source.ring && d.target.ring){
                    return 10;
                }else if(d.nb){
                    return 0.01;
                }else if(d.lone && d.neighbour){
                    return 1.5;
                }else{
                    return d.hidden ? 2 : 20;
                }
            })
            .nodes(nodes)
            .links(links)
            .size([w, h]);

        var paxes = this.get_center();

        var center = vis.selectAll("circle.center")
            .data( paxes )
          .enter().append("circle")
            .attr("class", "center")
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; })
            .attr("r", 6)
            .style("fill", 'blue')
            .style("visibility", function(d){
                return (d.hidden && !self.show_center) ? 'hidden' : 'visible';
            })
            .style("fill-opacity", 0.3);

        var axes = vis.selectAll("line.axis")
            .data([ {i: 0}, {i: 1} ])
          .enter().append("line")
            .attr("class", "axis")
            .style("visibility", function(d){
                return (d.hidden && !self.show_axes) ? 'hidden' : 'visible';
            })
            .style("stroke-width", 10)
            .style("stroke", "blue")
            .style("stroke-opacity", 0.1)
            .attr("x1", function(d) { return paxes[d.i+1].x; })
            .attr("y1", function(d) { return paxes[d.i+1].y; })
            .attr("x2", function(d) { return paxes[d.i+3].x; })
            .attr("y2", function(d) { return paxes[d.i+3].y; });

        var link = vis.selectAll("line.link")
            .data(links)
          .enter().append("line")
            .attr("class", "link")
            .style("visibility", function(d){
                return (d.hidden && !self.show_helper_links) ? 'hidden' : 'visible';
            })
            .style("stroke-width", function(d){
                if( d.source.backbone && d.target.backbone && !d.hidden ){
                    return 3.5;
                }else{
                    return d.hidden ? 0.2 : 1.5;
                }
            })
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

        this.link = link;
        this.node = node;
        this.groups = groups;
        this.center = center;
        this.axes = axes;

        force.on("tick", function(e) {
            force.axes = self.get_center();
            if( force.alpha() < self.alpha ){
                force.alpha(0);
            }
            self.elm('current_alpha').text( force.alpha() );
            self.update();
        });

        force.on("end", function(e) {
            force.axes = self.get_center();
            self.update();
        });

        // d3.select("body").on("click", function() {
        //     force.resume();
        // });

        force.start();
        this.force = force;
    },
    group_path: function(d) {
        //console.log(d);
        if(!d) return;
        var gp = "M" + 
          d3.geom.hull(d.map(function(i) { return [i.x, i.y]; }))
            .join("L")
        + "Z";
        //console.log(gp);
        return gp;
    },
    _group_fill: d3.scale.category10(),
    alpha_dsq: function(a,b) {
        var dx = a[0]-b[0], dy = a[1]-b[1];
        return dx*dx+dy*dy;
    },
    get_center: function(){
        var fnodes = _.filter(this.nodes, function(d){ return !d.resno; });
        var c = _.reduce(fnodes, function(memo,d){
            return {
                x: memo.x + d.x,
                y: memo.y + d.y
            };
        }, {x:0, y:0});
        var n = fnodes.length;
        var x = c.x/n;
        var y = c.y/n;
        if(this.show_axes){
            var axes = principal_axes( _.map(fnodes, function(d){ return [d.x, d.y]; }) );
            return [
                { x: x, y: y },
                { x: x + axes[0][0]/2, y: y + axes[0][1]/2 },
                { x: x + axes[1][0]/2, y: y + axes[1][1]/2 },
                { x: x - axes[0][0]/2, y: y - axes[0][1]/2 },
                { x: x - axes[1][0]/2, y: y - axes[1][1]/2 }
            ];
        }else{
            return [
                { x: x, y: y },
                { x: x, y: y },
                { x: x, y: y },
                { x: x, y: y },
                { x: x, y: y }
            ];
        }
    },
    update: function(){
        var self = this;

        this.link.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; })
            .style("stroke", function(d){
                var color = d3.scale.linear()
                    .domain([-d.dist, 0, d.dist])
                    .range(["red", "green", "blue"]);
                var dist = Math.sqrt( Math.pow(d.source.x - d.target.x, 2) + Math.pow(d.source.y - d.target.y, 2) ) / 25.5;
                //console.log( color( d.dist-dist ), dist, d.dist, d.source.x, d.target.x, d.source.y, d.target.y, d.source.px, d.target.px, d.source.py, d.target.py );
                if(!self.color_tension){
                    if( d.lone || d.vdw ){
                        return d.nb ? 'yellow' : 'orange';
                    }else{
                        return d.hidden ? 'red' : 'black';
                    }
                }else{
                    return color( d.dist-dist );
                }
            })
            .style("visibility", function(d){
                return (d.hidden && !self.show_helper_links) ? 'hidden' : 'visible';
            });

        this.node.attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });

        paxes = this.get_center();
        
        if( this.show_center ){
            this.center.data( paxes );
            this.center.attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; });
        }

        if( this.show_axes ){
            this.axes.attr("x1", function(d) { return paxes[d.i+1].x; })
                .attr("y1", function(d) { return paxes[d.i+1].y; })
                .attr("x2", function(d) { return paxes[d.i+3].x; })
                .attr("y2", function(d) { return paxes[d.i+3].y; });
        }

        var group_fill = function(d, i) { 
            return self._group_fill(i & 3); 
        }

        vis2.selectAll("path.hull")
            .data(this.groups)
                .attr("d", this.group_path)
                .style("visibility", function(d){
                    return (!self.show_hull) ? 'hidden' : 'visible';
                })
            .enter().insert("path", "circle")
                .attr("class", "hull")
                .style("fill", 'green')//group_fill)
                .style("stroke", 'green')//group_fill)
                .style("stroke-width", 40)
                .style("stroke-linejoin", "round")
                .style("opacity", .2)
                .attr("d", this.group_path);

        var mesh = d3.geom.delaunay(_.map(this.nodes, function(i) { return [i.x, i.y]; })).filter(function(t) {
            var ret = self.alpha_dsq(t[0],t[1]) < self.alpha_asq && self.alpha_dsq(t[0],t[2]) < self.alpha_asq && self.alpha_dsq(t[1],t[2]) < self.alpha_asq;
            //console.log(ret, self.alpha_asq, self.alpha_dsq(t[0],t[1]));
            return ret;
        });
        //console.log(mesh);

        vis2.selectAll("path.shape")
            .data(mesh)
                .attr("d", function(d) { return "M" + d.join("L") + "Z"; })
                .style("visibility", function(d){
                    return (!self.show_hull) ? 'hidden' : 'visible';
                })
            .enter().insert("path", "circle")
                .attr("class", "shape")
                .style("fill", 'lightgrey')
                .style("stroke", 'lightgrey')
                .style("stroke-width", 20)
                .style("stroke-linejoin", "round")
                //.style("opacity", .2)
                .attr("d", function(d) { return "M" + d.join("L") + "Z"; });
            
        vis2.selectAll("path.shape")
            .data(mesh)
                .attr("d", function(d) { return "M" + d.join("L") + "Z"; })
            .exit().remove();

    }
});



})();