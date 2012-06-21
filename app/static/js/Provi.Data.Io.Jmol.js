/**
 * @fileOverview This file contains the {@link Provi.Data.Io.Jmol} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * @namespace
 * Provi.Data.Io.Jmol module
 */
Provi.Data.Io.Jmol = {};


(function() {

/** @exports Utils as Provi.Utils */
var Utils = Provi.Utils;
/** @exports Widget as Provi.Widget.Widget */
var Widget = Provi.Widget.Widget;


/**
 * A widget
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Data.Io.Jmol.CalculateWidget = function(params){
    params = _.defaults(
        params,
        Provi.Data.Io.Jmol.CalculateWidget.prototype.default_params
    );
    params.persist_on_applet_delete = false;
    params.heading = 'Jmol Calculate On Server';
    //params.collapsed = false;
    Provi.Widget.Widget.call( this, params );
    this._init_eid_manager( ['applet_selector', 'form', 'iframe', 'calculate'] );
    
    var template = '' +
	'<div id="${eids.applet_selector}"></div>' +
	'<div class="control_row">' +
	    '<button id="${eids.calculate}" >Calculate</button>' +
	    
	'</div>' +
	'<form id="${eids.form}" style="display:hidden;" method="post" action="${params.form_action}" target="${eids.iframe}">' +
            '<input type="hidden" name="data" value=""></input>' +
        '</form>' +
        '<iframe id="${eids.iframe}" name="${eids.iframe}" style="display:none;" src="" frameborder="0" vspace="0" hspace="0" marginwidth="0" marginheight="0" width="0" height="0"></iframe>' +
	'';
    
    params = $.extend({
	form_action: '../../calculate/jmol/'
    }, params);
    
    this.add_content( template, params );
    this.applet_selector = new Provi.Jmol.JmolAppletSelectorWidget({
        parent_id: this.eid('applet_selector'),
        applet: params.applet,
        allow_new_applets: false
    });
    this._init();
}
Provi.Data.Io.Jmol.CalculateWidget.prototype = Utils.extend(Provi.Widget.Widget, /** @lends Provi.Data.Io.Jmol.CalculateWidget.prototype */ {
    default_params: {
        
    },
    _init: function(){
        var self = this;
        
        this.elm( 'calculate' ).button().click( function(e){
            console.log('jmol calculate on server');
	    self.calculate();
        });
        
	Provi.Widget.Widget.prototype.init.call(this);
    },
    calculate: function(){
	var data = this.applet_selector.get_value().get_property_as_string("stateInfo", '');
	var $form = this.elm('form');
	$form.children('input[name=data]').val( data );
	$form.submit();
    }
});



})();