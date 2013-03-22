/**
 * @fileOverview This file contains the {@link Provi.Jmol.Settings} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * @namespace
 * Jmol settings module
 */
Provi.Jmol.Settings = {};


(function() {

/** @exports Utils as Provi.Utils */
var Utils = Provi.Utils;

/** @exports Widget as Provi.Widget.Widget */
var Widget = Provi.Widget.Widget;


Provi.Jmol.Settings.Packing = {};
Provi.Jmol.Settings.Packing.vdw = {"C4H1b":[1.88,0.78],"DEFAULT":[1.70,0.77],"O2H0b":[1.62,0.65],"N3H1b":[1.64,0.67],"S2H0u":[1.77,1.04],"C4H1s":[1.88,0.78],"FE":[1.70,0.70],"O2H2u":[1.46,0.66],"C4H3u":[1.88,0.74],"O2H0s":[1.50,0.65],"N3H1s":[1.64,0.67],"C3H2u":[1.76,0.77],"C4H2s":[1.88,0.76],"N2H0s":[1.64,0.64],"C3H1b":[1.76,0.68],"N2H0b":[1.64,0.64],"C3H1t":[1.76,0.68],"C3H1s":[1.76,0.68],"N3H2u":[1.64,0.61],"P4H0u":[1.82,0.97],"C4H2b":[1.88,0.76],"Z2ION":[0.74,0.74],"MGION":[1.59,0.70],"O2H1u":[1.46,0.65],"N3H0u":[1.64,0.69],"O1H0u":[1.42,0.52],"C3H0b":[1.61,0.72],"S2H1u":[1.77,1.04],"C3H0s":[1.61,0.72],"O1N3HH":[1.60,0.68],"N4H3u":[1.64,0.73]};


Provi.Jmol.Settings.Packing.resdb = {"C4H1b":["ILE.CB","G.C1*","G.C4*","PRO.CA","A.C1*","A.C4*","C.C1*","C.C4*","VAL.CB","THR.CB","U.C1*","U.C4*","T.C1*","T.C4*","ALA.CA","LEU.CG"],"O2H0b":["G.O5*","G.O3*","A.O5*","A.O3*","C.O5*","C.O3*","U.O5*","U.O3*","T.O5*","T.O3*"],"N3H1b":["HIS.ND1","HIS.NE2","TRP.NE1","ARG.NE"],"S2H0u":["CSS.SG","MET.SD"],"C4H1s":["ILE.CA","GLN.CA","G.C3*","G.C2*","GLU.CA","CYS.CA","HIS.CA","SER.CA","LYS.CA","ASN.CA","A.C3*","A.C2*","C.C3*","C.C2*","VAL.CA","THR.CA","ASP.CA","U.C3*","U.C2*","T.C3*","T.C2*","TRP.CA","CSS.CA","PHE.CA","MET.CA","LEU.CA","ARG.CA","TYR.CA"],"O2H2u":["HOH.OW","HOH.O","WAT.OW","WAT.O"],"C4H3u":["ILE.CD1","ILE.CG2","VAL.CG1","VAL.CG2","THR.CG","THR.CG2","T.C7","ALA.CB","MET.CE","ACE.CH3","LEU.CD1","LEU.CD2"],"O2H0s":["G.O4*","A.O4*","C.O4*","U.O4*","T.O4*"],"N3H1s":["ILE.N","GLN.N","G.N1","GLY.N","GLU.N","CYS.N","HIS.N","SER.N","LYS.N","ASN.N","VAL.N","THR.N","ASP.N","U.N3","T.N3","TRP.N","CSS.N","PHE.N","ALA.N","MET.N","LEU.N","ARG.N","TYR.N"],"Z2ION":["ZN.ZN"],"N2H0s":["A.N1","C.N3"],"C3H1b":["C.C5","U.C5","TRP.CZ2","TRP.CH2","TRP.CE3","TRP.CZ3","TRP.CEH2","PHE.CE1","PHE.CZ","PHE.CD2","PHE.CE2"],"N2H0b":["G.N3","G.N7","A.N3","A.N7"],"C3H1t":["C.C6","U.C6","T.C6"],"C3H1s":["G.C8","HIS.CE1","HIS.CD2","A.C8","A.C2","TRP.CD1","PHE.CD1","TYR.CE1","TYR.CD1","TYR.CD2","TYR.CE2"],"N3H2u":["GLN.NE2","G.N2","ASN.ND2","A.N6","C.N4","ARG.NH1","ARG.NH2"],"P4H0u":["G.P","A.P","C.P","U.P","T.P"],"C4H2b":["ILE.CG1","CYS.CB","LYS.CE","PRO.CB","PRO.CG","CSS.CB","MET.CG"],"O2H1u":["G.O2*","SER.OG","SER.OG1","A.O2*","C.O2*","THR.OG1","U.O2*","T.O2*","TYR.OH"],"N3H0u":["G.N9","PRO.N","A.N9","C.N1","U.N1","T.N1"],"O1H0u":["ILE.O","GLN.O","GLN.OE1","G.O6","G.O1P","G.O2P","GLY.O","GLU.O","GLU.OE2","GLU.OE1","CYS.O","HIS.O","SER.O","LYS.O","PRO.O","ASN.O","ASN.OD1","A.O1P","A.O2P","C.O1P","C.O2P","C.O2","VAL.O","THR.O","ASP.O","ASP.OD1","ASP.OD2","U.O1P","U.O2P","U.O4","U.O2","T.O1P","T.O2P","T.O4","T.O2","TRP.O","CSS.O","PHE.O","ALA.O","MET.O","LEU.O","ARG.O","TYR.O"],"C3H0b":["GLN.CD","GLY.C","GLU.CD","HIS.CG","ASN.CG","ASP.CG","T.C5","TRP.CG","TRP.CE2","TRP.CD2","PHE.CG","ARG.CZ","TYR.CG","TYR.CZ"],"S2H1u":["CYS.SG"],"C3H0s":["ILE.C","GLN.C","G.C2","G.C6","G.C5","G.C4","GLU.C","CYS.C","HIS.C","SER.C","LYS.C","PRO.C","ASN.C","A.C6","A.C5","A.C4","C.C2","C.C4","VAL.C","THR.C","ASP.C","U.C2","U.C4","T.C2","T.C4","TRP.C","CSS.C","PHE.C","ALA.C","MET.C","LEU.C","ARG.C","TYR.C"],"C4H2s":["GLN.CB","GLN.CG","G.C5*","GLY.CA","GLU.CB","GLU.CG","HIS.CB","SER.CB","LYS.CB","LYS.CG","LYS.CD","PRO.CD","ASN.CB","A.C5*","C.C5*","ASP.CB","U.C5*","T.C5*","TRP.CB","PHE.CB","MET.CB","LEU.CB","ARG.CB","ARG.CG","ARG.CD","TYR.CB"],"N4H3u":["LYS.NZ"]};


Provi.Jmol.Settings.Radii = {};
Provi.Jmol.Settings.Radii['jmol'] = {'C':1.95,'N':1.85,'O':1.7,'S':2,'Mg':1.73,'Fe':1.7,'Zn':1.39};
Provi.Jmol.Settings.Radii['babel'] = {'C':1.7,'N':1.6,'O':1.55,'S':1.8,'Mg':2.2,'Fe':2.05,'Zn':2.1};

/**
 * A base class to create classes to provide a central instance for changing settings
 * @constructor
 */
Provi.Jmol.Settings.SettingsManager = function(params) {
    this.names = Object.keys( this.default_params );
    console.log(this.names, typeof(this), this.default_params);
    params = $.extend( this.default_params, params );
    console.log(this.names, typeof(this), this.default_params);
    this.applet = params.applet;
    this.set( params );
}
Provi.Jmol.Settings.SettingsManager.prototype = /** @lends Provi.Jmol.Settings.SettingsManager.prototype */ {
    default_params: {},
    jmol_param_names: {},
    _command: function( names ){
        names = names || this.names;
        return $.map( names, $.proxy( function( name ){
            if( this.jmol_param_names[name] ){
                return "set " + this.jmol_param_names[name] + " " + this[name] + ';';
            }else{
                return '';
            }
        }, this )).join(" ");
    },
    _set: function( params ){
        for( var p in params || {} ){
            this[ p ] = params[ p ];
        }
        console.log( 'SETTINGS MANAGER CHANGE', typeof(this), this.get() );
        $(this).triggerHandler( 'change', this.get() );
    },
    set: function( params ){
        this._set( params );
        this.applet.script( this._command(), { maintain_selection: true, try_catch: true } );
    },
    get: function(){
        var params = {};
        $.each( this.names, $.proxy( function( i, name ){
            params[ name ] = this[name];
        }, this ));
        return params;
    },
    promise: function( params ){
        this._set( params );
        return this._command();
    },
    repair: function(){
        this.set( this.get() );
    },
    sync: function(){
        var params = {};
        $.each( this.jmol_param_names, $.proxy( function( name, jmol_name ){
            params[ name ] = this.applet.evaluate( jmol_name );
        }, this ));
        //console.log( 'SYNC SETTINGS', typeof(this), this._command(), params );
        this._set( params );
    },
    defaults: function(){
        this.set( this.default_params );
    }
};


/**
 * A widget
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Jmol.Settings.SettingsManagerWidget = function(params){
    params = _.defaults(
        params,
        Provi.Jmol.Settings.SettingsManagerWidget.prototype.default_params
    );
    params.collapsed = true;
    Provi.Widget.Widget.call( this, params );
    this._init_eid_manager([
        'defaults', 'applet_selector'
    ]);
    
    var template = '' +
        '<div class="control_group">' +
            '<div class="control_row" id="${eids.applet_selector}"></div>' +
            '<div class="control_row">' +
            '<button id="${eids.defaults}">defaults</button>' +
            '</div>' +
        '</div>' +
    '';
    
    this.add_content( template, params );
    
    this.manager_name = params.manager_name;
    this.applet_selector = new Provi.Jmol.JmolAppletSelectorWidget({
        parent_id: this.eid('applet_selector')
    });
    
    // to be called by child classes
    //this._init();
}
Provi.Jmol.Settings.SettingsManagerWidget.prototype = Utils.extend(Provi.Widget.Widget, /** @lends Provi.Jmol.Settings.SettingsManagerWidget.prototype */ {
    default_params: {
        
    },
    _init: function(){
        var self = this;
    
    
        this.elm('defaults').button().click(function(){
            var applet = self.applet_selector.get_value();
            if(applet){
                applet[ self.manager_name ].defaults();
            }
        });
    
        // init clipping manager
        this._init_manager();
        // bindings to the applet or its properties need to get
        // re-bound when the selected applet changes
        $( this.applet_selector ).bind('change_selected', function(event, applet){
            _.each( Provi.Jmol.get_applet_list(), function(applet, i){
                $(applet[ self.manager_name ]).unbind('.'+self.id);
            });
            self._init_manager();
        });
        
        Provi.Widget.Widget.prototype.init.call(this);
    },
    _init_manager: function(){
        var applet = this.applet_selector.get_value();
        if(applet){
            var self = this;
            $( applet[ this.manager_name ] ).bind('change.'+self.id, function(){
                self._sync();
            });
            this._sync();
        }
    },
    _sync: function(){
        var applet = this.applet_selector.get_value();
        if(applet){
            var params = applet[ this.manager_name ].get();
        }
    },
    set: function(){
        var applet = this.applet_selector.get_value();
        if(applet){
            applet[ this.manager_name ].set({
            
            });
        }
    }
});


/**
 * A class to provide a central instance for setting lighting parameters
 * @constructor
 * @extends Provi.Jmol.Settings.SettingsManager
 */
Provi.Jmol.Settings.MiscManager = function(params) {
    Provi.Jmol.Settings.SettingsManager.call( this, params );
}
Provi.Jmol.Settings.MiscManager.prototype = Utils.extend( Provi.Jmol.Settings.SettingsManager, /** @lends Provi.Jmol.Settings.MiscManager.prototype */ {
    default_params: {
        default_vdw: 'babel',
        vdw: 'JMOL',
        isosurface_property_smoothing: true,
        large_atom_count: 30000
    },
    jmol_param_names: {
        default_vdw: "defaultVDW",
        vdw: "vdw",
        isosurface_property_smoothing: "isosurfacePropertySmoothing"
    },
    _command: function( names ){
        // var radii = [];
        // if( this['default_vdw']=='protor' ){
        //     _.each( Provi.Jmol.Settings.Packing.vdw,function(vdw, name){
        //         var sele = []
        //         _.each( Provi.Jmol.Settings.Packing.resdb[name],function(atoms){
        //             var group_atom = atoms.split('.');
        //             var g = group_atom[0];
        //             var a = group_atom[1]
        //             if( g.length>1 ){
        //                 g = '[' + g + ']';
        //             }
        //             radii.push( '{' + g + '.' + a + '}.vdw=' + vdw[0] + ';' );
        //         });
        //     });
        //     names = _.without(names, 'default_vdw');
        // }else if( _.include( ['jmol', 'babel'], this['default_vdw'] ) ){
        //     _.each( Provi.Jmol.Settings.Radii[ this['default_vdw'] ], function(vdw, atom){
        //         radii.push( '{_' + atom + '}.vdw=' + vdw + ';' );
        //     })
        // }
        // radii = radii.join('');
        // console.log(radii);
        return '' +
            //radii + 
            // 'select cpk>0 and cpk<=1; cpk ' + this.applet.style_manager['cpk'] + '%; select none; ' +
            // 'select cpk>1; cpk 100%; select none; ' +
            Provi.Jmol.Settings.SettingsManager.prototype._command.call( this, names );
    }
});


/**
 * A widget
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Jmol.Settings.MiscManagerWidget = function(params){
    params = _.defaults(
        params,
        Provi.Jmol.Settings.MiscManagerWidget.prototype.default_params
    );
    params.heading = 'Misc Settings';
    params.manager_name = 'misc_manager';
    
    Provi.Jmol.Settings.SettingsManagerWidget.call( this, params );
    
    this._init_eid_manager([
        'default_vdw', 'isosurface_property_smoothing', 'large_atom_count'
    ]);
    
    var template = '' +
        '<div class="control_group">' +
            '<div class="control_row">' +
                '<label for="${eids.default_vdw}">default vdW radii</label>' +
                '<select id="${eids.default_vdw}" class="ui-state-default">' +
                    '<option value="jmol">Jmol</option>' +
                    '<option value="babel">Babel</option>' +
                    // '<option value="rasmol">Rasmol</option>' +
                    '<option value="protor">ProtOr</option>' +
                    // '<option value="user">User defined</option>' +
                '</select>' +
            '</div>' +
            '<div class="control_row">' +
                '<input id="${eids.isosurface_property_smoothing}" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
                '<label for="${eids.isosurface_property_smoothing}" style="display:block;">isosurface property smoothing</label>' +
            '</div>' +
            '<div class="control_row">' +
                '<input id="${eids.large_atom_count}" type="text" />' +
                '<label for="${eids.large_atom_count}" style="display:block;">large atom count</label>' +
            '</div>' +
        '</div>' +
    '';
    
    this.add_content( template, params );
    
    this._init();
}
Provi.Jmol.Settings.MiscManagerWidget.prototype = Utils.extend(Provi.Jmol.Settings.SettingsManagerWidget, /** @lends Provi.Jmol.Settings.MiscManagerWidget.prototype */ {
    default_params: {
        isosurface_property_smoothing: true
    },
    _init: function(){
        var self = this;
    
        this.elm('default_vdw').bind('click change', $.proxy( this.set, this )).parent().hide();
        this.elm('isosurface_property_smoothing').bind('click', $.proxy( this.set, this ));
        this.elm('large_atom_count').bind('change', $.proxy( this.set, this ));

        Provi.Jmol.Settings.SettingsManagerWidget.prototype._init.call(this);
    },
    _sync: function(){
        var applet = this.applet_selector.get_value();
        if(applet){
            var params = applet.misc_manager.get();
            this.elm('default_vdw').val( params.default_vdw );
            this.elm('isosurface_property_smoothing').attr('checked', params.isosurface_property_smoothing);
            this.elm('large_atom_count').val( params.large_atom_count );
        }
    },
    set: function(){
        var applet = this.applet_selector.get_value();
        if(applet){
            applet.misc_manager.set({
                default_vdw: this.elm('default_vdw').children("option:selected").val(),
                isosurface_property_smoothing: this.elm('isosurface_property_smoothing').is(':checked'),
                large_atom_count: this.elm('large_atom_count').val()
            });
        }
    }
});



