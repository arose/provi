/**
 * @fileOverview This file contains the {@link Provi.Bio} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * @namespace
 * Bio module
 */
Provi.Bio = {};



(function() {




Provi.Bio.Data = {};
Provi.Bio.Data.Data = function( params ){
	this.dataset = params.dataset;
};
Provi.Bio.Data.Data.prototype = /** @lends Provi.Bio.Data.Data.prototype */ {

};



Provi.Bio.Data.DotProvi = function( params ){
	this.dataset = params.dataset;
	this.load();
};
Provi.Bio.Data.DotProvi.prototype = /** @lends Provi.Bio.Data.DotProvi.prototype */ {
    load: function(){
        var self = this;
        var ds_dict = {};
        var name_dict = {};
        var applet = Provi.Jmol.get_default_applet(true).widget.applet;

        _.each( this.dataset.raw_data, function(data, i){
        	console.log("ProviMixin load", i, data.type, data);
            
        	var params = _.defaults( ( data.params || {} ), {
                applet: applet
            });

            _.each( params , function(value, key){
                if( _.isString(value) ){
                    var m = value.match(/DATASET_(.+)/i);
                    if(m) params[ key ] = name_dict[ m[1] ];
                }
            });

            ds_dict[i] = { loaded: false };
            if( data.widget ){
                var func = function(){
                	var widget = eval( data.widget );
                    new widget( params );
                    ds_dict[i].loaded = true;
                    $( ds_dict[i] ).triggerHandler("loaded");
                }
            }else if( data.function ){
                var func = function(){
                    eval( data.function )( params );
                    ds_dict[i].loaded = true;
                    $( ds_dict[i] ).triggerHandler("loaded");
                }
            }else{
                if( !data.dir ){
                    data.dir = self.dataset.meta.directory;
                    data.filename = '' + 
                        self.dataset.meta.filename.split('/').slice(0,-1).join('/') + 
                        '/' + data.filename;
                }
                ds_dict[i] = Provi.Data.Io.import_example( 
                    data.dir, data.filename, data.type, params, true 
                );
                if( data.name ){
                	name_dict[ data.name ] = ds_dict[i];
                }
                var func = function(){
                    var ds = ds_dict[i];
                    ds.init( params );
                }
            }

            var prev = ds_dict[ i-1 ];
        	if( i==0 || prev.loaded ){
        		func();
        	}else{
                $( prev ).bind('loaded', function(){
                    func();
                });
            }
        });

		var last = ds_dict[ this.dataset.raw_data.length-1 ];
		if( last.loaded ){
			this.dataset.set_loaded();
		}else{
			$( last ).bind('loaded', function(){
	            self.dataset.set_loaded();
	        });
		}
    }
};



Provi.Bio.Data.Tmalign = function( params ){
	params = _.defaults(
		params,
		Provi.Bio.Data.Tmalign.prototype.default_params
	)
	var p = [ "applet", "dataset", "sele" ];
	_.extend( this, _.pick( params, p ) );
	this.load();
};
Provi.Bio.Data.Tmalign.prototype = /** @lends Provi.Bio.Data.Tmalign.prototype */ {
    default_params: {
        sele: 'file=1'
    },
    load: function( sele, applet ){
        var t = [0, 0, 0];
        var u = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
        var j = 0;
        _.each( this.dataset.raw_data.split(/\n/), function(line, i){
            if( _.contains(["1", "2", "3"], line.charAt(1)) ){
                var x = line.trim().split(/\s+/);
                t[j] = x[1];
                u[j] = x.slice(2,5);
                j += 1;
            }
        })
        // todo: move into jspt file
        var s = '' +
            'select ' + this.sele + ';' +
            'm = [[' + u[0] + '],[' + u[1] + '],[' + u[2] + ']];' +
            'rotateSelected @m;' +
            'translateSelected {' + t + '};' +
            'center selected;' +
            'print "provi dataset: ' + this.dataset.id + ' loaded";' +
        '';
        console.log(s);
        this.applet.script(s, { maintain_selection: true, try_catch: false });
    }
}



Provi.Bio.Data.JmolFile = function( params ){
	var p = [ "applet", "dataset" ];
	_.extend( this, _.pick( params, p ) );
	this.load();
};
Provi.Bio.Data.JmolFile.prototype = /** @lends Provi.Bio.Data.JmolFile.prototype */ {
    load: function( sele, applet ){
    	this.applet._delete();
    	var s = '' +
            'load "' + this.dataset.url + '";' +
            'print "provi dataset: ' + this.dataset.id + ' loaded";' +
        '';
        this.applet.script(s, { maintain_selection: true, try_catch: false });
    }
}



Provi.Bio.Data.JmolScript = function( params ){
	var p = [ "applet", "dataset" ];
	_.extend( this, _.pick( params, p ) );
	this.load();
};
Provi.Bio.Data.JmolScript.prototype = /** @lends Provi.Bio.Data.JmolScript.prototype */ {
    load: function( sele, applet ){
    	var s = '' +
            this.dataset.raw_data + ';' +
            'print "provi dataset: ' + this.dataset.id + ' loaded";' +
        '';
        this.applet.script(s, { maintain_selection: true, try_catch: false });
    }
}



Provi.Bio.Data.Story = function( params ){
	params.parent_id = Provi.defaults.dom_parent_ids.DATASET_WIDGET;
	new Provi.Widget.StoryWidget( params );
	this.dataset.set_loaded();
};



Provi.Bio.Data.Fasta = function( params ){
    new Provi.Jalview.JalviewWidget({ file: this.dataset.url });
	this.dataset.set_loaded();
};



Provi.Bio.Data.Features = function( params ){
	var self = this;
	var jalview = Provi.Jalview.get_default_applet();
	$(this.dataset).bind("initialized", function(){
		jalview.applet.loadAnnotation( self.dataset.raw_data );
		this.dataset.set_loaded();
	});
};




})();










