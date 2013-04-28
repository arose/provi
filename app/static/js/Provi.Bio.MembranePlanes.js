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
Provi.Bio.MembranePlanes.Mplane = function( params ){
    this.dataset = params.dataset;
    this.applet = params.applet;
    this.parse();
    this.calc_distance();

    var self = this;
    $(this.dataset).bind("loaded", function(){
        new Provi.Bio.MembranePlanes.MplaneWidget({
            parent_id: Provi.defaults.dom_parent_ids.DATASET_WIDGET,
            dataset: self.dataset,
            applet: self.applet
        });
    });

    $(this.dataset).bind("initialized", function(){
        self.dataset.set_loaded();
    });
};
Provi.Bio.MembranePlanes.Mplane.prototype = /** @lends Provi.Bio.MembranePlanes.Mplane.prototype */ {
    __jmol_format: function( p ){
        return "{" + p[0].join(',') + "} {" + p[1].join(',') + "} {" + p[2].join(',') + "}";
    },
    format_as_jmol_planes: function(){
        return [ this.__jmol_format( this.plane1 ), this.__jmol_format( this.plane2 ) ];
    },
    parse: function(){
        var line = this.dataset.raw_data.split("\n")[0];
        var raw_planes = line.substring( line.indexOf(": {") + 2 ).split(":::");
        var planes = _.map( raw_planes, function( pl ){
            var raw_points = pl.split( /}\s+{/ );
            return _.map( raw_points, function( pt ){
                return _.map( pt.split(","), function( c ){
                    return parseFloat( c.replace(/{|}|\s*/g, "") )
                });
            })
        });
        this.plane1 = planes[0];
        this.plane2 = planes[1];
    },
    calc_distance: function(){
        // http://softsurfer.com/Archive/algorithm_0104/algorithm_0104.htm
        // http://mathworld.wolfram.com/Point-PlaneDistance.html
        var p1 = _.map( this.plane1, $V );
        var p2 = _.map( this.plane2, $V );
        var v1 = p1[1].subtract( p1[0] );
        var v2 = p1[2].subtract( p1[0] );
        var n = v1.cross( v2 );
        var v3 = p2[0].subtract( p1[0] );
        this.distance = Math.abs( v3.dot( n ) / n.modulus() );
    }
};