/**
 * A class to provide a central instance for setting lighting parameters
 * @constructor
 * @extends Provi.Jmol.Settings.SettingsManager
 */
Provi.Jmol.Settings.LightingManager = function(params) {
    Provi.Jmol.Settings.SettingsManager.call( this, params );
}
Provi.Jmol.Settings.LightingManager.prototype = Utils.extend( Provi.Jmol.Settings.SettingsManager, /** @lends Provi.Jmol.Settings.LightingManager.prototype */ {
    default_params: {
        ambient_percent: 45,
        diffuse_percent: 84,
        specular: true,
        specular_percent: 22,
        specular_power: 40,
        specular_exponent: 6,
        phong_exponent: 64,
        z_shade: true,
        z_shade_power: 3,
        z_slab: 10,
        z_depth: 0,
        cel_shading: false,
        //background_color: '"[xffffff]"'
        background_color: '"[x000000]"'
    },
    jmol_param_names: {
        ambient_percent: "ambientPercent",
        diffuse_percent: "diffusePercent",
        specular: "specular",
        specular_percent: "specularPercent",
        specular_power: "specularPower",
        specular_exponent: "specularExponent",
        phong_exponent: "phongExponent",
        z_shade: "zShade",
        z_shade_power: "zShadePower",
        z_slab: "zSlab",
        z_depth: "zDepth",
        cel_shading: "celShading",
        background_color: "backgroundColor"
    }
});


