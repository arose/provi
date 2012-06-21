/**
 * @fileOverview This file contains the {@link Provi.Jmol.Analysis} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * @namespace
 * Jmol analysis module
 */
Provi.Jmol.Analysis = {};


(function() {

/** @exports Utils as Provi.Utils */
var Utils = Provi.Utils;

/** @exports Widget as Provi.Widget.Widget */
var Widget = Provi.Widget.Widget;



/**
 * A widget to create ramachandran plots from molecular data
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Jmol.Analysis.RamachandranPlotWidget = function(params){
    Widget.call( this, params );
    this.canvas_id = this.id + '_canvas';
    this.favored_angles_id = this.id + '_favored_angles';
    this.do_ramachandran_plot_id = this.id + '_do_plot';
    this.applet_selector_widget_id = this.id + '_applet';
    this.selection = [];
    this.vis = false;

    var content = '<div class="control_group">' +
    '<div class="control_row" id="' + this.applet_selector_widget_id + '"></div>' +
        '<div class="control_row">' +
            '<label for="' + this.style_id + '">favored angles</label>' +
            '<select id="' + this.favored_angles_id + '" class="ui-state-default">' +
                '<option value="General" selected="selected">General</option>' +
                '<option value="Glycine">Glycine</option>' +
                '<option value="Pre-Pro">Pre-Pro</option>' +
                '<option value="Proline">Proline</option>' +
            '</select>' +
            '<button id="' + this.do_ramachandran_plot_id + '">ramachandran plot</button>' +
        '</div>' +
    '<div class="control_row">' +
            '<div id="' + this.canvas_id + '" style="width:300px;height:300px"></div>' +
        '</div>' +
    '</div>';
    $(this.dom).append( content );
    this.applet_selector = new Provi.Jmol.JmolAppletSelectorWidget({
        parent_id: this.applet_selector_widget_id
    });
    this._init();
}
Provi.Jmol.Analysis.RamachandranPlotWidget.prototype = Utils.extend(Widget, /** @lends Provi.Jmol.Analysis.RamachandranPlotWidget.prototype */ {
    _init: function(){
    this.ramachandran_plot();
        var self = this;
        
    $("#" + this.do_ramachandran_plot_id).button().click(function() {
            self.ramachandran_plot();
        });
    
    // init favored angle contour overlay
        $("#" + this.favored_angles_id).change( function() {
            self.ramachandran_plot();
        });
    
    this.applet_selector.change( function() {
            self.ramachandran_plot();
        });
    
    $.each( Provi.Jmol.get_applet_list(), function(i, applet){
        $(applet.selection_manager).bind('select', function( e, selection, applet ){
        self.selection = selection;
        if(self.vis){
            self.vis.render();
        }else{
            self.ramachandran_plot();
        }
        });
        $(applet).bind('load_struct', function(){
        if(applet == self.applet_selector.get_value(true)) self.ramachandran_plot();
        });
    });
    $(Provi.Jmol).bind('applet_added', function(event, applet){
        $(applet.selection_manager).bind('select', function( e, selection, applet ){
        self.selection = selection;
        if(self.vis){
            self.vis.render();
        }else{
            self.ramachandran_plot();
        }
        });
        $(applet).bind('load_struct', function(){
        if(applet == self.applet_selector.get_value(true)) self.ramachandran_plot();
        });
    });
    },
    /**
     * draw a ramachandran plot
     */
    ramachandran_plot: function(){
        var self = this;
        var applet = this.applet_selector.get_value(true);
        var ramachandran_data = [];
    
        if(applet && applet.loaded){
            var selection = 'protein and {*.ca}';
            var format = '%[phi],%[psi],\'%[group]\', \'%[resNo]\', \'%[chain]\'';
            ramachandran_data = applet.evaluate('"[" + {' + selection + '}.label("[' + format + ']").join(",") + "]"');
            ramachandran_data = ramachandran_data.replace(/%\[psi\]/g,"");
            ramachandran_data = ramachandran_data.replace(/%\[phi\]/g,"");
            ramachandran_data = eval(ramachandran_data.replace(/\,\]/g,",null]"));
            //console.log( ramachandran_data );
        }
        
        /* Sizing and scales. */
        var w = 270,
            h = 270,
            kx = 180,
            ky = 180,
            x = pv.Scale.linear(-180, 180).range(0, w),
            y = pv.Scale.linear(-180, 180).range(0, h);
        
        //var img = vis.add(pv.Panel)
        var vis = new pv.Panel()
            .canvas(this.canvas_id)
            .width(w)
            .height(h)
            .top(5).left(30).right(5).bottom(15);
            
        var img = vis.add(pv.Panel).overflow("hidden").add(pv.Image)
            .left(x)
            .bottom(y)
            .url("../img/ramachandran_plot_empty_" + $("#" + this.favored_angles_id + " option:selected").val() + ".png");
        
        /* X-axis and ticks. */
        vis.add(pv.Rule)
            .data(x.ticks())
            .left(x)
            .strokeStyle(function(d){ return d ? "#eee" : "#000"; })
          .anchor("bottom").add(pv.Label)
            .text(x.tickFormat);
        
        /* Y-axis and ticks. */
        vis.add(pv.Rule)
            .data(y.ticks())
            .top(y)
            .strokeStyle(function(d){ return d ? "#eee" : "#000"; })
          .anchor("left").add(pv.Label)
            .text(y.tickFormat);
        
        /** Update the x- and y-scale domains per the new transform.
         * @private
        */
        function transform() {
            var t = this.transform();
            var ti = t.invert();
            x.domain(ti.x / w * 2 * kx - kx, (ti.k + ti.x / w) * 2 * kx - kx);
            y.domain(ti.y / h * 2 * ky - ky, (ti.k + ti.y / h) * 2 * ky - ky);
            var ih = h * t.k;
            var iw = w * t.k;
            img.height(ih).width(iw).top(t.y).left(t.x);
            vis.render();
        }
        
        /* Use an invisible panel to capture pan & zoom events. */
        vis.add(pv.Panel)
            .events("all")
            .event("mousedown", pv.Behavior.pan())
            .event("mousewheel", pv.Behavior.zoom())
            .event("pan", transform)
            .event("zoom", transform);
        
        /* The dot plot! */
        vis.add(pv.Panel)
            .overflow("hidden")
          .add(pv.Dot)
            .data(ramachandran_data)
            .left(function(d){ return x(d[0]); })
            .top(function(d){ return y(-d[1]); })
            .size( function(d){ return self.in_selection(d) ? 7 : 3; })
            .lineWidth( function(d){ return self.in_selection(d) ? 2 : 0; })
            .strokeStyle( 'gold' )
            .text(function(d){ return d[2]; })
            .event("mouseover", pv.Behavior.tipsy({gravity: "s", fade: true}))
            .event("mouseup", function(d) {
                var sele = new Provi.Selection.Selection({ selection: 'resNo=' + d[3] + ' ' + (d[4] ? 'and chain=' + d[4] : ''), applet: applet });
                if( self.in_selection(d) ){
                    if (!pv.event.altKey) sele.deselect();
                }else{
                    pv.event.metaKey ? sele.add() : sele.select();
                }
                if( pv.event.altKey ) applet.script_wait( 'zoomto 0.5 (' + sele.selection + ');' );
            })
            .fillStyle('black');
        

        
        vis.render();
        self.vis = vis;
    },
    in_selection: function(d){
        return Utils.in_array(this.selection, d, function(a,b){
            return a.resno==b[3] && (a.chain==b[4] || !b[4]);
        });
    },
    select: function( foo, selection, applet ){
        console.log(foo);
        console.log( applet == this.applet_selector.get_value(true) );
    }
});



