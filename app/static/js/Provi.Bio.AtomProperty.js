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
    
    Provi.Widget.Widget.call( this, params );
    this._init_eid_manager([
        'property_name', 'color_scheme'
    ]);

    var template = '' +
        '<div class="control_row">' + 
            '<div id="${eids.property_name}">' +
                'Name: <span>${params.property_name.substr(9)}</span>' +
            '</div>' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="${eids.color_scheme}">color scheme</label>' +
            '<select id="${eids.color_scheme}" class="ui-state-default">' +
                '<option value=""></option>' +
                '<option value="rwb">red-white-blue</option>' +
                '<option value="bwr">blue-white-red</option>' +
                '<option value="roygb">rainbow</option>' +
                '<option value="low">red-green</option>' +
                '<option value="high">green-blue</option>' +
                '<option value="bw">black-white</option>' +
                '<option value="wb">white-black</option>' +
            '</select>' +
        '</div>' +
    '';
    this.add_content( template, params );
    this._init();
}
Provi.Bio.AtomProperty.AtomPropertyWidget.prototype = Utils.extend(Provi.Widget.Widget, /** @lends Provi.Bio.AtomProperty.AtomPropertyWidget.prototype */ {
    default_params: {
        heading: 'Atom property',
        collapsed: false
    },
    _init: function () {
        var self = this;
        
        // init select
        this.elm('color_scheme').bind('change', function(){
            console.log(self.applet);
            if(self.applet){
                self.color_scheme = self.elm('color_scheme').children("option:selected").val();
                console.log(self.color_scheme);
                self.elm('color_scheme').val('');
                self.applet.script('' +
                    'select *;' +
                    'color atoms "' + self.property_name + '" "' + self.color_scheme + '";' +
                '', true);
            }
        });

        Provi.Widget.Widget.prototype.init.call(this);
    }
});



})();