/**
 * A widget
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Jmol.Settings.LightingManagerWidget = function(params){
    params = _.defaults(
        params,
        Provi.Jmol.Settings.LightingManagerWidget.prototype.default_params
    );
    params.heading = 'Lighting Settings';
    params.manager_name = 'lighting_manager';
    
    Provi.Jmol.Settings.SettingsManagerWidget.call( this, params );
    
    this._init_eid_manager([
        'ambient_percent', 'diffuse_percent',
        'specular_state', 'specular_percent', 'specular_exponent',
        'specular_power', 'phong_exponent',
        'z_shade_state', 'z_shade_slider', 'z_shade_power',
        'cel_shading', 'background_color'
    ]);
    
    var template = '' +
        '<div class="control_group">' +
            '<div class="control_row">' +
                '<label for="${eids.ambient_percent}" style="display:block;">ambient percent</label>' +
                '<div id="${eids.ambient_percent}"></div>' +
            '</div>' +
            '<div class="control_row">' +
                '<label for="${eids.diffuse_percent}" style="display:block;">diffuse percent</label>' +
                '<div id="${eids.diffuse_percent}"></div>' +
            '</div>' +
            '<div class="control_row">' +
                '<label for="${eids.specular_percent}" style="display:block;">specular percent</label>' +
                '<input id="${eids.specular_state}" type="checkbox" checked="checked" style="float:left; margin-top: 0.5em;"/>' +
                '<div id="${eids.specular_percent}"></div>' +
            '</div>' +
            '<div class="control_row">' +
                '<label for="${eids.specular_power}" style="display:block;">specular power</label>' +
                '<div id="${eids.specular_power}"></div>' +
            '</div>' +
            '<div class="control_row">' +
                '<label for="${eids.specular_exponent}">specular exponent</label>' +
                '<select id="${eids.specular_exponent}" class="ui-state-default">' +
                    '<option value="1">1</option><option value="2">2</option>' +
                    '<option value="3">3</option><option value="4">4</option>' +
                    '<option value="5">5</option><option value="6">6</option>' +
                    '<option value="7">7</option><option value="8">8</option>' +
                    '<option value="9">9</option><option value="10">10</option>' +
                '</select>' +
            '</div>' +
            '<div class="control_row">' +
                '<label for="${eids.phong_exponent}" style="display:block;">phong exponent (specular)</label>' +
                '<div id="${eids.phong_exponent}"></div>' +
            '</div>' +
            '<div class="control_row">' +
                '<label for="${eids.z_shade_state}" style="display:block;">z-shade</label>' +
                '<input id="${eids.z_shade_state}" type="checkbox" checked="checked" style="float:left; margin-top: 0.5em;"/>' +
                '<div id="${eids.z_shade_slider}"></div>' +
            '</div>' +
            '<div class="control_row">' +
                '<label for="${eids.z_shade_power}">z-shade power</label>' +
                '<select id="${eids.z_shade_power}" class="ui-state-default">' +
                    '<option value="1">1</option><option value="2">2</option>' +
                    '<option value="3">3</option><option value="4">4</option>' +
                '</select>' +
            '</div>' +
            '<div class="control_row">' +
                '<input id="${eids.cel_shading}" type="checkbox" checked="checked" style="float:left; margin-top: 0.5em;"/>' +
                '<label for="${eids.cel_shading}" >cel shading</label>' +
            '</div>' +
            '<div class="control_row">' +
                '<label for="${eids.background_color}" >background color</label>' +
                '<input id="${eids.background_color}" type="text" value="#000000"/> ' +
            '</div>' +
        '</div>' +
    '';
    
    this.add_content( template, params );
    
    this._init();
}
Provi.Jmol.Settings.LightingManagerWidget.prototype = Utils.extend(Provi.Jmol.Settings.SettingsManagerWidget, /** @lends Provi.Jmol.Settings.LightingManagerWidget.prototype */ {
    default_params: {
        
    },
    _init: function(){
        var self = this;
    
        this.elm('ambient_percent')
            .slider({min: 0, max: 100})
            .bind( 'slidestop slide', $.proxy( this.set, this ));
        
        this.elm('diffuse_percent')
            .slider({min: 0, max: 100})
            .bind( 'slidestop slide', $.proxy( this.set, this ));
        
        this.elm('specular_state').click( $.proxy( this.set, this ) );
        
        this.elm('specular_percent')
            .slider({min: 0, max: 100})
            .bind( 'slidestop slide', $.proxy( this.set, this ));
        
        this.elm('specular_exponent').bind('click change', $.proxy( this.set, this ));
        
        this.elm('specular_power')
            .slider({min: 0, max: 100})
            .bind( 'slidestop slide', $.proxy( this.set, this ));
        
        this.elm('phong_exponent')
            .slider({min: 0, max: 100})
            .bind( 'slidestop slide', $.proxy( this.set, this ));
        
        this.elm('z_shade_state').click( $.proxy( this.set, this ) );
        
        this.elm('z_shade_slider')
            .slider({ values: [0, 100], range: true, min: 0, max: 100 })
            .bind( 'slidestop slide', $.proxy( this.set, this ));
        
        this.elm('z_shade_power').bind('click change', $.proxy( this.set, this ));
        
        this.elm('cel_shading').click( $.proxy( this.set, this ) );

        // init color picker
        this.elm('background_color').colorPicker();
        this.elm('background_color').bind('change', $.proxy( this.set, this ));

        Provi.Jmol.Settings.SettingsManagerWidget.prototype._init.call(this);
    },
    _sync: function(){
        var applet = this.applet_selector.get_value();
        if(applet){
            var params = applet.lighting_manager.get();
            this.elm('ambient_percent').slider("value", params.ambient_percent);
            this.elm('diffuse_percent').slider("value", params.diffuse_percent);
            this.elm('specular_state').attr('checked', params.specular);
            this.elm('specular_percent').slider("value", params.specular_percent);
            this.elm('specular_exponent').val( params.specular_exponent );
            this.elm('specular_power').slider("value", params.specular_power);
            this.elm('phong_exponent').slider("value", params.phong_exponent);
            this.elm('z_shade_state').attr('checked', params.z_shade);
            this.elm('z_shade_slider').slider("values", 0, params.z_depth);
            this.elm('z_shade_slider').slider("values", 1, params.z_slab);
            this.elm('z_shade_power').val( params.z_shade_power );
            this.elm('cel_shading').attr('checked', params.cel_shading );
            this.elm('background_color').val( params.background_color.substr(2,7) );
        }
    },
    set: function(){
        var applet = this.applet_selector.get_value();
        if(applet){
            bg = applet.lighting_manager.default_params.background_color;
            if( this.elm('background_color').val() ){
                bg = '"[x' + this.elm('background_color').val().substring(1) + ']"';
            }
            applet.lighting_manager.set({
                ambient_percent: this.elm('ambient_percent').slider("value"),
                diffuse_percent: this.elm('diffuse_percent').slider("value"),
                specular: this.elm('specular_state').is(':checked'),
                specular_percent: this.elm('specular_percent').slider("value"),
                specular_power: this.elm('specular_power').slider("value"),
                specular_exponent: this.elm('specular_exponent').children("option:selected").val(),
                phong_exponent: this.elm('phong_exponent').slider("value"),
                z_shade: this.elm('z_shade_state').is(':checked'),
                z_shade_power: this.elm('z_shade_power').children("option:selected").val(),
                z_depth: this.elm('z_shade_slider').slider("values", 0),
                z_slab: this.elm('z_shade_slider').slider("values", 1),
                cel_shading: this.elm('cel_shading').is(':checked'),
                // background_color: bg                
                background_color: '"[x' + this.elm('background_color').val().substr(1) + ']"'
            });
        }
    }
});