/**
 * A widget to access Jmol's calculate hbonds functionality
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Jmol.Analysis.HbondsWidget = function(params){
    params = _.defaults(
        params,
        Provi.Jmol.Analysis.HbondsWidget.prototype.default_params
    );
    params.persist_on_applet_delete = true;
    Provi.Widget.Widget.call( this, params );
    this._init_eid_manager([
        'angle_min', 'dist_max', 'calc', 'applet_selector_widget', 
        'display', 'display_residues' 
    ]);
    
    this.angle_min = params.angle_min;
    this.dist_max = params.dist_max;
    this.visibility = params.visibility;
    
    var template = '' +
        '<div class="control_row" id="${eids.applet_selector_widget}"></div>' +
        '<div class="control_row">' +
            '<input id="${eids.display}" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
            '<label for="${eids.display}" style="display:inline-block;">display hbonds</label>' +
        '</div>' +
        '<div class="control_row">' +
            '<input size="4" id="${eids.angle_min}" type="text" class="ui-state-default"/>' +
            '<label for="${eids.angle_min}" >min angle</label> ' +
            '<input size="4" id="${eids.dist_max}" type="text" class="ui-state-default"/>' +
            '<label for="${eids.dist_max}" >max distance</label> ' +
            '<button id="${eids.calc}">calc hbonds</button>' +
        '</div>' +
        '<div class="control_row">' +
            '<button id="${eids.display_residues}">display residues</button>' +
        '</div>' +
    '';
    this.add_content( template, params );
    this.applet_selector = new Provi.Jmol.JmolAppletSelectorWidget({
        parent_id: this.eid('applet_selector_widget')
    });
    this._init();
}
Provi.Jmol.Analysis.HbondsWidget.prototype = Utils.extend(Provi.Widget.Widget, /** @lends Provi.Jmol.Analysis.HbondsWidget.prototype */ {
    default_params: {
        heading: 'Hbond calculation',
        collapsed: true,
        angle_min: 60,
        dist_max: 3.9,
        visibility: true
    },
    _init: function(){
        var self = this;
    
        this.elm('display').click(function(){
            self.visibility = self.elm('display').is(':checked');
            self.display();
        }).attr( 'checked', this.visibility );
    
        this.elm('calc').button().click(function() {
            self.calc();
        });
    
        this.elm('angle_min').change(function() {
            self.angle_min = $(this).val();
            self.calc();
        }).val( this.angle_min );
    
        this.elm('dist_max').change(function() {
            self.dist_max = $(this).val();
            self.calc();
        }).val( this.dist_max );
    
        this.elm('display_residues').button().click(function() {
            self.display_residues();
        });
    
        Provi.Widget.Widget.prototype.init.call(this);
    },
    calc: function(){
        var applet = this.applet_selector.get_value();
        if(applet){
            applet.script(
                //"select not backbone and not hydrogen;" +
                "select not hydrogen;" +
                "hbonds delete;" +
                "set hbondsRasmol FALSE;" +
                "set hbondsAngleMinimum " + this.angle_min + ";" +
                "set hbondsDistanceMaximum " + this.dist_max + ";" +
                "calculate hbonds;"
            , true );
        }
    },
    display: function(){
        applet = this.applet_selector.get_value();
        if(applet){
            applet.script( 
                'select all; hbonds ' + ( this.visibility ? 'on' : 'off' ) + ';'
            , true );
        }
    },
    display_residues: function(){
        applet = this.applet_selector.get_value();
        if(applet){
            applet.script(
                'var x = connected("hbond").atoms; ' +
                'select @x or within(group, @x);' +
                'wireframe 0.1;'
            , true );
        }
    }
});


