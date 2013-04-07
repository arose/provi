/**
 * @fileOverview This file contains the {@link Provi.Bio.HydrogenBonds} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * Module providing functionality around Hydrogen bonds
 * @namespace 
 */
Provi.Bio.HydrogenBonds = {};

(function() {

var Utils = Provi.Utils;
var Widget = Provi.Widget.Widget;



/**
 * Represents a bond set
 * @constructor
 */
Provi.Bio.HydrogenBonds.BondSet = function(bondset){
    this.bondset = bondset;
};
Provi.Bio.HydrogenBonds.BondSet.prototype = /** @lends Provi.Bio.HydrogenBonds.BondSet.prototype */ {
    sele: function(){
        return this.bondset;
    }
}


// /**
//  * Represents hydrogen bonds
//  * @constructor
//  */
// Provi.Bio.HydrogenBonds.Hbonds = function(hbonds_list){
//     this.hbonds_list = hbonds_list;
//     this.init();
// };
// Provi.Bio.HydrogenBonds.Hbonds.prototype = Provi.Utils.extend(Provi.Bio.Smcra.AbstractAtomPropertyMap, /** @lends Provi.Bio.HydrogenBonds.Hbonds.prototype */ {
//     key_length: 2,
//     init: function(){
// 	console.log( 'HBX', this );
// 	var self = this;
// 	this.property_dict = {};
// 	this.property_list = [];
// 	this._keys = [];
// 	$.each( this.hbonds_list, function(i, hb){
// 	    var property = {
// 		atom1: { resno: hb[0][3], chain: hb[0][2], atom_name: $.trim(hb[0][0]) },
// 		atom2: { resno: hb[1][3], chain: hb[1][2], atom_name: $.trim(hb[1][0]) },
// 		type: hb[2],
// 		sele: '(' + hb[0][3] + ':' + hb[0][2] + '.' + $.trim(hb[0][0]) + ' OR ' +
// 		    hb[1][3] + ':' + hb[1][2] + '.' + $.trim(hb[1][0]) + ')'
// 	    }
// 	    var key1 = [ hb[0][2], hb[0][3], $.trim(hb[0][0]) ];
// 	    var key2 = [ hb[1][2], hb[1][3], $.trim(hb[1][0]) ];
// 	    var key = [ key1, key2 ];
// 	    self._keys.push( key );
// 	    self.property_dict[ key ] = property;
// 	    self.property_list.push( property );
// 	});
//     },
//     _get: function(id){
// 	//console.log('ID', id );
// 	return this.property_dict[ id ];
//     },
//     _cmp_id: function(id, own_id){
// 	var len = id.length;
// 	return Provi.Utils.array_cmp( id, own_id[0].slice(0, len) ) ||
// 	    Provi.Utils.array_cmp( id, own_id[1].slice(0, len) );
//     }
// });



/**
 * A widget to view hydrogen bonds data
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 * @param {Provi.Jmol.Applet} params.applet The applet the widget will be bound to
 * @param {Provi.Data.Dataset} params.dataset The dataset the widget will be bond to
 */
Provi.Bio.HydrogenBonds.HbondsWidget = function(params){
    params = _.defaults(
        params,
        Provi.Bio.HydrogenBonds.HbondsWidget.prototype.default_params
    );
    
    /** Color in which the hydrogen bonds are drawn */
    this.color = params.color;
    this.filter = params.filter;
    this.show_hbonds = params.show_hbonds;
    this.bond_mode_or = params.bond_mode_or;
    this.tmhelix_atmsele_ds = params.tmhelix_atmsele_ds;

    this.applet = params.applet;
    this.dataset = params.dataset;
    
    Provi.Widget.Widget.call( this, params );
    this._init_eid_manager([
        'grid', 'show_hbonds', 'filter', 'bond_mode_or'
    ]);

    var template = '' +
        '<div class="control_row">' +
            '<input id="${eids.show_hbonds}" type="checkbox" />' +
            '<label for="${eids.show_hbonds}">show hydrogen bonds</label>&nbsp;' +
        '</div>' +
        '<div class="control_row">' +
            '<input id="${eids.bond_mode_or}" type="checkbox" />' +
            '<label for="${eids.bond_mode_or}">bond mode "OR"</label>&nbsp;' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="${eids.filter}">filter</label>' +
            '&nbsp;' +
            '<select id="${eids.filter}" class="ui-state-default">' +
                '<option value="all">all</option>' +
                '<option value="backbone">backbone</option>' +
                '<option value="sidechain">sidechain</option>' +
            '</select>' +
        '</div>' +
        '<div class="control_row">' +
            '<i>The hydrogen bonds are shown as dashed lines.</i>' +
        '</div>' +
        '<div class="control_row">' +
            '<div id="${eids.grid}"></div>' +
        '</div>' +
    '';
    this.add_content( template, params );
    this._init();
}
Provi.Bio.HydrogenBonds.HbondsWidget.prototype = Utils.extend(Widget, /** @lends Provi.Bio.HydrogenBonds.HbondsWidget.prototype */ {
    /** initialisation */
    default_params: {
        heading: 'Hydrogen bonds',
        show_hbonds: false,
        // color: 'blue',
        color: 'cpk',
        filter: 'all',
        bond_mode_or: false
    },
    _init: function(){
        var self = this;

        this.elm('show_hbonds').change( function() {
            self.show_hbonds = self.elm("show_hbonds").is(":checked");
            self.show();
        });

        this.elm('bond_mode_or').change( function() {
            self.bond_mode_or = self.elm("bond_mode_or").is(":checked");
            self.show();
        });

        this.elm('filter').change( function() {
            self.filter = self.elm('filter').children("option:selected").val();
            self.show();
        });
        
        if( this.tmhelix_atmsele_ds ){
            this.elm('filter').children().first().after(
                '<option value="interhelical">interhelical (TODO: not working)</option>'
            );
        }
        
        Provi.Widget.Widget.prototype.init.call(this);
    },
    get_filter: function(){
        if( !this.filter ) return '*';

        if( this.filter==='interhelical' ){
            return 'helix and sidechain';
        }else{
            return this.filter;
        }
    },
    show: function(){
        var sele = this.dataset.data.sele();
        var filter_sele = this.get_filter();;
        var bond_mode_or = this.bond_mode_or;
        console.log(this, sele, filter_sele);
        var s = '' +
            'var bs = ' + sele + ';' +
            'color @bs ' + this.color + ';' +
            'connect @bs hbonds;' +
            'hide add @bs;' +
            'set bondModeOr ' + bond_mode_or + ';' +
        '';
        if( this.show_hbonds ){
            s += '' +
                'var atms = bs.atoms.all;' +
                'var filter = {atms and ' + filter_sele + '};' +
                'var filtered_bs = filter.bonds and bs;' +
                'display add @filtered_bs;' +
            '';
        }
        s += 'set bondModeOr false;';
        this.applet.script( s, { maintain_selection: true, try_catch: true } );
    }
});



/**
 * A widget to get params
 * @constructor
 * @extends Provi.Widget.Widget
 */
Provi.Bio.HydrogenBonds.HbondParamsWidget = function(params){
    params = _.defaults(
        params,
        Provi.Bio.HydrogenBonds.HbondParamsWidget.prototype.default_params
    );
    Provi.Widget.Widget.call( this, params );
    this._init_eid_manager([ 'filter', 'bond_mode_or', 'angle_min', 'dist_max' ]);

    var template = '' +
        '<div class="control_row">' +
            '<input id="${eids.bond_mode_or}" type="checkbox" />' +
            '<label for="${eids.bond_mode_or}">bond mode "OR"</label>&nbsp;' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="${eids.filter}">filter</label>' +
            '&nbsp;' +
            '<select id="${eids.filter}" class="ui-state-default">' +
                '<option value="all">all</option>' +
                '<option value="backbone">backbone</option>' +
                '<option value="sidechain">sidechain</option>' +
            '</select>' +
        '</div>' +
        '<div class="control_row">' +
            '<input size="4" id="${eids.angle_min}" type="text" class="ui-state-default"/>' +
            '<label for="${eids.angle_min}" >min angle</label> ' +
            '<input size="4" id="${eids.dist_max}" type="text" class="ui-state-default"/>' +
            '<label for="${eids.dist_max}" >max distance</label> ' +
        '</div>' +
    '';
    this.add_content( template, params );

    this.elm('bond_mode_or').attr( 'checked', params.bond_mode_or );
    this.elm('filter').val( params.filter );
    this.elm('angle_min').val( params.angle_min );
    this.elm('dist_max').val( params.dist_max );
}
Provi.Bio.HydrogenBonds.HbondParamsWidget.prototype = Utils.extend(Widget, /** @lends Provi.Bio.HydrogenBonds.HbondParamsWidget.prototype */ {
    default_params: {
        bond_mode_or: false,
        filter: 'sidechain',
        angle_min: 60,
        dist_max: 3.9
    },
    filter: function(){
        return this.elm('filter').val();
    },
    bond_mode_or: function(){
        return this.elm('bond_mode_or').is(':checked');
    },
    angle_min: function(){
        return this.elm('angle_min').val();
    },
    dist_max: function(){
        return this.elm('dist_max').val();
    }
});



Provi.Bio.HydrogenBonds.HbondsSelectionType = function(params){
    Provi.Bio.AtomSelection.SelectionType.call( this, params );
    this.handler = _.defaults({

    }, this.handler );
}
Provi.Bio.HydrogenBonds.HbondsSelectionType.prototype = Utils.extend(Provi.Bio.AtomSelection.SelectionType, /** @lends Provi.Bio.HydrogenBonds.HbondsSelectionType.prototype */ {
    _init: function(grid){
        grid.elm("widgets").empty();
        this.params_widget = new Provi.Bio.HydrogenBonds.HbondParamsWidget({
            parent_id: grid.eid('widgets')
        });
        var self = this;
        this.initialized = false;
        this.applet.script_callback('' +
            'script "../data/jmol_script/hbond.jspt";' +
        '', {}, function(){
            self.initialized = true;
            $(self).trigger("init_ready");
        });
    },
    calculate: function(){
        var self = this;
        this.ready = false;
        var filtered = this.filtered() + ' and ' + this.params_widget.filter();
        var s = '' +
            'set bondModeOr = ' + 
                ( this.params_widget.bond_mode_or() ? 'true' : 'false' ) + ';' +
            'provi_data["hbonds"] = provi_hbonds(' +
                '{' + filtered + '}, ' +
                this.params_widget.angle_min() + ', ' +
                this.params_widget.dist_max() + 
            ');' +
        '';
        console.log(s);
        this.applet.script_callback(s, {}, function(){
            self.ready = true;
            $(self).trigger("calculate_ready");
        });
    },
    get_ids: function(){
        if( !this.ready ) return [];
        var s = 'provi_data["hbonds"]';
        var data = this.applet.evaluate(s).split("\n");
        // console.log("hbonds sele", data);
        return data;
    },
    get_data: function(id){
        var pair = id.split("_");
        var format = '\'%[group1]\',\'%[resno]\',\'%[chain]\',\\"%[atomName]\\",\'%[file]\',\'%[model]\',\'%[selected]\'';
        var a1 = this.applet.atoms_property_map( format, 'atomindex='+pair[0] )[0];
        var a2 = this.applet.atoms_property_map( format, 'atomindex='+pair[1] )[0];
        return [ a1, a2 ];
    },
    make_row: function(id){
        if(id==='all'){
            var label = 'Hbonds';
            var s = '{' + this.selection(id) + '}.selected.join("")';
            var selected = this.applet.evaluate(s);
            var color = '';
        }else{
            var a = this.get_data(id);
            var label = id;
            var selected = 0;
            if(a){
                label = '' +
                    a[0][0] + a[0][1] + ':' + a[0][2] + '.' + 
                        a[0][3] + '/' + a[0][4] + '.' + a[0][5] +
                    ' -- ' +
                    a[1][0] + a[1][1] + ':' + a[1][2] + '.' + 
                        a[1][3] + '/' + a[1][4] + '.' + a[1][5] +
                '';
                selected = ( parseInt(a[0][6]) + parseInt(a[1][6]) ) / 2;
            }
        }

        var $row = $('<div></div>');
        $row.append(
            this.selected_cell( id, selected ),
            this.label_cell( label )
        );
        return $row;
    },
    selection: function(id){
        if( id==='all' ){
            return 'within(MODEL, (' + this.filtered() + ') and helix)';
        }else{
            pair = id.split("_");
            return '(atomindex=' + pair[0] + ' or atomindex=' + pair[1] + ')';
        }
    }
});
Provi.Bio.AtomSelection.SelectionTypeRegistry.add(
    'hbonds', Provi.Bio.HydrogenBonds.HbondsSelectionType
);





})();