/**
 * A class to provide a central instance for setting lighting parameters
 * @constructor
 * @extends Provi.Jmol.Settings.SettingsManager
 */
Provi.Jmol.Settings.BindManager = function(params) {
    Provi.Jmol.Settings.SettingsManager.call( this, params );
};
Provi.Jmol.Settings.BindManager.prototype = Utils.extend( Provi.Jmol.Settings.SettingsManager, /** @lends Provi.Jmol.Settings.BindManager.prototype */ {
    default_params: {
        mousedrag_factor: 2.0, // 1.0,
        mousewheel_factor: 1.15
    },
    jmol_param_names: {
        mousedrag_factor: "mousedragFactor",
        mousewheel_factor: "mousewheelFactor"
    }
});


/**
 * A widget
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Jmol.Settings.BindManagerWidget = function(params){
    params = _.defaults(
        params,
        Provi.Jmol.Settings.BindManagerWidget.prototype.default_params
    );
    params.heading = 'Bind Settings';
    params.manager_name = 'bind_manager';
    
    Provi.Jmol.Settings.SettingsManagerWidget.call( this, params );
    
    this._init_eid_manager([
        'mousedrag_factor', 'mousewheel_factor'
    ]);
    
    var template = '' +
        '<div class="control_group">' +
            '<div class="control_row">' +
                '<label for="${eids.mousedrag_factor}" style="display:block;">mousedrag factor</label>' +
                '<div id="${eids.mousedrag_factor}"></div>' +
            '</div>' +
            '<div class="control_row">' +
                '<label for="${eids.mousewheel_factor}" style="display:block;">mousewheel factor</label>' +
                '<div id="${eids.mousewheel_factor}"></div>' +
            '</div>' +
        '</div>' +
    '';
    
    this.add_content( template, params );
    
    this._init();
}
Provi.Jmol.Settings.BindManagerWidget.prototype = Utils.extend(Provi.Jmol.Settings.SettingsManagerWidget, /** @lends Provi.Jmol.Settings.BindManagerWidget.prototype */ {
    default_params: {
        
    },
    _init: function(){
        var self = this;

        this.elm('mousedrag_factor')
            .slider({min: 50, max: 400})
            .bind( 'slidestop slide', $.proxy( this.set, this ));

        this.elm('mousewheel_factor')
            .slider({min: 50, max: 400})
            .bind( 'slidestop slide', $.proxy( this.set, this ));
        
        Provi.Jmol.Settings.SettingsManagerWidget.prototype._init.call(this);
    },
    _sync: function(){
        var applet = this.applet_selector.get_value();
        if(applet){
            var params = applet.bind_manager.get();
            
            this.elm('mousedrag_factor').slider("value", Math.round(params.mousedrag_factor*100));
            this.elm('mousewheel_factor').slider("value", Math.round(params.mousewheel_factor*100));
        }
    },
    set: function(){
        var applet = this.applet_selector.get_value();
        if(applet){
            applet.bind_manager.set({
                mousedrag_factor: this.elm('mousedrag_factor').slider("value")/100,
                mousewheel_factor: this.elm('mousewheel_factor').slider("value")/100
            });
        }
    }
});


/**
 * A class to provide a central instance for setting lighting parameters
 * @constructor
 * @extends Provi.Jmol.Settings.SettingsManager
 */
Provi.Jmol.Settings.ClippingManager = function(params) {
    Provi.Jmol.Settings.SettingsManager.call( this, params );
}
Provi.Jmol.Settings.ClippingManager.prototype = Utils.extend( Provi.Jmol.Settings.SettingsManager, /** @lends Provi.Jmol.Settings.ClippingManager.prototype */ {
    default_params: {
        clipping: true,
        slab_range: 0,
        slab: 100,
        depth: 0,
        slab_by_atom: false,
        slab_by_molecule: false
    },
    jmol_param_names: {
        clipping: "slabEnabled",
        slab_range: "slabRange",
        slab: "slab",
        depth: "depth",
        slab_by_atom: "slabByAtom",
        slab_by_molecule: "slabByMolecule"
    },
    _command: function( names ){
        //this.applet.lighting_manager.set({z_depth: (this.depth||0), z_slab: (this.depth||0)+30});
        //var p = {z_depth: 0, z_slab: (params.depth||20)+10}
        names = names || this.names.slice();
        if( this.slab_range ) names.removeItems( "slab" );
        return '' +
            'unbind "CTRL-LEFT";' + 
            'unbind "ALT-WHEEL";' + 
            'unbind "ALT-CTRL-WHEEL";' + 
            'bind "CTRL-LEFT" "if(_MODE==2 and _ATOM){ zoomTo 0.6 (_ATOM); } javascript jmol_zoom(' + this.applet.name_suffix + ', \'_X\', \'_Y\', \'_DELTAX\', \'_DELTAY\', \'_TIME\', \'_ACTION\', \'_ATOM\', \'_BOND\', \'_POINT\')";' +
            'bind "ALT-WHEEL" "slab @{slab - _DELTAY/abs(_DELTAY)}; if(slab<0){slab 0;} if(slab>100){slab 100;} set zSlab @{zSlab + _DELTAY/abs(_DELTAY)}; if(zSlab<0){set zSlab 0;} if(zSlab>100){set zSlab 100;} javascript jmol_bind(' + this.applet.name_suffix + ') ";' +
            'bind "ALT-CTRL-WHEEL" "slab @{slab - _DELTAY/abs(_DELTAY)}; if(slab<0){slab 0;} if(slab>100){slab 100;} set zSlab @{zSlab - _DELTAY/abs(_DELTAY)}; if(zSlab<0){set zSlab 0;} if(zSlab>100){set zSlab 100;} javascript jmol_bind(' + this.applet.name_suffix + ') ";' +
            //'bind "SHIFT-LEFT" "_translate";' +
            //'bind "ALT-LEFT" "_selectToggleOr";' +
            
            //'bind "ALT-LEFT" "print _X; print _Y; print _picked; print _pickedAtom;";' +
            //'javascript "jmol_bind(1);";' +
            //'function javascript_bind(i){ javascript "xjmol_binder()"; }' +
            //'bind "ALT-WHEEL" "javascript_bind(1);";' +
            Provi.Jmol.Settings.SettingsManager.prototype._command.call( this, names );
    }
});

