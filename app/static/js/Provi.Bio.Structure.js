/**
 * @fileOverview This file contains the {@link Provi.Bio.Structure} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * @namespace
 * Structure module
 */
Provi.Bio.Structure = {};


(function() {

/** @exports Utils as Provi.Utils */
var Utils = Provi.Utils;
/** @exports Widget as Provi.Widget.Widget */
var Widget = Provi.Widget.Widget;



/**
 * @class Represents Structure
 */
Provi.Bio.Structure.Structure = function(params){
    params = _.defaults( params, this.default_params );
    var p = [ "applet", "load_as", "style", "script", "filter", "lattice", "pdb_add_hydrogens", "dataset" ];
    _.extend( this, _.pick( params, p ) );
    this.load();
};
Provi.Bio.Structure.Structure.prototype = /** @lends Provi.Bio.Structure.Structure.prototype */ {
    default_params: {
        style: '',
        load_as: undefined,
        script: '',
        filter: '',
        lattice: '',
        pdb_add_hydrogens: false
    },
    load: function(){
        var self = this;
        var style = this.style;
        var post_script = this.script || '';
        var type = this.dataset.type;
        
        if( _.contains(['pdb', 'pqr', 'ent', 'sco', 'mbn', 'vol', 'cif'], type ) ){
            type = 'pdb';
        }
        var jmol_types = {
            pdb: 'PDB',
            gro: 'GROMACS'
        };
        type = jmol_types[type];
        type = type ? (type + '::') : '';
        type = '';
        if( !style ){
            style = 'provi_style();';
        }else{
            style = 'select all; ' + style;
        }
        if( this.load_as != 'append' && this.load_as != 'trajectory+append' ){
            this.applet._delete();
        }

        var path = '"' + type + this.dataset.url + '"';
        if( this.filter ) path += ' FILTER "' + this.filter + '"';
        if( this.lattice ) path += ' ' + this.lattice + '';
        
        // add hydrogens and multiple bonding (fetches ligand data from rcsb pdb)
        var s = 'set pdbAddHydrogens ' + ( this.pdb_add_hydrogens ? 'true' : 'false' ) + ';';

        // load structural data into the jmol applet
        if( this.load_as == 'trajectory' ){
            s += 'load TRAJECTORY ' + path + '; ' + style;
        }else if( this.load_as == 'trajectory+append' ){
            s += 'load APPEND TRAJECTORY ' + path + '; ' +
                'subset file = _currentFileNumber; ' + style + '; subset;';
        }else if( this.load_as == 'append' ){
            s += 'load APPEND ' + path + '; ' +
                'subset file = _currentFileNumber; ' + style + '; subset; ';
        }else{
            s += 'load ' + path + '; ' + style;
        }
        console.log(s);

        this.applet.script_callback( s, { maintain_selection: true, try_catch: false }, function(){
            post_script = 'provi_settings_init();' + post_script;
            if( this.load_as != 'trajectory+append' && this.load_as != 'trajectory'  ){
                post_script = 'frame all;' + post_script;
            }
            if( self.dataset ){
                post_script += 'print "provi dataset: ' + self.dataset.id + ' loaded";';
            }
            self.applet.script( post_script, { maintain_selection: true, try_catch: false } );
        });
    }
};





/**
 * A widget to select a structure loading type
 * @constructor
 */
Provi.Bio.Structure.StructureParamsWidget = function(params){
    Provi.Widget.ParamsWidget.call( this, params );
}
Provi.Bio.Structure.StructureParamsWidget.prototype = Utils.extend(Provi.Widget.ParamsWidget, /** @lends Provi.Bio.Structure.StructureParamsWidget.prototype */ {
    params_dict: {
        load_as: {
            default_value: "new",
            type: "select", 
            options: [ "new", "append", "trajectory", "trajectory+append" ] 
        },
        lattice: { 
            default_value: "",
            type: "select", 
            options: [ "", "{1 1 1}", "{1 1 1} RANGE -12", "{2 2 1}", "{2 2 2}", "{3 3 1}", "{3 3 3}" ]
        },
        filter: {
            default_value: "",
            type: "select", 
            options: {
                "": "", 
                "no water, no ions": "![HOH],![SOL],![WAT],![NA],![CL]", 
                "no water, no ions, no lipids": "![HOH],![SOL],![WAT],![NA],![CL],![DMPC],![DMP],![MPC]", 
                "P, CA only": "*.P,*.CA", 
                "P, CA only + HETATM": "*.P,*.CA|HETATM"
            }
        },
        pdb_add_hydrogens: {
            default_value: false,
            type: "checkbox" 
        }
    }
});





})();