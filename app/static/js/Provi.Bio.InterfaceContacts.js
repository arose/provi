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
    params = $.extend(
        Provi.Bio.InterfaceContacts.InterfaceContactsWidget.prototype.default_params,
        params
    );
    this.color = params.color;
    this.cutoff = params.cutoff;
    this.show_only_interface_atoms = params.show_only_interface_atoms;
    this.color_interface_residue = params.color_interface_residue;
    this.interface_ids = '';
    this.interface_names = '';
    this.tmh_filter = false;
    this.tmh_list = false;
    this.atoms = [];
    this.structure_atoms = [];
    
    Widget.call( this, params );
    this._build_element_ids([ 'interface_name', 'cutoff', 'show_only_interface_atoms', 'color_interface_residue', 'tmh_filter_check' ]);
    
    
    var content = '<div class="control_group">' +
        '<div class="control_row">' +
            '<label for="' + this.interface_name_id + '">interface contacts for</label>' +
            '<select id="' + this.interface_name_id + '" class="ui-state-default">' +
                '<option title="group" value="">none</option>' +
            '</select>' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="' + this.cutoff_id + '">interface contact cutoff</label>' +
            '<select id="' + this.cutoff_id + '" class="ui-state-default">' +
                '<option value="2.8">2.8</option>' +
                '<option value="2.5">2.5</option>' +
                '<option value="2.0">2.0</option>' +
                '<option value="1.5" selected="selected">1.5</option>' +
                '<option value="1.0">1.0</option>' +
                '<option value="0.5">0.5</option>' +
                '<option value="0.0">0.0</option>' +
                '<option value="-0.5">-0.5</option>' +
            '</select>&nbsp;&#8491;' +
        '</div>' +
        '<div class="control_row">' +
            '<input id="' + this.show_only_interface_atoms_id + '" type="checkbox" />' +
            '<label for="' + this.show_only_interface_atoms_id + '">show only interface atoms/residues</label>' +
        '</div>' +
        '<div class="control_row">' +
            '<input id="' + this.color_interface_residue_id + '" type="checkbox" />' +
            '<label for="' + this.color_interface_residue_id + '">color the complete residue (not only the contact making atom)</label>' +
        '</div>' +
        '<div class="control_row">' +
            '<input id="' + this.tmh_filter_check_id + '" type="checkbox" />' +
            '<label for="' + this.tmh_filter_check_id + '">limit interface contacts to tmh atoms</label>&nbsp;' +
        '</div>' +
        '<i>interface atoms are shown in orange</i>' +
    '</div>';
    $(this.dom).append( content );
    this._init();
}
Provi.Bio.InterfaceContacts.InterfaceContactsWidget.prototype = Utils.extend(Widget, /** @lends Provi.Bio.InterfaceContacts.InterfaceContactsWidget.prototype */ {
    default_params: {
        color: 'orange',
        cutoff: 1.5,
        show_only_interface_atoms: false,
        color_interface_residue: false
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
        
        $("#" + this.cutoff_id).change( function() {
            self.cutoff = $("#" + self.cutoff_id + " option:selected").val();
            //console.log( self.cutoff );
            self.retrieve_atoms();
        });
        $("#" + this.interface_name_id).change( function() {
            self.interface_names = $("#" + self.interface_name_id + " option:selected").val();
            self.retrieve_atoms();
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
        $("#" + this.tmh_filter_check_id).change( function() {
            self.tmh_filter = $("#" + self.tmh_filter_check_id).is(':checked');
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
        }
    },
    /** initialize the tmh filter controls */
    _init_tmh_filter: function(){
        var self = this;
        $.each( Provi.Data.DatasetManager.get_list(), function(i, dataset){
            $("#" + self.tmh_filter_check_id).parent().hide();
            if( dataset.type == 'tmhelix' && dataset.data && Utils.in_array(dataset.applet_list, self.applet) ){
                self.tmh_list = dataset.data.tmh_list;
                self.tmh_filter = false;
                $("#" + self.tmh_filter_check_id).parent().show();
                return false;
            }else{
                return true;
            }
        });
    },
    retrieve_atoms: function (){
        if(this.interface_names){
            var self = this;
            this.dataset.get_atoms( this.interface_ids, this.interface_names, this.cutoff, function( interface_data, structure_data ){
                self.atoms = interface_data;
                self.structure_atoms = structure_data;
                self.draw();
            });
        }else{
            this.atoms = [];
            this.structure_atoms = [];
            this.draw();
        }
    },
    draw: function(){
        if(this.atoms && this.atoms.length){
            var atoms = $.map(this.atoms, function(atom){
                return atom.asNr + ":" + atom.chainId + "." + atom.atomName;
            });
            atoms = atoms.join(',');
            
            if( this.tmh_filter && this.tmh_list ){
                console.log( this.tmh_list );
                var tmh_filter = []
                $.each( this.tmh_list, function( i, tmh ){
                    tmh_filter.push(
                        '(' + ( tmh[0][0] ? ('chain = "' + tmh[0][0] + '" and ') : '' ) + 'resno >= ' + tmh[0][1] + ' and resno <= ' + tmh[1][1] + ')'
                    );
                });
                atoms = '( (' + atoms + ') ) and (' + tmh_filter.join( ' or ' ) + ')';
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
            
            var cmdX = 'var IATOMS = {(' + atoms + ')}; ' +
                'var SATOMS = {(' + structure_atoms + ')};';
            this.applet.script_wait(cmdX + ' boundbox { @IATOMS or @SATOMS }; boundbox ON; select @IATOMS; save selection IATOMS; select @SATOMS; save selection SATOMS;');
            var boundbox = $.parseJSON( this.applet.get_property_as_json('boundboxInfo') );
            console.log( boundbox );
            
            var cmd = 'restore selection IATOMS; var IATOMS = {selected};' +
                'restore selection SATOMS; var SATOMS = {selected};';
            
            if(this.color_interface_residue){
                //cmd += 'display all; select all; color grey; select within(GROUP, (' + atoms + ') ); save selection MINTERF; color ' + this.color + ';';
                cmd += 'display all; select all; color grey; select within(GROUP, @IATOMS ); color ' + this.color + ';';
            }else{
                //cmd += 'display all; select all; color grey; select (' + atoms + '); save selection MINTERF; color ' + this.color + ';';
                cmd += 'display all; select all; color grey; select @IATOMS; color ' + this.color + ';';
                //cmd += 'display all; select all; color grey; restore selection IATOMS; color ' + this.color + ';';
            }
            
            if(this.show_only_interface_atoms){
                //cmd = cmd + ' restore selection MINTERF; display selected;';
                //cmd = cmd + ' select ' + (structure_atoms ? ('(' + structure_atoms + ') or ') : '' ) + '(' + atoms + ');';
                cmd = cmd + ' select @IATOMS or @SATOMS;';
                cmd = cmd + ' display selected; ';
            }
            if(this.structure_atoms && this.structure_atoms.length){
                //cmd = cmd + ' select (' + structure_atoms + '); save selection MSTRUC; color pink; ';
                cmd = cmd + ' select @SATOMS; color pink; ';
            }
            cmd = cmd + 'slab on; set slabRange 28.0; set zShade on; set zSlab 45; set zDepth 10; ';
            
            //cmd = cmd + ' select ' + (structure_atoms ? ('(' + structure_atoms + ') or ') : '' ) + '(' + atoms + ');';
            cmd = cmd + ' select {@IATOMS or @SATOMS};';
            //this.applet.script_wait(cmd + 'center selected; zoom (selected) 100; boundbox {selected}; select none;');
            
            //var boundbox = $.parseJSON( this.applet.get_property_as_json('boundboxInfo') );
            
            if( boundbox ){//&& boundbox.hasOwnProperty('boundboxInfo') ){
                boundbox = boundbox['boundboxInfo'];
                var v0 = $V( boundbox['corner0'] );
                var v1 = $V( boundbox['corner1'] );
                var corner_dist = v0.distanceFrom( v1 );
                console.log( corner_dist );
                cmd += '' +
                    'set rotationRadius ' + Math.round(corner_dist/2) + ';' +
                    'slab on; set slabRange ' + Math.round(corner_dist/1) + ';' +
                    'set zShade on; set zSlab ' + Math.round(corner_dist*0.6) + ';' +
                    'set zDepth ' + Math.round(corner_dist*0.1) + '; ' +
                    '';
                //this.applet.script(  );
            }
            console.log( cmd );
            //this.applet.script(cmd + 'center selected; zoom (selected) 100; select none;');
            this.applet.script(cmd + ' zoom (selected) 100; select none;');
        }else{
            var cmd = 'display all; select all; center {all}; color grey; slab off;';
            this.applet.script( cmd );
        }
        
        
    }
});

})();