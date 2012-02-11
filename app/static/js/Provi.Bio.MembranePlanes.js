/**
 * @fileOverview This file contains the {@link Provi.Bio.MembranePlanes} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * @namespace
 * Membrane planes module
 */
Provi.Bio.MembranePlanes = {};


(function() {

/** @exports Utils as Provi.Utils */
var Utils = Provi.Utils;

/** @exports Widget as Provi.Widget.Widget */
var Widget = Provi.Widget.Widget;


var MembranePlanes = {};

/**
 * @class Represents membrane planes
 */
Provi.Bio.MembranePlanes.Mplane = function(plane1, plane2, distance){
    this.plane1 = plane1;
    this.plane2 = plane2;
    this.distance = parseFloat(distance);
};
Provi.Bio.MembranePlanes.Mplane.prototype = /** @lends Provi.Bio.MembranePlanes.Mplane.prototype */ {
    __jmol_format: function( p ){
        return "{" + p[0].join(',') + "} {" + p[1].join(',') + "} {" + p[2].join(',') + "}";
    },
    format_as_jmol_planes: function(){
        return [ this.__jmol_format(this.plane1), this.__jmol_format(this.plane2) ];
    }
};


/**
 * widget class for controlling a mplane dataset
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Bio.MembranePlanes.MplaneWidget = function(params){
    params = $.extend(
        Provi.Bio.MembranePlanes.MplaneWidget.prototype.default_params,
        params
    );
    this.dataset = params.dataset;
    this.applet = params.applet;
    this.color = "blue";
    this.translucency = 0.6;
    this.size = -2;
    this.visibility = true;
    Widget.call( this, params );
    this._build_element_ids([ 'size', 'size_slider', 'size_slider_option', 'visibility', 'orient', 'color', 'distance' ]);
    var content = '<div class="control_group">' +
        '<div class="control_row">' +
            'The distance between the membrane planes is: ' +
            '<span id="' + this.distance_id + '"></span>&nbsp;&#8491;' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="' + this.size_id + '">membrane plane size</label>' +
            '<select id="' + this.size_id + '" class="ui-state-default">' +
                '<option value="0">hide</option>' +
                '<option value="-2" selected="selected">boundbox</option>' +
                '<option id="' + this.size_slider_option_id + '" value="-1">slider</option>' +
                '<option value="100">100</option>' +
                '<option value="200">200</option>' + 
                '<option value="300">300</option>' +
                '<option value="400">400</option>' +
                '<option value="500">500</option>' +
                '<option value="600">600</option>' +
                '<option value="700">700</option>' +
                '<option value="800">800</option>' +
                '<option value="1000">1000</option>' +
                '<option value="1200">1200</option>' +
                '<option value="1400">1400</option>' +
            '</select>' +
        '</div>' +
        '<div class="control_row">' +
            '<input id="' + this.visibility_id + '" type="checkbox" checked="checked" style="float:left; margin-top: 0.5em;"/>' +
            '<div id="' + this.size_slider_id + '"></div>' +
        '</div>' +
        '<div class="control_row">' +
            '<input id="' + this.color_id + '" type="text" value="' + this.color + '"/> ' +
            '<label for="' + this.color_id + '" >color</label>' +
        '</div>' +
        '<div class="control_row">' +
            '<button id="' + this.orient_id + '">orient along membrane normal</button>' +
        '</div>' +
    '</div>'
    $(this.dom).append( content );
    this._init();
}
Provi.Bio.MembranePlanes.MplaneWidget.prototype = Utils.extend(Widget, /** @lends Provi.Bio.MembranePlanes.MplaneWidget.prototype */ {
    _init: function () {
        this.visibility = $("#" + this.visibility_id).is(':checked');
        $("#" + this.size_slider_option_id).hide();
        $("#" + this.size_id).val(this.size);
        this.draw();
        this.orient();
        var self = this;
        
        $("#" + this.distance_id).html( this.dataset.data.distance.toFixed(2) );
        
        $("#" + this.visibility_id).bind('change click', function() {
            self.visibility = $("#" + self.visibility_id).is(':checked');
            self.draw();
        });
        $("#" + this.size_id).change( function() {
            self.size = $("#" + self.size_id + " option:selected").val();
            $("#" + self.size_slider_id).slider('option', 'value', self.size);
            $("#" + self.size_slider_option_id).hide();
            self.draw();
        });
        $("#" + this.size_slider_id)
            .slider({min: 1, max: 1400})
            .bind( 'slidestop slide', function(event, ui){
                self.size = ui.value;
                self.update_size_slider();
            });
        //$("#" + this.size_slider_id).mousewheel( function(event, delta){
        //    event.preventDefault();
        //    self.size = parseInt( self.size );
        //    var old_size = self.size;
        //    self.size = Math.round(self.size + 20*delta);
        //    console.log( old_size, self.size, delta );
        //    if( isNaN( self.size ) ) self.size = old_size;
        //    if(self.size > 1400) self.size = 1400;
        //    if(self.size < 0) self.size = 0;
        //    console.log( old_size, self.size, delta );
        //    $("#" + self.size_slider_id).slider('option', 'value', self.size);
        //    self.update_size_slider();
        //});
        $("#" + this.size_slider_id).slider('option', 'value', this.size);
        
        // init color picker
        $('#' + this.color_id).colorPicker();
        $('#' + this.color_id).change(function(){
            self.color = $('#' + self.color_id).val();
            self.draw();
        });
        
        // init orient
        $('#' + this.orient_id).button().click( $.proxy( this.orient, this ) );
        Widget.prototype.init.call(this);
    },
    update_size_slider: function(){
        if( $("#" + this.size_id + " option[value=" + this.size + "]").size() ){
            if( !$("#" + this.size_slider_option_id).is(':selected') ){
                $("#" + this.size_slider_option_id).hide();
            }
        }else{
            $("#" + this.size_slider_option_id).show();
            $("#" + this.size_slider_option_id).val(this.size);
            $("#" + this.size_slider_option_id).text(this.size);
            Array.prototype.sort.call(
                $("#" + this.size_id + " option"),
                function(a,b) {
                    return parseInt($(a).val()) >= parseInt($(b).val()) ? 1 : -1;
                }
            ).appendTo("#" + this.size_id); 
        }
        $("#" + this.size_id).val(this.size);
        this.draw();
    },
    orient: function(){        
        var mp = this.dataset.data;
        // first try to rotate the model so the planes are aligned with the point of view
        var s = 'M = {' + mp.plane1[1].join(',') + '};' +
            'A =  {' + mp.plane1[0].join(',') + '};' +
            'B={' + mp.plane2[0].join(',') + '};' +
            'x=180; ' +
            'spin @{quaternion({1 0 0}, x) * (!quaternion(M, A, B)) * (!quaternion())} -0.1';
        this.applet.script(s);
    },
    draw: function(){
        var base_name = 'plane_' + this.id;
        if(this.visibility){
            var mp = this.dataset.data;
            var mp_f = mp.format_as_jmol_planes();
            var color = 'color TRANSLUCENT ' + this.translucency + ' ' +
                (this.color.charAt(0) == '#' ? '[x' + this.color.substring(1) + ']' : this.color);
            var base_plane = (this.size==-2) ?
                ('intersection boundbox plane ') :
                ('plane ' + this.size + ' ');
            //var p_min, p_max;
            //var b = eval( this.applet.evaluate(
            //    '"["+' +
            //        '"[" + {*}.X.min + "," + {*}.Y.min + "," + {*}.Z.min + "]"' +
            //    '+","+' +
            //        '"[" + {*}.X.max + "," + {*}.Y.max + "," + {*}.Z.max + "]"' +
            //    '+"]"'
            //));
            //console.log( b );
            
            //p_min = [ b[0][0], b[0][1], -10 ];
            //p_min = b[0];
            //p_max = b[1];
            
            var s = 'boundbox {*} OFF;';
            //var s = 'boundbox CORNERS {' + p_min.join(' ') + '} {' + p_max.join(' ') + '} OFF;';
            s += 'draw ' + base_name + '_1 ' + color + ' ' + base_plane + mp_f[0] + ';';
            s += 'draw ' + base_name + '_2 ' + color + ' ' + base_plane + mp_f[1] + ';';
            console.log(s);
            this.applet.script(s);
        }else{
            this.applet.script('draw ' + base_name + '_* off;');
        }
    }
});



})();