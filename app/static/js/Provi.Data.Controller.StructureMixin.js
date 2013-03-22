/**
 * @fileOverview This file contains the {@link Provi.Data.Controller.StructureMixin} controller.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */

/**
 * @class
 */
Provi.Data.Controller.StructureMixin = {
    available_widgets: {
        'StructureWidget': Provi.Bio.Structure.StructureWidget
    },
    load_params_widget: [{
        params: [
            { name: 'load_as', getter: 'get_load_as' },
            { name: 'filter', getter: 'get_filter' },
            { name: 'lattice', getter: 'get_lattice' }
        ],
        obj: Provi.Bio.Structure.StructureParamsWidget
    }],
    init: function(params){
        Provi.Data.Dataset.prototype.init.call(this, params);
        if( params.applet ){

            var get_params = '?id=' + this.server_id + '&session_id=' + $.cookie('provisessions');
            //var params = '?id=' + this.dataset.server_id;
            
            if( $.inArray(this.type, ['pdb', 'pqr', 'ent', 'sco', 'mbn', 'vol']) >= 0 ){
                get_params += '&data_action=get_pdb';
            }

            filename = '../../data/get/' + get_params + '"';

            if( !params.script ) params.script = '';
            params.script += 'print "provi dataset: ' + this.id + ' loaded";';

            new Provi.Bio.Structure.Structure( $.extend( params, {
                filename: filename,
                type: this.type,
                dataset: this
            }));
        }
    }
}