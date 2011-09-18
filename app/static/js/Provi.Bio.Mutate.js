/**
 * @fileOverview This file contains the {@link Provi.Bio.Mutate} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * @namespace
 * Rotamers module
 */
Provi.Bio.Mutate = {};


(function() {

/** @exports Utils as Provi.Utils */
var Utils = Provi.Utils;

/** @exports Widget as Provi.Widget.Widget */
var Widget = Provi.Widget.Widget;


Provi.Bio.Mutate._pdb_atom_format_string = "%s%5i %-4s%c%3s %c%4i%c   %8.3f%8.3f%8.3f%6.2f%6.2f      %4s%2s%2s\n";

Provi.Bio.Mutate.res_db = {
    'TYR': [
        { name: ' N  ', coords: [1.622, 13.211, 6.524], type: 'N' },
        { name: ' CA ', coords: [0.794, 12.027, 6.667], type: 'C' },
        { name: ' C  ', coords: [1.262, 11.218, 7.863], type: 'C' },
        { name: ' O  ', coords: [0.173, 10.574, 8.454], type: 'O' },
        { name: ' CB ', coords: [0.804, 11.240, 5.360], type: 'C' },
        { name: ' CG ', coords: [-0.197, 10.133, 5.366], type: 'C' },
        { name: ' CD1', coords: [-1.613, 10.431, 5.606], type: 'C' },
        { name: ' CD2', coords: [0.240, 8.750, 5.130], type: 'C' },
        { name: ' CE1', coords: [-2.594, 9.338, 5.648], type: 'C' },
        { name: ' CE2', coords: [-0.744, 7.658, 5.152], type: 'C' },
        { name: ' CZ ', coords: [-2.154, 7.958, 5.422], type: 'C' },
        { name: ' OH ', coords: [-3.069, 6.942, 5.457], type: 'O' }
    ]
}

Provi.Bio.Mutate.build_pdb_line = function( params ){
    var p = $.extend({
        atom_number: 1, fullname: '    ',
        altloc: ' ', resname: '   ',
        chain_id: ' ', resseq: 1, icode: ' ',
        x: 0.0, y: 0.0, z: 0.0,
        occupancy: 1.0, bfactor: 0.0, segid: ' ', 
        element: '  ', charge: '  ', hetatom: false
    }, params);
    
    var record_type = p.hetatom ? "HETATM" : "ATOM  ";

    args = [
        p.record_type, p.atom_number, p.fullname, p.altloc, p.resname, p.chain_id, 
        p.resseq, p.icode, p.x, p.y, p.z, p.occupancy, p.bfactor, p.segid, 
        p.element, p.charge
    ];
    return _ATOM_FORMAT_STRING % args
}

/**
 * A widget
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Bio.Mutate.MutateWidget = function(params){
    params = $.extend(
        Provi.Bio.Mutate.MutateWidget.prototype.default_params,
        params
    );
    console.log('STRUCTURE', params);
    params.persist_on_applet_delete = false;
    params.heading = 'Mutate';
    //params.collapsed = false;
    Provi.Widget.Widget.call( this, params );
    this._init_eid_manager( ['applet_selector'] );
    
    var template = '' +
        '<div class="control_row" id="${eids.applet_selector}"></div>' +
        
	'';
    
    this.add_content( template, params );
    this.applet_selector = new Provi.Jmol.JmolAppletSelectorWidget({
        parent_id: this.eid('applet_selector')
    });
    this._init();
}
Provi.Bio.Mutate.MutateWidget.prototype = Utils.extend(Provi.Widget.Widget, /** @lends Provi.Bio.Mutate.MutateWidget.prototype */ {
    default_params: {
        
    },
    _init: function(){
        var self = this;
        
        
        
	Provi.Widget.Widget.prototype.init.call(this);
    },
    mutate: function(){
        var applet = self.applet_selector.get_value();
        if(applet){
            
            
        }
    },
    get_mutate_script: function(  ){
        
    },
    get_mutated_residue: function( res ){
        res_tpl = Provi.Bio.Mutate.res_db[ res ];
        
    }
});





})();