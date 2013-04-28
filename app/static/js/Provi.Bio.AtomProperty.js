/**
 * @fileOverview This file contains the {@link Provi.Bio.AtomProperty} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * @namespace
 * atom property module
 */
Provi.Bio.AtomProperty = {};


(function() {

/** @exports Utils as Provi.Utils */
var Utils = Provi.Utils;

/** @exports Widget as Provi.Widget.Widget */
var Widget = Provi.Widget.Widget;


var AtomProperty = {};

/**
 * @class Represents atom property
 */
Provi.Bio.AtomProperty.AtomProperty = function( params ){
    var p = [ "dataset", "applet" ];
    _.extend( this, _.pick( params, p ) );
    // var self = this;
    // $(this.dataset).bind("loaded", function(){self.get_list(); console.log("foobar")});
    this.load();
};
Provi.Bio.AtomProperty.AtomProperty.prototype = /** @lends Provi.Bio.AtomProperty.AtomProperty.prototype */ {
    load: function(){
        var s = 'provi_load_property("' + this.dataset.url + '", {*}, "' + this.dataset.id + '");';
        this.applet.script(s, { maintain_selection: true, try_catch: false });
    },
    get_list: function(){
        var d = this.applet.evaluate( "provi_datasets[" + this.dataset.id + "].join(',')" ).split(",");
        // console.log("AtomProperty", d);
        return d;
    }
};


// /**
//  * @class Represents atom property group
//  */
// Provi.Bio.AtomProperty.AtomPropertyGroup = function(names){
//     var self = this;
//     this._list = [];
//     _.each(names, function(name){
//         self.add( new Provi.Bio.AtomProperty.AtomProperty(name) );
//     });
//     console.log( this.get_list() );
// };
// Provi.Bio.AtomProperty.AtomPropertyGroup.prototype = /** @lends Provi.Bio.AtomProperty.AtomPropertyGroup.prototype */ {
//     add: function(atom_property){
//         this._list.push( atom_property );
//     },
//     get_list: function(){
//         return this._list;
//     }
// };


/**
 * widget class
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Bio.AtomProperty.AtomPropertyWidget = function( params ){
    params = _.defaults( params, this.default_params );
    params.persist_on_applet_delete = false;

    var p = [ "dataset", "applet", "property_name", "color_scheme", "colorize_on_init", "fixed_range" ];
    _.extend( this, _.pick( params, p ) );
    
    Provi.Widget.Widget.call( this, params );
    this._init_eid_manager([
        'property_name', 'color_scheme', 'min', 'max', 'set',
        'observed_min', 'observed_max'
    ]);

    var template = '' +
        '<div class="control_row">' + 
            '<div id="${eids.property_name}">' +
                'Name: <span>${params.property_name.substr(9)}</span>' +
            '</div>' +
        '</div>' +
        '<div class="control_row">' +
            'observed min:&nbsp;' +
            '<span id="${eids.observed_min}"></span>' +
            ',&nbsp;max:&nbsp;' +
            '<span id="${eids.observed_max}"></span>' +
        '</div>' +
        '<div class="control_row">' +
            '<select style="width:1.5em;" id="${eids.color_scheme}" class="ui-state-default">' +
                '<option value=""></option>' +
                '<option value="rwb">red-white-blue</option>' +
                '<option value="bwr">blue-white-red</option>' +
                '<option value="roygb">rainbow</option>' +
                '<option value="low">red-green</option>' +
                '<option value="high">green-blue</option>' +
                '<option value="bw">black-white</option>' +
                '<option value="wb">white-black</option>' +
            '</select>' +
            '&nbsp;' +
            '<label for="${eids.color_scheme}">color scheme</label>' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="${eids.min}">color scheme min</label>&nbsp;' +
            '<input style="width:3.5em;" type="text" id="${eids.min}" />,&nbsp;' +
            '<label for="${eids.max}">max</label>&nbsp;' +
            '<input style="width:3.5em;" type="text" id="${eids.max}" />&nbsp;' +
            '<button id="${eids.set}">set</button>' +
        '</div>' +
    '';
    this.add_content( template, params );
    this._init();
}
Provi.Bio.AtomProperty.AtomPropertyWidget.prototype = Utils.extend(Provi.Widget.Widget, /** @lends Provi.Bio.AtomProperty.AtomPropertyWidget.prototype */ {
    default_params: {
        heading: 'Atom property',
        color_scheme: 'rwb',
        collapsed: false
    },
    _init: function () {
        var self = this;
        
        this.init_range();

        // init select
        this.elm('color_scheme').bind('change', function(){
            self.set_range();
            self.set_color_scheme();
        });

        this.elm('set').button().bind( 'click', function(){
            self.set_range();
        }).hide();

        if( this.colorize_on_init ){
            this.colorize();
        }

        Provi.Widget.Widget.prototype.init.call(this);
    },
    init_range: function(){
        if(!this.applet) return;

        var obs = this.applet.evaluate('[' +
            '{*}.' + this.property_name + '.min, ' +
            '{*}.' + this.property_name + '.max' +
        '].join(",")').split(",");
        console.log(obs);
        this.observed_min = parseFloat(obs[0]);
        this.observed_max = parseFloat(obs[1]);
        this.elm('observed_min').text( this.observed_min );
        this.elm('observed_max').text( this.observed_max );
        var min = this.observed_min;
        var max = this.observed_max;
        if(this.fixed_range){ 
            min = this.fixed_range[0];
            max = this.fixed_range[1];
        }
        this.elm('min').val( min.toFixed(2) );
        this.elm('max').val( max.toFixed(2) );
        this.set_range();
    },
    set_range: function(){
        if(!this.applet) return;

        this.min = parseFloat( this.elm('min').val() );
        this.max = parseFloat( this.elm('max').val() );
    },
    set_color_scheme: function(){
        this.color_scheme = this.elm('color_scheme').children("option:selected").val();
        console.log(this.color_scheme);
        this.elm('color_scheme').val('');
        this.colorize();
    },
    colorize: function( scheme ){
        if(!this.applet) return;
        scheme = scheme || this.color_scheme;

        var range = _.isFinite( this.min ) && _.isFinite( this.max );
        this.applet.script('' +
            'select *;' +
            'color atoms "' + this.property_name + '" "' + this.color_scheme + '" ' +
                (range ? ' RANGE ' + this.min + ' ' + this.max : '' ) +
            ';' +
        '', { maintain_selection: true, try_catch: true });
    }
});


/**
 * widget class
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Bio.AtomProperty.AtomPropertyGroupWidget = function(params){
    params = _.defaults( params, this.default_params );
    params.persist_on_applet_delete = false;

    var p = [ "dataset", "applet", "filer_properties", "colorize_on_init", "property_ranges" ];
    _.extend( this, _.pick( params, p ) );
    
    Provi.Widget.Widget.call( this, params );
    this._init_eid_manager([
        'list'
    ]);

    var template = '<div>' +
        '<div id="${eids.list}"></div>' +
    '</div>';
    this.add_content( template, params );

    this.init();
}
Provi.Bio.AtomProperty.AtomPropertyGroupWidget.prototype = Utils.extend(Widget, /** @lends Provi.Bio.AtomProperty.AtomPropertyGroupWidget.prototype */ {
    default_params: {
        heading: 'Atom property group',
        collapsed: false,
        filter_properties: false
    },
    init: function(){
        var self = this;
        
        var props = _.map( this.dataset.bio.get_list(), function(p){
            return p.split('_').slice(1, -1).join('_'); // remove 'property_' prefix and '_id' suffix
        });
        
        if( this.filter_properties ){
            props = _.intersection( props, this.filter_properties )
        }

        _.each( props, function( property_name ){
            property_name = property_name + '_' + self.dataset.id;
            var range = undefined;
            if( self.property_ranges ){
                range = self.property_ranges[ property_name ];
            }
            self.add( property_name, range );
        });

        Provi.Widget.Widget.prototype.init.call(this);
    },
    add: function( property_name, range ){
        new Provi.Bio.AtomProperty.AtomPropertyWidget({
            parent_id: this.eid('list'),
            applet: this.applet,
            property_name: 'property_' + property_name,
            heading: false,
            collapsed: false,
            colorize_on_init: this.colorize_on_init,
            fixed_range: range
        });
    }
});


})();