/**
 * A widget
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Jmol.Settings.ClippingManagerWidget = function(params){
    params = _.defaults(
        params,
        Provi.Jmol.Settings.ClippingManagerWidget.prototype.default_params
    );
    params.heading = 'Clipping Settings';
    params.manager_name = 'clipping_manager';
    
    Provi.Jmol.Settings.SettingsManagerWidget.call( this, params );
    
    this._init_eid_manager([
    'clipping_state', 'clipping_slider', 'clipping_range',
    'slab_by_atom', 'slab_by_molecule'
    ]);
    
    var template = '' +
    '<div class="control_group">' +
        '<div class="control_row">' +
        '<label for="${eids.clipping_range}" style="display:block;">clipping</label>' +
        '<input id="${eids.clipping_state}" type="checkbox" checked="checked" style="float:left; margin-top: 0.5em;"/>' +
        '<div id="${eids.clipping_slider}"></div>' +
        '</div>' +
        '<div class="control_row">' +
        '<label for="${eids.clipping_range}" style="display:block;">range to viewpoint clipping</label>' +
        '<div id="${eids.clipping_range}"></div>' +
        '</div>' +
        '<div class="control_row">' +
            '<input id="${eids.slab_by_atom}" type="checkbox" checked="checked" style="float:left; margin-top: 0.5em;"/>' +
            '<label for="${eids.slab_by_atom}" style="display:block;">clip by atom</label>' +
        '</div>' +
        '<div class="control_row">' +
        '<input id="${eids.slab_by_molecule}" type="checkbox" checked="checked" style="float:left; margin-top: 0.5em;"/>' +
        '<label for="${eids.slab_by_molecule}" style="display:block;">clip by molecule</label>' +
        '</div>' +
        '</div>' +
    '';
    
    this.add_content( template, params );
    
    this._init();
}
Provi.Jmol.Settings.ClippingManagerWidget.prototype = Utils.extend(Provi.Jmol.Settings.SettingsManagerWidget, /** @lends Provi.Jmol.Settings.ClippingManagerWidget.prototype */ {
    default_params: {
        
    },
    _init: function(){
        var self = this;
    
        this.elm('clipping_state').bind('click', $.proxy( this.set, this ));
    
        this.elm('clipping_slider').slider({
            values: [0, 100], range: true,
            min: 0, max: 100
        }).bind( 'slidestop slide', function(event, ui){
            console.log( event.orginalEvent );
            // deactivate slabRange/clipping_range
            if(ui.values[1] < 100){
                self.elm('clipping_range').slider('value', 0);
            }
            self.set();
        });
        this.elm('clipping_range').slider({
            min: 0, max: 100
        }).bind( 'slidestop slide', function(event, ui){
            // deactivate clipping slab
            if( ui.value > 0 ){
                self.elm('clipping_slider').slider('values', 1, 100);
            }
            self.set();
        });
        
        this.elm('slab_by_atom').bind('click', $.proxy( this.set, this ));
        this.elm('slab_by_molecule').bind('click', $.proxy( this.set, this ));
        
        Provi.Jmol.Settings.SettingsManagerWidget.prototype._init.call(this);
    },
    _sync: function(){
        var applet = this.applet_selector.get_value();
        if(applet){
        var params = applet.clipping_manager.get();
        
        this.elm('clipping_state').attr('checked', params.clipping);
        this.elm('clipping_slider').slider("values", 0, params.depth);
        this.elm('clipping_slider').slider("values", 1, params.slab);
        this.elm('clipping_range').slider("value", params.slab_range);
        this.elm('slab_by_atom').attr('checked', params.slab_by_atom);
        this.elm('slab_by_molecule').attr('checked', params.slab_by_molecule);
    }
    },
    set: function(){
    var applet = this.applet_selector.get_value();
        if(applet){
            applet.clipping_manager.set({
                clipping: this.elm('clipping_state').is(':checked'),
                depth: this.elm('clipping_slider').slider("values", 0),
                slab: this.elm('clipping_slider').slider("values", 1),
                slab_range: this.elm('clipping_range').slider("value"),
                slab_by_atom: this.elm('slab_by_atom').is(':checked'),
                slab_by_molecule: this.elm('slab_by_molecule').is(':checked')
            });
        }
    }
});


/**
 * A class to provide a central instance for setting quality parameters
 * @constructor
 * @extends Provi.Jmol.Settings.SettingsManager
 */
Provi.Jmol.Settings.QualityManager = function(params) {
    Provi.Jmol.Settings.SettingsManager.call( this, params );
}
Provi.Jmol.Settings.QualityManager.prototype = Utils.extend( Provi.Jmol.Settings.SettingsManager, /** @lends Provi.Jmol.Settings.QualityManager.prototype */ {
    default_params: {
        high_resolution: false,
        antialias_display: false,
        antialias_translucent: true,
        antialias_images: true,
        wireframe_rotation: false
    },
    jmol_param_names: {
        high_resolution: "highResolution",
        antialias_display: "antialiasDisplay",
        antialias_translucent: "antialiasTranslucent",
        antialias_images: "antialiasImages",
        wireframe_rotation: "wireframeRotation"
    }
});


/**
 * A widget
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Jmol.Settings.QualityManagerWidget = function(params){
    params = _.defaults(
        params,
        Provi.Jmol.Settings.QualityManagerWidget.prototype.default_params
    );
    params.heading = 'Quality Settings';
    params.manager_name = 'quality_manager';
    
    Provi.Jmol.Settings.SettingsManagerWidget.call( this, params );
    
    this._init_eid_manager([
    'high_resolution', 'antialias_display',
    'antialias_translucent', 'antialias_images', 'wireframe_rotation',
    ]);
    
    var template = '' +
    '<div class="control_group">' +
        '<div class="control_row">' +
        '<input id="${eids.high_resolution}" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
        '<label for="${eids.high_resolution}" style="display:block;">high resolution</label>' +
        '</div>' +
        '<div class="control_row">' +
        '<input id="${eids.antialias_display}" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
        '<label for="${eids.antialias_display}" style="display:block;">antialias display</label>' +
        '</div>' +
        '<div class="control_row">' +
        '<input id="${eids.antialias_translucent}" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
        '<label for="${eids.antialias_translucent}" style="display:block;">antialias translucent</label>' +
        '</div>' +
        '<div class="control_row">' +
        '<input id="${eids.antialias_images}" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
        '<label for="${eids.antialias_images}" style="display:block;">antialias images</label>' +
        '</div>' +
        '<div class="control_row">' +
        '<input id="${eids.wireframe_rotation}" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
        '<label for="${eids.wireframe_rotation}" style="display:block;">wireframe rotation</label>' +
        '</div>' +
        '</div>' +
    '';
    
    this.add_content( template, params );
    
    this._init();
}
Provi.Jmol.Settings.QualityManagerWidget.prototype = Utils.extend(Provi.Jmol.Settings.SettingsManagerWidget, /** @lends Provi.Jmol.Settings.QualityManagerWidget.prototype */ {
    default_params: {
        
    },
    _init: function(){
        var self = this;
    
    this.elm('high_resolution').bind('click', $.proxy( this.set, this ));
    this.elm('antialias_display').bind('click', $.proxy( this.set, this ));
    this.elm('antialias_translucent').bind('click', $.proxy( this.set, this ));
    this.elm('antialias_images').bind('click', $.proxy( this.set, this ));
    this.elm('wireframe_rotation').bind('click', $.proxy( this.set, this ));
        
    Provi.Jmol.Settings.SettingsManagerWidget.prototype._init.call(this);
    },
    _sync: function(){
    var applet = this.applet_selector.get_value();
        if(applet){
        var params = applet.quality_manager.get();
        this.elm('high_resolution').attr('checked', params.high_resolution);
        this.elm('antialias_display').attr('checked', params.antialias_display);
        this.elm('antialias_translucent').attr('checked', params.antialias_translucent);
        this.elm('antialias_images').attr('checked', params.antialias_images);
        this.elm('wireframe_rotation').attr('checked', params.wireframe_rotation);
    }
    },
    set: function(){
    var applet = this.applet_selector.get_value();
        if(applet){
        applet.quality_manager.set({
        high_resolution: this.elm('high_resolution').is(':checked'),
        antialias_display: this.elm('antialias_display').is(':checked'),
        antialias_translucent: this.elm('antialias_translucent').is(':checked'),
        antialias_images: this.elm('antialias_images').is(':checked'),
        wireframe_rotation: this.elm('wireframe_rotation').is(':checked')
        });
        }
    }
});


