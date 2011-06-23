/**
 * @fileOverview This file contains the {@link Provi.Data.Controller.InterfaceContactsMixin} controller.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */

/**
 * @class
 */
Provi.Data.Controller.InterfaceContactsMixin = $.extend(true, {}, Provi.Data.Controller.StructureMixin, /** @lends Provi.Data.Controller.StructureMixin.prototype */ {
    available_widgets: {
        'InterfaceContactsWidget': Provi.Bio.InterfaceContacts.InterfaceContactsWidget
    },
    init: function( params ){
        var self = this;
        self.set_data( new Provi.Bio.InterfaceContacts.Contacts( {}, [] ) );
        Provi.Data.Controller.StructureMixin.init.call( this, params );
        this.retrieve_data( function(d){
            
            self.data.names = d;
            if( params.applet ){
                new Provi.Bio.InterfaceContacts.InterfaceContactsWidget( $.extend( params, {
                    parent_id: Provi.defaults.dom_parent_ids.DATASET_WIDGET,
                    dataset: self
                }));
            }
        });
        
    },
    load: function(applet, load_as){
        Provi.Data.Controller.StructureMixin.load.call( this, applet, load_as );
    },
    retrieve_data: function( onload ){
        var get_params = { 'id': this.server_id+'', 'data_action': 'get_helix_interface_names' };
        $.getJSON( '../../data/get/', get_params, onload );
    },
    get_atoms: function( interface_ids, interface_names, cutoff, onload ){
        var self = this;
        //console.log( cutoff );
        this.get_interface_atoms( interface_ids, interface_names, cutoff, function( interface_data ){
            self.get_structure_atoms( interface_names, function( structure_data ){
                onload( interface_data, structure_data );
            })
        })
    },
    get_interface_atoms: function( interface_ids, interface_names, cutoff, onload ){
        var get_params = {
            'id': this.server_id+'',
            'data_action': 'get_helix_interface_atoms',
            'interface_ids': interface_ids,
            'interface_names': interface_names,
            'cutoff': cutoff
        };
        $.getJSON( '../../data/get/', get_params, onload );
    },
    get_structure_atoms: function( structure_name, onload ){
        var get_params = {
            'id': this.server_id+'',
            'data_action': 'get_structure_atoms',
            'structure_name': structure_name
        };
        $.getJSON( '../../data/get/', get_params, onload );
    }
});