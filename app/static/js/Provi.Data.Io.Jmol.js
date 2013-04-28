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
    params = _.defaults( params, this.default_params );
    params.persist_on_applet_delete = false;
    Provi.Widget.Widget.call( this, params );
    this._init_eid_manager( ['applet_selector', 'calculate', 'download', 'size'] );
    
    var template = '' +
        '<div id="${eids.applet_selector}"></div>' +
        '<div class="control_row">' +
            '<label for="${eids.size}">size</label>' +
            '&nbsp;' +
            '<select id="${eids.size}" class="ui-state-default">' +
                '<option value="1">same (x1)</option>' +
                '<option value="2">large (x2)</option>' +
                '<option value="4">very large (x4)</option>' +
                // '<option value="8">huge (x8)</option>' +
            '</select>' +
        '</div>' +
        '<div class="control_row">' +
            '<button id="${eids.calculate}" >Calculate</button>' +

            '&nbsp;' +
            '<span id="${eids.download}"></span>' +
        '</div>' +
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
        heading: 'Jmol Calculate On Server',
        collapsed: true
    },
    _init: function(){
        var self = this;
        
        this.elm('calculate').button().click( function(e){
            console.log('jmol calculate on server');
            self.elm('download').empty();
            self.elm('download').append( 'calculating...' );
            self.calculate();
        });

        this._init_calculate_callback();
        $( this.applet_selector ).bind('change_selected', function(event, applet){
            _.each( Provi.Jmol.get_applet_list(), function(applet, i){
                $(applet).unbind( '.' + self.id );
            });
            self._init_calculate_callback();
        });
        
        Provi.Widget.Widget.prototype.init.call(this);
    },
    _init_calculate_callback: function(){
        var self = this;
        var applet = this.applet_selector.get_value();
        if(applet){
            $(applet).bind( 'message.' + this.id, function(e, msg1, msg2, msg3){
                if( msg1.search(/provi calculate:/) != -1 ){
                    console.log(msg1, msg2, msg3, msg1.search(/provi calculate:/));
                    var path = msg1.match(/provi calculate: (.+)/)[1];
                    console.log( path );
                    self.elm('download').empty();
                    self.elm('download').append(
                        '<a target="_blank" href="../tmp/' + path + '">download</a>'
                    );
                }
            });
        }
    },
    calculate: function(){
        var applet = this.applet_selector.get_value();
        var size = this.elm('size').children(':selected').val();
        var s = '' +
            'print "provi calculate: " + ' +
                'load(' +
                    '"/../../../calculate/jmol/?POST?_PNGJBIN_&' +
                    'width=" + _width*' + size + ' + "&' +
                    'height=" + _height*' + size +
                ');' +
        '';
        console.log(s);
        applet.applet.script( s );
    }
});



})();