/**
 * A widget to access Jmol's isosurface creation functionality
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Jmol.Analysis.IsosurfaceConstructionWidget = function(params){
    params = _.defaults(
        params,
        Provi.Jmol.Analysis.IsosurfaceConstructionWidget.prototype.default_params
    );
    //params.persist_on_applet_delete = false;
    //params.heading = '';
    //params.collapsed = false;
    Provi.Widget.Widget.call( this, params );
    this._build_element_ids([
    'applet_selector_widget', 'surface_params_widget', 'isosurface_params_widget', 'construct' ]);
    
    var content = '<div class="control_group">' +
        '<div class="control_row" id="' + this.applet_selector_widget_id + '"></div>' +
        '<div class="control_row" id="' + this.surface_params_widget_id + '"></div>' +
        '<div class="control_row" id="' + this.isosurface_params_widget_id + '"></div>' +
        '<div class="control_row">' +
            '<button id="' + this.construct_id + '">construct</button>' +
        '</div>' + 
    '</div>';
    $(this.dom).append( content );
    this.applet_selector = new Provi.Jmol.JmolAppletSelectorWidget({
        parent_id: this.applet_selector_widget_id
    });
    this.surface_params = new Provi.Bio.Isosurface.SurfaceParamsWidget({
        parent_id: this.surface_params_widget_id
    });
    this.isosurface_params = new Provi.Bio.Isosurface.LoadParamsWidget({
        parent_id: this.isosurface_params_widget_id
    });
    this._init();
}
Provi.Jmol.Analysis.IsosurfaceConstructionWidget.prototype = Utils.extend(Provi.Widget.Widget, /** @lends Provi.Jmol.Analysis.IsosurfaceConstructionWidget.prototype */ {
    default_params: {
        heading: 'Isosurface Construction',
        collapsed: true
    },
    _init: function(){
        var self = this;
    
        this.surface_params.set_applet( this.applet_selector.get_value(true) );
        $(this.applet_selector).bind('change change_selected', function(event, applet){
            //console.log('CHANGE');
            self.surface_params.set_applet( applet );
        });
    
        $( '#' + this.construct_id ).button().click( function(){
            var applet = self.applet_selector.get_value();
            if( applet ){
                console.log('IsosurfaceConstructionWidget');
                new Provi.Bio.Isosurface.SurfaceWidget({
                    parent_id: Provi.defaults.dom_parent_ids.DATASET_WIDGET,
                    dataset: self,
                    applet: applet,
                    within: self.isosurface_params.get_within(),
                    type: self.surface_params.get_type(),
                    resolution: self.surface_params.get_resolution(),
                    select: self.surface_params.get_select(),
                    ignore: self.surface_params.get_ignore(),
                    slab: self.surface_params.get_slab(),
                    map: self.surface_params.get_map()
                });
            }
        });
        
        Provi.Widget.Widget.prototype.init.call(this);
    }
});


var geometric_center = function(coords){
    return _.map(_.range(3), function(i){
        return _.reduce(coords, function(sum, x){ 
            return sum + x[i]; 
        }, 0) / coords.length;
    });
}

