/**
 * @fileOverview This file contains the {@link Provi.Jmol.Modeling} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * @namespace
 * Jmol modeling module
 */
Provi.Jmol.Modeling = {};


(function() {

/** @exports Utils as Provi.Utils */
var Utils = Provi.Utils;

/** @exports Widget as Provi.Widget.Widget */
var Widget = Provi.Widget.Widget;



/**
 * A widget holding jmol modeling related controls
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Jmol.Modeling.JmolModelingWidget = function(params){
    params = _.defaults(
        params,
        Provi.Jmol.Modeling.JmolModelingWidget.prototype.default_params
    );

    this.move_selected = false;
    this.show_vdw = false;
    this.clash_expression = '*';
    this.dihedral_name = 'phi';
    this.move_nterm = false;

    Provi.Widget.Widget.call( this, params );
    this._init_eid_manager([ 
        'move_selected', 'duplicate_selection', 'applet_selector_widget',
        'residue_expression', 'get_dihedrals', 'presets', 'dihedrals', 'dihedral_slider',
        'current_angle', 'move_nterm', 'minimize_selection', 'minimize_sidechains_only'
    ]);
    
    var template = '' +
        '<div class="control_row" id="${eids.applet_selector_widget}"></div>' +
        '<div class="control_row">' +
            '<input id="${eids.move_selected}" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
            '<label for="${eids.move_selected}" style="display:inline-block;" title="move selected atoms: ALT-SHIFT-LEFT for translation and ALT-LEFT for rotation">move selected</label>' +
        '</div>' +
        '<div class="control_row">' +
            '<button id="${eids.minimize_selection}">minimize selection</button>' +
            '&nbsp;&nbsp;&nbsp;' +
            '<input id="${eids.minimize_sidechains_only}" type="checkbox" style="margin-top: 0.5em;">' +
            '&nbsp;' +
            '<label for="${eids.minimize_sidechains_only}">selection only</label>' +
        '</div>' +
        '<div class="control_row">' +
            '<button id="${eids.duplicate_selection}">duplicate selection</button>' +
        '</div>' +
        '<div class="control_row">' +
            '<input size="10" id="${eids.residue_expression}" type="text" value="resno=323" class="ui-state-default"/>' +
            '<label for="${eids.residue_expression}" >residue</label> ' +
            '<button id="${eids.get_dihedrals}">get rotamers</button>' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="${eids.presets}">preset angles</label>' +
            '<select id="${eids.presets}" class="ui-state-default"><option></option></select>' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="${eids.dihedrals}">dihedrals</label>' +
            '<select id="${eids.dihedrals}" class="ui-state-default"><option></option></select>' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="${eids.dihedral_slider}" style="display:block;">' +
                'dihedral angle <span id="${eids.current_angle}"></span>' +
            '</label>' + 
            '<div id="${eids.dihedral_slider}"></div>' +
        '</div>' +
        '<div class="control_row">' +
            '<input id="${eids.move_nterm}" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
            '<label for="${eids.move_nterm}" style="display:inline-block;">move N-term (instead of C-term)</label>' +
        '</div>' +
    '';
    this.add_content( template, params );

    this.applet_selector = new Provi.Jmol.JmolAppletSelectorWidget({
        parent_id: this.eid('applet_selector_widget')
    });

    this._init();
}
Provi.Jmol.Modeling.JmolModelingWidget.prototype = Utils.extend(Widget, /** @lends Provi.Jmol.Modeling.JmolModelingWidget.prototype */ {
    default_params: {
        heading: 'Modeling',
        collapsed: true
    },
    _init: function(){
        var self = this;
    
        // init move selected
        this.move_selected = this.elm('move_selected').is(':checked');
        this.elm('move_selected').click(function(){
            var applet = self.applet_selector.get_value();
            if(applet){
                self.move_selected = self.elm('move_selected').is(':checked');
                if(self.move_selected){
                    applet.script('set allowMoveAtoms true');
                }else{
                    applet.script('set allowMoveAtoms false');
                }
            }
        });
        
        this.elm('minimize_selection').button().click(function() {
            self.minimize_selection();
        });

        this.elm("minimize_sidechains_only").bind('change click', function() {
            self.minimize_sidechains_only = self.elm("minimize_sidechains_only").is(':checked');
        });

        this.elm('duplicate_selection').button().click(function() {
            self.duplicate_selection();
        });

        // init get dihedrals
        this.elm('get_dihedrals').button().click(function(){
            var applet = self.applet_selector.get_value();
            if(applet){
                self.residue_expression = self.elm('residue_expression').val();
                console.log( self.residue_expression );
                self.get_dihedrals();
            }
        });

        this.elm("move_nterm").bind('change click', function() {
            self.move_nterm = self.elm("move_nterm").is(':checked');
        });

        this.elm('presets').change(function(){
            self.set_dihedral();
        });

        this.elm('dihedrals').change(function(){
            self.dihedral_name = self.elm('dihedrals').val().split('_')[1];
            self.update_dihedral();
        });

        this.elm('dihedral_slider').slider({
            value: 0, min: -180, max: 180
        }).bind( 'slidestop slide', function(event, ui){
            self.move_dihedral();
        });
    
        Provi.Widget.Widget.prototype.init.call(this);
    },
    duplicate_selection: function(){
        var applet = this.applet_selector.get_value();
        if(applet){
            applet.script(
                "var n = {*}.atomIndex.max;" +
                "var x = write('pdb');" +
                "set appendNew OFF;" +
                "load append '@x';" +
                "set appendNew ON;" +
                "select atomIndex > n;" + 
                "set selectionHalos ON;"
            );
        }
    },
    get_dihedrals: function(){
        var self = this;
        var applet = this.applet_selector.get_value();
        
        var format = '\'%[group]\',\'%[groupindex]\',\'%[chain]\',\'%[resno]\'';
        var a = applet.atoms_property_map( format, this.residue_expression )[0];
        this.res_name = a[0];
        this.res_id = parseInt( a[1] );
        this.chain = a[2];
        this.resno = a[3];

        var s = '' +
            'select ' + this.residue_expression + '; center selected; wireframe 0.2;' + '\n' +
            //'connect (within(GROUP,selected) and not *.C and not *.N) (not within(GROUP,selected)) delete;' + '\n' +
            // 'connect ' +
            //     '(groupindex!=' + this.res_id + ' and resno<' + this.resno + ' and chain) ' + 
            //     '(not within(GROUP,selected)) delete;' + '\n' +
            'try{ contact {(' + this.residue_expression + ') and sidechain} {not (' + this.residue_expression + ') and (' + this.clash_expression + ')}; }catch(e){ print "JMOL ERROR: "+ e  };' + '\n' +
            'function set_dihedral( a, b, c, d, angle, move_nterm ){' + '\n' +
                'var current_angle = angle( a, b, c, d );' + '\n' +
                'var angle_change = @angle - @current_angle;' + '\n' +
                'print @current_angle;' + '\n' +
                'print @angle;' + '\n' +
                'print @angle_change;' + '\n' +
                //'select within(BRANCH, @b, @c) and within(GROUP, @b) and not backbone;' + '\n' +
                'if(move_nterm){' +
                    'select within(BRANCH, @c, @b) ' + 
                        // 'and (' +
                        //     '(resno<=' + this.resno + ' and chain="' + this.chain + '") ' +
                        //     // 'or chain!="' + this.chain + '"' +
                        // ')' +
                    ';' + '\n' +
                    'rotateSelected @c @b @angle_change;' + '\n' +
                '}else{' +
                    'select within(BRANCH, @b, @c) ' +
                        // 'and (' +
                        //     '(resno>=' + this.resno + ' and chain="' + this.chain + '") ' +
                        //     // 'or chain!="' + this.chain + '"' +
                        // ')' +
                    ';' + '\n' +
                    'rotateSelected @b @c @angle_change;' + '\n' +
                '}' +
                'print angle( @a, @b, @c, @d );' + '\n' +
            '};' +
            'function show_clashes( an1, an2 ){' + '\n' +
                'print "foobar";' + '\n' +
                'var a1 = {atomno=an1};' + '\n' +
                'var a2 = {atomno=an2};' + '\n' +
                'var p1 = a1.XYZ;' + '\n' +
                'var p2 = a2.XYZ;' + '\n' +
                'var r1 = a1.vanderwaals;' + '\n' +
                'var r2 = a2.vanderwaals;' + '\n' +
                'var r = r1+r2;' + '\n' +
                'var d = p1.distance(p2);' + '\n' +
                'var x = r-d;' + '\n' +
                'if( x>0 ){' + '\n' +
                    (this.show_vdw ? ('select @a1 or @a2;' + '\n' +
                        'cpk 100%;' + '\n' +
                        'color translucent;' + '\n') : '') +
                    'var e = 3;' + '\n' +
                    'var re = r1**e + r2**e' + '\n' +
                    'var r1p = r1**e/re;' + '\n' +
                    'var r2p = r2**e/re;' + '\n' +
                    'var v12 = p2-p1;' + '\n' +
                    'var v21 = p1-p2;' + '\n' +
                    'var h = x*r2p;' + '\n' +
                    'var m = p1+((v12/v12)*(r1-h));' + '\n' +
                    'var m1 = m+v12/v12/20;' + '\n' +
                    'var m2 = m+v21/v21/20;' + '\n' +
                    'var dia = 2*sqrt( h*(2*r1-h) );' + '\n' +
                    'var isoname = "' + this.id + '_clash_" + an1 + "_" + an2;' + '\n' +
                    'draw ID @isoname CYLINDER @m1 @m2 DIAMETER @dia;' + '\n' +
                '}' + '\n' +
            '};' +
        '';
        //console.log(s);
        applet.script_wait( s, true );
        
        this.original_dihedrals = [];

        this.dihedral_atoms = {
            phi: [
                'groupindex=' + (this.res_id-1) + ' and atomname="C"',
                this.residue_expression + ' and atomname="N"',
                this.residue_expression + ' and atomname="CA"',
                this.residue_expression + ' and atomname="C"'
            ],
            psi: [
                this.residue_expression + ' and atomname="N"',
                this.residue_expression + ' and atomname="CA"',
                this.residue_expression + ' and atomname="C"',
                'groupindex=' + (this.res_id+1) + ' and atomname="N"'
            ],
            omega: [
                this.residue_expression + ' and atomname="CA"',
                this.residue_expression + ' and atomname="C"',
                'groupindex=' + (this.res_id+1) + ' and atomname="N"',
                'groupindex=' + (this.res_id+1) + ' and atomname="CA"'
            ]
        };
        this.dihedral_db = {
            alpha: [-57, -47, 180],
            beta: [-80, 150, 180],
            alphaL: [85, 10, 180]
        }

        _.each(this.dihedral_atoms, function(atoms_expr, name){
            var s = 'angle( {' + atoms_expr.join('}, {') + '} )';
            console.log(name, s, applet.evaluate( s ));
            self.original_dihedrals.push( 
                parseFloat( parseFloat( applet.evaluate( s ) ).toFixed(2) ) );
        });

        this.elm('presets').empty();
        this.elm('presets').append(
            "<option value='original'>" +
                "original (" + self.original_dihedrals.join('\u00B0, ') + "\u00B0)" +
            "</option>"
        );
        _.each(this.dihedral_db, function(angles, name){
            self.elm('presets').append(
                "<option value='rot_" + name + "'>" +
                    name + " (" + angles.join('\u00B0, ') + "\u00B0)" +
                "</option>"
            );
        });

        this.elm('dihedrals').empty();
        _.each(this.dihedral_atoms, function(atoms_expr, name){
            self.elm('dihedrals').append(
                "<option value='dihedral_" + name + "'>" + name + "</option>"
            );
        });

        this.update_dihedral();
    },
    update_dihedral: function(no_slider_update){
        var applet = this.applet_selector.get_value();
        var dihedral_atoms = this.dihedral_atoms[ this.dihedral_name ];
        var s = 'angle( {' + dihedral_atoms.join('}, {') + '} )';
        var angle = applet.evaluate( s );
        console.log(name, s, angle);
        this.elm('current_angle').html( parseFloat( angle ).toFixed(2) + ' \u00B0' );
        if(!no_slider_update){
            this.elm('dihedral_slider').slider("value", angle);
        }
    },
    move_dihedral: function(){
        var applet = this.applet_selector.get_value();
        var dihedral_atoms = this.dihedral_atoms[ this.dihedral_name ];
        var dihedral_angle = this.elm('dihedral_slider').slider("value");
        var s = '' +
            'set_dihedral( {' + dihedral_atoms.join('}, {') + '}, ' + dihedral_angle + ', ' + this.move_nterm + ' );' + '\n' +
            'try{ contact {(' + this.residue_expression + ') and (sidechain or atomName="O")} {not (' + this.residue_expression + ') and (' + this.clash_expression + ')}; }catch(e){ print "JMOL ERROR: "+ e  };' + '\n' +
        '';
        applet.script_wait(s, true);
        this.update_dihedral(true);
    },
    set_dihedral: function( rot ){
        var self = this;
        var applet = this.applet_selector.get_value();
        
        if( !rot ){
            var rot_id = this.elm('presets').val();
            if( rot_id == 'original' ){
                rot = self.original_dihedrals;
            }else if( rot_id == 'custom' ){
                rot = self.custom_dihedrals;
            }else{
                rot_idX = rot_id.split('_')[1];
                rot = this.dihedral_db[ rot_idX ];
            }
        }
        //console.log(rot, rot_id, rot_idX);
        var s = ''
        var i = 0
        _.each(this.dihedral_atoms, function(atoms_expr, name){
            s += 'set_dihedral( {' + atoms_expr.join('}, {') + '}, ' + rot[i] + ', ' + self.move_nterm + ' );\n';
            i += 1;
        });
        s += 'draw "' + self.id + '_clash*" DELETE;' + '\n' +
            'set defaultVDW babel;' + '\n' +
            'var ma = measure( {' + this.residue_expression + ' and sidechain}, {not ' + this.residue_expression + '}, 0, 4).split("\\n");' + '\n' +
            'print ma;' + '\n' +
            'select *; cpk off;' + '\n' +
            'select ' + this.residue_expression + '; color wireframe opaque;' + '\n' +
            'for (var a IN ma) {' + '\n' +
                'var pair = a.split(" ").find("(#[0-9]+)", "").replace("#", "");' + '\n' +
                'print pair;' + '\n' +
                //'show_clashes( pair[0], pair[1] );' + '\n' +
            '}' + '\n' +
            'try{ contact {(' + this.residue_expression + ') and (sidechain or atomName="O")} {not (' + this.residue_expression + ') and (' + this.clash_expression + ')}; }catch(e){ print "JMOL ERROR: "+ e  };' + '\n' +
        '';
        //console.log(s);
        applet.script_wait(s, true);
        this.update_dihedral();
    },
    minimize_selection: function(){
        var applet = this.applet_selector.get_value();
        var s = '' +
            'select selected' + (this.minimize_sidechains_only ? ' and sidechains ' : '') + ';' +
            'minimize select selected steps 100;' + '\n' +
            'try{ contact {(selected) and (sidechain or atomName="O")} {not (selected) and (' + this.clash_expression + ')}; }catch(e){ print "JMOL ERROR: "+ e  };' + '\n' +
        '';
        applet.script_wait(s, true);
    }
});



})();