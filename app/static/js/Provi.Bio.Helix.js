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
                return 'script "../data/jmol_script/helixorient.jspt";' +
                    'helixorient_show_axis({' + self.selection(id) + '}, ' +
                        '"helixorient_' + id + '_axis__no_widget__", ' +
                        ( params.show_local_axes ? 'true' : 'false' ) +
                    ')' +
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


Provi.Bio.Helix.HelixcrossingSelectionTypeFactory = function(ids){
    return function(params){
        params.ids = ids;
        return new Provi.Bio.Helix.HelixcrossingSelectionType(params);
    }
}

Provi.Bio.Helix.HelixcrossingSelectionType = function(params){
    Provi.Bio.AtomSelection.SelectionType.call( this, params );
}
Provi.Bio.Helix.HelixcrossingSelectionType.prototype = Utils.extend(Provi.Bio.AtomSelection.SelectionType, /** @lends Provi.Bio.Helix.HelixcrossingSelectionType.prototype */ {
    _init: function(grid){
        this.applet.script_wait('' +
            'function helix_pairs( sele ){' +
                'var arr = [];' +
                'var helices = {@sele and helix and protein}.strucno.all.count();' +
                'var n = helices.length;' +
                'for(var i = 1; i<n; i++){' +
                    'var x = (helices[i])[1];' +
                    'for(var j = i+1; j<=n; j++){' +
                        'var y = (helices[j])[1];' +
                        'if({ within(4.0, false, strucno=@x) and strucno=@y }){' +
                            'arr += "" + x + "_" + y;' +
                        '}' +
                    '}' +
                '}' +
                'return arr;' +
            '}' +
            'function provi_helixcrossing_test(ids){' +
                //'try{' +
                    'var sele_l = [];' +
                    'var angle_l = [];' +
                    'var draw_l = [];' +
                    'for(id in ids){' +
                        'var pair = id.split("_");' +
                        'a = pair[1]*1; b = pair[2]*1;' + // convert to int
                        'sele_l += {strucno=@a or strucno=@b}.selected.join("");' +
                        // 'tmp = 0;' +
                        // 'var s = "tmp = ($helixorient_"+id+"_axis__no_widget__ & true)+0";' +
                        // 'script INLINE @s;' +
                        // 'draw_l += tmp;' +
                    '}' +
                //'}catch(){}' +
                'return [ sele_l.average, 0 ];' +
            '};' +
        '');
    },
    get_ids: function(){
        // var s = 'helix_pairs({' + this.filtered() + '}).join(",")';
        var s = 'helix_pairs({*}).join(",")';
        var data = this.applet.evaluate(s);
        if(data){
            data = data.split(",");
        }
        return data || [];
    },
    get_data: function(id){
        var ids = (id=="all") ? this.get_ids() : [id];
        var s = 'provi_helixcrossing_test(["' + ids.join('","') + '"]).join(",")';
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
            var label = "Helixcrossing";
        }else{
            ids = id.split("_");
            var label = ids[0] + " - " + ids[1];
        }

        var $row = $('<div></div>');
        $row.append(
            this.selected_cell( id, a[0] ),
            this.label_cell( label )//,
            //this.axis_cell( id, a[1] )
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
                return 'script "../data/jmol_script/helixorient.jspt";' +
                    'helixorient_show_axis({' + self.selection(id) + '}, ' +
                        '"helixorient_' + id + '_axis__no_widget__")' +
                '';
            }).join(' ');
        }
    },
    show_axis: function(id, flag, params, callback){
        var s = this._show_axis(id, flag, params);
        this.applet.script_callback( s, { maintain_selection: true, try_catch: false }, callback );
    },
    axis_cell: Provi.Bio.AtomSelection.CellFactory({
        name: "axis", label: "axis", color: "skyblue"
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





})();