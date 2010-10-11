/**
 * @fileOverview This file contains the {@link Provi.Data.Controller.MplaneMixin} controller.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */

/**
 * @class
 */
Provi.Data.Controller.MplaneMixin = {
    available_widgets: {
        'MplaneWidget': Provi.Bio.MembranePlanes.MplaneWidget
    },
    init: function( params ){
        var self = this;
        this.retrieve_data( function(d){
            self.set_data( new Provi.Bio.MembranePlanes.Mplane( d[0], d[1], d[2] ) );
            if( params.applet ){
                new Provi.Bio.MembranePlanes.MplaneWidget({
                    parent_id: 'tab_widgets',
                    dataset: self,
                    applet: params.applet
                });
            }
        });
        Provi.Data.Dataset.prototype.init.call(this, params);
    },
    retrieve_data: function( onload ){
        var get_params = { 'id': this.server_id+'', 'data_action': 'get_planes' };
        $.getJSON( '../../data/get/', get_params, onload );
    }
}