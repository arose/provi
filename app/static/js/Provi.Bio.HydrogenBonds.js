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
            'x = load("' + this.dataset.url + '");' +
            'bond_count_before = {*}.bonds.size;' +
            'script INLINE @x;' +
            'bond_count_after = {*}.bonds.size;' +
            'bs = "[{" + (bond_count_before) + ":" + (bond_count_after-1) + "}]";' +
            'hide add @bs;' +
            'provi_datasets[' + this.dataset.id + '] = bs;' + 
            'print "provi dataset: ' + this.dataset.id + ' loaded";' +
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



/**
 * A widget to get params
 * @constructor
 * @extends Provi.Widget.Widget
 */
Provi.Bio.HydrogenBonds.HbondParamsWidget = function(params){
    params = _.defaults( params, this.default_params );
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
            'provi_data["hbonds"] = provi_hbonds(' +
                '{' + filtered + '}, ' +
                this.params_widget.angle_min() + ', ' +
                this.params_widget.dist_max() + ', ' +
                ( this.params_widget.bond_mode_or() ? 'true' : 'false' ) +
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
        console.log(id, a)
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
    show_hbres: function(id, flag, params, callback){
        var s = this._show_hbres(id, flag, params);
        this.applet.script_callback( s, { maintain_selection: true }, callback );
    },
    _show_hbond: function(id, flag, params){
        var self = this;
        var ids = (id==='all') ? this.get_ids() : [ id ];
        return 'provi_toggle_hbond(["' + ids.join('","') + '"], ' + flag + ');';
    },
    show_hbond: function(id, flag, params, callback){
        var s = this._show_hbond(id, flag, params);
        this.applet.script_callback( s, { maintain_selection: true }, callback );
    },
    hbres_cell: Provi.Bio.AtomSelection.CellFactory({
        "name": "hbres", "color": "tomato"
    }),
    hbond_cell: Provi.Bio.AtomSelection.CellFactory({
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
Provi.Bio.AtomSelection.SelectionTypeRegistry.add(
    'hbonds', Provi.Bio.HydrogenBonds.HbondsSelectionType
);





})();