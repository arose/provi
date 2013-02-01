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
        console.log('MPLANE init');
        this.retrieve_data( function(d){
            console.log('MPLANE onload');
            self.set_data( new Provi.Bio.MembranePlanes.Mplane( d[0], d[1], d[2] ) );
            if( params.applet ){
                console.log('MPLANEdfmgmsdpfgmsdpsd');
                new Provi.Bio.MembranePlanes.MplaneWidget( $.extend( params, {
                    parent_id: Provi.defaults.dom_parent_ids.DATASET_WIDGET,
                    dataset: self
                }));
            }
        });
        Provi.Data.Dataset.prototype.init.call(this, params);
    },
    retrieve_data: function( onload ){
        console.log('MPLANE retrieve');
        var get_params = { 'id': this.server_id+'', 'data_action': 'get_planes', 'session_id': $.cookie('provisessions') };
        //$.getJSON( '../../data/get/', get_params, onload );
        $.ajax({
            dataType: "json",
            url: '../../data/get/',
            data: get_params,
            success: onload,
            error: function(e){ console.log(e); }
        });
    }
}