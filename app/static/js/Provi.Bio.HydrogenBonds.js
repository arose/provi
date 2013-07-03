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
Provi.Bio.HydrogenBonds.BondSet = function( params ){
    params = _.defaults( params, this.default_params );
    var p = [ "applet", "dataset" ];
    _.extend( this, _.pick( params, p ) );
    var self = this;
    $(this.dataset).bind("loaded", function(){self.sele()});
    this.load();
};
Provi.Bio.HydrogenBonds.BondSet.prototype = /** @lends Provi.Bio.HydrogenBonds.BondSet.prototype */ {
    default_params: {

    },
    load: function( applet ){
        var s = '' +
            'var x = load("' + this.dataset.url + '");' +
            'var bond_count_before = {*}.bonds.size;' +
            'script INLINE @x;' +
            'var bond_count_after = {*}.bonds.size;' +
            'var bs = "[{" + (bond_count_before) + ":" + (bond_count_after-1) + "}]";' +
            'hide add @bs;' +
            'provi_datasets[' + this.dataset.id + '] = bs;' + 
            'provi_dataset_loaded( ' + this.dataset.id + ' );' +
        '';
        console.log(s);
        this.applet.script(s, { maintain_selection: true, try_catch: false });
    },
    sele: function(){
        var d = this.applet.evaluate( "provi_datasets[" + this.dataset.id + "]" );
        console.log(d);
        return d;
    }
}




/**
 * A widget to view hydrogen bonds data
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 * @param {Provi.Jmol.Applet} params.applet The applet the widget will be bound to
 * @param {Provi.Data.Dataset} params.dataset The dataset the widget will be bond to
 */
Provi.Bio.HydrogenBonds.HbondsWidget = function(params){
    params = _.defaults( params, this.default_params );
    
    var p = [ "applet", "dataset", "color", "filter", "show_hbonds", "bond_mode_or", "tmhelix_atomsele_ds" ];
    _.extend( this, _.pick( params, p ) );
    
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
        var sele = this.dataset.bio.sele();
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





Provi.Bio.HydrogenBonds.HbondParamsWidget = function(params){
    Provi.Widget.ParamsWidget.call( this, params );
}
Provi.Bio.HydrogenBonds.HbondParamsWidget.prototype = Utils.extend(Provi.Widget.ParamsWidget, {
    params_dict: {
        bond_mode_or: { default: false, type: "checkbox" },
        filter: { default: "sidechain", type: "select", options: [ 'all', 'backbone', 'sidechain' ] },
        angle_min: { default: 60, type: "slider", range: [ 20, 120 ] },
        dist_max: { default: 3.9, type: "slider", range: [ 20, 50 ], factor: 10, fixed: true }
    }
});


Provi.Bio.HydrogenBonds.HbondsDatalist = function(params){
    params = _.defaults( params, this.default_params );

    var p = [ "filter", "bond_mode_or", "angle_min", "dist_max" ];
    _.extend( this, _.pick( params, p ) );

    Provi.Bio.AtomSelection.SelectionDatalist.call( this, params );
    this.handler = _.defaults({
        "show_hbres": {
            "selector": 'input[cell="hbres"]',
            "click": this.show_hbres,
            "label": "hydrogen bond residue"
        },
        "show_hbond": {
            "selector": 'input[cell="hbond"]',
            "click": this.show_hbond,
            "label": "hydrogen bond"
        }
    }, this.handler );
}
Provi.Bio.HydrogenBonds.HbondsDatalist.prototype = Utils.extend(Provi.Bio.AtomSelection.SelectionDatalist, {
    type: "HbondsDatalist",
    params_object: Provi.Bio.HydrogenBonds.HbondParamsWidget,
    jspt_url: "../data/jmol_script/hbond.jspt",
    default_params: {
        filter: 'sidechain',
        bond_mode_or: false,
        angle_min: 60,
        dist_max: 3.9
    },
    calculate: function(){
        if( !this.initialized ) return;
        this.ready = false;
        var s = 'provi_data["hbonds"] = provi_hbonds(' +
            '{' + this.filtered() + ' and ' + this.filter + '}, ' +
            this.angle_min + ', ' +
            this.dist_max + ', ' +
            ( this.bond_mode_or ? 'true' : 'false' ) +
        ');';
        this.applet.script_callback( s, {}, _.bind( this.set_ready, this ) );
    },
    get_ids: function(){
        if( !this.ready ) return [];
        var s = 'provi_data["hbonds"]';
        var data = this.applet.evaluate(s).trim().split("\n");
        // console.log("hbonds sele", data);
        return data;
    },
    get_data: function(id){
        var ids = (id=="all") ? this.get_ids() : [id];
        var s = 'provi_hbond_test(["' + ids.join('","') + '"]).join(",")';
        var a = this.applet.evaluate(s);
        a = a ? a.split(",") : [0, 0, 0];
        return _.map( a, parseFloat );
    },
    make_row: function(id){
        var a = this.get_data(id);
        // console.log(id, a)
        var selected = a[0];
        var hbond = a[1];
        var hbres = a[2];

        if(id==='all'){
            var label = 'Hbonds';
        }else{
            var format = '\'%[group1]\',\'%[resno]\',\'%[chain]\',\\"%[atomName]\\",\'%[file]\',\'%[model]\'';
            var pair = id.split("_");
            var a1 = this.applet.atoms_property_map( format, 'atomindex='+pair[0] )[0];
            var a2 = this.applet.atoms_property_map( format, 'atomindex='+pair[1] )[0];
            var label = '' +
                a1[0] + a1[1] + ':' + a1[2] + '.' + 
                    a1[3] + '/' + a1[4] + '.' + a1[5] +
                ' -- ' +
                a2[0] + a2[1] + ':' + a2[2] + '.' + 
                    a2[3] + '/' + a2[4] + '.' + a2[5] +
            '';
        }

        var $row = $('<div></div>');
        $row.append(
            this.selected_cell( id, selected ),
            this.label_cell( label, id ),
            this.hbres_cell( id, hbres ),
            this.hbond_cell( id, hbond )
        );
        return $row;
    },
    _show_hbres: function(id, flag, params){
        var self = this;
        var ids = (id==='all') ? this.get_ids() : [ id ];
        return 'provi_toggle_hbond_residues(["' + ids.join('","') + '"], ' + flag + ');';
    },
    show_hbres: function(id, flag, params){
        var s = this._show_hbres(id, flag, params);
        this.script( s, true );
    },
    _show_hbond: function(id, flag, params){
        var self = this;
        var ids = (id==='all') ? this.get_ids() : [ id ];
        return 'provi_toggle_hbond(["' + ids.join('","') + '"], ' + flag + ');';
    },
    show_hbond: function(id, flag, params){
        var s = this._show_hbond(id, flag, params);
        this.script( s, true );
    },
    hbres_cell: Provi.Widget.Grid.CellFactory({
        "name": "hbres", "color": "tomato"
    }),
    hbond_cell: Provi.Widget.Grid.CellFactory({
        "name": "hbond", "color": "skyblue"
    }),
    selection: function(id){
        if( id==='all' ){
            return 'within(MODEL, (' + this.filtered() + ') and helix)';
        }else{
            pair = id.split("_");
            return '(atomindex=' + pair[0] + ' or atomindex=' + pair[1] + ')';
        }
    }
});




})();