/**
 * A class to provide a central instance for setting picking parameters
 * @constructor
 * @extends Provi.Jmol.Settings.SettingsManager
 */
Provi.Jmol.Settings.PickingManager = function(params) {
    Provi.Jmol.Settings.SettingsManager.call( this, params );
}
Provi.Jmol.Settings.PickingManager.prototype = Utils.extend( Provi.Jmol.Settings.SettingsManager, /** @lends Provi.Jmol.Settings.PickingManager.prototype */ {
    default_params: {
        atom_picking: true,
        draw_picking: false,
        picking: 'group',
        picking_style: 'toggle',
        selection_halos: true,
        selection_halos_color: 'green',
        hover_delay: 0.1
    },
    jmol_param_names: {
        atom_picking: "atomPicking",
        draw_picking: "drawPicking",
        picking: "picking",
        picking_style: "pickingStyle",
        selection_halos: "selectionHalos",
        hover_delay: "hoverDelay"
    },
    _command: function( names ){
        return '' +
            'color selectionHalos ' + this['selection_halos_color'] + ';' +
            Provi.Jmol.Settings.SettingsManager.prototype._command.call( this, names );
    }
});

/**
 * A widget
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Jmol.Settings.PickingManagerWidget = function(params){
    params = _.defaults(
        params,
        Provi.Jmol.Settings.PickingManagerWidget.prototype.default_params
    );
    params.heading = 'Picking Settings';
    params.manager_name = 'picking_manager';
    
    Provi.Jmol.Settings.SettingsManagerWidget.call( this, params );
    
    this._init_eid_manager([
        'atom_picking', 'draw_picking', 'picking', 'picking_style',
        'selection_halos', 'selection_halos_color', 'hover_delay'
    ]);
    
    var template = '' +
        '<div class="control_group">' +
            '<div class="control_row">' +
                '<input id="${eids.atom_picking}" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
                '<label for="${eids.atom_picking}" style="display:block;">atom picking</label>' +
            '</div>' +
            '<div class="control_row">' +
                '<input id="${eids.draw_picking}" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
                '<label for="${eids.draw_picking}" style="display:block;">draw picking</label>' +
            '</div>' +
            '<div class="control_row">' +
                '<label for="${eids.picking}">picking</label>' +
                '<select id="${eids.picking}" class="ui-state-default">' +
                    '<option value=""></option>' +
                    '<option value="center">center</option>' +
                    '<option value="atom">select atom</option><option value="group">select group</option>' +
                    '<option value="chain">select chain</option><option value="molecule">select molecule</option>' +
                    '<option value="label">label</option>' +
                    '<option value="spin">spin</option>' +
                    '<option value="draw">draw</option>' +
                    '<option value="distance">measure distance</option>' +
                    '<option value="angle">measure angle</option>' +
                    '<option value="torsion">measure torsion</option>' +
                '</select>' +
            '</div>' +
            '<div class="control_row">' +
                '<label for="${eids.picking_style}">picking style</label>' +
                '<select id="${eids.picking_style}" class="ui-state-default">' +
                    '<option value="toggle">select toggle</option>' +
                    '<option value="selectOrToggle">select or toggle</option>' +
                    '<option value="extendedSelect">extended select</option>' +
                    '<option value="measure">measure</option>' +
                '</select>' +
            '</div>' +
            '<div class="control_row">' +
                '<input id="${eids.selection_halos}" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
                '<label for="${eids.selection_halos}" style="display:block;">selection halos</label>' +
            '</div>' +
            '<div class="control_row">' +
                '<label for="${eids.hover_delay}">hover delay</label>' +
                '<select id="${eids.hover_delay}" class="ui-state-default">' +
                    '<option value="0.05">0.05</option>' +
                    '<option value="0.1">0.1</option><option value="0.2">0.2</option>' +
                    '<option value="0.3">0.3</option><option value="0.5">0.5</option>' +
                    '<option value="0.7">0.7</option><option value="1.0">1.0</option>' +
                '</select>' +
            '</div>' +
        '</div>' +
    '';
    
    this.add_content( template, params );
    
    this._init();
}
Provi.Jmol.Settings.PickingManagerWidget.prototype = Utils.extend(Provi.Jmol.Settings.SettingsManagerWidget, /** @lends Provi.Jmol.Settings.PickingManagerWidget.prototype */ {
    default_params: {
        
    },
    _init: function(){
        var self = this;
    
    this.elm('atom_picking').bind('click', $.proxy( this.set, this ));
    this.elm('draw_picking').bind('click', $.proxy( this.set, this ));
    this.elm('picking').bind('click change', $.proxy( function(){
        if( this._prevent ) return;
        this._prevent = true;
        var picking = this.elm('picking').children("option:selected").val();
        if( Provi.Utils.in_array( ['atom', 'group', 'chain', 'molecule'], picking ) ){
            var style = this.elm('picking_style').children("option:selected").val();
            if( !Provi.Utils.in_array( ['toggle', 'selectOrToggle', 'extendedSelect'], style ) ){
                this.elm('picking_style').val( 'toggle' );
            }
        }
        if( Provi.Utils.in_array( ['distance', 'angle', 'torsion'], picking ) ){
            this.elm('picking_style').val( 'measure' );
        }
        this.set();
        this._prevent = false;
    }, this ));
    this.elm('picking_style').bind('click change', $.proxy( function(){
        if( this._prevent ) return;
        this._prevent = true;
        var style = this.elm('picking_style').children("option:selected").val();
        if( style=='measure' ){
            this.elm('picking').val( 'distance' );
        }
        if( Provi.Utils.in_array( ['toggle', 'selectOrToggle', 'extendedSelect'], style ) ){
            var picking = this.elm('picking').children("option:selected").val();
            if( !Provi.Utils.in_array( ['atom', 'group', 'chain', 'molecule'], picking ) ){
                this.elm('picking').val( 'group' );
            }
        }
        this.set();
        this._prevent = false;
    }, this ));
    this.elm('selection_halos').bind('click', $.proxy( this.set, this ));
    this.elm('hover_delay').bind('click change', $.proxy( this.set, this ));
        
    Provi.Jmol.Settings.SettingsManagerWidget.prototype._init.call(this);
    },
    _sync: function(){
    var applet = this.applet_selector.get_value();
        if(applet){
        var params = applet.picking_manager.get();
        this.elm('atom_picking').attr('checked', params.atom_picking);
        this.elm('draw_picking').attr('checked', params.draw_picking);
        this.elm('picking').val( params.picking );
        this.elm('picking_style').val( params.picking_style );
        this.elm('selection_halos').attr('checked', params.selection_halos );
        this.elm('hover_delay').val( params.hover_delay );
    }
    },
    set: function(){
    var applet = this.applet_selector.get_value();
        if(applet){
        applet.picking_manager.set({
        atom_picking: this.elm('atom_picking').is(':checked'),
        draw_picking: this.elm('draw_picking').is(':checked'),
        picking: this.elm('picking').children("option:selected").val(),
        picking_style: this.elm('picking_style').children("option:selected").val(),
        selection_halos: this.elm('selection_halos').is(':checked'),
        hover_delay: this.elm('hover_delay').children("option:selected").val()
        });
        }
    }
});


