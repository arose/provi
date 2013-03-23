/**
 * @fileOverview This file contains the {@link Provi.Data.Io.Get} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * @namespace
 * Data GET module
 */
Provi.Data.Io.Get = {};


(function() {

/** @exports Utils as Provi.Utils */
var Utils = Provi.Utils;

Provi.Data.Io.Get = $.extend(Provi.Data.Io.Get, /** @lends Provi.Data.Io.Get */ {
    /**
     * Initializes and starts loading of datasets based on the url's GET string
     *
     * @param {object} params The configuration object.
     * @param {string} [params.parent_id] The html id of the parent of the Jmol applet.
     * @returns {boolean} Weather any datasets were loaded or not.
     */
    init: function( params ){
        this.parent_id = params.parent_id;
        return this._exec();
    },
    _exec: function(){
        //console.log( $.query.get() );
        
        if( $.query.get('example') ){
            var jw_dict = {};
            $.each( $.query.get('example'), function(i, data){
                if(jw_dict[data.applet]){
                    var jw = jw_dict[data.applet];
                }else{
                    var jw = new Provi.Jmol.JmolWidget({ parent: this.parent_id });
                    jw_dict[i] = jw;
                }
                var params = $.extend( (data.params || {}), { applet: jw.applet, load_as: (data.load_as || 'new') } );
                Provi.Data.Io.import_example( data.dir, data.filename, data.type, params );
        
            });
        }
    
        //example json url (eju)
        if( $.query.get('example_json_url') ){
            console.log( $.query.get('example_json_url') );
            $.ajax({
                url: $.query.get('example_json_url'),
                data: {},
                dataType: "json",
                success: function(response){
                    console.log( 'example_json_url', response );
                    Provi.Data.Controller.ProviMixin.load( response );
                },
                error: function( jqXHR, textStatus, errorThrown ){
                    console.error( jqXHR, textStatus, errorThrown );
                }
            });
        }
        
        if( $.query.get('url') ){
            var jw_dict = {};
            $.each( $.query.get('url'), function(i, data){
                if(jw_dict[data.applet]){
                    var jw = jw_dict[data.applet];
                }else{
                    var jw = new Provi.Jmol.JmolWidget({ parent: this.parent_id });
                    jw_dict[i] = jw;
                }
                var params = $.extend( (data.params || {}), { applet: jw.applet, load_as: load_as } );
                Provi.Data.Io.import_url( data.url, data.name, data.type, params );
            });
        }
            
        if( $.query.get('pdb') ){
            $.each( $.query.get('pdb').split(','), function(i, id){
                //console.log( id );
                var jw = new Provi.Jmol.JmolWidget({ parent: this.parent_id });
                Provi.Data.Io.import_pdb( id, { applet: jw.applet, load_as: 'new' } );
            });
        }
        
        return $.query.get('example') || $.query.get('pdb');
    }
});


})();