var principal_axes = function(m, center){
    m = numeric.clone(m);
    // var means = _.map(_.range(m[0].length), function(i){
    //     return _.reduce(m, function(memo,x){
    //         return x[i]+memo;
    //     }, 0) / m.length;
    // });
    var means = center || geometric_center(m);
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
Provi.Jmol.Analysis.PlaneConstructionWidget = function(params){
    params = _.defaults(
        params,
        Provi.Jmol.Analysis.PlaneConstructionWidget.prototype.default_params
    );
    params.persist_on_applet_delete = true;
    
    Provi.Widget.Widget.call( this, params );
    this._init_eid_manager([
        'applet_selector_widget', 'selection_selector_widget', 'create'
    ]);
    
    var template = '' +
        '<div class="control_row" id="${eids.applet_selector_widget}"></div>' +
        '<div class="control_row" id="${eids.selection_selector_widget}"></div>' +
        '<div class="control_row">' +
            '<button id="${eids.create}">create</button>' +
        '</div>' +
    '';
    this.add_content( template, params );

    this.applet_selector = new Provi.Jmol.JmolAppletSelectorWidget({
        parent_id: this.eid('applet_selector_widget')
    });
    this.selection_selector = new Provi.Selection.SelectorWidget({
        parent_id: this.eid('selection_selector_widget'),
        applet: params.applet,
        tag_name: 'span'
    });

    this._init();
}
Provi.Jmol.Analysis.PlaneConstructionWidget.prototype = Utils.extend(Provi.Widget.Widget, /** @lends Provi.Jmol.Analysis.PlaneConstructionWidget.prototype */ {
    default_params: {
        heading: 'Plane Construction',
        collapsed: true
    },
    _init: function(){
        var self = this;
    
        $(this.applet_selector).bind('change change_selected', function(event, applet){
            self.selection_selector.set_applet( applet );
        });
        this.selection_selector.set_applet( this.get_applet() );

        this.elm('create').button().click( function(){
            self.create();
        });

        Provi.Widget.Widget.prototype.init.call(this);
    },
    get_applet: function(){
        if( this.applet ){
            return this.applet;
        }else{
            return this.applet_selector.get_value(true);
        }
    },
    create: function(){
        var applet = this.get_applet();
        var self = this;
        if (!applet ) return;

        var sele = this.selection_selector.get().selection;
        console.log('PLANE CONSTRUCTION SELE', sele);
        var format = "'%[atomno]',%[resno],'%[chain]','%[model]','%[file]','%x','%y','%z'";
        var apm = applet.atoms_property_map( format, sele );

        var coords = _.map(apm, function(d,i){
            return _.map([d[5], d[6], d[7]], function(x){ return parseFloat(x); });
        });
        console.log(coords);
        
        var axes = principal_axes(coords);
        // var axes = [[2, 1, 1], [1, 2, 1], [1, 1, 2]];

        var s = '' +
            'function norm( v ){ return v/v; }' +
            'var sele = {' + sele + '};' +
            'draw id "fc" @sele radius 0.3 color tomato;' +
            'draw id "svd1" vector @sele {' + axes[0].join(' ') + '} color pink;' + 
            'draw id "svd2" vector @sele {' + axes[1].join(' ') + '} color pink;' +
            'draw id "svd3" vector @sele {' + axes[2].join(' ') + '} color pink;' +

            'var p = sele.XYZ;' + 
            'var vp = {' + axes[2].join(', ') + '};' +
            'var vpx1 = norm( cross( vp, {1,0,0} ) );' +
            'var vpx2 = norm( cross( vp, vpx1 ) );' +
            'var pl = plane( p, p+vpx1, p+vpx2 );' +
            'print pl;' +
    
            'select *;' +
            'isosurface id "p" plane @pl color blue translucent;' +
            'draw id "p" intersection boundbox;' +
            'select none;' +
        '';

        console.log( s );
        applet.script( s, true );
    }
});



/**
 * A widget
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Jmol.Analysis.PlotWidget = function(params){
    params = _.defaults(
        params,
        Provi.Jmol.Analysis.PlotWidget.prototype.default_params
    );
    params.collapsed = true;
    Provi.Widget.Widget.call( this, params );
    this._init_eid_manager([
    'canvas', 'draw', 'selector', 'selector2', 'xaxis', 'yaxis', 'bgimage', 'presets', 'chart', 'color'
    ]);
    
    var template = '' +
        '<div class="control_group">' +
            '<div class="control_row">' +
                '<label for="${eids.presets}">Presets:</label>' +
                '<select id="${eids.presets}" class="ui-state-default">' +
                    '<option value=""></option>' +
                    '<option value="rama"">Ramachandran</option>' +
                    '<option value="dist"">Distance map</option>' +
                '</select>' +
            '</div>' +
            '<div class="control_row">' +
                '<span id="${eids.selector}"></span>' +
            '</div>' +
            '<div class="control_row">' +
                '<span id="${eids.selector2}"></span>' +
            '</div>' +
            '<div class="control_row">' +
                '<label for="${eids.xaxis}">X-axis:</label>' +
                '<select id="${eids.xaxis}" class="ui-state-default">' +
                    '<option value=""></option>' +
                '</select>' +
            '</div>' +
            '<div class="control_row">' +
                '<label for="${eids.yaxis}">Y-axis:</label>' +
                '<select id="${eids.yaxis}" class="ui-state-default">' +
                    '<option value=""></option>' +
                '</select>' +
            '</div>' +
            '<div class="control_row">' +
                '<label for="${eids.color}">Color:</label>' +
                '<select id="${eids.color}" class="ui-state-default">' +
                    '<option value="color">Structure color</option>' +
                    '<option value="dist">Distance</option>' +
                '</select>' +
            '</div>' +
            '<div class="control_row">' +
                '<label for="${eids.chart}">Chart type image:</label>' +
                '<select id="${eids.chart}" class="ui-state-default">' +
                    '<option value="points">Points</option>' +
                    '<option value="lines"">Lines</option>' +
                    '<option value="bars">Bars</option>' +
                '</select>' +
            '</div>' +
            '<div class="control_row">' +
                '<label for="${eids.bgimage}">Background image:</label>' +
                '<select id="${eids.bgimage}" class="ui-state-default">' +
                    '<option value=""></option>' +
                    '<option value="rama_general"">Ramachandran: General</option>' +
                    '<option value="rama_glycine">Ramachandran: Glycine</option>' +
                    '<option value="rama_pre-pro">Ramachandran: Pre-Pro</option>' +
                    '<option value="rama_proline">Ramachandran: Proline</option>' +
                '</select>' +
            '</div>' +
            '<div class="control_row">' +
                '<button id="${eids.draw}">draw</button>' +
            '</div>' +
        '</div>' +
        '<div class="control_group">' +
            '<div class="control_row" style="width:300px; height:300px;" id="${eids.canvas}"></div>' +
        '</div>' +
    '';
    
    this.add_content( template, params );
    
    this.selector = new Provi.Selection.SelectorWidget({
        parent_id: this.eid('selector'),
    applet: params.applet,
    tag_name: 'span'
    });
    
    this.selector2 = new Provi.Selection.SelectorWidget({
        parent_id: this.eid('selector2'),
    applet: params.applet,
    tag_name: 'span'
    });
    
    this._init();
}
Provi.Jmol.Analysis.PlotWidget.prototype = Utils.extend(Provi.Widget.Widget, /** @lends Provi.Jmol.Analysis.PlotWidget.prototype */ {
    default_params: {
        heading: 'Plot',
        collapsed: true,
        persist_on_applet_delete: true
    },
    _init: function(){
        var self = this;
    
    this.data_types = {
        'res': {
        label: 'Residue',
        format: "'%[group]', '%[resNo]', '%[chain]'",
        value: function(d){ return d[1]; },
        min: function(d){ return _.min(d) },
        max: function(d){ return _.max(d) }
        },
        'resres': {
        label: 'Residue vs. residue (R1,R2,...RN,R1,...)',
        format: "'%[group]', '%[resNo]', '%[chain]'",
        value: function(d){ return d[1]; },
        proc: function(d,m){
            var ret = [];
            var n = d.length;
            for( var i=0; i<m; ++i ){
            for( var j=0; j<n; ++j ){
                ret.push( d[j] );
            }
            }
            return ret;
        },
        min: function(d){ return _.min(d) },
        max: function(d){ return _.max(d) }
        },
        'resres2': {
        label: 'Residue vs. residue (R1,R1,...R1,R2,...)',
        format: "'%[group]', '%[resNo]', '%[chain]'",
        value: function(d){ return d[1]; },
        proc: function(d,m){
            var ret = [];
            var n = d.length;
            for( var i=0; i<n; ++i ){
            for( var j=0; j<m; ++j ){
                ret.push( d[i] );
            }
            }
            return ret;
        },
        min: function(d){ return _.min(d) },
        max: function(d){ return _.max(d) }
        },
        'atom': {
        label: 'Atom',
        value: function(d){ return d[0]; },
        format: "'%[atomno]', '%[group]', '%[resNo]', '%[chain]', '%[atomName]', '%[file]', '%[model]', '%[modelindex]'"
        },
        'psi': {
        label: 'Psi',
        format: '%[psi]',
        value: function(d){ return d[0]; },
        min: function(){ return -180 },
        max: function(){ return 180 }
        },
        'phi': {
        label: 'Phi',
        format: '%[phi]',
        value: function(d){ return d[0]; },
        min: function(){ return -180 },
        max: function(){ return 180 }
        },
        'bfac': {
        label: 'B-factor',
        format: '%[temperature]',
        value: function(d){ return d[0]; }
        },
        'color': {
        label: 'Color',
        format: '%[color]',
        value: function(d){
            return $.color.make( d[0], d[1], d[2] ).toString();
        }
        },
        'dist': {
        //script: 'for(var a1 in sele){ for(var a2 in sele){ ret += [ distance(a1,a2) ] } }',
        script2: '' +
            'var t = 5.0;' +
            'for(var a1 in sele2){ ' +
            'var g1 = {within(GROUP,@a1)};' +
            'for(var a2 in sele){' +
                'var g2 = {within(GROUP,@a2)};' +
                'var g3 = {@g2 and within(@t,@g1)};' +
                'var tmp = t;' +
                'if( g3.length > 0 ){' +
                'for(var ag1 in {@g1 and within(@t,@g3)}){' +
                    'for(var ag2 in @g3){' +
                    'var d = distance(ag1,ag2);' +
                    'if( d<tmp ){' +
                        'tmp = d;' +
                        'ret += [ {@ag1}.resno, {@ag2}.resno, d ];' +
                    '}' +
                    '}' +
                '}' +
                '}' +
            '}' +
            '}' +
        '',
        script: '' +
            'var t = 5.0;' +
            'var g2 = {within(GROUP,@sele)};' +
            'for(var a1 in sele2){ ' +
            'var g1 = {within(GROUP,@a1)};' +
            'var g3 = {@g2 and within(@t,@g1)};' +
            'var mindist = t;' +
            'var tmp = [];' +
            'if( g3.length > 0 ){' +
                'for(var ag1 in {@g1 and within(@t,@g3)}){' +
                'for(var ag2 in @g3){' +
                    'var d = distance(ag1,ag2);' +
                    'if( d<mindist ){' +
                    'mindist = d;' +
                    'tmp = [ {@ag1}.resno, {@ag2}.resno, mindist ];' +
                    '}' +
                '}' +
                '}' +
                'ret += tmp;' +
            '}' +
            '}' +
        '',
        value: function(dat){
            dat.push( dat[2] );
            var d = dat[2];
            if( d < 1){
            dat[2] = 'rgb(0,0,0)';
            }else if( d < 1.5){
            dat[2] = 'rgb(30,30,30)';
            }else if( d < 2.0){
            dat[2] = 'rgb(60,60,60)';
            }else if( d < 3.5){
            dat[2] = 'rgb(90,90,90)';
            }else if( d < 4){
            dat[2] = 'rgb(120,120,120)';
            }else if( d <= 5){
            dat[2] = 'rgb(150,150,150)';
        //    }else if( d < 6){
        //  dat[2] = 'rgb(180,180,180)';
        //    }else if( d < 7){
        //  dat[2] = 'rgb(210,210,210)';
            }else{
            dat[2] = 'rgb(255,255,255)';
            }
            return dat;
        }
        }
    };
    
    this.bgimages = {
        'rama_general': [ '../img/ramachandran_plot_empty_General.png', -180, -180, 180, 180 ],
        'rama_glycine': [ '../img/ramachandran_plot_empty_Glycine.png', -180, -180, 180, 180 ],
        'rama_pre-pro': [ '../img/ramachandran_plot_empty_Pre-Pro.png', -180, -180, 180, 180 ],
        'rama_proline': [ '../img/ramachandran_plot_empty_Proline.png', -180, -180, 180, 180 ]
    }
    
    this.elm('draw').button().click(function(){
            self.draw();
        });
        
    // init axis selects
    $.each( this.data_types, function( key, elm ){
        if( elm.label ){
        var opt = "<option value='" + key + "'>" + elm.label + "</option>";
        self.elm('xaxis').append( opt );
        self.elm('yaxis').append( opt );
        }
    });
    
    // init presets
    this.elm('presets').bind('click change', function(){
        var preset = self.elm('presets').children("option:selected").val();
        switch( preset ){
        case 'rama':
            self.elm('xaxis').val( 'phi' );
            self.elm('yaxis').val( 'psi' );
            self.elm('color').val( 'color' );
            self.elm('chart').val( 'points' );
            self.elm('bgimage').val( 'rama_general' );
            self.selector.set_input( '*.CA and protein' );
            self.selector2.set_input( '' );
            self.radius = 2;
            self.shadow = 3;
            break;
        case 'dist':
            self.elm('xaxis').val( 'resres' );
            self.elm('yaxis').val( 'resres2' );
            self.elm('color').val( 'dist' );
            self.elm('chart').val( 'points' );
            self.elm('bgimage').val( '' );
            self.selector.set_input( '*.CA and protein and resno < 339' );
            self.selector2.set_input( '*.CA and protein and resno >= 339' );
            self.radius = 'auto';
            self.shadow = 0;
            break;
        default:
            break;
        }
        self.draw();
    });
    
    // init select
    this.elm('canvas').bind("plotselected", function (event, ranges) {
        self.select( ranges );
    });
    
    Provi.Widget.Widget.prototype.init.call(this);
    },
    get_data: function( type, sele, sele2 ){
    var dt = this.data_types[ type ];
    if( dt.format ){
        var format = dt.format;
        var data = this.applet.evaluate('"[" + {' + sele + '}.label("[' + format + ']").join(",") + "]"');
        data = data.replace(/(%\[psi\]|%\[phi\]|\,\])/g,"null");
        if( type=='color' ){
        data = data.replace(/\.00/g,",").replace(/\,\]/g, "]");
        }
        data = eval( data );
    }else if( dt.script ){
        var script = '' +
        'var sele = {' + sele + '}; ' +
        'var sele2 = {' + sele2 + '}; ' +
        'var ret = []; ' +
        dt.script +
        'print ret; return ret;' +
        '';
        var data = this.applet.script_wait_output( script );
        //console.log( data );
        data = data.split('\n').slice(0,-1);
        var n = data.length;
        var data2 = [];
        for( var i=0; i<n; i+=3 ){
        data2.push( [ data[i], data[i+1], data[i+2] ] );
        }
        var data = data2;
        //var data = this.applet.script_wait( script );
        console.log('JMOL finished');
        console.log( data );
    }
    data = _.map( data, dt.value );
    if( _.isFunction(dt.proc) ){
        //data = dt.proc( data );
    }
    
    return {
        data: data,
        min: dt.min ? dt.min( data ) : null,
        max: dt.max ? dt.max( data ) : null
    };
    },
    _get_options: function(){
    this.sele = this.selector.get().selection;
    this.sele2 = this.selector2.get().selection || this.sele;
    this.chart = this.elm('chart').children("option:selected").val();
    this.xtype = this.elm('xaxis').children("option:selected").val();
    this.ytype = this.elm('yaxis').children("option:selected").val();
    this.ctype = this.elm('color').children("option:selected").val();
    this.preset = self.elm('presets').children("option:selected").val();
    },
    draw: function(){
    var self = this;
    var x = this.get_data( this.xtype, this.sele );
    var y = this.get_data( this.ytype, this.sele2 );
    var c = this.get_data( this.ctype, this.sele, this.sele2 );
    
    if( this.preset == 'dist' ){
        var xlen = x.data.length;
        var ylen = y.data.length;
        x.data = this.data_types[ this.xtype ].proc( x.data, ylen );
        y.data = this.data_types[ this.ytype ].proc( y.data, xlen );
        c.data = _.map( c.data, function(e){ return e[2]; } );
        //x.data = this.data_types[ xtype ].proc( x.data, ylen );
        //y.data = this.data_types[ ytype ].proc( y.data, xlen );
        this.symbol = 'rect';
        this.radius = (300/xlen*0.40);
        this.radius2 = (300/ylen*0.40);
        this.grid = false;
    }else{
        this.symbol = 'circle';
        this.radius = 2;
        this.radius2 = 0;
        this.grid = true;
    }
    
    //console.log(x);
    //console.log(y);
    //console.log(c);
    
    
    
    var d1 = _.zip( x.data, y.data );
    
    var data = [];
    data.push({
        data: d1,
        lines: { show: this.chart=='lines' },
        points: {
        show: this.chart=='points',
        colors: c.data,
        symbol: this.symbol,
        radius: this.radius,
        radius2: this.radius2
        },
        bars: { show: this.chart=='bars' },
        shadowSize: this.shadow
    });
    
    var options = {
        xaxis: { min: x.min, max: x.max, tickLength: 0 },
        yaxis: { min: y.min, max: y.max, tickLength: 0 },
        series: { images: { anchor: null } },
        grid: {
        show: true,
        axisMargin: 3,
        minBorderMargin: _.max( [this.radius, this.radius2] ),
        borderWidth: 0
        },
        // zoom: { interactive: true },
        // pan: { interactive: false },
        selection: { mode: "xy" }
    }
    
    var bgimage = this.elm('bgimage').children("option:selected").val();
    if( bgimage ){
        options['grid']['backgroundImage'] = this.bgimages[ bgimage ];
    }
    
    $.plot( this.elm('canvas'), data, options );
    },
    select: function( s ){
    // TODO: mapping between xaxis/yaxis and data (data needs to be added first!)
    console.log( s );
    }
});


