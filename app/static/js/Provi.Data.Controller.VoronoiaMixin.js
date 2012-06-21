/**
 * @fileOverview This file contains the {@link Provi.Data.Controller.VoronoiaMixin} controller.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */

/**
 * @class
 */
Provi.Data.Controller.VoronoiaMixin = $.extend(true, {}, Provi.Data.Controller.StructureMixin, /** @lends Provi.Data.Controller.StructureMixin.prototype */ {
    available_widgets: {
        'VoronoiaWidget': Provi.Bio.Voronoia.VoronoiaWidget
    },
    init: function( params ){
        var self = this;
        this.set_data( new Provi.Bio.Voronoia.Vol( [], [] ) );
        
        Provi.Data.Controller.StructureMixin.init.call( this, params );
    
        this.retrieve_data( params.applet, function( atoms, cavities, neighbours, cavities_model_number ){
            self.data.init( atoms, cavities, neighbours );
            self.add_data( 'residue_map', new Provi.Bio.Voronoia.VolResidueMap( self.data ) );
            console.log( cavities_model_number, self.data );
            if( params.applet ){
                new Provi.Bio.Voronoia.VoronoiaWidget( $.extend( params, {
                    parent_id: Provi.defaults.dom_parent_ids.DATASET_WIDGET,
                    dataset: self,
                    cavities_model_number: cavities_model_number
                }));
            }
        });
    },
    load: function(applet, load_as){

    },
    retrieve_data: function( applet, onload ){
        var self = this;
        this.get_atoms( function( atoms ){
            self.get_cavities( applet, function( cavities, cavities_model_number ){
                self.get_neighbours( function( neighbours ){
                    onload( atoms, cavities, neighbours, cavities_model_number );
                })
            });
        });
    },
    get_atoms: function( onload ){
        var get_params = {
            'id': this.server_id+'',
            'data_action': 'get_atoms'
        };
        $.getJSON( '../../data/get/', get_params, onload );
    },
    get_cavities: function( applet, onload ){
        applet._script_wait('load APPEND "PDB::../../data/get/?id=' + this.server_id + '&data_action=get_cavities&session_id=' + $.cookie('provisessions') + '";', true);
        var model_number = applet.evaluate('_modelNumber');
        applet._script_wait('hide add ' + model_number + '; frame all;', true);
        var selection = model_number;
        var format = '\'%[group]\',\'%[sequence]\',%[resno],\'%[chain]\',\'%[atomName]\',%[atomNo],\'%[model]\',\'%[temperature]\'';
        var cavities = applet.atoms_property_map( format, selection) ;
        cavities = eval( cavities );
        // max for spacefill is 16...
        var s = '{'+ model_number + ' and temperature>32}.temperature = 32;';
        $.each( cavities, function(i){
            s += 'select ' + this[0] + '/' + model_number + '; color translucent blue; spacefill @{ {atomNo=' + this[0] + ' and ' + model_number + '}.temperature/2 };';
        });
        applet._script_wait( s, true );
        applet.picking_manager.set();
        applet.misc_manager.set({'default_vdw': 'protor'});
        onload( cavities, model_number );
    },
    get_neighbours: function( onload ){
        var get_params = {
            'id': this.server_id+'',
            'data_action': 'get_neighbours'
        };
        $.getJSON( '../../data/get/', get_params, onload );
    },
});