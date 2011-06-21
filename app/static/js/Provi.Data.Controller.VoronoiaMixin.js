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
	
        //params.applet.script_wait('set refreshing false;');
        
        Provi.Data.Controller.StructureMixin.init.call( this, params );
	//Provi.Utils.pause(1000);
	
	this.retrieve_data( params.applet, function( atoms, cavities, cavities_model_number ){
	    self.data.init( atoms, cavities );
	    self.add_data( 'residue_map', new Provi.Bio.Voronoia.VolResidueMap( self.data ) );
	    console.log( cavities_model_number, self.data );
	    if( params.applet ){
                new Provi.Bio.Voronoia.VoronoiaWidget({
                    parent_id: Provi.defaults.dom_parent_ids.DATASET_WIDGET,
                    dataset: self,
                    applet: params.applet,
		    cavities_model_number: cavities_model_number
                });
            }
            
            //params.applet.script_wait('set refreshing true;');
	});
    },
    load: function(applet, load_as){
        Provi.Data.Controller.StructureMixin.load.call( this, applet, load_as );
    },
    retrieve_data: function( applet, onload ){
	var self = this;
	console.log('retrieve data');
	this.get_atoms( function( atoms ){
	    self.get_cavities( applet, function( cavities, cavities_model_number ){
		onload( atoms, cavities, cavities_model_number );
	    });
	});
    },
    get_atoms: function( onload ){
	console.log('get atoms');
        var get_params = {
            'id': this.server_id+'',
            'data_action': 'get_atoms'
        };
        $.getJSON( '../../data/get/', get_params, onload );
    },
    get_cavities: function( applet, onload ){
	console.log('get cavities');
        //applet.script_wait('set refreshing false;');
        applet._script_wait('load APPEND "PDB::../../data/get/?id=' + this.server_id + '&data_action=get_cavities";');
	console.log('get cavities, after load');
        //var model_number = '2.1';
	var model_number = applet.evaluate('_modelNumber');
	var selection = model_number;
        var format = '\'%[group]\',\'%[sequence]\',%[resno],\'%[chain]\',\'%[atomName]\',%[atomNo],\'%[model]\',\'%[temperature]\'';
        var cavities = applet.evaluate('"[" + {' + selection + '}.label("[' + format + ']").join(",") + "]"');
	console.log('get cavities, after evaluate');
        //console.log( cavities );
        //cavities = cavities.replace(/\'\'/g,"'");
        //console.log( cavities );
        cavities = eval( cavities );
	//console.log(cavities);
	applet._script_wait('frame all;');
	console.log('get cavities, after frame all');
	applet._script_wait('hide hidden or ' + model_number);
        //applet.script_wait('set refreshing true;');
	console.log('get cavities, after hide');
	var s = '';
	$.each( cavities, function(i){
	    s += 'select ' + this[0] + '/' + model_number + '; color translucent blue; spacefill @{ {atomNo=' + this[0] + ' and ' + model_number + '}.temperature/2 };';
	});
	applet._script_wait( s );
	console.log('get cavities, after cav');
	
	onload( cavities, model_number );
    }
});