/**
 * A class to provide a central instance for setting style parameters
 * @constructor
 * @extends Provi.Jmol.Settings.SettingsManager
 */
Provi.Jmol.Settings.StyleManager = function(params) {
    Provi.Jmol.Settings.SettingsManager.call( this, params );
    console.log( this.get_default_style() );
}
Provi.Jmol.Settings.StyleManager.prototype = Utils.extend( Provi.Jmol.Settings.SettingsManager, /** @lends Provi.Jmol.Settings.StyleManager.prototype */ {
    default_params: {
        cartoon: '0.8',
        trace: '0.3',
        line: '0.01',
        stick: '0.15',
        cpk: '20%',
        spacefill: '0.5',
        backbone: '0.3',
        style: '' +
            'select protein; cartoon only; select helix or sheet; cartoon ${cartoon};' +
            'select nucleic; ${nucleic_cartoon_style};' +
            'select (ligand or ace or ((gmy or gpl) and (sidechain or *.N or *.CA)) or ((gpl or cyg or ypl or yfa or lrt) and sidechain) ); wireframe ${stick}; spacefill ${spacefill};' +
            'select (gpl or ypl or cyg or yfa or lrt) and (sidechain or *.CA); wireframe ${stick};' +
            'select water; wireframe ${line};' +
            //'select group=hoh; cpk 20%;' +
            'select HOH; cpk ${cpk};' +
            //'select (hetero or ypl or gmy or yfa or lrt or ace) or within(GROUP, connected(hetero or ypl or lrt or ace)); wireframe ${stick};' +
            'select (hetero and not(ret or plm or ace or lrt or ypl or cyg or gmy or yfa or gpl)) or within(GROUP, connected(hetero and not(ret or plm or ace or lrt or ypl or gmy or yfa or gpl))); wireframe ${stick};' +
            'select (ace) or (within(GROUP, connected(ace)) and (*.N or *.CA)); wireframe ${stick};' +
            'select ((ret or plm or ger) and hetero) or (within(GROUP, connected(ret or plm or ger)) and (sidechain or *.CA)); wireframe ${stick};' +
            'select (dmpc or dmp or popc or pop); wireframe ${stick};' +
            'select none;' +
            '',
        hermite_level: 0,
        cartoon_rockets: false,
        ribbon_aspect_ratio: 16,
        ribbon_border: false,
        rocket_barrels: false,
        sheet_smoothing: 1,
        trace_alpha: true,
        sidechain_helper: true,
        sidechain_helper_sele: '',
        _sidechain_helper_sele_on: '(protein or nucleic) and (sidechain or *.CA or (pro and *.N))',
        _sidechain_helper_sele_off: '(protein or nucleic)',
        cartoon_base_edges: false,
        nucleic_cartoon_style: 'cartoon only',
        large_structure_style: 'select protein or nucleic; cartoon off; backbone ${backbone};'
    },
    jmol_param_names: {
        hermite_level: "hermiteLevel",
        cartoon_rockets: "cartoonRockets",
        ribbon_aspect_ratio: "ribbonAspectRatio",
        ribbon_border: "ribbonBorder",
        rocket_barrels: "rocketBarrels",
        sheet_smoothing: "sheetSmoothing",
        trace_alpha: "traceAlpha",
        cartoon_base_edges: "cartoonBaseEdges"
    },
    get_default_style: function(inline){
        var style = this.get_style( this.style );
        var large_structure_style = $.tmpl( this.large_structure_style || '', this).text();
        if( inline ){
            large_atom_count = this.applet.misc_manager.large_atom_count;
            style += 'if( {*}.count >= ' + large_atom_count + ' ){' + 
                large_structure_style + 
            '}';
        }else if( this.applet.large_atom_count() ){
            style += large_structure_style;
        }
        return style + 'select none;';
    },
    get_style: function( style ){
        this.sidechain_helper_sele = this.sidechain_helper ? this._sidechain_helper_sele_on : this._sidechain_helper_sele_off;
        var tpl = $.tmpl( style || '', this );
        console.log(tpl, tpl.length);
        return ( (tpl && tpl.length) ? tpl.text() : '') + 'select none;';
    },
    _command: function( names ){
        // var trace = this['trace'];
        // if( this['trace']=='0.333' ){
        //     // try with help of a temporary property! AR
        //     trace = '0.333; for( var a in {*.CA and trace=0.333} ){ {a}.trace = 4*{a}.temperature; };';
        // }
        return '' +
            // 'select cartoon>0 and (helix or sheet); cartoon ' + this['cartoon'] + '; select none; ' +
            //'select trace>0; trace ' + trace + '; select none; ' +
            Provi.Jmol.Settings.SettingsManager.prototype._command.call( this, names );
    }
});

