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
    this.filename = params.filename;

    this.applet = params.applet;
    this.load_as = params.load_as;
    this.style = params.style;
    this.script = params.script;
    this.filter = params.filter;
    this.lattice = params.lattice;
    this.type = params.type;

    this.load();
};
Provi.Bio.Structure.Structure.prototype = /** @lends Provi.Bio.Structure.Structure.prototype */ {
    default_params: {
        style: '',
        load_as: undefined,
        script: false,
        filter: '',
        lattice: ''
    },
    load: function(){
        this.load_file();
    },
    load_file: function(){
        var self = this;
        var applet = this.applet;
        var load_as = this.load_as;
        var style = this.style;
        var script = this.script;
        var filter = this.filter;
        var lattice = this.lattice;
        var type = this.type;
        
        if( $.inArray(type, ['pdb', 'pqr', 'ent', 'sco', 'mbn', 'vol', 'cif']) >= 0 ){
            type = 'pdb';
        }
        var jmol_types = {
            pdb: 'PDB',
            ent: 'PDB',
            gro: 'GROMACS'
        };
        type = jmol_types[type];
        type = type ? (type + '::') : '';
        type = '';
        if( !style ){
            style = applet.style_manager.get_default_style(true);
        }else{
            style = 'select all; ' + style;
        }
        if( load_as != 'append' && load_as != 'trajectory+append' ){
            applet._delete();
        }

        var path = '"' + type + this.filename;

        if(filter){
            path += ' FILTER "' + filter + '"';
        }

        if(lattice){
            path += ' ' + lattice + '';
        }
        
        // load structural data into the jmol applet
        var s = '';
        if(load_as == 'trajectory'){
            s = 'load TRAJECTORY ' + path + '; ' + style;
        }else if(load_as == 'trajectory+append'){
            s = 'load APPEND TRAJECTORY ' + path + '; ' +
                'subset file = _currentFileNumber; ' + style + ' subset;';
        }else if(load_as == 'append'){
            s = 'load APPEND ' + path + '; ' +
                'subset file = _currentFileNumber; ' + style + '; subset; ';
        //}else if(load_as == 'new'){
        }else{
            console.log('../../data/get/' + params);
            s = 'load ' + path + '; ' + style;
        }

        applet.script_callback( s, { maintain_selection: true, try_catch: true }, function(){
            if( load_as != 'append' && load_as != 'trajectory+append' ){
                applet.lighting_manager.set();
                applet.clipping_manager.set();
                applet.picking_manager.set();
            }
            applet.picking_manager.set();
            applet.misc_manager.set();
            if( load_as != 'trajectory+append' && load_as != 'trajectory'  ){
                applet.script( 'frame all;', { maintain_selection: true, try_catch: true } );
            }
            if( script ){
                applet.script( script, { maintain_selection: true, try_catch: true } );
            }
        });
    }
};



/**
 * A widget to select a structure loading type
 * @constructor
 */
Provi.Bio.Structure.StructureParamsWidget = function(params){
    params = _.defaults(
        params,
        Provi.Bio.Structure.StructureParamsWidget.prototype.default_params
    );
    Provi.Widget.Widget.call( this, params );

    this._init_eid_manager([
        'load_as', 'filter', 'lattice'
    ]);

    var template = '' +
        '<div class="control_row">' +
            '<label for="${eids.load_as}">Structure load as:</label>' +
            '<select id="${eids.load_as}" class="ui-state-default">' +
                '<option value="new">new</option>' +
                '<option value="append">append</option>' +
                '<option value="trajectory">new trajectory</option>' +
                '<option value="trajectory+append">append trajectory</option>' +
            '</select>' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="${eids.filter}">Structure load filter:</label>' +
            '<select id="${eids.filter}" class="ui-state-default">' +
                '<option value=""></option>' +
                '<option value="![HOH],![SOL],![WAT],![NA],![CL]">no water, no ions</option>' +
                '<option value="![HOH],![SOL],![WAT],![NA],![CL],![DMPC],![DMP],![MPC]">no water, no ions, no lipids</option>' +
                '<option value="*.P,*.CA">P, CA only</option>' +
                '<option value="*.P,*.CA|HETATM">P, CA only + HETATM</option>' +
            '</select>' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="${eids.lattice}">Symmetry lattice:</label>' +
            '<select id="${eids.lattice}" class="ui-state-default">' +
                '<option value=""></option>' +
                '<option value="{1 1 1}">{1 1 1}</option>' +
                '<option value="{1 1 1} RANGE -12">{1 1 1} RANGE -12</option>' +
                '<option value="{2 2 1}">{2 2 1}</option>' +
                '<option value="{2 2 2}">{2 2 2}</option>' +
                '<option value="{3 3 1}">{3 3 1}</option>' +
                '<option value="{3 3 3}">{3 3 3}</option>' +
            '</select>' +
        '</div>' +
    '';
    this.add_content( template, params );
}
Provi.Bio.Structure.StructureParamsWidget.prototype = Utils.extend(Widget, /** @lends Provi.Bio.Structure.StructureParamsWidget.prototype */ {
    default_params: {

    },
    get_load_as: function(){
        return this.elm("load_as").children("option:selected").val();
    },
    get_filter: function(){
        return this.elm("filter").children("option:selected").val();
    },
    get_lattice: function(){
        return this.elm("lattice").children("option:selected").val();
    }
});


})();