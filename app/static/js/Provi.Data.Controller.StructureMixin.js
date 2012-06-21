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
            { name: 'filter', getter: 'get_filter' }
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
    },
    load: function( applet, load_as, style ){
        
    }
    //,
    // jmol_load: function(){
    //     var selection = 'protein and {*}';
    //     var format = '\'%[group]\',\'%[sequence]\',%[resno],\'%[chain]\',\'%[atomName]\',%[atomNo],\'%[model]\'';
    //     var protein_data = applet.evaluate('"[" + {' + selection + '}.label("[' + format + ']").join(",") + "]"');
    //     //console.log( protein_data );
    //     protein_data = protein_data.replace(/\'\'/g,"'");
    //     //console.log( protein_data );
    //     protein_data = eval( protein_data );
        
    //     var s = new Bio.Pdb.Structure('1');
    //     var m = new Bio.Pdb.Model('1');
    //     s.add( m );
        
    //     $.each(protein_data, function() {
    //         //console.log(this);
    //         var atom = this;
    //         //console.log(atom);
    //         var group = atom[0],
    //             sequence = atom[1],
    //             resno = atom[2],
    //             chain = atom[3],
    //             atomName = atom[4],
    //             atomNo = atom[5];
            
    //         var c = m.get( chain );
    //         //console.log('chain', chain, c);
    //         if( !c ){
    //             c = new Bio.Pdb.Chain( chain );
    //             m.add( c );
    //         }
            
    //         var r = c.get( resno );
    //         //console.log('residue', resno, r);
    //         if( !r ){
    //             r = new Bio.Pdb.Residue( resno, group );
    //             c.add( r );
    //         }
            
    //         var a = new Bio.Pdb.Atom( atomName, [], 0, 0, "", atomName, atomNo, "" );
    //         try{
    //             r.add( a );
    //         }catch(err){
    //             //console.log(err);
    //         }
    //     });
        
    //     console.log(m);
    //     self.set_data( s );
    //     new Provi.Bio.Sequence.TreeViewWidget({
    //         parent_id: Provi.defaults.dom_parent_ids.SELECTION_WIDGET,
    //         dataset: self
    //     });
    // }
}