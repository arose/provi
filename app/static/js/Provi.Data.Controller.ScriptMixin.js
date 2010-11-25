/**
 * @fileOverview This file contains the {@link Provi.Data.Controller.ScriptMixin} controller.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */

/**
 * @class
 */
Provi.Data.Controller.ScriptMixin = {
    available_widgets: {},
    init: function( params ){
        var self = this;
        this.retrieve_data( function(d){
            self.set_data( d );
            if( params.applet ){
                self.load( params.applet );
            }
        });
        Provi.Data.Dataset.prototype.init.call(this, params);
    },
    retrieve_data: function( onload ){
        var get_params = { 'id': this.server_id+'' };
        $.get( '../../data/get/', get_params, onload, 'text' );
    },
    load: function(applet){
        applet.script( this.data );
    }
}