/**
 * widget class for controlling a mplane dataset
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Bio.MembranePlanes.MplaneWidget = function(params){
    params = _.defaults(
        params,
        Provi.Bio.MembranePlanes.MplaneWidget.prototype.default_params
    );
    
    this.dataset = params.dataset;
    this.applet = params.applet;
    this.color = params.color;
    this.translucency = params.translucency;
    this.size = params.size;
    this.visibility = params.visibility;
    
    Widget.call( this, params );

    this._init_eid_manager([
        'size', 'size_slider', 'size_slider_option', 'visibility', 
        'orient', 'color', 'distance', 'modelbased' 
    ]);
    var template = '' +
        '<div class="control_row">' +
            'The distance between the membrane planes is: ' +
            '<span id="${eids.distance}"></span>&nbsp;&#8491;' +
        '</div>' +
        '<div class="control_row">' +
            '<select id="${eids.size}" class="ui-state-default">' +
                '<option value="0">hide</option>' +
                '<option value="-2" selected="selected">boundbox</option>' +
                '<option id="${eids.size_slider_option}" value="-1">slider</option>' +
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
            '</select>&nbsp;' +
            '<label for="${eids.size}">membrane plane size</label>' +
        '</div>' +
        '<div class="control_row">' +
            '<input id="${eids.visibility}" type="checkbox" checked="checked" style="float:left; margin-top: 0.5em;"/>' +
            '<div id="${eids.size_slider}"></div>' +
        '</div>' +
        '<div class="control_row">' +
            '<input id="${eids.modelbased}" type="checkbox" checked="checked" style="float:left; margin-top: 0.5em;"/>&nbsp;' +
            '<label for="${eids.modelbased}" >modelbased</label>' +
        '</div>' +
        '<div class="control_row">' +
            '<input id="${eids.color}" type="text" value="${params.color}"/>&nbsp;' +
            '<label for="${eids.color}" >color</label>' +
        '</div>' +
        '<div class="control_row">' +
            '<button id="${eids.orient}">orient along membrane normal</button>' +
        '</div>' +
    ''
    this.add_content( template, params );
    this._init();
}
Provi.Bio.MembranePlanes.MplaneWidget.prototype = Utils.extend(Widget, /** @lends Provi.Bio.MembranePlanes.MplaneWidget.prototype */ {
    default_params: {
        heading: 'Membrane planes',
        size: -2,
        color: '#3366FF',
        translucency: 0.6,
        visibility: true,
        modelbased: true
    },
    _init: function () {
        this.visibility = this.elm("visibility").is(':checked');
        this.elm("size_slider_option").hide();
        this.elm("size").val(this.size);
        this.draw();
        this.orient();
        var self = this;
        
        this.elm("distance").html( this.dataset.bio.distance.toFixed(2) );
        
        this.elm("visibility").bind('change click', function() {
            self.visibility = self.elm("visibility").is(':checked');
            self.draw();
        });
        this.elm("size").change( function() {
            self.size = self.elm("size").children("option:selected").val();
            self.elm("size_slider").slider('option', 'value', self.size);
            self.elm("size_slider_option").hide();
            self.draw();
        });
        this.elm("size_slider")
            .slider({min: 1, max: 1400})
            .bind( 'slidestop slide', function(event, ui){
                self.size = ui.value;
                self.update_size_slider();
            });
        this.elm("size_slider").slider('option', 'value', this.size);
        
        // init color picker
        this.elm("color").colorPicker();
        this.elm("color").change(function(){
            self.color = self.elm("color").val();
            self.draw();
        });

        // init modelbased/fixed
        this.elm("modelbased").bind('change click', function() {
            self.modelbased = self.elm("modelbased").is(':checked');
            self.draw();
        });
        
        // init orient
        this.elm("orient").button().click( $.proxy( this.orient, this ) );
        Widget.prototype.init.call(this);
    },
    update_size_slider: function(){
        if( this.elm("size").children("option[value=" + this.size + "]").size() ){
            if( !this.elm("size_slider_option").is(':selected') ){
                this.elm("size_slider_option").hide();
            }
        }else{
            this.elm("size_slider_option").show();
            this.elm("size_slider_option").val(this.size);
            this.elm("size_slider_option").text(this.size);
            Array.prototype.sort.call(
                this.elm("size").children("option"),
                function(a,b) {
                    return parseInt($(a).val()) >= parseInt($(b).val()) ? 1 : -1;
                }
            ).appendTo( this.eid("size") ); 
        }
        this.elm("size").val(this.size);
        this.draw();
    },
    orient: function(){        
        var mp = this.dataset.bio;
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
            var mp = this.dataset.bio;
            console.log(mp, this.dataset);
            var mp_f = mp.format_as_jmol_planes();
            var color = 'color TRANSLUCENT ' + this.translucency + ' ' +
                (this.color.charAt(0) == '#' ? '[x' + this.color.substring(1) + ']' : this.color);
            var base_plane = (this.size==-2) ?
                ('intersection boundbox plane ') :
                ('plane ' + this.size + ' ');
            var fixed_modelbased = this.modelbased ? 'MODELBASED' : 'FIXED';
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
            s += 'draw ' + base_name + '_1 ' + color + ' ' + fixed_modelbased 
                + ' ' + base_plane + mp_f[0] + ';';
            s += 'draw ' + base_name + '_2 ' + color + ' ' + fixed_modelbased 
                + ' ' + base_plane + mp_f[1] + ';';
            // console.log(s);
            this.applet.script(s);
        }else{
            this.applet.script('draw ' + base_name + '_* off;');
        }
    }
});



})();