/**
 * A widget
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Jmol.Analysis.GromacsHelixorientWidget = function(params){
    params = _.defaults(
        params,
        Provi.Jmol.Analysis.GromacsHelixorientWidget.prototype.default_params
    );
    console.log('HELIXORIENT', params);
	params.persist_on_applet_delete = true;
    
    //params.collapsed = false;
    Provi.Widget.Widget.call( this, params );
    this._init_eid_manager([
        'center_ds_selector', 'axis_ds_selector', 'ndx_ds_selector',
        'applet_selector_widget', 'draw'
    ]);
    
    //this. = params.
    
    var template = '' +
        '<div class="control_row" id="${eids.applet_selector_widget}"></div>' +
        '<div class="control_row" id="${eids.center_ds_selector}"></div>' +
        '<div class="control_row" id="${eids.axis_ds_selector}"></div>' +
        '<div class="control_row" id="${eids.ndx_ds_selector}"></div>' +
        '<div class="control_row">' +
            '<button id="${eids.draw}">draw</button>' +
        '</div>' +
	'';
    this.add_content( template, params );

    this.applet_selector = new Provi.Jmol.JmolAppletSelectorWidget({
        parent_id: this.eid('applet_selector_widget')
    });
    this.center_ds_selector = new Provi.Data.DatasetSelectorWidget({
        parent_id: this.eid('center_ds_selector'),
        selector_label: 'center.dat',
        ext_list: ['dat']
    });
	this.axis_ds_selector = new Provi.Data.DatasetSelectorWidget({
        parent_id: this.eid('axis_ds_selector'),
        selector_label: 'helixaxis.dat',
        ext_list: ['dat']
    });
    this.ndx_ds_selector = new Provi.Data.DatasetSelectorWidget({
        parent_id: this.eid('ndx_ds_selector'),
        selector_label: 'helixorient.ndx',
        ext_list: ['ndx']
    });

    this._init();
}
Provi.Jmol.Analysis.GromacsHelixorientWidget.prototype = Utils.extend(Provi.Widget.Widget, /** @lends Provi.Jmol.Analysis.GromacsHelixorientWidget.prototype */ {
    default_params: {
        heading: 'Helixorient'
    },
    _init: function(){
        var self = this;
        
        this.elm('draw').button().click( function(){
            self.draw();
        });

        $(this.center_ds_selector).bind('change', function(){
        	self.center_ds = self.center_ds_selector.get_ds();
        	self._init_center();
        });

        $(this.axis_ds_selector).bind('change', function(){
        	self.axis_ds = self.axis_ds_selector.get_ds();
        	self._init_axis();
        });

        $(this.ndx_ds_selector).bind('change', function(){
        	self.ndx_ds = self.ndx_ds_selector.get_ds();
        	self._init_ndx();
        });

	   	Provi.Widget.Widget.prototype.init.call(this);
    },
    parse_dat: function( raw_dat ){
    	if( !raw_dat ) return;	
    	var dat = [];
    	_.each( raw_dat.split(/\r\n|\r|\n/), function( line, i ){
    		var d = line.trim().split(/\s+/);
    		var n = d.length;
    		if( n>1 ){
    			var values = [];
    			for ( var i = 1; i<n; i+=3 ){
    				values.push( _.map( d.slice(i,i+3), parseFloat ) );
    			}
    			dat.push({ time: parseInt(d[0]), values: values });
    		}
    	});
    	return dat;
    },
    _init_center: function(){
    	if( !this.center_ds ) return;
    	this.center_dat = this.parse_dat( this.center_ds.data );
    },
    _init_axis: function(){
    	if( !this.axis_ds ) return;	
    	this.axis_dat = this.parse_dat( this.axis_ds.data );
    },
    _init_ndx: function(){
    	if( !this.ndx_ds ) return;
    	console.log( this.ndx_ds.data );
    	this.ndx_dat = this.ndx_ds.data.ndx_list[0][1];
    },
    draw: function(){
    	console.log( this.center_dat, this.axis_dat );
	    var applet = this.applet_selector.get_value(true);
	    var self = this;
	    if (!applet || !this.center_dat || !this.axis_dat) return;

	    var n1 = this.ndx_dat.length-1;
	    var s = '';
        s += 'draw PLANE {47 62 62} {67 12 62} {17 52 62} FIXED; ' +
            'draw ID "pv1" Vector {47 62 62} {0 0 15} FIXED; ' +
            'function vec_mag(v){ return sqrt(v.X*v.X + v.Y*v.Y + v.Z*v.Z) }; ' +
            'function vec2plane_proj(v, pn){' +
                'var c1 = cross( v, pn );' + 
                'var c2 = cross( c1, pn );' + 
                'return c2/c2;' +
            '};' +
            '';
	    _.each( this.center_dat, function( d, i ){
	    	var axis = self.axis_dat[i];
	    	s += 'frame ' + i + ';';
	    	_.each( d.values, function( c, j ){
	    		var v = axis.values[j];
	    		if( j>0 && j<n1 ){
		    		s += 'draw ID "o_' + i + '_' + j + '" ARROW ' + 
		    			'{ ' + (10*c[0]) + ' ' + (10*c[1]) + ' ' + (10*c[2]) + ' } ' +
		    			'{ model="' + i + '" and atomno=' + self.ndx_dat[j] + ' }' +
		    			'COLOR @{ color("rwb", 1, ' + n1 + ', ' + j + ') } ' +
		    			';';
			    	s += 'draw ID "x_' + i + '_' + j + '" VECTOR ' + 
			    		'{ ' + (10*c[0]) + ' ' + (10*c[1]) + ' ' + (10*c[2]) + ' } ' +
			    		'{ ' + v[0] + ' ' + v[1] + ' ' + v[2] + ' } ' +
			    		'SCALE 700 ' +
			    		'COLOR @{ color("rwb", 1, ' + n1 + ', ' + j + ') } ' +
			    		';';
                    s += 'draw ID "p_' + i + '_' + j + '" VECTOR ' + 
                        '{ ' + (10*c[0]) + ' ' + (10*c[1]) + ' ' + '62' + ' } ' +
                        '@{ vec2plane_proj(point(' + v[0] + ', ' + v[1] + ', ' + v[2] + '), point(0, 0, 10)) } ' +
                        'SCALE 700 ' +
                        'COLOR @{ color("rwb", 1, ' + n1 + ', ' + j + ') } ' +
                        ';';
		    	}
    		});
	    });
	    console.log( s );
	    applet.script( s, true );
    }
});


// function vec_norm(v){
//     return v/v;
// }

// function vec_mag(v){ 
//     return sqrt(v.X*v.X + v.Y*v.Y + v.Z*v.Z);
// };

// function vec2plane_proj(v, pn){ 
//     return v-(v*pn); 
// };

// var a = {-0.57 -0.28 -0.76};

// draw ID "pv2" vector { 42.37 46.46 62 } {0 0 10};

// draw ID "pv3" vector { 42.37 46.46 62 } @{ cross( {0 0 10},  {-0.57 -0.28 -0.76} ) };

// var c = cross( cross( {0 0 10},  {-0.57 -0.28 -0.76} ), {0 0 10} );
// draw ID "pv4" vector { 42.37 46.46 62 } @{ vec_norm(c) * 7  };

// draw ID "p_250_5" VECTOR { 42.37 46.46 62 } @{ vec2plane_proj(point(-0.57, -0.28, -0.76), point(0, 0, 1)) } SCALE 700 COLOR @{ color("rwb", 1, 6, 5) }



})();