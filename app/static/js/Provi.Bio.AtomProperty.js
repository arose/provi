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
Provi.Bio.AtomProperty.AtomProperty = function(name){
    this.name = name;
};
Provi.Bio.AtomProperty.AtomProperty.prototype = /** @lends Provi.Bio.AtomProperty.AtomProperty.prototype */ {
    
};


/**
 * @class Represents atom property group
 */
Provi.Bio.AtomProperty.AtomPropertyGroup = function(names){
    var self = this;
    this._list = [];
    _.each(names, function(name){
        self.add( new Provi.Bio.AtomProperty.AtomProperty(name) );
    });
    console.log( this.get_list() );
};
Provi.Bio.AtomProperty.AtomPropertyGroup.prototype = /** @lends Provi.Bio.AtomProperty.AtomPropertyGroup.prototype */ {
    add: function(atom_property){
        this._list.push( atom_property );
    },
    get_list: function(){
        return this._list;
    }
};


/**
 * widget class
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Bio.AtomProperty.AtomPropertyWidget = function(params){
    params = _.defaults(
        params,
        Provi.Bio.AtomProperty.AtomPropertyWidget.prototype.default_params
    );
    params.persist_on_applet_delete = false;

    this.dataset = params.dataset;
    this.applet = params.applet;

    this.property_name = params.property_name;
    this.color_scheme = params.color_scheme;
    this.colorize_on_init = params.colorize_on_init;
    
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
        this.elm('min').val( this.observed_min );
        this.elm('max').val( this.observed_max );
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
        '', true);
    }
});


/**
 * widget class
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Bio.AtomProperty.AtomPropertyGroupWidget = function(params){
    params = _.defaults(
        params,
        Provi.Bio.AtomProperty.AtomPropertyGroupWidget.prototype.default_params
    );
    params.persist_on_applet_delete = false;

    this.filter_properties = params.filter_properties;
    this.colorize_on_init = params.colorize_on_init;

    this.dataset = params.dataset;
    this.applet = params.applet;
    
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
        
        var props = _.map( this.dataset.data.get_list(), function(p){
            return p.name.substr(9); // remove 'property_' prefix
        });
        if( this.filter_properties ){
            props = _.intersection( props, this.filter_properties )
        }

        _.each( props, function( property_name ){
            self.add( property_name );
            console.log(property_name);
        });

        Provi.Widget.Widget.prototype.init.call(this);
    },
    add: function( property_name ){
        new Provi.Bio.AtomProperty.AtomPropertyWidget({
            parent_id: this.eid('list'),
            applet: this.applet,
            property_name: 'property_' + property_name,
            heading: false,
            collapsed: false,
            colorize_on_init: this.colorize_on_init
        });
    }
});


})();