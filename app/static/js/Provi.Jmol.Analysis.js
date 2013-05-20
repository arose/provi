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
 * A widget to access Jmol's isosurface creation functionality
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Jmol.Analysis.IsosurfaceConstructionWidget = function(params){
    params = _.defaults( params, this.default_params );
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
                var params = { applet: applet };
                _.extend( params, self.isosurface_params.params );
                console.log('IsosurfaceConstructionWidget', params);
                new Provi.Bio.Isosurface.Isosurface( params );
                // Provi.Bio.Isosurface.Isosurface({
                //     applet: applet,
                //     within: self.isosurface_params.get_within(),
                //     type: self.surface_params.get_type(),
                //     resolution: self.surface_params.get_resolution(),
                //     select: self.surface_params.get_select(),
                //     ignore: self.surface_params.get_ignore(),
                //     slab: self.surface_params.get_slab(),
                //     map: self.surface_params.get_map()
                // });
            }
        });
        
        Provi.Widget.Widget.prototype.init.call(this);
    }
});



/**
 * A widget
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Jmol.Analysis.PlaneConstructionWidget = function(params){
    params = _.defaults( params, this.default_params );
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
    this.selection_selector = new Provi.Bio.AtomSelection.SelectorWidget({
        parent_id: this.eid('selection_selector_widget'),
        applet: params.applet, tag_name: 'span'
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

        var sele = this.selection_selector.get();
        console.log('PLANE CONSTRUCTION SELE', sele);
        var format = "'%[atomno]',%[resno],'%[chain]','%[model]','%[file]','%x','%y','%z'";
        var apm = applet.atoms_property_map( format, sele );

        var coords = _.map(apm, function(d,i){
            return _.map([d[5], d[6], d[7]], function(x){ return parseFloat(x); });
        });
        console.log(coords);
        
        var axes = Provi.Utils.principal_axes(coords);
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
    params = _.defaults( params, this.default_params );
    
    Provi.Widget.Widget.call( this, params );
    this._init_eid_manager([
        'canvas', 'draw', 'selector', 'selector2', 'xaxis', 'yaxis', 'bgimage', 
        'presets', 'chart', 'color'
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
            '<div class="control_row" style="width:350px; height:350px;" id="${eids.canvas}"></div>' +
        '</div>' +
    '';
    
    this.add_content( template, params );
    console.log( this.eid('selector'), this.eid('selector2'), this.eid_dict );
    this.selector = new Provi.Bio.AtomSelection.SelectorWidget({
        parent_id: this.eid('selector'),
        selection_label: 'Selection A',
        applet: params.applet, tag_name: 'span'
    });
    
    this.selector2 = new Provi.Bio.AtomSelection.SelectorWidget({
        parent_id: this.eid('selector2'),
        selection_label: 'Selection B',
        applet: params.applet, tag_name: 'span'
    });
    
    this._init();
}
Provi.Jmol.Analysis.PlotWidget.prototype = Utils.extend(Provi.Widget.Widget, /** @lends Provi.Jmol.Analysis.PlotWidget.prototype */ {
    default_params: {
        heading: 'Plot',
        collapsed: true,
        persist_on_applet_delete: false
    },
    _init: function(){
        var self = this;
    
        this.data_types = {
            'res': {
                label: 'Residue',
                format: "'%[group]', '%[resNo]', '%[chain]'",
                value: function(d){ return parseInt(d[1]); },
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
                value: function(d){ return parseFloat(d[0]); }
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
            //self.draw();
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
        this.sele = this.selector.get();
        this.sele2 = this.selector2.get() || this.sele;
        this.chart = this.elm('chart').children("option:selected").val();
        this.xtype = this.elm('xaxis').children("option:selected").val();
        this.ytype = this.elm('yaxis').children("option:selected").val();
        this.ctype = this.elm('color').children("option:selected").val();
        this.preset = this.elm('presets').children("option:selected").val();
    },
    draw: function(){
        var self = this;
        this._get_options();

        var x = this.get_data( this.xtype, this.sele );
        var y = this.get_data( this.ytype, this.sele2 );
        var c = this.get_data( this.ctype, this.sele, this.sele2 );
        
        if( this.preset == 'dist' ){
            var xlen = x.data.length;
            var ylen = y.data.length;
            x.data = this.data_types[ this.xtype ].proc( x.data, xlen );
            y.data = this.data_types[ this.ytype ].proc( y.data, ylen );
            c.data = _.map( c.data, function(e){ return e[2]; } );
            this.symbol = 'rect';
            this.radius = (350/xlen*0.40);
            this.radius2 = (350/ylen*0.40);
            this.grid = false;
        }else{
            this.symbol = 'circle';
            this.radius = 2;
            this.radius2 = 0;
            this.grid = true;
        }
        
        console.log(x);
        console.log(y);
        console.log(c);
        
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