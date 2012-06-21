/**
 * @fileOverview This file contains the {@link Provi.Bio.Rotamers} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * @namespace
 * Rotamers module
 */
Provi.Bio.Rotamers = {};


(function() {

/** @exports Utils as Provi.Utils */
var Utils = Provi.Utils;

/** @exports Widget as Provi.Widget.Widget */
var Widget = Provi.Widget.Widget;



/**
 * amino acid rotamers db from:
 * 
 * Roland L. Dunbrack, Jr., Ph. D.
 * Backbone-independent rotamer library, May 15, 2002
 * www.fccc.edu/research/labs/dunbrack
 */
Provi.Bio.Rotamers.db = {"CYS":[[56.64,-64.3],[27.42,-177.3],[15.94,63.7]],"ASP":[[30.87,-72.1,-12.7],[19.45,-65.4,-49.8],[17.61,-172.3,-0.8],[10.97,62.5,1.3],[8.72,-173.6,58.5],[4.93,-167.9,-55.7],[3.47,62.4,-55.8],[2.08,57.1,54.3],[1.90,-69.1,65.0]],"SER":[[47.07,65.3],[29.38,-63.9],[23.54,179.0]],"GLN":[[18.53,-67.5,177.6,-1.1],[14.66,-63.4,-63.2,-46.3],[9.49,-177.0,177.3,1.0],[9.06,-66.8,-179.7,-76.8],[7.88,-65.8,-178.9,75.3],[7.76,-176.1,65.7,44.6],[4.48,-176.6,-179.4,74.8],[3.93,-178.0,176.1,-77.6],[2.51,65.1,-177.5,-4.1],[2.48,-68.5,-61.2,119.9],[2.45,-67.0,-76.5,44.4],[2.23,-68.4,74.8,37.4],[2.08,-66.9,179.0,-177.9],[1.63,65.4,-177.1,79.5],[1.39,64.0,-177.6,-79.1],[1.38,-175.4,74.1,-37.5],[1.21,-174.0,60.6,-124.1],[1.19,-169.4,-81.4,-34.9],[0.91,-64.6,86.7,-35.4],[0.83,-175.5,178.6,-179.1],[0.76,64.8,-89.6,38.2],[0.73,66.3,-76.0,-34.4],[0.41,62.5,84.6,38.5],[0.34,-70.8,73.4,-123.8],[0.33,61.5,-174.9,-179.8],[0.31,-66.1,-82.1,-111.8],[0.21,-178.1,70.4,109.0],[0.21,-170.6,-75.8,125.3],[0.19,57.6,-79.7,123.9],[0.16,-165.7,-83.7,46.1],[0.10,-72.0,83.7,110.1],[0.08,64.9,86.9,-33.0],[0.04,-165.2,-77.7,-112.0],[0.03,67.7,84.8,117.2],[0.02,64.1,74.9,-124.0],[0.01,64.1,-82.4,-111.9]],"LYS":[[22.79,-67.1,-179.4,-179.4,179.5],[13.45,-177.2,177.1,179.5,179.9],[6.96,-62.2,-66.1,-177.3,-177.9],[5.44,-66.8,-178.0,-177.5,-65.9],[5.29,-67.1,-178.4,177.7,66.5],[3.83,-67.6,-175.0,-72.6,-176.5],[3.53,-176.7,176.0,175.4,65.1],[3.48,-68.5,176.2,69.4,177.3],[3.47,-177.1,177.0,-176.6,-67.4],[3.14,66.0,-179.4,-179.5,179.9],[2.99,-177.7,70.3,175.8,179.3],[2.38,-175.0,-177.3,-70.2,-176.8],[2.32,-177.5,173.7,71.5,177.8],[2.12,-60.1,-67.0,-174.3,-69.4],[1.79,-63.5,-67.5,-177.9,64.3],[1.39,-65.1,-174.8,-72.3,-65.7],[1.31,-70.1,178.9,73.0,72.3],[1.25,-63.4,-66.5,-70.5,-179.8],[0.82,-174.3,174.4,72.8,70.5],[0.80,65.9,-178.1,173.2,66.9],[0.79,-178.4,67.8,170.7,67.0],[0.78,65.6,-178.1,-175.9,-68.7],[0.78,-175.4,-178.7,-71.0,-65.1],[0.74,-174.2,66.7,-178.3,-65.6],[0.74,-81.0,74.0,-178.3,177.9],[0.64,64.3,-172.4,-68.2,-176.8],[0.53,64.7,175.2,70.9,174.9],[0.49,-165.2,-87.2,-177.2,-178.9],[0.48,-66.8,-174.8,-76.5,78.2],[0.46,-172.9,65.9,71.0,179.7],[0.42,-60.5,-68.5,-73.1,-72.7],[0.39,-70.3,174.9,84.2,-76.5],[0.33,-80.7,75.7,176.2,62.3],[0.32,-172.2,168.9,87.1,-78.4],[0.32,-62.3,-76.6,91.0,-179.6],[0.30,-87.6,74.5,178.0,-61.8],[0.27,67.2,-173.7,-70.3,-68.0],[0.27,179.6,-178.0,-75.8,70.6],[0.23,65.8,175.6,68.3,68.9],[0.17,-172.6,88.2,-91.5,-177.5],[0.16,-80.9,81.3,66.9,-179.6],[0.15,-65.2,-68.9,-76.9,78.3],[0.14,-178.7,68.1,65.3,66.2],[0.13,-161.2,-77.8,-177.5,66.4],[0.13,-166.1,-83.0,-177.8,-67.3],[0.11,69.4,-80.1,-178.3,177.0],[0.11,-166.8,-96.6,-69.4,178.4],[0.08,-64.8,-75.8,85.4,76.5],[0.07,68.4,-179.3,87.4,-84.8],[0.07,-179.1,68.7,81.0,-81.3],[0.06,67.2,-175.2,-71.5,74.3],[0.06,-168.0,-93.8,-76.0,-65.7],[0.06,-88.0,81.2,68.0,69.3],[0.06,-82.6,71.2,-96.3,-172.0],[0.05,68.9,76.7,177.2,175.3],[0.05,68.9,77.8,-177.5,-68.4],[0.05,-173.8,86.5,-86.4,-69.3],[0.04,64.2,-81.9,174.4,-65.5],[0.04,63.7,-77.8,-67.7,179.7],[0.04,-170.3,87.2,-90.8,76.8],[0.04,-163.0,-83.1,95.7,-178.9],[0.04,-62.3,-83.2,88.3,-84.3],[0.03,69.9,76.7,66.8,175.9],[0.03,65.7,78.2,174.6,62.6],[0.03,71.8,-79.7,-178.6,65.4],[0.03,-86.8,86.0,84.3,-83.2],[0.02,57.5,74.0,85.8,-83.1],[0.02,-160.1,-90.5,-80.9,68.3],[0.02,-86.6,83.2,-85.6,68.2],[0.01,69.5,85.2,-93.8,-177.2],[0.01,67.2,-83.2,80.8,69.9],[0.01,64.1,-83.7,88.2,177.6],[0.01,67.5,-77.5,-75.5,-67.1],[0.01,-162.4,-81.9,82.2,74.2],[0.01,-85.8,78.0,-86.1,-66.3],[0.00,66.8,76.3,66.4,71.1],[0.00,66.8,82.3,-86.0,74.7],[0.00,66.8,82.3,-83.6,-67.0],[0.00,66.9,-81.3,88.3,-80.2],[0.00,66.9,-76.7,-78.3,74.7],[0.00,-164.5,-82.8,88.3,-80.2]],"ILE":[[61.58,-63.8,170.1],[15.57,-59.2,-61.0],[12.02,61.1,171.0],[6.15,-171.4,167.4],[2.67,-167.9,66.8],[1.28,-67.1,83.0],[0.56,60.6,85.4],[0.11,-165.5,-78.0],[0.06,61.7,-80.0]],"PRO":[[50.72,27.0,-34.6],[49.28,-25.1,36.3]],"THR":[[48.86,61.1],[43.64,-60.4],[7.51,-173.3]],"PHE":[[47.08,-66.9,97.7],[31.71,-178.8,78.1],[11.06,63.0,90.4],[8.17,-68.2,-15.3],[1.89,-174.2,21.2],[0.09,62.0,-6.5]],"ASN":[[28.20,-70.4,-23.2],[18.60,-65.7,-63.9],[9.84,-169.3,24.3],[7.14,-170.8,-20.2],[7.05,64.6,1.5],[5.49,-171.9,60.6],[4.32,-173.5,-66.3],[4.16,-65.2,96.5],[3.59,60.0,57.0],[3.09,-176.0,-114.6],[3.04,-64.7,139.8],[2.60,64.5,-53.9],[1.24,-79.5,34.3],[0.61,-77.3,-137.6],[0.42,-160.3,121.5],[0.37,68.9,101.9],[0.19,50.3,-115.0],[0.05,69.3,175.1]],"MET":[[18.53,-65.8,-61.8,-69.4],[16.34,-67.4,178.0,70.4],[11.81,-67.7,-176.3,-73.7],[9.31,-67.3,179.2,-177.6],[7.22,-174.6,179.7,-71.6],[7.02,-177.8,179.2,72.1],[6.90,-176.0,64.0,72.5],[3.73,-177.4,174.6,177.3],[3.32,-62.7,-64.0,171.9],[3.11,-65.8,-64.9,99.6],[2.53,64.4,-178.3,76.1],[2.44,63.4,179.1,-71.8],[1.72,-174.5,69.3,-166.1],[1.64,-178.8,-82.3,-73.4],[1.44,64.9,-176.0,-175.0],[0.93,-172.4,76.6,-96.9],[0.57,-78.6,67.3,73.0],[0.38,60.8,78.3,73.3],[0.31,-178.2,-78.4,173.0],[0.19,57.6,78.1,177.7],[0.19,72.6,-72.0,-71.4],[0.18,-78.9,69.3,-175.6],[0.08,-178.7,-73.7,99.6],[0.07,-77.7,70.6,-98.9],[0.03,72.2,-70.4,174.3],[0.02,59.4,77.8,-97.4],[0.01,72.5,-70.1,99.6]],"HIS":[[29.64,-63.7,-72.9],[15.33,-178.4,71.5],[14.51,-66.0,85.6],[12.13,-172.6,-83.8],[10.77,-68.1,168.7],[7.05,65.4,-79.5],[5.28,-172.8,-170.3],[4.74,63.0,85.6],[0.54,64.8,166.2]],"LEU":[[62.52,-64.7,174.5],[28.91,-179.2,63.0],[3.65,-86.1,54.6],[2.56,-164.9,170.7],[0.85,-81.5,-55.0],[0.73,58.7,80.7],[0.40,-169.8,-73.1],[0.36,71.8,164.6],[0.02,58.2,-73.6]],"ARG":[[10.99,-67.7,179.1,-179.0,176.3],[6.66,-67.0,179.5,-67.9,173.2],[6.11,-66.7,178.5,65.6,-170.1],[6.02,-68.1,-179.7,-176.3,-82.7],[5.46,-176.9,176.3,178.8,-179.4],[5.34,-68.4,-170.6,-64.5,-85.4],[4.80,-66.9,179.7,178.7,86.7],[3.92,-66.2,179.5,66.1,84.3],[3.67,-174.1,176.8,67.8,-167.7],[3.21,-175.4,179.7,-64.8,165.2],[3.19,-177.5,176.5,-177.8,-85.2],[3.08,-177.3,178.6,64.9,80.8],[2.92,-175.6,179.6,-65.0,-82.6],[2.83,-62.7,-72.4,-177.9,-177.8],[2.52,-176.8,177.6,178.8,85.2],[2.37,-63.2,-69.8,-175.2,-87.0],[1.97,-62.8,-68.8,-60.8,-83.5],[1.80,-63.6,-67.9,-65.0,169.4],[1.74,66.5,-177.6,-178.9,-177.2],[1.49,-177.0,67.4,177.0,171.0],[1.36,65.3,180.0,178.0,85.7],[1.34,66.4,-175.2,-177.5,-82.5],[1.33,-62.6,-68.9,179.4,83.8],[1.22,-68.9,-175.6,-68.5,102.2],[1.20,-174.4,178.1,-63.4,105.1],[1.09,64.1,-175.8,68.0,-172.6],[1.03,63.4,-176.5,-66.7,173.2],[0.96,-176.7,178.8,63.4,-103.7],[0.92,179.4,65.8,65.3,-170.9],[0.89,179.3,66.2,-178.6,85.1],[0.89,-67.2,-178.5,63.1,-101.8],[0.73,178.1,66.9,-178.7,-85.3],[0.64,-176.5,65.8,60.2,80.8],[0.62,62.0,177.8,64.9,84.4],[0.58,62.9,179.9,-69.2,-82.5],[0.58,-85.8,70.4,174.6,179.0],[0.43,-64.3,-80.3,78.7,-165.9],[0.38,-63.9,-76.1,80.0,79.6],[0.28,-175.6,79.6,-90.4,172.4],[0.28,-64.9,-74.5,-79.7,95.0],[0.27,-170.2,-91.1,-67.4,170.0],[0.26,-83.1,81.9,69.8,-178.0],[0.26,-80.8,79.3,177.3,-81.8],[0.25,-171.3,-87.2,-179.0,-176.1],[0.19,65.1,-178.6,61.1,-104.5],[0.16,63.8,-171.9,-64.5,102.9],[0.15,-79.0,87.7,66.3,84.2],[0.14,-78.6,73.8,-179.4,85.1],[0.13,53.9,87.8,-178.5,178.1],[0.13,-171.0,-84.3,-176.8,-81.1],[0.12,-165.9,-84.4,-59.4,-82.3],[0.11,-178.7,78.6,-78.3,-84.6],[0.10,-173.6,68.1,67.3,-103.0],[0.08,57.6,-83.1,-176.1,-178.4],[0.08,63.7,-78.1,-64.2,169.9],[0.07,59.2,85.4,68.2,-166.2],[0.07,-171.4,-85.4,-174.0,84.2],[0.06,53.5,87.8,-176.0,-81.1],[0.06,68.7,-75.7,-177.8,-85.7],[0.06,-62.5,-80.5,71.6,-105.6],[0.05,54.5,86.6,178.2,85.5],[0.04,55.4,79.7,62.4,82.3],[0.04,63.8,-78.2,-59.5,-83.3],[0.04,-170.0,-92.9,-72.5,104.0],[0.04,-85.1,77.1,-91.5,168.7],[0.03,50.0,82.4,-92.5,169.0],[0.02,-176.1,81.2,-80.9,103.3],[0.02,-166.0,-82.2,78.0,-172.4],[0.02,-80.8,86.2,67.4,-101.7],[0.02,-81.6,78.0,-79.6,-84.1],[0.01,65.2,-85.1,84.2,84.5],[0.01,63.2,-85.5,80.7,-172.0],[0.01,63.6,-78.2,-179.8,85.7],[0.01,-169.7,-83.6,80.9,82.5],[0.00,54.5,79.4,64.6,-103.2],[0.00,54.5,83.5,-78.4,102.9],[0.00,54.5,83.5,-77.1,-84.1],[0.00,63.6,-82.1,71.6,-103.2],[0.00,63.6,-77.9,-77.1,102.9],[0.00,-169.7,-83.6,71.6,-103.2],[0.00,-82.6,77.9,-78.4,102.9]],"TRP":[[30.81,-67.4,100.3],[16.21,-177.3,-104.9],[13.02,-179.8,84.7],[13.02,-68.6,-4.2],[9.92,61.2,-89.9],[5.81,-175.1,17.3],[5.32,61.5,89.2],[5.32,-70.1,-92.2],[0.56,66.0,-6.3]],"VAL":[[73.90,175.9],[18.70,-61.7],[7.40,65.5]],"GLU":[[18.84,-67.7,177.8,-2.2],[12.00,-177.3,177.9,-0.2],[9.00,-65.3,-178.2,-54.7],[8.30,-67.7,-60.7,-52.4],[7.50,-68.3,179.3,56.0],[6.85,-64.2,-71.2,-9.8],[6.00,-177.6,175.8,57.3],[5.72,-175.2,179.2,-57.4],[4.09,-178.4,67.8,9.7],[3.92,-66.2,82.2,1.9],[3.00,-172.8,62.1,52.1],[2.56,64.6,-177.4,1.7],[2.10,-66.3,71.1,52.3],[1.53,65.3,-176.6,-58.5],[1.50,64.2,-178.4,58.7],[1.40,-64.1,-79.0,64.0],[1.31,68.3,-81.5,2.6],[0.84,-166.0,-80.1,-49.5],[0.73,-66.8,91.0,-54.1],[0.68,-169.0,-86.3,-14.5],[0.67,-174.2,72.2,-65.1],[0.49,65.1,-74.4,-51.1],[0.47,58.6,-93.4,51.0],[0.21,54.5,88.3,6.4],[0.13,54.3,83.1,49.0],[0.13,-155.8,-76.6,63.4],[0.03,50.8,78.6,-61.4]],"TYR":[[47.35,-65.8,97.8],[32.48,-179.6,77.5],[11.59,63.6,90.2],[6.53,-67.2,-16.7],[1.93,-174.2,21.0],[0.12,69.7,-9.5]]};

/**
 * atom quadrupels for all possible amino acid sidechain dihedrals
 */
Provi.Bio.Rotamers.sidechain_atoms = {"CYS":[["N","CA","CB","SG"]],"ASP":[["N","CA","CB","CG"],["CA","CB","CG","OD1"]],"SER":[["N","CA","CB","OG"]],"GLN":[["N","CA","CB","CG"],["CA","CB","CG","CD"],["CB","CG","CD","OE1"]],"LYS":[["N","CA","CB","CG"],["CA","CB","CG","CD"],["CB","CG","CD","CE"],["CG","CD","CE","NZ"]],"ILE":[["N","CA","CB","CG1"],["CA","CB","CG1","CD1"]],"PRO":[["N","CA","CB","CG"],["CA","CB","CG","CD"]],"THR":[["N","CA","CB","OG1"]],"PHE":[["N","CA","CB","CG"],["CA","CB","CG","CD1"]],"ASN":[["N","CA","CB","CG"],["CA","CB","CG","OD2"]],"MET":[["N","CA","CB","CG"],["CA","CB","CG","SD"],["CB","CG","SD","CE"]],"HIS":[["N","CA","CB","CG"],["CA","CB","CG","ND1"]],"LEU":[["N","CA","CB","CG"],["CA","CB","CG","CD1"]],"ARG":[["N","CA","CB","CG"],["CA","CB","CG","CD"],["CB","CG","CD","NE"],["CG","CD","NE","CZ"]],"TRP":[["N","CA","CB","CG"],["CA","CB","CG","CD1"]],"VAL":[["N","CA","CB","CG1"]],"GLU":[["N","CA","CB","CG"],["CA","CB","CG","CD"],["CB","CG","CD","OE1"]],"TYR":[["N","CA","CB","CG"],["CA","CB","CG","CD1"]]}


Provi.Bio.Rotamers.db["CNO"] = [
    ['{t,p,m}',-180,64,-101],
    ['{m,m,m}',-67,-64,-83],
    ['{m,t,p}',-71,153,85],
    ['{m,m,p}',-64,-71,95],
    ['{t,m,p}',-160,-91,103],
    ['{t,p,p}',-180,63,89],
    ['{t,m,m}',-171,-85,-91],
    ['{t,t,p}',-174,178,90],
    ['{t,t,m}',-178,170,-90]
];
Provi.Bio.Rotamers.sidechain_atoms["CNO"] = [
    ["N","CA","CB","SG"],["CA","CB","SG","SD"],["CB","SG","SD","CE"],
    ["SG","SD","CE","C5"],["SD","CE","C5","C6"]
];

Provi.Bio.Rotamers.db["TOA"] = [];
Provi.Bio.Rotamers.sidechain_atoms["TOA"] = [
    ["N","CA","CB","C6"], ["N","CA","C10","C7"],
    ["C","CA","NO","CB"], ["C","CB","C10","NO"]
];

Provi.Bio.Rotamers.db["PRX"] = [];
Provi.Bio.Rotamers.sidechain_atoms["PRX"] = [
    ["O","C","CA","C5"]
];



/**
 * A widget to work with amino acid rotamers
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Bio.Rotamers.RotamersWidget = function(params){
    params = _.defaults(
        params,
        Provi.Bio.Rotamers.RotamersWidget.prototype.default_params
    );
    this.picking_select = 'ATOM';
    this.drag_selected = false;
    this.selection_halos = false;
    this.show_vdw_id = false;
    this.clash_expression = '*';
    Widget.call( this, params );
    this._build_element_ids([ 'residue_expression', 'get_rotamers', 'rotamers', 'applet_selector_widget', 'next', 'previous', 'custom_rotamer', 'set_custom_rotamer', 'show_vdw', 'minimize', 'dihedrals', 'dihedral_slider', 'clash_expression' ]);
    var content = '<div class="control_group">' +
        '<div class="control_row" id="' + this.applet_selector_widget_id + '"></div>' +
	'<div class="control_row">' +
            '<input size="10" id="' + this.residue_expression_id + '" type="text" value="resno=7" class="ui-state-default"/>' +
            '<label for="' + this.residue_expression_id + '" >residue</label> ' +
	    '<button id="' + this.get_rotamers_id + '">get rotamers</button>' +
            '<span>' +
                '<button id="' + this.previous_id + '">previous rotamer</button>' +
		'<button id="' + this.next_id + '">next rotamer</button>' +
            '</span>' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="' + this.rotamers_id + '">rotamers</label>' +
            '<select id="' + this.rotamers_id + '" class="ui-state-default"><option></option></select>' +
	'</div>' +
	'<div class="control_row">' +
	    '<input size="12" id="' + this.custom_rotamer_id + '" type="text" value="" class="ui-state-default"/>' +
	    '<label for="' + this.custom_rotamer_id + '" >custom rotamer</label> ' +
	    '<button id="' + this.set_custom_rotamer_id + '">set</button>' +
        '</div>' +
	'<div class="control_row">' +
	    '<input size="12" id="' + this.clash_expression_id + '" type="text" value="*" class="ui-state-default"/>' +
	    '<label for="' + this.clash_expression_id + '" >clash expr.</label> ' +
        '</div>' +
	'<div class="control_row">' +
            '<input id="' + this.show_vdw_id + '" type="checkbox" style="float:left; margin-top: 0.5em;"/>' +
            '<label for="' + this.show_vdw_id + '" style="display:inline-block;">show vdw radii</label>' +
        '</div>' +
	'<div class="control_row">' +
            '<label for="' + this.dihedrals_id + '">dihedral atoms</label>' +
            '<select id="' + this.dihedrals_id + '" class="ui-state-default"><option></option></select>' +
	'</div>' +
	'<button id="' + this.minimize_id + '">minimize</button>' +
	'<div class="control_row">' +
	    '<label for="' + this.dihedral_slider_id + '" style="display:block;">dihedral angle</label>' +
	    '<div id="' + this.dihedral_slider_id + '"></div>' +
	'</div>' +
    '</div>';
    $(this.dom).append( content );
    this.applet_selector = new Provi.Jmol.JmolAppletSelectorWidget({
        parent_id: this.applet_selector_widget_id
    });
    this._init();
}
Provi.Bio.Rotamers.RotamersWidget.prototype = Utils.extend(Widget, /** @lends Provi.Bio.Rotamers.RotamersWidget.prototype */ {
    default_params: {
        heading: 'Rotamers',
        collapsed: true
    },
    _init: function(){
        var self = this;
	
	// init get rotamers
        $('#' + this.get_rotamers_id).button().click(function(){
            var applet = self.applet_selector.get_value();
            if(applet){
		self.residue_expression = $('#' + self.residue_expression_id).val();
		console.log( self.residue_expression );
                self.get_rotamers();
            }
        });
	
        $('#' + this.rotamers_id).change(function(){
            self.set_dihedral();
        });
        
        $('#' + this.previous_id).button({
            text: false,
            icons: {
                primary: 'ui-icon-triangle-1-w'
            }
        }).click(function(){
            $("#" + self.rotamers_id + ' option:selected').prev().attr('selected', true).trigger('change');
        });
        
        $('#' + this.next_id).button({
            text: false,
            icons: {
                primary: 'ui-icon-triangle-1-e'
            }
        }).click(function(){
            $("#" + self.rotamers_id + ' option:selected').next().attr('selected', true).trigger('change');
        });
	
	// init set custom rotamer
        $('#' + this.set_custom_rotamer_id).button().click(function(){
            var applet = self.applet_selector.get_value();
            if(applet){
		rot_str = $('#' + self.custom_rotamer_id).val();
		console.log( rot_str );
		var rot = $.map( rot_str.split(','), function(elm, i){
		    return parseFloat(elm);
		});
		self.custom_rotamer = [0.00].concat( rot );
		$("#" + self.rotamers_id + '>option[value="custom"]').remove();
		$("#" + self.rotamers_id).append("<option value='custom'>custom (" + self.custom_rotamer.slice(1).join('\u00B0, ') + "\u00B0)</option>").val('custom');
                self.set_dihedral( self.custom_rotamer );
            }
        });
	
	// init show vdw
        this.show_vdw = $("#" + this.show_vdw_id).is(':checked');
        $('#' + this.show_vdw_id).click(function(){
	    self.show_vdw = $("#" + self.show_vdw_id).is(':checked');
	    var applet = self.applet_selector.get_value();
	    applet.script_wait('' +
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
			(self.show_vdw ? ('select @a1 or @a2;' + '\n' +
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
			'var isoname = "' + self.id + '_clash_" + an1 + "_" + an2;' + '\n' +
			'draw ID @isoname CYLINDER @m1 @m2 DIAMETER @dia;' + '\n' +
		    '}' + '\n' +
		'};' +
		'',
		true
	    );
	    self.set_dihedral();
        });
	
	$('#' + this.minimize_id).button().click(function(){
            var applet = self.applet_selector.get_value();
            if(applet){
                self.minimize();
            }
        });
	
	$('#' + this.dihedral_slider_id).slider({
            value: 0, min: -180, max: 180
	}).bind( 'slidestop slide', function(event, ui){
	    self.move_dihedral();
	});
	
	$('#' + this.clash_expression_id).change(function(){
            self.clash_expression = $('#' + self.clash_expression_id).val();
	    console.log( self.clash_expression );
        });
	
	   Provi.Widget.Widget.prototype.init.call(this);
    },
    get_rotamers: function(){
        var self = this;
	var applet = this.applet_selector.get_value();
        
        var s = '' +
	    'select ' + this.residue_expression + '; center selected; wireframe 0.2;' + '\n' +
	    'connect (within(GROUP,selected) and not *.C and not *.N) (not within(GROUP,selected)) delete;' + '\n' +
	    'try{ contact {(' + this.residue_expression + ') and sidechain} {not (' + this.residue_expression + ') and (' + this.clash_expression + ')}; }catch(e){ print "JMOL ERROR: "+ e  };' + '\n' +
            'function set_dihedral( a, b, c, d, angle ){' + '\n' +
                'var current_angle = angle( a, b, c, d );' + '\n' +
                'var angle_change = @angle - @current_angle;' + '\n' +
                'print @current_angle;' + '\n' +
                'print @angle;' + '\n' +
                'print @angle_change;' + '\n' +
                'select within(BRANCH, @b, @c) and within(GROUP, @b) and not backbone;' + '\n' +
                'rotateSelected @b @c @angle_change;' + '\n' +
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
	console.log(s);
	applet.script_wait( s, true );
        
	this.res_name = eval( applet.evaluate('"[" + {' + this.residue_expression + '}.label("[\'%[group]\']").join(",") + "]"') )[0][0];
        
        this.original_rotamer = [0];
        $.each(Provi.Bio.Rotamers.sidechain_atoms[ this.res_name ], function(i){
            var atoms = this;
            var atoms_expr = [];
            $.each(atoms, function(){
                atoms_expr.push('{' + self.residue_expression + ' and atomName="' + this + '"}');
            });
            self.original_rotamer.push( parseFloat( parseFloat( applet.evaluate( 'angle( ' + atoms_expr.join(', ') + ' )' ) ).toFixed(2) ) );
        });
        //console.log(this.original_rotamer);
        
        //console.log( this.res_name );
        //console.log( Rotamers.sidechain_atoms[ this.res_name ] );
        //console.log( Rotamers.db[ this.res_name ] );
        
        $("#" + self.rotamers_id).empty();
        $("#" + self.rotamers_id)
	    .append("<option value='original'>" +
			"original (" + self.original_rotamer.slice(1).join('\u00B0, ') + "\u00B0)" +
		    "</option>");
        $.each(Provi.Bio.Rotamers.db[ this.res_name ], function(i){
            $("#" + self.rotamers_id).append(
		"<option value='rot" + i + "'>" +
		    this[0] + ( Provi.Utils.isNumber(this[0]) ? "%" : "" ) +
		    " (" + this.slice(1).join('\u00B0, ') + "\u00B0)" +
		"</option>"
	    );
        });
	
	$("#" + self.dihedrals_id).empty();
        $.each(Provi.Bio.Rotamers.sidechain_atoms[ this.res_name ], function(i){
            $("#" + self.dihedrals_id).append(
		"<option value='dihedral_" + i + "'>" +
		    this +
		"</option>"
	    );
        });
    },
    set_dihedral: function( rot ){
        var self = this;
	var applet = this.applet_selector.get_value();
        
	if( !rot ){
	    var rot_id = $("#" + this.rotamers_id).val();
	    if( rot_id == 'original' ){
		rot = self.original_rotamer;
	    }else if( rot_id == 'custom' ){
		rot = self.custom_rotamer;
	    }else{
		rot_id = parseInt( rot_id.substring(3) );
		rot = Provi.Bio.Rotamers.db[ this.res_name ][ rot_id ];
	    }
	}
        //console.log( rot );
        var s = ''
        $.each(Provi.Bio.Rotamers.sidechain_atoms[ this.res_name ], function(i){
            var atoms = this;
            var atoms_expr = [];
            $.each(atoms, function(){
                atoms_expr.push('{' + self.residue_expression + ' and atomName="' + this + '"}');
            });
            console.log( atoms_expr.join(', ') );
            s += 'set_dihedral( ' + atoms_expr.join(', ') + ', ' + rot[i+1] + ' );\n';
        });
	s += 'draw "' + self.id + '_clash*" DELETE;' + '\n' +
	    'set defaultVDW babel;' + '\n' +
	    'var ma = measure( {' + this.residue_expression + ' and sidechain}, {not ' + this.residue_expression + '}, 0, 4).split("\\n");' + '\n' +
	    'print ma;' + '\n' +
	    'select *; cpk off;' + '\n' +
	    'select ' + this.residue_expression + '; color wireframe opaque;' + '\n' +
	    'for (var a IN ma) {' + '\n' +
	    '    var pair = a.split(" ").find("(#[0-9]+)", "").replace("#", "");' + '\n' +
	    '    print pair;' + '\n' +
	    //'    show_clashes( pair[0], pair[1] );' + '\n' +
	    '}' + '\n' +
	    'try{ contact {(' + this.residue_expression + ') and sidechain} {not (' + this.residue_expression + ') and (' + this.clash_expression + ')}; }catch(e){ print "JMOL ERROR: "+ e  };' + '\n' +
	    '';
	console.log(s);
        applet.script_wait(s, true);
    },
    minimize: function(){
	var applet = this.applet_selector.get_value();
	var dihedral_no = $("#" + this.dihedrals_id).val().split('_')[1];
	var dihedral_atoms = Provi.Bio.Rotamers.sidechain_atoms[ this.res_name ][ dihedral_no ];
	var s = '';
	s += '' + '\n' +
	    'var b = {' + this.residue_expression + ' and atomName="' + dihedral_atoms[1] + '"}' + '\n' +
	    'var c = {' + this.residue_expression + ' and atomName="' + dihedral_atoms[2] + '"}' + '\n' +
	    'select (within(BRANCH, @b, @c) and within(GROUP, @b) and not backbone) or (within(GROUP, @b) and hydrogen); '  + '\n' +
	    'minimize select selected steps 100;' + '\n' +
	    'try{ contact {(' + this.residue_expression + ') and sidechain} {not (' + this.residue_expression + ') and (' + this.clash_expression + ')}; }catch(e){ print "JMOL ERROR: "+ e  };' + '\n' +
	    '';
	applet.script_wait(s, true);
    },
    move_dihedral: function(){
	var self = this;
	var applet = this.applet_selector.get_value();
	var dihedral_no = $("#" + this.dihedrals_id).val().split('_')[1];
	var dihedral_atoms = Provi.Bio.Rotamers.sidechain_atoms[ this.res_name ][ dihedral_no ];
	var dihedral_angle = $("#" + this.dihedral_slider_id).slider("value");
	
	var s = '';
	var atoms_expr = [];
	$.each(dihedral_atoms, function(){
	    atoms_expr.push('{' + self.residue_expression + ' and atomName="' + this + '"}');
	});
	console.log( atoms_expr.join(', ') );
	s += 'set_dihedral( ' + atoms_expr.join(', ') + ', ' + dihedral_angle + ' );' + '\n' +
	    'try{ contact {(' + this.residue_expression + ') and sidechain} {not (' + this.residue_expression + ') and (' + this.clash_expression + ')}; }catch(e){ print "JMOL ERROR: "+ e  };' + '\n' +
	    '';
	applet.script_wait(s, true);
    }
});


})();