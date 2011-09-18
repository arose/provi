/**
 * @fileOverview This file contains the {@link Provi.Data.Controller.TmHelicesMixin} controller.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */

/**
 * @class
 */
Provi.Data.Controller.TmHelicesMixin = {
    available_widgets: {
        'TmHelicesWidget': Provi.Bio.TransmembraneHelices.TmHelicesWidget
    },
    init: function( params ){
        var self = this;
        this.retrieve_data( function(d){
            self.set_data( new Provi.Bio.TransmembraneHelices.TmHelices( d ) );
            if( params.applet ){
                new Provi.Bio.TransmembraneHelices.TmHelicesWidget( $.extend( params, {
                    parent_id: Provi.defaults.dom_parent_ids.DATASET_WIDGET,
                    dataset: self
                }));
            }
        });
        Provi.Data.Dataset.prototype.init.call(this, params);
    },
    retrieve_data: function( onload ){
        var get_params = { 'id': this.server_id+'', 'data_action': 'get_tm_helices' };
        $.getJSON( '../../data/get/', get_params, onload );
    }
}