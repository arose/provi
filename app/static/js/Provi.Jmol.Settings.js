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

// TODO are these used anywhere anymore?
Provi.Jmol.Settings.Radii = {};
Provi.Jmol.Settings.Radii['jmol'] = {'C':1.95,'N':1.85,'O':1.7,'S':2,'Mg':1.73,'Fe':1.7,'Zn':1.39};
Provi.Jmol.Settings.Radii['babel'] = {'C':1.7,'N':1.6,'O':1.55,'S':1.8,'Mg':2.2,'Fe':2.05,'Zn':2.1};



Provi.Jmol.Settings.groups = {
    misc: [ "defaultVDW", "isosurfacePropertySmoothing", "largeAtomCount",
        "translucent" ],
    lighting: [ "ambientPercent", "diffusePercent", "specular", 
        "specularPercent", "specularPower", "specularExponent", 
        "phongExponent", "zShade", "zShadePower", "zSlab", "zDepth", 
        "celShading", "celShadingPower", "backgroundColor" ],
    bind: [ "mousedragFactor", "mousewheelFactor", "useArcBall" ],
    clipping: [ "slabEnabled", "slabRange", "slabByAtom", "slabByMolecule", 
        "slab", "depth" ],
    quality: [ "highResolution", "antialiasDisplay", "antialiasTranslucent", 
        "antialiasImages", "wireframeRotation", "platformSpeed" ],
    picking: [ "atomPicking", "drawPicking", "picking", "pickingStyle", 
        "selectionHalos", "selectionHalosColor", "hoverDelay", "highlightColor" ],
    style: [ "cartoon", "trace", "line", "stick", "cpk", "spacefill", 
        "backbone", "hermiteLevel", "cartoonRockets", "cartoonFancy", 
        "ribbonAspectRatio", "ribbonBorder", "rocketBarrels", 
        "sheetSmoothing", "traceAlpha", "cartoonBaseEdges", 
        "cartoonLadder", "cartoonRibose", "sidechainHelper", "style" ],
    sys: [ "appletProxy" ],
}


Provi.Jmol.Settings.dict = {
    platformSpeed: { type: "int", range: [ 0, 8 ] },

    defaultVDW: { type: "str", options: [ "jmol", "babel", "rasmol" ] },
    isosurfacePropertySmoothing: { type: "bool" },
    largeAtomCount: { type: "bool", provi: true },
    translucent: { type: "bool" },

    ambientPercent: { type: "int", range: [ 1, 100 ] },
    diffusePercent: { type: "int", range: [ 1, 100 ] },
    specular: { type: "bool" },
    specularPercent: { type: "int", range: [ 1, 100 ] },
    specularPower: { type: "int", range: [ 1, 100 ] },
    specularExponent: { type: "int", options: _.range( 1, 10 ) },
    phongExponent: { type: "int", range: [ 1, 100 ] }, 
    zShade: { type: "bool" },
    zShadePower: { type: "int", options: _.range( 1, 4 ) },
    zSlab: { type: "int", range: [ 1, 100 ] },
    zDepth: { type: "int", range: [ 1, 100 ] },
    celShading: { type: "bool" },
    celShadingPower: { type: "int", range: [ -20, 20 ] },
    backgroundColor: { type: "str", options: [ "[xFFFFFF]", "[x000000]" ] },

    mousedragFactor: { type: "float", range: [ 0.5, 8 ], step: 0.1 },
    mousewheelFactor: { type: "float", range: [ 1.05, 4 ], step: 0.05 },
    useArcBall: { type: "bool" },

    slabEnabled: { type: "bool" },
    slabRange: { type: "int", range: [ 0, 100 ] },
    slabByAtom: { type: "bool" },
    slabByMolecule: { type: "bool" },
    slab: { type: "int", range: [ 0, 100 ] },
    depth: { type: "int", range: [ 0, 100 ] },

    highResolution: { type: "bool" },
    antialiasDisplay: { type: "bool" },
    antialiasTranslucent: { type: "bool" },
    antialiasImages: { type: "bool" },
    wireframeRotation: { type: "bool" },

    atomPicking: { type: "bool" },
    drawPicking: { type: "bool" },
    picking: { type: "str", options: [ 
        "", "center", "atom", "group", "chain", "molecule", "label", 
        "spin", "draw", "distance", "angle", "torsion" ] },
    pickingStyle: { type: "str", options: [ 
        "toggle", "selectOrToggle", "extendedSelect", "measure" ] },
    selectionHalos: { type: "bool" },
    selectionHalosColor: { type: "str", options: [ "green", "gold" ], provi: true },
    highlightColor: { type: "str", options: [ 
        "pink", "yellow", "black", "white", "green", "gold" ], provi: true },
    hoverDelay: { type: "float", range: [ 0.01, 1 ], step: 0.01 },

    // cpk: 
    // spacefill: 
    // cartoon: { type: "str", options: _.range( 0.1, 1.6, 0.1 ), provi: true, value: "float", fixed: 1 },
    cartoon: { type: "float", range: [ 0.1, 2 ], step: 0.1 },
    trace: { type: "float", range: [ 0.1, 1.4 ], step: 0.1 },
    line: { type: "float", range: [ 0.01, 0.1 ], step: 0.01 },
    stick: { type: "float", range: [ 0.1, 1.6 ], step: 0.1 },
    backbone: { type: "float", range: [ 0.1, 2.5 ], step: 0.1 },
    hermiteLevel: { type: "int", range: [ -8, 8 ] },
    cartoonRockets: { type: "bool" },
    cartoonFancy: { type: "bool" },
    ribbonAspectRatio: { type: "int", range: [ 1, 20 ] },
    ribbonBorder: { type: "bool" },
    rocketBarrels: { type: "bool" },
    sheetSmoothing: { type: "bool" },
    traceAlpha: { type: "bool" },
    cartoonBaseEdges: { type: "bool" },
    cartoonLadders: { type: "bool" },
    cartoonRibose: { type: "bool" },
    sidechainHelper:  { type: "bool", provi: true },
    style: { type: "str", options: [ 
        "", "default", "lines", "sticks", "cartoon", "cartoon+sticks", 
        "backbone", "backbone+sticks", "trace" ] },

    meshScale: { type: "int", options: [ 1, 2, 3 ] },

    appletProxy: { type: "str" }
}




Provi.Jmol.Settings.SettingsDatalist = function(params){
    Provi.Data.Datalist.call( this, params );
    this.handler = {};
}
Provi.Jmol.Settings.SettingsDatalist.prototype = Utils.extend(Provi.Data.Datalist, {
    type: "SettingsDatalist",
    get_ids: function(){
        return _.keys( Provi.Jmol.Settings.dict );
    },
    get_data: function(id){
        return this.applet.evaluate( 'provi_get("' + id + '");' );
    },
    make_row: function(id){
        if( id=="all" ) return;
        return Provi.Widget.form_builder( 
            Provi.Jmol.Settings.dict[ id ] || {},
            this.get_data( id ), id, this
        )
    },
    set: function(e){
        var elm = $(e.currentTarget);
        var id = elm.data('id');
        var p = Provi.Jmol.Settings.dict[ id ] || {};
        
        var value = Provi.Widget.form_parser( elm, id, p );;
        if( p.type=="str" ){
            value = '"' + value + '"';
        }

        var s = 'provi_set("' + id + '", ' + value + ', false);';
        if( e.type=="slide" ){
            this.applet.script( s );
        }else{
            this.applet.script_callback( 
                s, {}, _.bind( this.invalidate, this ) 
            );
        }
    }    
});




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



})();
