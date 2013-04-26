/**
 * @fileOverview This file contains the {@link Provi.Bio.Superposition} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * @namespace
 * Superposition module
 */
Provi.Bio.Superposition = {};


(function() {

/** @exports Utils as Provi.Utils */
var Utils = Provi.Utils;

/** @exports Widget as Provi.Widget.Widget */
var Widget = Provi.Widget.Widget;





/**
 * widget class for doing superposition
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Bio.Superposition.SuperposeWidget = function(params){
    params = _.defaults(
        params,
        Provi.Bio.Superposition.SuperposeWidget.prototype.default_params
    );

    this.gap_penalty = params.gap_penalty;
    this.gap_extension = params.gap_extension;
    this.no_alignment = false;
    
    Widget.call( this, params );

    this._init_eid_manager([
        'applet_selector_widget', 'no_alignment',
        'gap_penalty', 'gap_extension', 'superpose',
        'sele1_selector_widget', 'sele2_selector_widget',
        'ali_sele1_selector_widget', 'ali_sele2_selector_widget',
        'filter_sele1_selector_widget', 'filter_sele2_selector_widget',
        'motion_sele1_selector_widget', 'motion_sele2_selector_widget'
    ]);
    var template = '' +
        '<div class="control_row" id="${eids.applet_selector_widget}"></div>' +
        '<div class="control_row">' +
            '<label for="${eids.gap_penalty}">Gap penalty:</label>' +
            '<input type="text" id="${eids.gap_penalty}"></input>' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="${eids.gap_extension}">Gap extension penalty:</label>' +
            '<input type="text" id="${eids.gap_extension}"></input>' +
        '</div>' +
        '<div class="control_row">General selection:' +
            '<div class="control_group">' +
                '<div class="control_row" id="${eids.sele1_selector_widget}"></div>' +
                '<div class="control_row" id="${eids.sele2_selector_widget}"></div>' +
            '</div>' +
        '</div>' +
        '<div class="control_row">Alignment selection:' +
            '<span>' +
                '&nbsp;&nbsp;&nbsp;' +
                '<input id="${eids.no_alignment}" type="checkbox" style="margin-top: 0.5em;">' +
                '&nbsp;' +
                '<label for="${eids.no_alignment}">no alignment</label>' +
            '</span>' +
            '<div class="control_group">' +
                '<div class="control_row" id="${eids.ali_sele1_selector_widget}"></div>' +
                '<div class="control_row" id="${eids.ali_sele2_selector_widget}"></div>' +
            '</div>' +
        '</div>' +
        '<div class="control_row">Filter selection:' +
            '<div class="control_group">' +
                '<div class="control_row" id="${eids.filter_sele1_selector_widget}"></div>' +
                '<div class="control_row" id="${eids.filter_sele2_selector_widget}"></div>' +
            '</div>' +
        '</div>' +
        '<div class="control_row">Motion selection:' +
            '<div class="control_group">' +
                '<div class="control_row" id="${eids.motion_sele1_selector_widget}"></div>' +
                '<div class="control_row" id="${eids.motion_sele2_selector_widget}"></div>' +
            '</div>' +
        '</div>' +
        '<div class="control_row">' +
            '<button id="${eids.superpose}">superpose</button>' +
        '</div>' +
    ''
    this.add_content( template, params );

    this.applet_selector = new Provi.Jmol.JmolAppletSelectorWidget({
        parent_id: this.eid('applet_selector_widget')
    });
    var self = this;
    var selectors = [
        'sele1', 'sele2', 'ali_sele1', 'ali_sele2', 
        'filter_sele1', 'filter_sele2', 'motion_sele1', 'motion_sele2'
    ]
    _.each(selectors, function( name ){
        self[name+'_selector'] = new Provi.Bio.AtomSelection.SelectorWidget({
            parent_id: self.eid(name+'_selector_widget'),
            applet: params.applet, tag_name: 'span'
        });    
    })
    this._init();
}
Provi.Bio.Superposition.SuperposeWidget.prototype = Utils.extend(Widget, /** @lends Provi.Bio.Superposition.SuperposeWidget.prototype */ {
    default_params: {
        heading: 'Superposition',
        collapsed: true,
        gap_penalty: -10,
        gap_extension: -1
    },
    _init: function () {
        var self = this;
    
        $(this.applet_selector).bind('change change_selected', function(event, applet){
            self.sele1_selector.set_applet( applet );
            self.sele2_selector.set_applet( applet );
            self.ali_sele1_selector.set_applet( applet );
            self.ali_sele2_selector.set_applet( applet );
        });
        this.sele1_selector.set_applet( this.get_applet() );
        this.sele2_selector.set_applet( this.get_applet() );
        this.ali_sele1_selector.set_applet( this.get_applet() );
        this.ali_sele2_selector.set_applet( this.get_applet() );
        this.filter_sele1_selector.set_applet( this.get_applet() );
        this.filter_sele2_selector.set_applet( this.get_applet() );

        this.elm('gap_penalty').val( this.gap_penalty );
        this.elm('gap_extension').val( this.gap_extension );

        this.elm('superpose').button().click( function(){
            self.superpose();
        });

        this.elm("no_alignment").bind('change click', function() {
            self.no_alignment = self.elm("no_alignment").is(':checked');
        });

        this.sele1_selector.set_input('2.1');
        this.sele2_selector.set_input('1.1');
        this.ali_sele1_selector.set_input(':A');
        this.ali_sele2_selector.set_input(':A');
        this.filter_sele1_selector.set_input('*');
        this.filter_sele2_selector.set_input('*');

        Provi.Widget.Widget.prototype.init.call(this);
    },
    get_applet: function(){
        if( this.applet ){
            return this.applet;
        }else{
            return this.applet_selector.get_value(true);
        }
    },
    apm: function( sele, ali_sele ){
        var applet = this.get_applet();
        var format = "'%[atomno]',%[resno],'%[chain]','%[model]','%[file]','%[group1]'";
        return applet.atoms_property_map( 
            format, 
            '(' + sele + ') and (' + ali_sele + ') and protein and *.CA'
        );
    },
    seq: function( apm ){
        return _.map(apm, function(p, i){
            return p[5] ? p[5] : ' ';
        }).join('');
    },
    alignment: function( apm1, apm2 ){
        this.gap_penalty = parseInt( this.elm('gap_penalty').val() );
        this.gap_extension = parseInt( this.elm('gap_extension').val() );

        var seq1 = this.seq( apm1 );
        var seq2 = this.seq( apm2 );

        nw = new Provi.Bio.Alignment.NeedlemanWunsch({
            seq1: seq1, 
            seq2: seq2,
            gap_penalty: this.gap_penalty,
            gap_extension_penalty: this.gap_extension
        });
        nw.calc();
        nw.trace();

        return nw;
    },
    gap: function( ali ){
        var g = 0
        return _.map(ali.split(''), function(c, i){
            return c=='-' ? ++g : g;
        });
    },
    superpose: function(){
        var applet = this.get_applet();
        var self = this;
        if (!applet ) return;

        var sele1 = this.sele1_selector.get();
        var sele2 = this.sele2_selector.get();
        var ali_sele1 = this.ali_sele1_selector.get();
        var ali_sele2 = this.ali_sele2_selector.get();
        var filter_sele1 = this.filter_sele1_selector.get();
        var filter_sele2 = this.filter_sele2_selector.get();
        var motion_sele1 = this.motion_sele1_selector.get();
        var motion_sele2 = this.motion_sele2_selector.get();

        if(this.no_alignment){
            var subset = '*';
            var pairs = '{' + ali_sele1 + '} {' + ali_sele2 + '}';
        }else{
            var subset = '*.CA or *.C or *.N';

            var apm1 = this.apm( sele1, ali_sele1 );
            var apm2 = this.apm( sele2, ali_sele2 );

            var nw = this.alignment( apm1, apm2 );
            var gap1 = this.gap( nw.ali1 );
            var gap2 = this.gap( nw.ali2 );

            var pairs = '';
            _.each(nw.ali1.split(''), function(c1, i){
                var c2 = nw.ali2.split('')[i];
                if( c1!='-' && c2!='-'){
                    // pairs += ' {' + apm1[ i - gap1[i] ][1] + '} {' + apm2[ i - gap2[i] ][1] + '} ';
                    pairs += ' {@' + apm1[ i - gap1[i] ][0] + '} {@' + apm2[ i - gap2[i] ][0] + '} ';
                }
            });

            // console.log(pairs);

            _.each(nw.ali1.split(''), function(c1, i){
                var c2 = nw.ali2.split('')[i];
                s += '' + 
                    'color {' + 
                        ( c1=='-' ? 'none' : '(' + sele1 + ') and (' + ali_sele1 + ') and ' + apm1[ i - gap1[i] ][1] ) + 
                        ' or ' +
                        ( c2=='-' ? 'none' : '(' + sele2 + ') and (' + ali_sele2 + ') and ' + apm2[ i - gap2[i] ][1] ) + 
                    '} ' +
                    '@{ color("' + 'roygb' + '", 0, ' + (nw.ali1.length-1) + ', ' + i + ') };' +
                '';
            });

            _.each(nw.ali1.split(''), function(c1, i){
                var c2 = nw.ali2.split('')[i];
                s += '' + 
                    'color {' + 
                        ( c2!='-' ? 'none' : '(' + sele1 + ') and (' + ali_sele1 + ') and ' + apm1[ i - gap1[i] ][1] ) + 
                        ' or ' +
                        ( c1!='-' ? 'none' : '(' + sele2 + ') and (' + ali_sele2 + ') and ' + apm2[ i - gap2[i] ][1] ) + 
                    '} ' +
                    'white;' +
                '';
            });
        }

        var s = '' +
            'center {' + sele2 + '};' +
            'compare {' + sele1 + '} {' + sele2 + '} ' + 
                'subset {' + subset + ' and ' + 
                    '(' +
                        '((' + sele1 + ') and (' + ali_sele1 + ') and (' + filter_sele1 + '))' + 
                        ' or ' +
                        '((' + sele2 + ') and (' + ali_sele2 + ') and (' + filter_sele2 + '))' + 
                    ')' +   
                '} ' +
                // 'atoms {' + sele1 + '} {' + sele2 + '} ' +
                'atoms ' + pairs +
                'rotate translate;' + 
        '';

        if( motion_sele1 && motion_sele1 ){
            var apm_m1 = this.apm( sele1, motion_sele1 );
            var apm_m2 = this.apm( sele2, motion_sele2 );

            var nw_m = this.alignment( apm_m1, apm_m2 );
            var gap_m1 = this.gap( nw.ali1 );
            var gap_m2 = this.gap( nw.ali2 );

            var pairs_m = [[],[]];
            _.each(nw_m.ali1.split(''), function(c1, i){
                var c2 = nw_m.ali2.split('')[i];
                if( c1!='-' && c2!='-'){
                    pairs_m[0].push('atomno=' + apm_m1[ i - gap_m1[i] ][0]);
                    pairs_m[1].push('atomno=' + apm_m2[ i - gap_m2[i] ][0]);
                }
            });
            s += 'axis_angle( ' + 
                '{' + pairs_m[0].join(' or ') + '}, ' +
                '{' + pairs_m[1].join(' or ') + '}, ' +
                'true )' +
            ';';
        }
        

        console.log('SUPERPOSE', s);
        s = 'try{' + s + '}catch(e){};';
        applet.script( s, { maintain_selection: true } );
    }
});







})();