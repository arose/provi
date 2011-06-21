/**
 * @fileOverview This file contains the {@link Provi.Data.Controller.NdxMixin} controller.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */

/**
 * @class
 */
Provi.Data.Controller.NdxMixin = {
    available_widgets: {
        'NdxWidget': Provi.Bio.Indices.NdxWidget
    },
    init: function( params ){
        var self = this;
        this.retrieve_dataX( function(d){
            self.set_data( new Provi.Bio.Indices.Ndx( d ) );
            if( params.applet ){
                new Provi.Bio.Indices.NdxWidget({
                    parent_id: Provi.defaults.dom_parent_ids.DATASET_WIDGET,
                    dataset: self,
                    applet: params.applet
                });
                
                $.each( self.data.ndx_list, function(i, ndx){
                    new Provi.Selection.Selection({
                        persist: true,
                        applet: params.applet,
                        name: ndx[0],
                        selection: '( atomno=' + ndx[1].join(', atomno=') + ')'
                    });
                });
            }
        });
        Provi.Data.Dataset.prototype.init.call(this, params);
    },
    retrieve_dataX: function( onload ){
        var get_params = { 'id': this.server_id+'', 'data_action': 'get_json_ndx' };
        $.get('../../data/get/', get_params, onload, 'json');
    }
}