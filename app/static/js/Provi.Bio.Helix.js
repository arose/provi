/**
 * @fileOverview This file contains the {@link Provi.Bio.Helix} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * @namespace
 * Helix module
 */
Provi.Bio.Helix = {};


(function() {

/** @exports Utils as Provi.Utils */
var Utils = Provi.Utils;

/** @exports Widget as Provi.Widget.Widget */
var Widget = Provi.Widget.Widget;




/**
 * A widget to get params
 * @constructor
 * @extends Provi.Widget.Widget
 */
Provi.Bio.Helix.HelixorientParamsWidget = function(params){
    params = _.defaults(
        params,
        Provi.Bio.Helix.HelixorientParamsWidget.prototype.default_params
    );
    Provi.Widget.Widget.call( this, params );
    this._init_eid_manager([ 'show_local_axes' ]);

    var template = '' +
        // '<div class="control_row">' +
        //     '<label for="${eid.}">Within:</label>' +
        //     '<input id="{eid.}" type="text" size="10" value=""/>' +
        // '</div>' +
        '<div class="control_row">' +
            '<input id="${eids.show_local_axes}" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
            '<label for="${eids.show_local_axes}" style="display:block;">show local axes</label>' +
        '</div>' +
    '';
    this.add_content( template, params );
}
Provi.Bio.Helix.HelixorientParamsWidget.prototype = Utils.extend(Widget, /** @lends Provi.Bio.Helix.HelixorientParamsWidget.prototype */ {
    // local_axes: function(){
    //     return $("#" + this.within_id).val();
    // },
    show_local_axes: function(){
        return this.elm('show_local_axes').is(':checked');
    }
});




Provi.Bio.Helix.HelixorientSelectionType = function(params){
    Provi.Bio.AtomSelection.SelectionType.call( this, params );
    this.handler = _.defaults({
        "show_axis": {
            "selector": 'input[cell="axis"]',
            "click": this.show_axis
        }
    }, this.handler );
}
Provi.Bio.Helix.HelixorientSelectionType.prototype = Utils.extend(Provi.Bio.AtomSelection.SelectionType, /** @lends Provi.Bio.Helix.HelixorientSelectionType.prototype */ {
    _init: function(grid){
        this.params_widget = new Provi.Bio.Helix.HelixorientParamsWidget({
            parent_id: grid.eid('widgets')
        });
        this.applet.script_wait('' +
            'script "../data/jmol_script/helixorient.jspt";' +
            'function provi_helixorient_test(ids){' +
                'var sele_l = [];' +
                'var draw_l = [];' +
                'for(id in ids){' +
                    'sele_l += {strucno=@id}.selected.join("");' +
                    'try{' +
                        'tmp = 0;' +
                        'var s = "tmp = ($helixorient_"+id+"_axis__no_widget__ & true)+0";' +
                        'script INLINE @s;' +
                        'draw_l += tmp;' +
                    '}catch(){' +
                        'draw_l += 0;' +
                    '}' +
                '}' +
                'return [ sele_l.average, draw_l.average ];' +
            '};' +
        '');
    },
    get_ids: function(){
        var s = '{' + this.filtered() + ' and helix and protein}.strucno.all.count().join("")';
        var data = this.applet.evaluate(s);
        if(data) data = data.trim().split('\t');
        data = _.filter(data, function(val, i){
            return i % 2 == 0;
        });
        return data;
    },
    get_data: function(id){
        var ids = (id=="all") ? this.get_ids() : [id];
        var s = 'provi_helixorient_test([' + ids.join(',') + ']).join(",")';
        var a = this.applet.evaluate(s);
        if(a){
            a = a.split(",");
        }else{
            a = [0, 0];
        }
        var selected = parseFloat(a[0]);
        var axis = parseFloat(a[1]);

        return [ selected, axis ];
    },
    make_row: function(id){
        var a = this.get_data(id);
        if(id==="all"){
            var label = "Helixorient";
        }else{
            var label = id;
        }

        var $row = $('<div></div>');
        $row.append(
            this.selected_cell( id, a[0] ),
            this.label_cell( label ),
            this.axis_cell( id, a[1] )
        );
        return $row;
    },
    selection: function(id){
        if( id==='all' ){
            return 'within(MODEL, ' + this.filtered() + ' and helix)';
        }else{
            return 'strucno=' + id;
        }
    },
    _show_axis: function(id, flag, params){
        params = params || {};
        var self = this;
        var ids = (id==='all') ? this.get_ids() : [ id ];
        if(flag){
            return _.map( ids, function(id){
                return 'draw ID "helixorient_' + id + '_axis__no_widget__*" delete;';
            }).join(' ');
        }else{
            return _.map( ids, function(id){
                return '' +
                    'helixorient_show_axis({' + self.selection(id) + '}, ' +
                        '"helixorient_' + id + '_axis__no_widget__", ' +
                        ( params.show_local_axes ? 'true' : 'false' ) +
                    ');' +
                '';
            }).join(' ');
        }
    },
    show_axis: function(id, flag, params, callback){
        params.show_local_axes = this.params_widget.show_local_axes();
        var s = this._show_axis(id, flag, params);
        this.applet.script_callback( s, { maintain_selection: true, try_catch: false }, callback );
    },
    axis_cell: Provi.Bio.AtomSelection.CellFactory({
        name: "axis", label: "axis", color: "skyblue"
    })
});
Provi.Bio.AtomSelection.SelectionTypeRegistry.add(
    'helixorient', Provi.Bio.Helix.HelixorientSelectionType
);





Provi.Bio.Helix.HelixcrossingWidget = function(params){
    params = _.defaults(
        params,
        Provi.Bio.Helix.HelixcrossingWidget.prototype.default_params
    );
    Provi.Bio.AtomSelection.GridWidget.call( this, params );
}
Provi.Bio.Helix.HelixcrossingWidget.prototype = Utils.extend(Provi.Bio.AtomSelection.GridWidget, /** @lends Provi.Bio.Helix.HelixcrossingWidget.prototype */ {
    default_params: {
        heading: 'Helixcrossing Grid',
        collapsed: false,
        type: 'helixcrossing',
        hide_eids: []
    },

})




Provi.Bio.Helix.HelixcrossingSelectionType = function(params){
    Provi.Bio.AtomSelection.SelectionType.call( this, params );
    this.handler = _.defaults({
        "show_crossing": {
            "selector": 'input[cell="crossing"]',
            "click": this.show_crossing
        },
        "show_contacts": {
            "selector": 'input[cell="helixcontacts"]',
            "click": this.show_contacts
        }
    }, this.handler );
}
Provi.Bio.Helix.HelixcrossingSelectionType.prototype = Utils.extend(Provi.Bio.AtomSelection.SelectionType, /** @lends Provi.Bio.Helix.HelixcrossingSelectionType.prototype */ {
    _init: function(grid){
        this.applet.script_wait('' +
            'script "../data/jmol_script/helixorient.jspt";' +
            'function helix_pairs( sele ){' +
                'var d = {};' +
                // todo: join helices, split helices, min helix length
                'var helices = {@sele and helix and protein}.strucno.all.count();' +
                'var n = helices.length;' +
                'set bondModeOr = true;' +
                'for(var i = 1; i<n; i++){' +
                    'var x = (helices[i])[1];' +
                    'for(var j = i+1; j<=n; j++){' +
                        'var y = (helices[j])[1];' +
                        // todo: min number of residues between two helices
                        'if( {*.CA and strucno=@x}.length > 4 & ' +
                            '{*.CA and strucno=@y}.length > 4 & ' +
                            '({strucno=@x and backbone}.bonds & {strucno=@y and backbone}.bonds).size == 0 &' +
                            '{ within(4.0, false, strucno=@x) and strucno=@y } ' +
                        '){' +
                            'var angl = helixorient_crossingangle( {strucno=@x}, {strucno=@y} );' +
                            'var name = "" + x + "_" + y;' +
                            'd[ name ] = [ name, x, y, angl ];' +
                        '}' +
                    '}' +
                '}' +
                'set bondModeOr = false;' +
                'return d;' +
            '}' +
            'function provi_helixcrossing_test(ids){' +
                //'try{' +
                    'var sele_l = [];' +
                    'var draw_l = [];' +
                    'var contact_l = [];' +
                    'var s = "";' +
                    'for(id in ids){' +
                        'var pair = id.split("_");' +
                        'var a = pair[1]*1; var b = pair[2]*1;' + // convert to int
                        'sele_l += {strucno=@a or strucno=@b}.selected.join("");' +
                        'tmpA = 0;' +
                        's = "tmpA = ($helixorient_"+id+"_axis__no_widget__A & true)+0";' +
                        'script INLINE @s;' +
                        'tmpB = 0;' +
                        's = "tmpB = ($helixorient_"+id+"_axis__no_widget__B & true)+0";' +
                        'script INLINE @s;' +
                        'draw_l += (tmpA+tmpB)/2;' +
                        'tmp = 0;' +
                        's = "tmp = ($helixcontact_"+id+" & true)+0";' +
                        'script INLINE @s;' +
                        'contact_l += tmp;' +
                    '}' +
                //'}catch(){}' +
                'var angl = 0;' +
                'if( ids.length==1 ){' +
                    'angl = (provi_data["helixcrossing"][ ids[1] ][4])[1];' +
                '}' +
                'return [ sele_l.average, draw_l.average, contact_l.average, angl ];' +
            '};' +
        '');
    },
    calculate: function(){
        var self = this;
        this.ready = false;
        this.applet.script_callback('' +
            'if(!provi_data){ provi_data = {}; }' +
            'provi_data["helixcrossing"] = helix_pairs({' + this.filtered() + '});' +
        '', {}, function(){
            console.log("helixcrossing", "calculate_ready");
            self.ready = true;
            $(self).trigger("calculate_ready");
        });
    },
    get_ids: function(){
        if( !this.ready ) return [];
        var s = 'provi_data["helixcrossing"].keys.join(",")';
        var data = this.applet.evaluate(s);
        if(data){
            data = data.split(",");
        }
        // todo: sort
        return data || [];
    },
    _get_data: function(ids, applet){
        var s = 'provi_helixcrossing_test(["' + ids.join('","') + '"]).join(",")';
        var a = applet.evaluate(s);
        if(a){
            a = a.split(",");
        }else{
            a = [0, 0, 0, 0];
        }
        var selected = parseFloat(a[0]);
        var axis = parseFloat(a[1]);
        var contacts = parseFloat(a[2]);
        var angle = parseFloat(a[3]);

        return [ selected, axis, contacts, angle ];
    },
    get_data: function(id){
        var ids = (id=="all") ? this.get_ids() : [id];
        return this._get_data( ids, this.applet );
    },
    make_row: function(id){
        var a = this.get_data(id);
        if(id==="all"){
            var label = "Helixcrossing";
        }else{
            ids = id.split("_");
            var label = ids[0] + " - " + ids[1] + ' (' + a[3].toFixed(2) + '\u00B0)';
        }

        var $row = $('<div></div>');
        $row.append(
            this.selected_cell( id, a[0] ),
            this.label_cell( label ),
            this.crossing_cell( id, a[1] ),
            this.contacts_cell( id, a[2] )
        );
        return $row;
    },
    selection: function(id){
        if( id==='all' ){
            return 'within(MODEL, (' + this.filtered() + ') and helix)';
        }else{
            ids = id.split("_");
            return '(strucno=' + ids[0] + ' or strucno=' + ids[1] + ')';
        }
    },
    _show_crossing: function(id, flag, params){
        params = params || {};
        var self = this;
        var ids = (id==='all') ? this.get_ids() : [ id ];
        if(flag){
            return _.map( ids, function(id){
                return 'draw ID "helixorient_' + id + '_axis__no_widget__*" delete;';
            }).join(' ');
        }else{
            return _.map( ids, function(id){
                var pair = id.split("_");
                return '' +
                    'var x = provi_data["helixcrossing"]["' + id + '"][4];' +
                    'helixorient_drawaxis(' + 
                        'x[2], "helixorient_' + id + '_axis__no_widget__A");' +
                    'helixorient_drawaxis(' + 
                        'x[3], "helixorient_' + id + '_axis__no_widget__B");' +
                '';
            }).join(' ');
        }
    },
    show_crossing: function(id, flag, params, callback){
        var s = this._show_crossing(id, flag, params);
        this.applet.script_callback( s, { maintain_selection: true, try_catch: false }, callback );
    },
    _show_contacts: function(id, flag, params){
        params = params || {};
        var self = this;
        var ids = (id==='all') ? this.get_ids() : [ id ];
        if(flag){
            return _.map( ids, function(id){
                return 'contact ID "helixcontact_' + id + '" delete;';
            }).join(' ');
        }else{
            return _.map( ids, function(id){
                pair = id.split("_");
                return '' +
                    'try{' +
                        'contact ID "helixcontact_' + id + '" ' +
                            '{strucno=' + pair[0] + '} {strucno=' + pair[1] + '} ' +
                            'full vdw 110%;' +
                    '}catch(){}' +
                '';
            }).join(' ');
        }
    },
    show_contacts: function(id, flag, params, callback){
        var s = this._show_contacts(id, flag, params);
        this.applet.script_callback( s, { maintain_selection: true, try_catch: false }, callback );
    },
    crossing_cell: Provi.Bio.AtomSelection.CellFactory({
        name: "crossing", label: "crossing", color: "skyblue"
    }),
    contacts_cell: Provi.Bio.AtomSelection.CellFactory({
        name: "helixcontacts", label: "contacts", color: "tomato"
    })
});
Provi.Bio.AtomSelection.SelectionTypeRegistry.add(
    'helixcrossing', Provi.Bio.Helix.HelixcrossingSelectionType
);








/**
 * A widget
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Bio.Helix.GromacsHelixorientWidget = function(params){
    params = _.defaults(
        params,
        Provi.Bio.Helix.GromacsHelixorientWidget.prototype.default_params
    );
    console.log('HELIXORIENT', params);
    params.persist_on_applet_delete = true;
    
    //params.collapsed = false;
    Provi.Widget.Widget.call( this, params );
    this._init_eid_manager([
        'center_ds_selector', 'axis_ds_selector', 'ndx_ds_selector',
        'applet_selector_widget', 'draw'
    ]);
    
    //this. = params.
    
    var template = '' +
        '<div class="control_row" id="${eids.applet_selector_widget}"></div>' +
        '<div class="control_row" id="${eids.center_ds_selector}"></div>' +
        '<div class="control_row" id="${eids.axis_ds_selector}"></div>' +
        '<div class="control_row" id="${eids.ndx_ds_selector}"></div>' +
        '<div class="control_row">' +
            '<button id="${eids.draw}">draw</button>' +
        '</div>' +
    '';
    this.add_content( template, params );

    this.applet_selector = new Provi.Jmol.JmolAppletSelectorWidget({
        parent_id: this.eid('applet_selector_widget')
    });
    this.center_ds_selector = new Provi.Data.DatasetSelectorWidget({
        parent_id: this.eid('center_ds_selector'),
        selector_label: 'center.dat',
        ext_list: ['dat']
    });
    this.axis_ds_selector = new Provi.Data.DatasetSelectorWidget({
        parent_id: this.eid('axis_ds_selector'),
        selector_label: 'helixaxis.dat',
        ext_list: ['dat']
    });
    this.ndx_ds_selector = new Provi.Data.DatasetSelectorWidget({
        parent_id: this.eid('ndx_ds_selector'),
        selector_label: 'helixorient.ndx',
        ext_list: ['ndx']
    });

    this._init();
}
Provi.Bio.Helix.GromacsHelixorientWidget.prototype = Utils.extend(Provi.Widget.Widget, /** @lends Provi.Bio.Helix.GromacsHelixorientWidget.prototype */ {
    default_params: {
        heading: 'Helixorient'
    },
    _init: function(){
        var self = this;
        
        this.elm('draw').button().click( function(){
            self.draw();
        });

        $(this.center_ds_selector).bind('change', function(){
            self.center_ds = self.center_ds_selector.get_ds();
            self._init_center();
        });

        $(this.axis_ds_selector).bind('change', function(){
            self.axis_ds = self.axis_ds_selector.get_ds();
            self._init_axis();
        });

        $(this.ndx_ds_selector).bind('change', function(){
            self.ndx_ds = self.ndx_ds_selector.get_ds();
            self._init_ndx();
        });

        Provi.Widget.Widget.prototype.init.call(this);
    },
    parse_dat: function( raw_dat ){
        if( !raw_dat ) return;  
        var dat = [];
        _.each( raw_dat.split(/\r\n|\r|\n/), function( line, i ){
            var d = line.trim().split(/\s+/);
            var n = d.length;
            if( n>1 ){
                var values = [];
                for ( var i = 1; i<n; i+=3 ){
                    values.push( _.map( d.slice(i,i+3), parseFloat ) );
                }
                dat.push({ time: parseInt(d[0]), values: values });
            }
        });
        return dat;
    },
    _init_center: function(){
        if( !this.center_ds ) return;
        this.center_dat = this.parse_dat( this.center_ds.data );
    },
    _init_axis: function(){
        if( !this.axis_ds ) return; 
        this.axis_dat = this.parse_dat( this.axis_ds.data );
    },
    _init_ndx: function(){
        if( !this.ndx_ds ) return;
        console.log( this.ndx_ds.data );
        this.ndx_dat = this.ndx_ds.data.ndx_list[0][1];
    },
    draw: function(){
        console.log( this.center_dat, this.axis_dat );
        var applet = this.applet_selector.get_value(true);
        var self = this;
        if (!applet || !this.center_dat || !this.axis_dat) return;

        var n1 = this.ndx_dat.length-1;
        var s = '';
        s += 'draw PLANE {47 62 62} {67 12 62} {17 52 62} FIXED; ' +
            'draw ID "pv1" Vector {47 62 62} {0 0 15} FIXED; ' +
            'function vec_mag(v){ return sqrt(v.X*v.X + v.Y*v.Y + v.Z*v.Z) }; ' +
            'function vec2plane_proj(v, pn){' +
                'var c1 = cross( v, pn );' + 
                'var c2 = cross( c1, pn );' + 
                'return c2/c2;' +
            '};' +
            '';
        _.each( this.center_dat, function( d, i ){
            var axis = self.axis_dat[i];
            s += 'frame ' + i + ';';
            _.each( d.values, function( c, j ){
                var v = axis.values[j];
                if( j>0 && j<n1 ){
                    s += 'draw ID "o_' + i + '_' + j + '" ARROW ' + 
                        '{ ' + (10*c[0]) + ' ' + (10*c[1]) + ' ' + (10*c[2]) + ' } ' +
                        '{ model="' + i + '" and atomno=' + self.ndx_dat[j] + ' }' +
                        'COLOR @{ color("rwb", 1, ' + n1 + ', ' + j + ') } ' +
                        ';';
                    s += 'draw ID "x_' + i + '_' + j + '" VECTOR ' + 
                        '{ ' + (10*c[0]) + ' ' + (10*c[1]) + ' ' + (10*c[2]) + ' } ' +
                        '{ ' + v[0] + ' ' + v[1] + ' ' + v[2] + ' } ' +
                        'SCALE 700 ' +
                        'COLOR @{ color("rwb", 1, ' + n1 + ', ' + j + ') } ' +
                        ';';
                    s += 'draw ID "p_' + i + '_' + j + '" VECTOR ' + 
                        '{ ' + (10*c[0]) + ' ' + (10*c[1]) + ' ' + '62' + ' } ' +
                        '@{ vec2plane_proj(point(' + v[0] + ', ' + v[1] + ', ' + v[2] + '), point(0, 0, 10)) } ' +
                        'SCALE 700 ' +
                        'COLOR @{ color("rwb", 1, ' + n1 + ', ' + j + ') } ' +
                        ';';
                }
            });
        });
        console.log( s );
        applet.script( s, true );
    }
});


// $(document).ready(function(){
//     $.ajax({
//         type: "GET",
//         url: "sites.xml",
//         dataType: "xml",
//         success: function(xml) {
//             $(xml).find('site').each(function(){
//                 var id = $(this).attr('id');
//                 var title = $(this).find('title').text();
//                 var url = $(this).find('url').text();
//                 $('<div class="items" id="link_'+id+'"></div>').html('<a href="'+url+'">'+title+'</a>').appendTo('#page-wrap');
//                 $(this).find('desc').each(function(){
//                     var brief = $(this).find('brief').text();
//                     var long = $(this).find('long').text();
//                     $('<div class="brief"></div>').html(brief).appendTo('#link_'+id);
//                     $('<div class="long"></div>').html(long).appendTo('#link_'+id);
//                 });
//             });
//         }
//     });
// });



})();