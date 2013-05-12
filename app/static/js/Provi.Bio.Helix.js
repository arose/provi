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




// TODO not working anymore
Provi.Bio.Helix.HelixorientParamsWidget = function(params){
    params = _.defaults( params, this.default_params );
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




Provi.Bio.Helix.HelixorientDatalist = function(params){
    Provi.Bio.AtomSelection.SelectionDatalist.call( this, params );
    this.handler = _.defaults({
        show_axis: {
            selector: 'input[cell="axis"]',
            click: this.show_axis,
            label: "axis"
        },
        colorize_axis: {
            selector: 'input[cell="colorize"]',
            click: this.colorize_axis,
            label: "colorize"
        }
    }, this.handler );
}
Provi.Bio.Helix.HelixorientDatalist.prototype = Utils.extend(Provi.Bio.AtomSelection.SelectionDatalist, {
    type: "HelixorientDatalist",
    params_object: Provi.Bio.Helix.HelixorientParamsWidget,
    _init: function(grid){
        this.initialized = false;
        this.applet.script_callback('' +
            'script "../data/jmol_script/helixorient.jspt";' +
        '', {}, _.bind( function(){
            this.initialized = true;
            $(this).trigger("init_ready");
        }, this ) );
    },
    calculate: function(){
        if( !this.initialized ) return;
        var self = this;
        this.ready = false;
        this.applet.script_callback('' +
            'provi_data["helixorient"] = calc_helices({' + this.filtered() + '});' +
        '', {}, function(){
            console.log("helixorient", "calculate_ready");
            self.ready = true;
            $(self).trigger("calculate_ready");
        });
    },
    get_ids: function(){
        if( !this.ready ) return [];
        var s = 'provi_data["helixorient"].length';
        var data = this.applet.evaluate(s);
        return _.range(1, parseInt(data)+1);
    },
    get_data: function(id){
        if( !this.ready ) return [0, 0];
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
            this.label_cell( label, id ),
            this.axis_cell( id, a[1] ),
            this.colorize_cell( id, false )
        );
        return $row;
    },
    selection: function(id){
        if( id==='all' ){
            return 'within(MODEL, ' + this.filtered() + ' and helix)';
        }else{
            return '@provi_data["helixorient"][' + id + ']["sele"]';
            // return 'strucno=' + id;
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
                    'var x = provi_data["helixorient"][' + id + '];' +
                    'helixorient_drawaxis(' + 
                        'x["axis"], "helixorient_' + id + '_axis__no_widget__"' +
                    ');' +
                    // 'helixorient_show_axis(provi_data["helixorient"][' + id + ']["sele"], ' +
                    //     '"helixorient_' + id + '_axis__no_widget__", ' +
                    //     ( params.show_local_axes ? 'true' : 'false' ) +
                    // ');' +
                '';
            }).join(' ');
        }
    },
    show_axis: function(id, flag, params, callback){
        // params.show_local_axes = this.params_widget.show_local_axes();
        var s = this._show_axis(id, flag, params);
        console.log("show_axis", s);
        this.applet.script_callback( s, { maintain_selection: true, try_catch: false }, callback );
    },
    _colorize_axis: function(id, flag, params){
        params = params || {};
        var self = this;
        var ids = (id==='all') ? this.get_ids() : [ id ];
        if(flag){
            return _.map( ids, function(id){
                return '' +
                    'var x = provi_data["helixorient"][' + id + '];' +
                    'color {@x["sele"]} cpk;';
            }).join(' ');
        }else{
            return _.map( ids, function(id){
                return '' +
                    'var x = provi_data["helixorient"][' + id + '];' +
                    'helixorient_colorize( x["data"] );' +
                '';
            }).join(' ');
        }
    },
    colorize_axis: function(id, flag, params, callback){
        var s = this._colorize_axis(id, flag, params);
        this.applet.script_callback( s, { maintain_selection: true, try_catch: false }, callback );
    },
    axis_cell: Provi.Widget.Grid.CellFactory({
        name: "axis", color: "skyblue"
    }),
    colorize_cell: Provi.Widget.Grid.CellFactory({
        name: "colorize", color: "tomato"
    })
});







Provi.Bio.Helix.HelixcrossingDatalist = function(params){
    Provi.Bio.AtomSelection.SelectionDatalist.call( this, params );
    this.handler = _.defaults({
        show_crossing: {
            selector: 'input[cell="crossing"]',
            click: this.show_crossing,
            label: "crossing"
        },
        show_contacts: {
            selector: 'input[cell="helixcontacts"]',
            click: this.show_contacts,
            label: "contacts"
        }
    }, this.handler );
}
Provi.Bio.Helix.HelixcrossingDatalist.prototype = Utils.extend(Provi.Bio.AtomSelection.SelectionDatalist, {
    type: "HelixcrossingDatalist",
    _init: function(grid){
        this.initialized = false;
        this.applet.script_callback('' +
            'script "../data/jmol_script/helixorient.jspt";' +
        '', {}, _.bind( function(){
            console.log("helixcrossing", "initialized");
            this.initialized = true;
            $(this).trigger("init_ready");
        }, this ) );
    },
    calculate: function(){
        if( !this.initialized ) return;
        var self = this;
        this.ready = false;
        this.applet.script_callback('' +
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
        if( !this.ready ) return [0, 0, 0, 0];
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
            var label = ids[0] + " - " + ids[1] + ' (' + a[3].toFixed(2) + '\u00B0)' + 
                // ' /' + ( a[2]=="0" ? parseInt(a[3])+1 : a[2] ) +
                '';
        }

        var $row = $('<div></div>');
        $row.append(
            this.selected_cell( id, a[0] ),
            this.label_cell( label, id ),
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
        console.log("show_crossing", s);
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
    crossing_cell: Provi.Widget.Grid.CellFactory({
        name: "crossing", color: "skyblue"
    }),
    contacts_cell: Provi.Widget.Grid.CellFactory({
        name: "helixcontacts", color: "tomato"
    })
});






/**
 * A widget
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Bio.Helix.GromacsHelixorientWidget = function(params){
    params = _.defaults( params, this.default_params );
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




})();