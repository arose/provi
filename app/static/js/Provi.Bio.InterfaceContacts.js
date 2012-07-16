/**
 * @fileOverview This file contains the {@link Provi.Bio.InterfaceContacts} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * @namespace
 * Interface contacts module
 */
Provi.Bio.InterfaceContacts = {};

(function() {

/** @exports Utils as Provi.Utils */
var Utils = Provi.Utils;

/** @exports Widget as Provi.Widget.Widget */
var Widget = Provi.Widget.Widget;

Provi.Bio.InterfaceContacts.register = function( params ){
    var contacts_ds = params.contacts_ds;
    console.log( contacts_ds );
    Provi.Bio.AtomSelection.SelectionTypeRegistry.add(
        'interface_contacts', Provi.Bio.InterfaceContacts.InterfaceContactsSelectionTypeFactory(
            _.pluck( contacts_ds.get().get_list(), 'name' )
        )
    )
}

Provi.Bio.InterfaceContacts.InterfaceContactsSelectionTypeFactory = function(ids){
    return function(params){
        params.ids = ids;
        return new Provi.Bio.InterfaceContacts.InterfaceContactsSelectionType(params);
    }
}

Provi.Bio.InterfaceContacts.InterfaceContactsSelectionType = function(params){
    var self = this;
    this.ids = params.ids;
    this.ids.sort();

    this.ids = [ 'Membrane', 'Water' ].concat( this.ids );

    var type_count = { 'H': 1, 'C': 1, 'E': 1, 'W': 1, 'O': 1 };
    var type_names = {
        'H': 'Helix',
        'C': 'Coil',
        'E': 'Sheet',
        'W': 'Water',
        'O': 'Hetero'
    }

    this.id_names = {};

    _.each( this.ids, function(id){
        var c = id.charAt(0)
        if( type_names[ c ] && /[0-9]/.test(id.charAt(1)) ){
            self.id_names[id] = '' + 
                type_names[ c ] + ' ' + 
                type_count[ c ] + 
                // ' (' + id + ')' +
            '';
            type_count[ c ] += 1;
        }
    })

    this.atm_cutoff = [
        [ '-0.5', '[xFFFF00]' ],
        [ '0.0', '[xFFA500]' ],
        [ '0.5', '[xEB8900]' ],
        [ '1.0', '[xD86E00]' ],
        [ '1.5', '[xC55200]' ],
        [ '2.0', '[xB13700]' ],
        [ '2.5', '[x9E1B00]' ],
        [ '2.8', '[x8B0000]' ]
    ];
    this.atm_cutoff.reverse();

    Provi.Bio.AtomSelection.SelectionType.call( this, params );
}
Provi.Bio.InterfaceContacts.InterfaceContactsSelectionType.prototype = Utils.extend(Provi.Bio.AtomSelection.VariableSelectionType, /** @lends Provi.Bio.InterfaceContacts.InterfaceContactsSelectionType.prototype */ {
    tmp_prop_cmd: function(id){
        var tmp_prop = '{*}.property_tmp = NaN;';
        _.each(this.atm_cutoff, function(d){
            tmp_prop += '{ @provi_selection["' + id + '_' + d[0] + '"] }' +
                '.property_tmp = ' + d[0] + ';';
        });
        return tmp_prop;
    },
    is_virtual: function(id){
        return _.include( ['Membrane', 'Water'], id );
    },
    get_ids: function(sele){
        return this.ids;
    },
    get_data: function(id){
        var ids = (id=="all") ? this.get_ids() : [id];
        this.applet.script_wait('' +
            'function provi_sele_test(ids){' +
                'var sele_l = [];' +
                'var consurf_l = [];' +
                'var intersurf_l = [];' +
                'var displayed_l = [];' +
                'for(id in ids){' +
                    'if(id!="Water" & id!="Membrane"){' +
                        'sele_l += provi_selection[id].selected.join("");' +
                    '}' +
                    //'var p = provi_selection[id];' +
                    'tmp = 0;' +
                    'var s = "tmp = ($"+id+"_consurf__no_widget__ & true)+0";' +
                    'script INLINE @s;' +
                    'consurf_l += tmp;' +
                    'tmp = 0;' +
                    'var s = "tmp = ($"+id+"_intersurf__no_widget__ & true)+0";' +
                    'script INLINE @s;' +
                    'intersurf_l += tmp;' +
                    // 'var s = {p} and {displayed};' +
                    // 'displayed_l += s.length.join("")/' +
                    //     'provi_selection[id].length.join("");' +
                '}' +
                'return [ sele_l.average, consurf_l.average, intersurf_l.average, displayed_l.average ];' +
            '};' +
        '');
        var s = 'provi_sele_test( ["' + ids.join('","') + '"] ).join(",")';
        var a = this.applet.evaluate(s).split(",");
        console.log(a);
        var selected = a[0];
        var consurf = parseFloat(a[1]);
        var intersurf = parseFloat(a[2]);
        return [ selected, consurf, intersurf ];
    },
    make_row: function(id){
        if(id==='all'){
            var label = 'Interface elements'
        }else{
            var label = this.id_names[ id ] || id;
        }
        var a = this.get_data(id);
        var selected = a[0];
        var contacts = this.shown_contact_id === id;
        var consurf = a[1];
        var intersurf = a[2];
        // var hole = a[1];
        // var cavity = a[2];
        // var neighbours = a[3];
        // var displayed = a[4];

        var $row = $('<div></div>');
        $row.append(
            this.selected_cell( id, selected, this.is_virtual(id) ),
            this.label_cell( label ),
            this.contacts_cell( id, contacts ),
            this.consurf_cell( id, consurf ),
            this.intersurf_cell( id, intersurf )
            // this.cavity_cell( id, cavity ),
            // this.neighbours_cell( id, neighbours )
        );
        return $row;
    },
    _show_consurf: function(id, flag, params){
        params = params || {};
        var resolution = params.resolution || 2.0;
        var cavity_probe_radius = params.cavity_probe_radius || 0.6;
        var exterior_probe_radius = params.exterior_probe_radius || 5.0;
        var self = this;
        var ids = (id==='all') ? this.get_ids() : [ id ];
        if(flag){
            return _.map( ids, function(id){
                return 'isosurface id "' + id + '_consurf__no_widget__" delete;';
            }).join(' ');
        }else{
            
            return _.map( ids, function(id){
                var color_cmd = '';
                _.each(self.atm_cutoff, function(d){
                    color_cmd += '' +
                        'if( {property_' + id + '=' + d[0] + '}.length ){' +
                            'try{' +
                                'color ISOSURFACE ' +
                                    '{property_' + id + '=' + d[0] + '} ' + d[1] + ';' +
                            '}catch(e){}' +
                        '}';
                });
                return 'set drawHover true;' +
                    'set isosurfacePropertySmoothing false;' +
                    self.tmp_prop_cmd(id) +
                    'var sele = {' + 
                        'property_tmp>=-0.5 and ' +
                        'property_tmp<=2.8' +
                        // 'property_' + id + '>=-0.5 and ' +
                        // 'property_' + id + '<=2.8' +
                    '};' +
                    'var sele2 = ' + 
                        (self.is_virtual(id) ? 'none' : self.selection(id, true)) + ';' +
                    'var sele3 = ' + 
                        (self.is_virtual(id) ? 'sele' : self.selection(id, true)) + ';' +
                    'isosurface id "' + id + '_consurf__no_widget__" ' +
                        'select { @sele } ' +
                        'ignore { @sele2 } ' +
                        'resolution ' + resolution + ' ' +
                        'color orange ' +
                        'solvent 1.4 ' +
                    ';' +
                    'isosurface id "' + id + '_consurf__no_widget__" ' +
                        'slab within 5.0 { @sele3 };' +
                    // 'isosurface id "' + id + '_consurf__no_widget__"; ' +
                    //     color_cmd +
                    'select *; ' +
                    'color "ic=[xFFFF00] [xFFA500] [xEB8900] [xD86E00] [xC55200] [xB13700] [x9E1B00] [x8B0000]";' +
                    'isosurface ID "' + id + '_consurf__no_widget__" ' + 
                        'MAP property_tmp;' +
                        // 'MAP property_' + id + ';' +
                    'color $' + id + '_consurf__no_widget__ "ic" ' +
                        ' RANGE -0.5 2.8;' +
                '';
            }).join(' ');
        }
    },
    show_consurf: function(id, flag, params){
        var s = this._show_consurf(id, flag, params);
        console.log(s);
        this.applet.script_wait( s, true );
    },
    _show_intersurf: function(id, flag, params){
        params = params || {};
        var resolution = params.resolution || 2.0;
        var cavity_probe_radius = params.cavity_probe_radius || 0.6;
        var exterior_probe_radius = params.exterior_probe_radius || 5.0;
        var self = this;
        var ids = (id==='all') ? this.get_ids() : [ id ];
        if(flag){
            return _.map( ids, function(id){
                return 'isosurface id "' + id + '_intersurf__no_widget__" delete;';
            }).join(' ');
        }else{
            return _.map( ids, function(id){
                return 'set drawHover true;' +
                    'isosurface id "' + id + '_intersurf__no_widget__" ' +
                        'select { ' + self.selection(id) + ' } ' +
                        'ignore { not ' + self.selection(id) + ' } ' +
                        'resolution ' + resolution + ' ' +
                        'color pink ' +
                        'solvent 1.4 ' +
                    ';' +
                '';
            }).join(' ');
        }
    },
    show_intersurf: function(id, flag, params){
        var s = this._show_intersurf(id, flag, params);
        this.applet.script_wait( s, true );
    },
    _show_contacts: function(id, flag){
        if( flag || id =="all" ){
            return 'color {*} cpk;';
        }
        // var color_cmd = '';
        // _.each(this.atm_cutoff, function(d){
        //     color_cmd += 'color {property_' + id + '=' + d[0] + '} ' + d[1] + ';';
        // });
        return '' +
            'color {*} cpk;' +
            //color_cmd +
            this.tmp_prop_cmd(id) +
            'select ' + 
                'property_tmp>=-0.5 and ' +
                'property_tmp<=2.8;' +
                // 'property_' + id + '>=-0.5 and ' +
                // 'property_' + id + '<=2.8;' +
            'color "ic=[xFFFF00] [xFFA500] [xEB8900] [xD86E00] [xC55200] [xB13700] [x9E1B00] [x8B0000]";' +
            // 'color atoms property_' + id + ' "ic" ' +
            'color atoms property_tmp "ic" ' +
                ' RANGE -0.5 2.8;' +
            'select ' + this.selection(id) + ';' +
            'color atoms pink;' +
        '';
    },
    show_contacts: function(id, flag){
        if(flag){
            this.shown_contact_id = undefined;
        }else{
            this.shown_contact_id = id;
        }
        this.applet.script_wait( this._show_contacts(id, flag), true );
    },
    consurf_cell: function(id, consurf){
        if( id==="all" ) return '';

        var $consurf = $('<span style="background:tomato; float:right; width:22px;">' +
            '<input cell="consurf" type="checkbox" ' + 
                ( consurf ? 'checked="checked" ' : '' ) + 
            '/>' +
        '</span>');
        $consurf.children().data( 'id', id );
        var tt = (consurf ? 'Hide' : 'Show') + ' contact surface';
        $consurf.tipsy({gravity: 'n', fallback: tt});
        return $consurf;
    },
    intersurf_cell: function(id, intersurf){
        if( _.include([ 'all', 'Membrane', 'Water' ], id ) ) return '';

        var $intersurf = $('<span style="background:skyblue; float:right; width:22px;">' +
            '<input cell="intersurf" type="checkbox" ' + 
                ( intersurf ? 'checked="checked" ' : '' ) + 
            '/>' +
        '</span>');
        $intersurf.children().data( 'id', id );
        var tt = (intersurf ? 'Hide' : 'Show') + ' element surface';
        $intersurf.tipsy({gravity: 'n', fallback: tt});
        return $intersurf;
    },
    contacts_cell: function(id, contacts){
        // if( id==="all" ) return '';

        var $contacts = $('<span style="background:lightgreen; float:right; width:22px;">' +
            '<input cell="contacts" type="radio" ' + 
                ( contacts ? 'checked="checked" ' : '' ) + 
            '/>' +
        '</span>');
        $contacts.children().data( 'id', id );

        if( !contacts && id!=='all' ){
            var tt = 'Show contacts';
            $contacts.tipsy({gravity: 'n', fallback: tt});
        }else if( !contacts && id==='all' ){
            var tt = 'Hide all contacts';
            $contacts.tipsy({gravity: 'n', fallback: tt});
        }
        
        return $contacts;
    }
    // selection: function(id, flag){
    //     if( _.include([ 'Membrane', 'Water' ], id ) ){
    //         ''
    //     }else{
    //         return Provi.Bio.AtomSelection.VariableSelectionType.selection.call(this, id, flag);
    //     }
    // },
});



/**
 * @constructor Represents interface contacts from sco and mbn files
 * @param atoms { cutoff: [atom] } A dictionary containing a list of atoms for different cutoff values
 * @param names [name] A list of available interface names
 */
Provi.Bio.InterfaceContacts.Contacts = function(atoms, names){
    this.atoms = atoms;
    this.names = names;
};
Provi.Bio.InterfaceContacts.Contacts.prototype = /** @lends Provi.Bio.InterfaceContacts.Contacts.prototype */ {
    get_atoms: function( names, cutoff ){
        try{
            return this.atoms[ names ][ cutoff ];
        }catch(err){
            return false;
        }
    }
};


/**
 * A widget to view interface contacts from sco and mbn data
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Bio.InterfaceContacts.InterfaceContactsWidget = function(params){
    this.applet = params.applet;
    this.dataset = params.dataset;
    params = _.defaults(
        params,
        Provi.Bio.InterfaceContacts.InterfaceContactsWidget.prototype.default_params
    );
    this.color = params.color;
    this.cutoff = params.cutoff;
    this.show_only_interface_atoms = params.show_only_interface_atoms;
    this.color_interface_residue = params.color_interface_residue;
    this.autofocus = params.autofocus;
    this.color_by_min_cutoff = params.color_by_min_cutoff;
    this.interface_ids = '';
    this.interface_names = '';
    this.tmh_filter = params.tmh_filter;
    this.tmh_ds = false;
    this.atoms = [];
    this.structure_atoms = [];
    
    Widget.call( this, params );
    this._build_element_ids([ 'interface_name', 'cutoff', 'show_only_interface_atoms', 'color_interface_residue', 'tmh_filter_check', 'autofocus', 'color_by_min_cutoff', 'update' ]);
    
    var content = '<div class="control_group">' +
        '<div class="control_row">' +
            '<label for="' + this.interface_name_id + '">interface contacts for</label>&nbsp;' +
            '<select id="' + this.interface_name_id + '" class="ui-state-default">' +
                '<option title="group" value="">none</option>' +
            '</select>' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="' + this.cutoff_id + '">interface contact cut-off</label>&nbsp;' +
            '<select id="' + this.cutoff_id + '" class="ui-state-default">' +
                '<option value="2.8">2.8</option>' +
                '<option value="2.5">2.5</option>' +
                '<option value="2">2.0</option>' +
                '<option value="1.5">1.5</option>' +
                '<option value="1">1.0</option>' +
                '<option value="0.5">0.5</option>' +
                '<option value="0">0.0</option>' +
                '<option value="-0.5">-0.5</option>' +
            '</select>&nbsp;&#8491;' +
        '</div>' +
        '<div class="control_row checkbox">' +
            '<input id="' + this.autofocus_id + '" type="checkbox" />' +
            '<label for="' + this.autofocus_id + '">autofocus</label>&nbsp;' +
        '</div>' +
        '<div class="control_row checkbox">' +
            '<input id="' + this.show_only_interface_atoms_id + '" type="checkbox" />' +
            '<label for="' + this.show_only_interface_atoms_id + '">show only interface atoms/residues</label>' +
        '</div>' +
        '<div class="control_row checkbox">' +
            '<input id="' + this.color_interface_residue_id + '" type="checkbox" />' +
            '<label for="' + this.color_interface_residue_id + '">color the complete residue (not only the contact making atom)</label>' +
        '</div>' +
        '<div class="control_row checkbox">' +
            '<input id="' + this.tmh_filter_check_id + '" type="checkbox" />' +
            '<label for="' + this.tmh_filter_check_id + '">limit interface contacts to tmh atoms</label>' +
        '</div>' +
        '<div class="control_row checkbox">' +
            '<input id="' + this.color_by_min_cutoff_id + '" type="checkbox" />' +
            '<label for="' + this.color_by_min_cutoff_id + '">' +
                'color by min cut-off ' +
                '<span style="background-color:#FFFF00; padding: 1px 3px;">&#8209;0.5</span>' +
                '<span style="background-color:#FFA500; padding: 1px 3px;">0.0</span>' +
                '<span style="background-color:#EB8900; padding: 1px 3px;">0.5</span>' +
                '<span style="background-color:#D86E00; padding: 1px 3px;">1.0</span>' +
                '<span style="background-color:#C55200; padding: 1px 3px;">1.5</span>' +
                '<span style="background-color:#B13700; padding: 1px 3px; color: white;">2.0</span>' +
                '<span style="background-color:#9E1B00; padding: 1px 3px; color: white;">2.5</span>' +
                '<span style="background-color:#8B0000; padding: 1px 3px; color: white;">2.8</span>' +
            '</label>' +
            '<div style="clear: both;"></div>' +
        '</div>' +
        '<div class="control_row">' +
            '<button id="' + this.update_id + '">update</button>' +
        '</div>' +
    '</div>';
    $(this.dom).append( content );
    this._init();
}
Provi.Bio.InterfaceContacts.InterfaceContactsWidget.prototype = Utils.extend(Widget, /** @lends Provi.Bio.InterfaceContacts.InterfaceContactsWidget.prototype */ {
    default_params: {
        color: 'orange',
        cutoff: 1.5,
        show_only_interface_atoms: false,
        color_interface_residue: false,
        autofocus: true,
        color_by_min_cutoff: false,
        tmh_filter: false
    },
    _init: function(){
        var self = this;
        $(Provi.Data.DatasetManager).bind('change', function(){ self._init_tmh_filter() });
        
        if(this.dataset.type == 'mbn'){
            this.interface_names = 'Membrane';
        }else{
            this.interface_names = 'Helices';
        }
        $("#" + this.interface_name_id).val( this.interface_names );
        
        $(this.dataset).bind('change', function(){ self._init_control });
        this._init_control();
        this.retrieve_atoms();
        
        $("#" + this.cutoff_id).val( this.cutoff );
        $("#" + this.cutoff_id).change( function() {
            self.cutoff = $("#" + self.cutoff_id + " option:selected").val();
            //console.log( self.cutoff );
            self.retrieve_atoms();
        });
        $("#" + this.interface_name_id).change( function() {
            self.interface_names = $("#" + self.interface_name_id + " option:selected").val();
            self.retrieve_atoms();
        });
        
        $("#" + self.autofocus_id).attr('checked', self.autofocus);
        $("#" + self.autofocus_id).bind('change click', function(){
            self.autofocus = $("#" + self.autofocus_id).is(':checked');
            if( self.autofocus ){
                self.draw();
            }else{
                // just 'center {*}' is not enough, because there seems to be
                // a bug that changes slab/depth but fails to update the
                // variables accessible to scripting?!
                self.applet.script_wait( 'center {*}; slab 100; depth 0;', true );
                self.applet.clipping_manager.sync();
            }
        });
        
        $("#" + self.color_interface_residue_id).bind('change click', function(){
            self.color_interface_residue = $("#" + self.color_interface_residue_id).is(':checked');
            self.draw();
        });
        $("#" + self.show_only_interface_atoms_id).bind('change click', function(){
            self.show_only_interface_atoms = $("#" + self.show_only_interface_atoms_id).is(':checked');
            self.draw();
        });

        this._init_tmh_filter();
        $("#" + this.tmh_filter_check_id).attr('checked', this.tmh_filter);
        $("#" + this.tmh_filter_check_id).change( function() {
            self.tmh_filter = $("#" + self.tmh_filter_check_id).is(':checked');
            self.draw();
        });
        $("#" + self.color_by_min_cutoff_id).bind('change click', function(){
            self.color_by_min_cutoff = $("#" + self.color_by_min_cutoff_id).is(':checked');
            self.draw();
        });

        $("#" + self.update_id).button().click( function(){
            self.draw();
        });
        
        this.interface_contacts_selection = new Provi.Selection.Selection({
            persist: true,
            applet: this.applet,
            name: 'Current Interface Contacts [' + this.dataset.id + ']',
            selection: ''
        });
        
        this.structure_selection = new Provi.Selection.Selection({
            persist: true,
            applet: this.applet,
            name: 'Current Interface Structure [' + this.dataset.id + ']',
            selection: ''
        });
        
        Widget.prototype.init.call(this);
    },
    _init_control: function(){
        var self = this;
        if( this.dataset.data.names ){
            var data = this.dataset.data.names;
            data.sort();
            type_count = {};
            type_names = {
                'H': 'Helix',
                'C': 'Coil',
                'E': 'Sheet',
                'W': 'Water',
                'O': 'Hetero'
            }
            $.each(data, function(i){
                //console.log( this, parseInt(this[1]+''), /[0-9]/.test(this[1]), this[1], this.charAt(1) );
                type_count[ this.charAt(0) ] = type_count[ this.charAt(0) ] ? type_count[ this.charAt(0) ] + 1 : 1;
                var label = this;
                var selected = "";
                if( self.interface_names == this ){
                    selected = ' selected="selected" ';
                }
                if( type_names[ this.charAt(0) ] && /[0-9]/.test(this.charAt(1)) ){
                    label = type_names[ this.charAt(0) ] + ' ' + type_count[ this.charAt(0) ] + ' (' + this + ')';
                    $("#" + self.interface_name_id).append(
                        "<option " + selected + " value='" + this + "'>" + label + "</option>"
                    );
                }else{
                    $("#" + self.interface_name_id).children('[title=group]').last().after(
                        "<option " + selected + " title='group' value='" + this + "'>" + label + "</option>"
                    );
                }
            });
            $("#" + this.interface_name_id).chosen();
        }
    },
    /** initialize the tmh filter controls */
    _init_tmh_filter: function(){
        var self = this;
        _.any( Provi.Data.DatasetManager.get_list(), function(dataset, i){
            if( dataset.type == 'tmhelix' && dataset.data && 
                _.include(dataset.applet_list, self.applet) 
            ){
                self.tmh_ds = dataset.data;
                // breaks the loop
                return true;
            }else{
                self.tmh_ds = false;
                return false;
            }
        });
        $("#" + self.tmh_filter_check_id).parent().toggle( this.tmh_ds ? true : false );
    },
    retrieve_atoms: function (){
        this.block();
        this.applet.echo( 'loading...' );
        if(this.interface_names){
            var self = this;
            this.dataset.get_atoms( this.interface_ids, this.interface_names, this.cutoff, function( interface_data, structure_data ){
                self.atoms = interface_data;
                self.structure_atoms = structure_data;
                self.draw();
                self.unblock();
                self.applet.echo();
            });
        }else{
            this.atoms = [];
            this.structure_atoms = [];
            this.draw();
            this.unblock();
            this.applet.echo();
        }
    },
    draw: function(){
        this.block();
        this.applet.echo( 'loading...' );
        //this._draw1();
        //this._draw2();
        //this._draw3();
        this._draw4();
        //this._draw5();
        this.unblock();
        this.applet.echo();
    },
    _draw1: function(){
        if(this.atoms && this.atoms.length){
            var timer = new Provi.Debug.timer({name:'draw1 by_chain'});
            
            timer.start();
            var atoms_by_chains = {}
            $.each(this.atoms, function(i,atom){
                if( !atoms_by_chains[atom.chainId] ){
                    atoms_by_chains[atom.chainId] = [];
                }
                atoms_by_chains[atom.chainId].push(
                    atom.asNr + "." + atom.atomName
                );
            });
            var atoms2 = [];
            $.each(atoms_by_chains, function(chain, atoms){
                atoms2.push(
                    '( chain="' + chain + '" and (' + atoms.join(',') + ') )'
                );
            });
            atoms2 = atoms2.join(' or ');
            timer.stop();
            atoms = atoms2;
            
            if( this.tmh_filter && this.tmh_ds ){
                atoms = '( (' + atoms + ') ) and ' + this.tmh_ds.jmol_sele();
            }
            
            this.interface_contacts_selection.selection = '(' + atoms + ')';
            
            var structure_atoms = [];
            if(this.structure_atoms && this.structure_atoms.length){
                structure_atoms = $.map(this.structure_atoms, function(atom){
                    return atom.asNr + ":" + atom.chainId + "." + atom.atomName;
                });
            }
            structure_atoms = structure_atoms.join(',');
            structure_atoms = structure_atoms ? structure_atoms : 'none';
            this.structure_selection.selection = '(' + structure_atoms + ')';
            
            var cmd = 'var IATOMS = {(' + atoms + ')}; ' +
                'var SATOMS = {(' + structure_atoms + ')};';
            
            if(this.color_interface_residue){
                cmd += 'display all; select all; color grey; select within(GROUP, @IATOMS ); color ' + this.color + ';';
            }else{
                cmd += 'display all; select all; color grey; select @IATOMS; color ' + this.color + ';';
            }
            
            if(this.show_only_interface_atoms){
                cmd += ' select @IATOMS or @SATOMS; display selected; ';
            }
            if(this.structure_atoms && this.structure_atoms.length){
                cmd += ' select @SATOMS; color pink; ';
            }
            //cmd += 'slab on; set slabRange 28.0; set zShade on; set zSlab 45; set zDepth 10; ';
            cmd += ' select {@IATOMS or @SATOMS}; echo @{ {selected}.length };';
            
            cmd += '' +
                'var dist = {selected}.distance({selected});' +
                'print @dist;' +
                'set rotationRadius @{dist*2};' +
                'slab on; set slabRange @{dist/1};' +
                'set zShade on; set zSlab @{dist*0.6};' +
                'set zDepth @{dist*0.1}; ' +
                '';
                
            //console.log( cmd );
            timer.start();
            this.applet.script_wait(cmd + ' zoom (selected) 100; select none;');
            timer.stop();
        }else{
            var cmd = 'display all; select all; center {all}; color grey; slab off;';
            this.applet.script( cmd );
        }
    },
    _draw2: function(){
        if(this.atoms && this.atoms.length){
            var timer = new Provi.Debug.timer({name:'draw2 res:chain:atom'});
            timer.start();
            var atoms = $.map(this.atoms, function(atom){
                return atom.asNr + ":" + atom.chainId + "." + atom.atomName;
            });
            atoms = atoms.join(',');
            timer.stop();
            
            if( this.tmh_filter && this.tmh_ds ){
                console.log( this.tmh_ds );
                var tmh_filter = []
                atoms = '( (' + atoms + ') ) and ' + this.tmh_ds.jmol_sele();
            }
            
            this.interface_contacts_selection.selection = '(' + atoms + ')';
            
            var structure_atoms = [];
            if(this.structure_atoms && this.structure_atoms.length){
                structure_atoms = $.map(this.structure_atoms, function(atom){
                    return atom.asNr + ":" + atom.chainId + "." + atom.atomName;
                });
            }
            structure_atoms = structure_atoms.join(',');
            structure_atoms = structure_atoms ? structure_atoms : 'none';
            this.structure_selection.selection = '(' + structure_atoms + ')';
            
            var cmd = 'var IATOMS = {(' + atoms + ')}; ' +
                'var SATOMS = {(' + structure_atoms + ')};';
            
            if(this.color_interface_residue){
                cmd += 'display all; select all; color grey; select within(GROUP, @IATOMS ); color ' + this.color + ';';
            }else{
                cmd += 'display all; select all; color grey; select @IATOMS; color ' + this.color + ';';
            }
            
            if(this.show_only_interface_atoms){
                cmd += ' select @IATOMS or @SATOMS; display selected; ';
            }
            if(this.structure_atoms && this.structure_atoms.length){
                cmd += ' select @SATOMS; color pink; ';
            }
            //cmd += 'slab on; set slabRange 28.0; set zShade on; set zSlab 45; set zDepth 10; ';
            cmd += ' select {@IATOMS or @SATOMS}; echo @{ {selected}.length };';
            
            cmd += '' +
                'var dist = {selected}.distance({selected});' +
                'print @dist;' +
                'set rotationRadius @{dist*2};' +
                'slab on; set slabRange @{dist/1};' +
                'set zShade on; set zSlab @{dist*0.6};' +
                'set zDepth @{dist*0.1}; ' +
                '';
                
            //console.log( cmd );
            timer.start();
            this.applet.script_wait(cmd + ' zoom (selected) 100; select none;');
            timer.stop();
        }else{
            var cmd = 'display all; select all; center {all}; color grey; slab off;';
            this.applet.script( cmd );
        }
    },
    _draw3: function(){
        if(this.atoms && this.atoms.length){
            var timer = new Provi.Debug.timer({name:'draw3 atomNr'});
            timer.start();
            var atoms = $.map(this.atoms, function(atom){
                return 'atomno='+ atom.atomNr;
            });
            atoms = '(' + atoms.join(',') + ')';
            timer.stop();
            
            //console.log( atoms );
            
            if( this.tmh_filter && this.tmh_ds ){
                console.log( this.tmh_ds );
                atoms = '( (' + atoms + ') ) and ' + this.tmh_ds.jmol_sele();
            }
            
            this.interface_contacts_selection.selection = '(' + atoms + ')';
            
            var structure_atoms = [];
            if(this.structure_atoms && this.structure_atoms.length){
                structure_atoms = $.map(this.structure_atoms, function(atom){
                    return atom.asNr + ":" + atom.chainId + "." + atom.atomName;
                });
            }
            structure_atoms = structure_atoms.join(',');
            structure_atoms = structure_atoms ? structure_atoms : 'none';
            this.structure_selection.selection = '(' + structure_atoms + ')';
            
            var cmd = 'var IATOMS = {(' + atoms + ')}; ' +
                'var SATOMS = {(' + structure_atoms + ')};';
            
            if(this.color_interface_residue){
                cmd += 'display all; select all; color grey; select within(GROUP, @IATOMS ); color ' + this.color + ';';
            }else{
                cmd += 'display all; select all; color grey; select @IATOMS; color ' + this.color + ';';
            }
            
            if(this.show_only_interface_atoms){
                cmd += ' select @IATOMS or @SATOMS; display selected; ';
            }
            if(this.structure_atoms && this.structure_atoms.length){
                cmd += ' select @SATOMS; color pink; ';
            }
            //cmd += 'slab on; set slabRange 28.0; set zShade on; set zSlab 45; set zDepth 10; ';
            cmd += ' select {@IATOMS or @SATOMS}; echo @{ {selected}.length };';
            
            cmd += '' +
                'var dist = {selected}.distance({selected});' +
                'print @dist;' +
                'set rotationRadius @{dist*2};' +
                'slab on; set slabRange @{dist/1};' +
                'set zShade on; set zSlab @{dist*0.6};' +
                'set zDepth @{dist*0.1}; ' +
                '';
                
            //console.log( cmd );
            timer.start();
            this.applet.script_wait(cmd + ' zoom (selected) 100; select none;');
            timer.stop();
        }else{
            var cmd = 'display all; select all; center {all}; color grey; slab off;';
            this.applet.script( cmd );
        }
    },
    _draw4: function(){
        if(this.atoms && this.atoms.length){
            // {296 and chain="A"}.temperature = data("1\n100\n1",1,0,1)
            var timer = new Provi.Debug.timer({name:'draw4 atomNr/atomID range'});
            timer.start();
            var atoms = [];
            var a_start = -10;
            var a_prev = -10;
            var cutoffs = [];
            $.each(this.atoms, function(i, atom){
                cutoffs.push( parseFloat( atom.cutoff ) );
                var a = parseInt( atom.atomNr );
                //console.log(a_prev, a, a-1);
                if(a-1 > a_prev){
                    //console.log( 'run break' );
                    if(a_start > 0){
                        atoms.push([a_start,a_prev]);
                    }
                    a_start = a;
                }
                a_prev = atom.atomNr;
            });
            console.log( 'CUTOFFS LENGTH', cutoffs.length );
            cutoffs = cutoffs.join("\n");
            atoms.push([a_start,a_prev]);
            //console.log( atoms );
            var atoms = $.map(atoms, function(atom){
                if( atom[0] == atom[1] ){
                    return '@' + atom[0] + '';
                }else{
                    return 'atomno>=' + atom[0] + '&atomno<=' + atom[1] + '';
                }
            });
            atoms = '(' + atoms.join(',') + ')';
            timer.stop();
            
            //console.log( atoms );
            //console.log( cutoffs );
            
            var atoms_filter = '';
            if( this.tmh_filter && this.tmh_ds ){
                console.log( this.tmh_ds );
                atoms_filter = this.tmh_ds.jmol_sele();
            }
            
            this.interface_contacts_selection.selection = '(' + atoms + ')';
            
            var structure_atoms = [];
            if(this.structure_atoms && this.structure_atoms.length){
                structure_atoms = $.map(this.structure_atoms, function(atom){
                    return atom.asNr + ":" + atom.chainId + "." + atom.atomName;
                });
            }
            structure_atoms = structure_atoms.join(',');
            structure_atoms = structure_atoms ? structure_atoms : 'none';
            this.structure_selection.selection = '(' + structure_atoms + ')';
            
            var cmd = 'var IATOMS_ALL = {(' + atoms + ')};' +
                'var IATOMS = {@IATOMS_ALL' + (atoms_filter ? ' and (' + atoms_filter + ')' : '') + '}; ' +
                'var SATOMS = {(' + structure_atoms + ')};';
            
            if(this.color_interface_residue){
                cmd += 'display all; select all; color grey; select within(GROUP, @IATOMS ); color ' + this.color + ';';
            }else{
                cmd += 'display all; select all; color grey; select @IATOMS; color ' + this.color + ';';
            }
            
            if(this.show_only_interface_atoms){
                if(this.color_interface_residue){
                    cmd += ' select within(GROUP, @IATOMS) or @SATOMS; display selected; ';
                }else{
                    cmd += ' select @IATOMS or @SATOMS; display selected; ';
                }
            }
            
            if(this.structure_atoms && this.structure_atoms.length){
                cmd += ' select @SATOMS; color pink; ';
            }
            
            if(this.color_by_min_cutoff){
                if( this.color_interface_residue ){
                    var color_by_cutoff = function(cutoff, color){
                        return 'select within(GROUP, @IATOMS and property_cutoff=' + cutoff + ');' +
                            'color ' + color + ';'
                    }
                }else{
                    var color_by_cutoff = function(cutoff, color){
                        return 'select @IATOMS and property_cutoff=' + cutoff + ';' +
                            'color ' + color + ';'
                    }
                }
                cmd += '{*}.property_cutoff = NaN;' +
                    '{@IATOMS_ALL}.property_cutoff = data("' + cutoffs + '",1,0,1); ' +
                    color_by_cutoff(2.8, '[x8B0000]') + //darkred
                    color_by_cutoff(2.5, '[x9E1B00]') +
                    color_by_cutoff(2.0, '[xB13700]') +
                    color_by_cutoff(1.5, '[xC55200]') +
                    color_by_cutoff(1.0, '[xD86E00]') +
                    color_by_cutoff(0.5, '[xEB8900]') +
                    color_by_cutoff(0.0, '[xFFA500]') + //orange
                    color_by_cutoff(-0.5, '[xFFFF00]') + //yellow
                    '';
            }
            
            //cmd += 'slab on; set slabRange 28.0; set zShade on; set zSlab 45; set zDepth 10; ';
            //cmd += ' select {@IATOMS or @SATOMS};';
            cmd += ' select {@IATOMS or @SATOMS}; echo @{ {selected}.length };';
            
            if( this.autofocus ){
                cmd += '' +
                    'var dist = {selected}.distance({selected});' +
                    'set rotationRadius @{dist*2};' +
                    'set zShade on; set zSlab @{dist*0.6};' +
                    'set zDepth @{dist*0.1}; ' +
                    'zoom (selected) 100; ' +
                    'set slabEnabled true; slab 100; depth 0;' +
                    // not needed, rotationRadius plus slab/depth take care
                    //'set slabRange @{dist/1};' +
                    '';
            }
                
            //console.log( cmd );
            timer.start();
            this.applet.script_wait(cmd, true);
            this.applet.lighting_manager.sync();
            this.applet.clipping_manager.sync();
            timer.stop();
        }else{
            var cmd = 'display all; select all; color grey;';
            if( this.autofocus ){
                cmd += 'zoom (*) 100; center {*}; slab off;';
            }
            this.applet.script_wait( cmd, true );
            this.applet.clipping_manager.sync();
        }
    },
    _draw5: function(){
        if(this.atoms && this.atoms.length){
            var timer = new Provi.Debug.timer({name:'draw5 atomNr range short syntax'});
            timer.start();
            var atoms = [];
            var a_start = -10;
            var a_prev = -10;
            $.each(this.atoms, function(i, atom){
                var a = parseInt( atom.atomNr );
                //console.log(a_prev, a, a-1);
                if(a-1 > a_prev){
                    //console.log( 'run break' );
                    if(a_start > 0){
                        atoms.push([a_start,a_prev]);
                    }
                    a_start = a;
                }
                a_prev = atom.atomNr;
            });
            atoms.push([a_start,a_prev]);
            //console.log( atoms );
            var atoms = $.map(atoms, function(atom){
                if( atom[0] == atom[1] ){
                    return (atom[0]-1) + '';
                }else{
                    return (atom[0]-1) + ':' + (atom[1]-1);
                }
            });
            atoms = '({' + atoms.join(' ') + '})';
            timer.stop();
            
            //console.log( atoms );
            
            if( this.tmh_filter && this.tmh_ds ){
                console.log( this.tmh_ds );
                atoms = '( (' + atoms + ') ) and ' + this.tmh_ds.jmol_sele();
            }
            
            this.interface_contacts_selection.selection = '(' + atoms + ')';
            
            var structure_atoms = [];
            if(this.structure_atoms && this.structure_atoms.length){
                structure_atoms = $.map(this.structure_atoms, function(atom){
                    return atom.asNr + ":" + atom.chainId + "." + atom.atomName;
                });
            }
            structure_atoms = structure_atoms.join(',');
            structure_atoms = structure_atoms ? structure_atoms : 'none';
            this.structure_selection.selection = '(' + structure_atoms + ')';
            
            var cmd = 'var IATOMS = {(' + atoms + ')}; ' +
                'var SATOMS = {(' + structure_atoms + ')};';
            
            if(this.color_interface_residue){
                cmd += 'display all; select all; color grey; select within(GROUP, @IATOMS ); color ' + this.color + ';';
            }else{
                cmd += 'display all; select all; color grey; select @IATOMS; color ' + this.color + ';';
            }
            
            if(this.show_only_interface_atoms){
                cmd += ' select @IATOMS or @SATOMS; display selected; ';
            }
            if(this.structure_atoms && this.structure_atoms.length){
                cmd += ' select @SATOMS; color pink; ';
            }
            //cmd += 'slab on; set slabRange 28.0; set zShade on; set zSlab 45; set zDepth 10; ';
            //cmd += ' select {@IATOMS or @SATOMS};';
            cmd += ' select {@IATOMS or @SATOMS}; echo @{ {selected}.length };';
            
            if( this.autofocus ){
                cmd += '' +
                    'var dist = {selected}.distance({selected});' +
                    'set rotationRadius @{dist*2};' +
                    'slab on; set slabRange @{dist/1};' +
                    'set zShade on; set zSlab @{dist*0.6};' +
                    'set zDepth @{dist*0.1}; ' +
                    'zoom (selected) 100; ' +
                    '';
            }
                
            //console.log( cmd );
            timer.start();
            this.applet.script(cmd, true);
            this.applet.lighting_manager.sync();
            this.applet.clipping_manager.sync();
            timer.stop();
        }else{
            var cmd = 'display all; select all; color grey;';
            if( this.autofocus ){
                cmd += 'zoom (*) 100; center {*}; slab off;';
            }
            this.applet.script( cmd, true );
            this.applet.clipping_manager.sync();
        }
    }
});

})();