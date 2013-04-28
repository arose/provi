/**
 * @fileOverview This file contains the {@link Provi.Bio.Propensities} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * @namespace
 * Structure module
 */
Provi.Bio.Propensities = {};


(function() {

/** @exports Utils as Provi.Utils */
var Utils = Provi.Utils;
/** @exports Widget as Provi.Widget.Widget */
var Widget = Provi.Widget.Widget;


/**
 * Represents hydrogen bonds
 * @constructor
 */
Provi.Bio.Propensities.Propensities = function(propensities){
    this.propensities = $.parseJSON( propensities );
    this.init();
};
Provi.Bio.Propensities.Propensities.prototype = /** @lends Provi.Bio.Propensities.Propensities.prototype */ {
    init: function(){
        var self = this;
        console.log( this.propensities );
        this.scale_ids = {};
        _.each( this.propensities['scales'], function( elm, i ){
            self.scale_ids[ elm ] = i;
        });
    },
    get_name: function(){
        return this.propensities['name'];
    },
    get_radii: function(){
        return _.keys( this.propensities['data'] );
    },
    get_cutoffs: function( radius ){
        return _.keys( this.propensities['data'][ radius ] );
    },
    get_scales: function(){
        return this.propensities['scales'];
    },
    get_scale_id: function( scale ){
        return this.scale_ids[ scale ];
    },
    get_data: function( scale, radius, cutoff ){
        if(radius && cutoff){
            var d = this.propensities['data'][radius][cutoff];
        }else{
            var d = this.propensities['data'];
        }
        var scale_id = this.get_scale_id( scale );
        var aa_prop_dict = {};
        _.each( d, function( value, key ){ 
            aa_prop_dict[ key ] = value[ scale_id ]; 
        });
        return aa_prop_dict;
    },
    get_min: function( scale, radius, cutoff ){
        if( scale==='BW'){
            return 0;
        }else{
            return _.min( this.get_data( scale, radius, cutoff ) );
        }
    },
    get_max: function( scale, radius, cutoff ){
        if( scale==='BW'){
            return 1;
        }else{
            return _.max( this.get_data( scale, radius, cutoff ) );
        }
    }
};


/**
 * A widget
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Bio.Propensities.PropensitiesWidget = function(params){
    params = _.defaults( params, this.default_params );
    console.log('PROPENSITIES', params);
    if( params.applet ){
        params.persist_on_applet_delete = false;
    }else{
        params.persist_on_applet_delete = true;
    }
    //params.collapsed = false;
    Provi.Widget.Widget.call( this, params );
    this._init_eid_manager([
        'colorize', 'scale', 'radius', 'cutoff', 'min', 'max',
        'tmh_filter', 'applet_selector_widget'
    ]);
    
    this.dataset = params.dataset;
    this.applet = params.applet;
    this.scale = params.scale;
    this.radius = params.radius;
    this.cutoff = params.cutoff;
    this.tmh_filter = params.tmh_filter;
    this.mphd = params.mphd;
    if( !this.mphd ){
        this.radius = false;
        this.cutoff = false;
    }
    
    var template = '' +
        '<div class="control_row" id="${eids.applet_selector_widget}"></div>' +
        '<div class="control_row">' +
            'method&nbsp;<select id="${eids.scale}" class="ui-state-default"></select>' +
        '</div>' +
        '<div class="control_row">' +
            'probe radius&nbsp;<select id="${eids.radius}" class="ui-state-default"></select>' +
        '</div>' +
        '<div class="control_row">' +
            'cut-off&nbsp;<select id="${eids.cutoff}" class="ui-state-default"></select>' +
        '</div>' +
        '<div class="control_row checkbox">' +
            '<input id="${eids.tmh_filter}" type="checkbox" />' +
            '<label for="${eids.tmh_filter}">limit coloring to tmh atoms</label>' +
        '</div>' +
        '<div class="control_row">' +
            '<div class="scale bwr" style="width:250px; height:20px; padding:0.15em;">' +
                '<span style="float:left; color:white; padding-left:0.3em;" id="${eids.min}"></span>' +
                '<span style="float:right; color:white; padding-right:0.3em;" id="${eids.max}"></span>' +
            '</div>' +
	    '</div>' +
        '<div class="control_row">' +
            '<button id="${eids.colorize}">colorize</button>' +
        '</div>' +
	'';
    this.add_content( template, params );

    if( !this.applet ){
        this.applet_selector = new Provi.Jmol.JmolAppletSelectorWidget({
            parent_id: this.eid('applet_selector_widget')
        });
    }

    this._init();
}
Provi.Bio.Propensities.PropensitiesWidget.prototype = Utils.extend(Provi.Widget.Widget, /** @lends Provi.Bio.Structure.StructureWidget.prototype */ {
    default_params: {
        scale: 'TMLIP2',
        radius: '2.8',
        cutoff: '1.5',
        tmh_filter: true,
        heading: 'Propensities',
        mphd: false
    },
    get_applet: function(){
        if( this.applet ){
            return this.applet;
        }else{
            return this.applet_selector.get_value(true);
        }
    },
    _init: function(){
        var self = this;
        
        this.elm('scale').bind( 'change', function(){
            self.scale = self.elm('scale').children("option:selected").val();
            self.colorize();
        });
        this._init_scale( this.scale );
        
        this.elm('colorize').button().click( function(){
            self.colorize();
        });
        
        if(this.mphd){
            this.elm('radius').bind('change', function(){ 
                self.radius = self.elm('radius').children("option:selected").val();
                self._init_cutoff();
                self.colorize();
            });
            this._init_radius( this.radius );
            
            this.elm('cutoff').bind('change', function(){ 
                self.cutoff = self.elm('cutoff').children("option:selected").val();
                self.colorize();
            });
            this._init_cutoff( this.cutoff );
        }else{
            this.elm('radius').parent().hide();
            this.elm('cutoff').parent().hide();
        }

        this.elm('tmh_filter').parent().hide();
        this._init_tmh_filter();
        this.elm('tmh_filter').change( function() {
            self.tmh_filter = self.elm('tmh_filter').is(':checked');
            self.colorize();
        });
        
        $(Provi.Data.DatasetManager).bind('change', function(){ self._init_tmh_filter(); });

	   Provi.Widget.Widget.prototype.init.call(this);
    },
    _init_scale: function( scale ){
        var self = this;
        var scales = this.dataset.data.get_scales();
        var value = scale || this.elm('scale').children("option:selected").val();
        this.elm('scale').empty();
        _.each( scales, function( e, i ){
            self.elm('scale').append(
                "<option value='" + e + "'>" + e + "</option>"
            );
        });
        if( !_.include( scales, value ) ){
            value = scales[0];
        }
        this.scale = value;
        this.elm('scale').val( value );
    },
    _init_radius: function( radius ){
        var self = this;
        var radii = this.dataset.data.get_radii();
        console.log('RADIUS', radius, radii);
        var value = radius || this.elm('radius').children("option:selected").val();
        this.elm('radius').empty();
        _.each( radii, function( e, i ){
            self.elm('radius').append(
                "<option value='" + e + "'>" + e + "</option>"
            );
        });
        if( !_.include( radii, value ) ){
            value = radii[0];
        }
        this.radius = value;
        this.elm('radius').val( value );
    },
    _init_cutoff: function( cutoff ){
        var self = this;
        var radius = this.elm('radius').children("option:selected").val();
        var cutoffs = this.dataset.data.get_cutoffs( radius );
        var value = cutoff || this.elm('cutoff').children("option:selected").val();
        this.elm('cutoff').empty();
        _.each( cutoffs, function( e, i ){
            self.elm('cutoff').append(
                "<option value='" + e + "'>" + e + "</option>"
            );
        });
        console.log( cutoffs, value );
        if( !_.include( cutoffs, value ) ){
            value = cutoffs[0];
        }
        this.cutoff = value;
        this.elm('cutoff').val( value );
    },
    /** initialize the tmh filter controls */
    _init_tmh_filter: function(){
        var self = this;
        _.any( Provi.Data.DatasetManager.get_list(), function(dataset, i){
            if( dataset.type == 'tmhelix' && dataset.data && 
                _.include(dataset.applet_list, self.get_applet()) 
            ){
                self.tmh_ds = dataset.data;
                // breaks the loop
                return true;
            }else{
                self.tmh_ds = false;
                return false;
            }
        });
        this.elm('tmh_filter').attr( 'checked', this.tmh_filter );
        this.elm('tmh_filter').parent().toggle( this.tmh_ds ? true : false );
        //this.elm('tmh_filter').parent().show();
    },
    colorize: function(){
        var applet = this.get_applet();
        if( !applet ) return;

        var scale = this.scale;
        var radius = this.radius;
        var cutoff = this.cutoff;
        var prop = this.dataset.data;
        //console.log( scale, radius, cutoff );
        var min = prop.get_min( scale, radius, cutoff );
        var max = prop.get_max( scale, radius, cutoff );
        if( scale !== 'BW' ){
            var abs = _.max([ Math.abs(min), max ]);
            min = -abs;
            max = abs;
        }
        var prop_data = prop.get_data( scale, radius, cutoff );

        this.elm('min').text( min.toFixed(2) );
        this.elm('max').text( max.toFixed(2) );

        var self = this;
        if( applet ){

            var tmh_filter = '';
            if( this.tmh_filter && this.tmh_ds ){
                tmh_filter = ' and ' + this.tmh_ds.jmol_sele();
            }

            var s = 'select all; color grey;';
            _.each( prop_data, function( value, key ){
                s += '' +
                    'select group1="' + key + '"' + tmh_filter + ';' +
                    'color @{ color("bwr", ' + min + ', ' + max + ', ' + value + ') };' +
                    '';
            });
            applet.script(s, true);
        }
    }
});



})();