/**
 * A widget
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Jmol.Settings.StyleManagerWidget = function(params){
    params = _.defaults(
        params,
        Provi.Jmol.Settings.StyleManagerWidget.prototype.default_params
    );
    params.heading = 'Style Settings';
    params.manager_name = 'style_manager';
    
    Provi.Jmol.Settings.SettingsManagerWidget.call( this, params );
    
    this._init_eid_manager([
        'cartoon', 'line', 'stick', 'cpk', 'spacefill', 'backbone', 'trace',
        'hermite_level', 'cartoon_rockets', 'ribbon_aspect_ratio', 'ribbon_border',
        'rocket_barrels', 'sheet_smoothing', 'trace_alpha', 'sidechain_helper',
        'nucleic_cartoon_style', 'cartoon_base_edges'
    ]);
    
    var template = '' +
    '<div class="control_group">' +
        '<div class="control_row">' +
            '<label for="${eids.cartoon}">cartoon</label>' +
            '<select id="${eids.cartoon}" class="ui-state-default">' +
                '<option value="0.1">0.1</option><option value="0.2">0.2</option>' +
                '<option value="0.3">0.3</option><option value="0.4">0.4</option>' +
                '<option value="0.5">0.5</option><option value="0.6">0.6</option>' +
                '<option value="0.7">0.7</option><option value="0.8">0.8</option>' +
                '<option value="0.9">0.9</option>' +
                '<option value="1.0">1.0</option><option value="1.3">1.3</option>' +
                '<option value="1.5">1.5</option><option value="1.7">1.7</option>' +
                '<option value="2.0">2.0</option><option value="2.5">2.5</option>' +
                '<option value="3.0">3.0</option><option value="3.5">3.5</option>' +
            '</select>' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="${eids.trace}">trace</label>' +
            '<select id="${eids.trace}" class="ui-state-default">' +
                '<option value="0.01">0.01</option><option value="0.05">0.05</option>' +
                '<option value="0.1">0.1</option><option value="0.15">0.15</option>' +
                '<option value="0.2">0.2</option><option value="0.3">0.3</option>' +
                '<option value="0.4">0.4</option><option value="0.5">0.5</option>' +
                '<option value="0.7">0.7</option><option value="1.0">1.0</option>' +
                '<option value="0.333">b-factor</option>' +
            '</select>' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="${eids.backbone}">backbone</label>' +
            '<select id="${eids.backbone}" class="ui-state-default">' +
                '<option value="0.1">0.1</option><option value="0.2">0.2</option>' +
                '<option value="0.3">0.3</option><option value="0.4">0.4</option>' +
                '<option value="0.5">0.5</option><option value="0.6">0.6</option>' +
                '<option value="0.7">0.7</option><option value="0.8">0.8</option>' +
                '<option value="0.9">0.9</option>' +
                '<option value="1.0">1.0</option><option value="1.3">1.3</option>' +
                '<option value="1.5">1.5</option><option value="1.7">1.7</option>' +
                '<option value="2.0">2.0</option><option value="2.5">2.5</option>' +
                '<option value="3.0">3.0</option><option value="3.5">3.5</option>' +
            '</select>' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="${eids.line}">line</label>' +
            '<select id="${eids.line}" class="ui-state-default">' +
                '<option value="0.001">0.001</option><option value="0.005">0.005</option>' +
                '<option value="0.01">0.01</option><option value="0.02">0.02</option>' +
                '<option value="0.03">0.03</option><option value="0.05">0.05</option>' +
            '</select>' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="${eids.hermite_level}">hermite level</label>' +
            '<select id="${eids.hermite_level}" class="ui-state-default">' +
                '<option value="-4">-4</option><option value="-3">-3</option>' +
                '<option value="-2">-2</option><option value="-1">-1</option>' +
                '<option value="0">0</option>' +
                '<option value="1">1</option><option value="2">2</option>' +
                '<option value="3">3</option><option value="4">4</option>' +
            '</select>' +
        '</div>' +
        '<div class="control_row">' +
            '<input id="${eids.cartoon_rockets}" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
            '<label for="${eids.cartoon_rockets}" style="display:block;">cartoon rockets</label>' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="${eids.ribbon_aspect_ratio}">ribbon aspect ratio</label>' +
            '<select id="${eids.ribbon_aspect_ratio}" class="ui-state-default">' +
                '<option value="2">2</option><option value="3">3</option>' +
                '<option value="4">4</option><option value="5">5</option>' +
                '<option value="6">6</option><option value="7">7</option>' +
                '<option value="8">8</option><option value="9">9</option>' +
                '<option value="10">10</option><option value="11">11</option>' +
                '<option value="12">12</option><option value="13">13</option>' +
                '<option value="14">14</option><option value="15">15</option>' +
                '<option value="16">16</option><option value="17">17</option>' +
            '</select>' +
        '</div>' +
        '<div class="control_row">' +
            '<input id="${eids.ribbon_border}" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
            '<label for="${eids.ribbon_border}" style="display:block;">ribbon border</label>' +
        '</div>' +
        '<div class="control_row">' +
            '<input id="${eids.rocket_barrels}" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
            '<label for="${eids.rocket_barrels}" style="display:block;">rocket barrels</label>' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="${eids.sheet_smoothing}">sheet smoothing</label>' +
            '<select id="${eids.sheet_smoothing}" class="ui-state-default">' +
                '<option value="0">0</option><option value="0.1">0.1</option>' +
                '<option value="0.2">0.2</option><option value="0.3">0.3</option>' +
                '<option value="0.4">0.4</option><option value="0.5">0.5</option>' +
                '<option value="0.6">0.6</option><option value="0.7">0.7</option>' +
                '<option value="0.8">0.8</option><option value="0.9">0.9</option>' +
                '<option value="1.0">1.0</option>' +
            '</select>' +
        '</div>' +
        '<div class="control_row">' +
            '<input id="${eids.trace_alpha}" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
            '<label for="${eids.trace_alpha}" style="display:block;">trace alpha</label>' +
        '</div>' +
        '<div class="control_row">' +
            '<input id="${eids.sidechain_helper}" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
            '<label for="${eids.sidechain_helper}" style="display:block;">sidechain helper</label>' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="${eids.nucleic_cartoon_style}">nucleic cartoon style</label>' +
            '<select id="${eids.nucleic_cartoon_style}" class="ui-state-default">' +
                '<option value="ribbon -0.4">ribbon</option>' +
                '<option value="trace only">trace</option>' +
                '<option value="cartoon only">cartoon</option>' +
            '</select>' +
        '</div>' +
        '<div class="control_row">' +
            '<input id="${eids.cartoon_base_edges}" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
            '<label for="${eids.cartoon_base_edges}" style="display:block;">cartoon base edges</label>' +
        '</div>' +
    '</div>' +
    '';
    
    this.add_content( template, params );
    
    this._init();
}
Provi.Jmol.Settings.StyleManagerWidget.prototype = Utils.extend(Provi.Jmol.Settings.SettingsManagerWidget, /** @lends Provi.Jmol.Settings.StyleManagerWidget.prototype */ {
    default_params: {
        
    },
    _init: function(){
        var self = this;
    
        this.elm('cartoon').bind('click change', $.proxy( this.set, this ));
        this.elm('trace').bind('click change', $.proxy( this.set, this ));
        this.elm('backbone').bind('click change', $.proxy( this.set, this ));
        this.elm('line').bind('click change', $.proxy( this.set, this ));
            
        this.elm('hermite_level').bind('click change', $.proxy( this.set, this ));
        this.elm('cartoon_rockets').bind('click', $.proxy( this.set, this ));
        this.elm('ribbon_aspect_ratio').bind('click change', $.proxy( this.set, this ));
        this.elm('ribbon_border').bind('click', $.proxy( this.set, this ));
        this.elm('rocket_barrels').bind('click', $.proxy( this.set, this ));
        this.elm('sheet_smoothing').bind('click change', $.proxy( this.set, this ));
        this.elm('trace_alpha').bind('click', $.proxy( this.set, this ));
        this.elm('sidechain_helper').bind('click', $.proxy( this.set, this ));
        this.elm('nucleic_cartoon_style').bind('click change', $.proxy( this.set, this ));
        this.elm('cartoon_base_edges').bind('click', $.proxy( this.set, this ));
        
        Provi.Jmol.Settings.SettingsManagerWidget.prototype._init.call(this);
    },
    _sync: function(){
        var applet = this.applet_selector.get_value();
        if(applet){
            var params = applet.style_manager.get();
            this.elm('cartoon').val( params.cartoon );
            this.elm('trace').val( params.trace );
            this.elm('backbone').val( params.backbone );
            this.elm('line').val( params.line );
            
            this.elm('hermite_level').val( params.hermite_level );
            this.elm('cartoon_rockets').attr('checked', params.cartoon_rockets);
            this.elm('ribbon_aspect_ratio').val( params.ribbon_aspect_ratio );
            this.elm('ribbon_border').attr('checked', params.ribbon_border);
            this.elm('rocket_barrels').attr('checked', params.rocket_barrels);
            this.elm('sheet_smoothing').val( params.sheet_smoothing );
            this.elm('trace_alpha').attr('checked', params.trace_alpha);
            this.elm('sidechain_helper').attr('checked', params.sidechain_helper);
            this.elm('nucleic_cartoon_style').val( params.nucleic_cartoon_style );
            this.elm('cartoon_base_edges').attr('checked', params.cartoon_base_edges);
        }
    },
    set: function(){
        var applet = this.applet_selector.get_value();
        if(applet){
            applet.style_manager.set({
                cartoon: this.elm('cartoon').children("option:selected").val(),
                trace: this.elm('trace').children("option:selected").val(),
                backbone: this.elm('backbone').children("option:selected").val(),
                line: this.elm('line').children("option:selected").val(),
                
                hermite_level: this.elm('hermite_level').children("option:selected").val(),
                cartoon_rockets: this.elm('cartoon_rockets').is(':checked'),
                ribbon_aspect_ratio: this.elm('ribbon_aspect_ratio').children("option:selected").val(),
                ribbon_border: this.elm('ribbon_border').is(':checked'),
                rocket_barrels: this.elm('rocket_barrels').is(':checked'),
                sheet_smoothing: this.elm('sheet_smoothing').children("option:selected").val(),
                trace_alpha: this.elm('trace_alpha').is(':checked'),
                sidechain_helper: this.elm('sidechain_helper').is(':checked'),
                nucleic_cartoon_style: this.elm('nucleic_cartoon_style').children("option:selected").val(),
                cartoon_base_edges: this.elm('cartoon_base_edges').is(':checked')
            });
        }
    }
});







})();
