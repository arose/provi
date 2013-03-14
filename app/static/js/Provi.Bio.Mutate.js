/**
 * @fileOverview This file contains the {@link Provi.Bio.Mutate} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * @namespace
 * Rotamers module
 */
Provi.Bio.Mutate = {};


(function() {

/** @exports Utils as Provi.Utils */
var Utils = Provi.Utils;

/** @exports Widget as Provi.Widget.Widget */
var Widget = Provi.Widget.Widget;


Provi.Bio.Mutate._pdb_atom_format_string = "%s%5i %-4s%c%3s %c%4i%c   %8.3f%8.3f%8.3f%6.2f%6.2f      %4s%2s%2s\n";


Provi.Bio.Mutate.res_db = {
    "CYS":
        "ATOM   2563  N   CYS A   1      69.753  13.122   4.073  1.00 70.14           N  \n" +
        "ATOM   2564  CA  CYS A   1      70.973  12.615   4.686  1.00 75.21           C  \n" +
        "ATOM   2565  C   CYS A   1      72.139  12.589   3.696  1.00 79.61           C  \n" +
        "ATOM   2566  O   CYS A   1      73.272  12.259   4.053  1.00 78.74           O  \n" +
        "ATOM   2567  CB  CYS A   1      70.722  11.224   5.273  1.00 75.73           C  \n" +
        "ATOM   2568  SG  CYS A   1      69.376  11.318   6.478  1.00 77.01           S  \n",
    "ASP":
        "ATOM   2241  N   ASP A   1      20.321  34.262  11.944  1.00 53.02           N  \n" +
        "ATOM   2242  CA  ASP A   1      21.158  34.662  13.065  1.00 54.07           C  \n" +
        "ATOM   2243  C   ASP A   1      22.320  33.734  13.389  1.00 52.65           C  \n" +
        "ATOM   2244  O   ASP A   1      22.142  32.721  14.054  1.00 53.81           O  \n" +
        "ATOM   2245  CB  ASP A   1      20.286  34.832  14.317  1.00 56.48           C  \n" +
        "ATOM   2246  CG  ASP A   1      20.843  35.870  15.291  1.00 61.70           C  \n" +
        "ATOM   2247  OD1 ASP A   1      20.164  36.154  16.306  1.00 63.30           O  \n" +
        "ATOM   2248  OD2 ASP A   1      21.950  36.407  15.046  1.00 63.28           O  \n",
    "SER":
        "ATOM    790  N   SER A   1      44.837  38.702  10.416  1.00 45.20           N  \n" +
        "ATOM    791  CA  SER A   1      44.497  38.306  11.778  1.00 44.20           C  \n" +
        "ATOM    792  C   SER A   1      45.206  39.166  12.814  1.00 43.91           C  \n" +
        "ATOM    793  O   SER A   1      44.646  39.462  13.871  1.00 43.64           O  \n" +
        "ATOM    794  CB  SER A   1      44.852  36.839  12.009  1.00 44.17           C  \n" +
        "ATOM    795  OG  SER A   1      44.047  35.993  11.208  1.00 48.05           O  \n",
    "GLN":
        "ATOM    211  N   GLN A   1      38.175  44.365  13.811  1.00 59.68           N  \n" +
        "ATOM    212  CA  GLN A   1      36.889  43.748  14.128  1.00 57.05           C  \n" +
        "ATOM    213  C   GLN A   1      36.811  43.216  15.546  1.00 58.16           C  \n" +
        "ATOM    214  O   GLN A   1      36.038  42.302  15.825  1.00 58.25           O  \n" +
        "ATOM    215  CB  GLN A   1      36.612  42.608  13.149  1.00 53.26           C  \n" +
        "ATOM    216  CG  GLN A   1      36.537  43.056  11.703  1.00 51.16           C  \n" +
        "ATOM    217  CD  GLN A   1      35.351  43.970  11.443  1.00 49.79           C  \n" +
        "ATOM    218  OE1 GLN A   1      34.222  43.650  11.821  1.00 52.28           O  \n" +
        "ATOM    219  NE2 GLN A   1      35.597  45.105  10.790  1.00 42.16           N  \n",
    "LYS":
        "ATOM    121  N   LYS A   1      22.782  47.187  15.834  1.00 72.62           N  \n" +
        "ATOM    122  CA  LYS A   1      21.840  47.985  16.606  1.00 73.41           C  \n" +
        "ATOM    123  C   LYS A   1      22.603  48.881  17.580  1.00 72.64           C  \n" +
        "ATOM    124  O   LYS A   1      22.086  49.907  18.021  1.00 73.87           O  \n" +
        "ATOM    125  CB  LYS A   1      20.852  47.092  17.367  1.00 74.64           C  \n" +
        "ATOM    126  CG  LYS A   1      21.408  46.418  18.606  1.00 79.12           C  \n" +
        "ATOM    127  CD  LYS A   1      20.297  45.722  19.390  1.00 83.09           C  \n" +
        "ATOM    128  CE  LYS A   1      19.227  46.716  19.861  1.00 84.72           C  \n" +
        "ATOM    129  NZ  LYS A   1      18.091  46.060  20.582  1.00 84.68           N  \n",
    "ILE":
        "ATOM    432  N   ILE A   1      57.385  21.470   4.391  1.00 44.78           N  \n" +
        "ATOM    433  CA  ILE A   1      56.980  20.138   3.929  1.00 47.25           C  \n" +
        "ATOM    434  C   ILE A   1      56.635  20.073   2.448  1.00 48.19           C  \n" +
        "ATOM    435  O   ILE A   1      56.854  19.045   1.804  1.00 49.45           O  \n" +
        "ATOM    436  CB  ILE A   1      55.775  19.543   4.702  1.00 48.62           C  \n" +
        "ATOM    437  CG1 ILE A   1      54.540  20.407   4.500  1.00 52.88           C  \n" +
        "ATOM    438  CG2 ILE A   1      56.112  19.388   6.163  1.00 50.01           C  \n" +
        "ATOM    439  CD1 ILE A   1      53.306  19.816   5.132  1.00 59.00           C  \n",
    "PRO":
        "ATOM     44  N   PRO A   1      28.551  47.499   1.063  1.00 47.47           N  \n" +
        "ATOM     45  CA  PRO A   1      28.701  47.304  -0.380  1.00 47.64           C  \n" +
        "ATOM     46  C   PRO A   1      29.425  46.022  -0.773  1.00 48.06           C  \n" +
        "ATOM     47  O   PRO A   1      29.045  45.374  -1.750  1.00 50.34           O  \n" +
        "ATOM     48  CB  PRO A   1      29.444  48.564  -0.834  1.00 46.85           C  \n" +
        "ATOM     49  CG  PRO A   1      30.218  48.966   0.390  1.00 49.18           C  \n" +
        "ATOM     50  CD  PRO A   1      29.217  48.738   1.502  1.00 47.45           C  \n",
    "THR":
        "ATOM     24  N   THR A   1      25.194  42.613   9.210  1.00 54.26           N  \n" +
        "ATOM     25  CA  THR A   1      25.335  43.950   8.666  1.00 50.31           C  \n" +
        "ATOM     26  C   THR A   1      25.926  43.856   7.272  1.00 51.01           C  \n" +
        "ATOM     27  O   THR A   1      27.111  43.563   7.104  1.00 52.00           O  \n" +
        "ATOM     28  CB  THR A   1      26.256  44.822   9.541  1.00 47.48           C  \n" +
        "ATOM     29  OG1 THR A   1      25.714  44.910  10.860  1.00 47.31           O  \n" +
        "ATOM     30  CG2 THR A   1      26.373  46.217   8.969  1.00 43.90           C  \n",
    "PHE":
        "ATOM     59  N   PHE A   1      30.728  43.503   1.879  1.00 40.27           N  \n" +
        "ATOM     60  CA  PHE A   1      31.004  42.703   3.054  1.00 40.06           C  \n" +
        "ATOM     61  C   PHE A   1      29.725  42.319   3.788  1.00 41.86           C  \n" +
        "ATOM     62  O   PHE A   1      28.652  42.854   3.506  1.00 40.29           O  \n" +
        "ATOM     63  CB  PHE A   1      31.941  43.469   3.996  1.00 42.66           C  \n" +
        "ATOM     64  CG  PHE A   1      31.335  44.720   4.584  1.00 45.34           C  \n" +
        "ATOM     65  CD1 PHE A   1      30.302  44.643   5.522  1.00 45.48           C  \n" +
        "ATOM     66  CD2 PHE A   1      31.794  45.975   4.198  1.00 46.89           C  \n" +
        "ATOM     67  CE1 PHE A   1      29.738  45.795   6.064  1.00 45.65           C  \n" +
        "ATOM     68  CE2 PHE A   1      31.233  47.139   4.735  1.00 48.16           C  \n" +
        "ATOM     69  CZ  PHE A   1      30.202  47.046   5.670  1.00 47.17           C  \n",
    "ASN":
        "ATOM     12  N   ASN A   1      20.063  40.620  11.404  1.00 74.28           N  \n" +
        "ATOM     13  CA  ASN A   1      20.914  39.753  12.205  1.00 69.77           C  \n" +
        "ATOM     14  C   ASN A   1      22.391  40.009  11.918  1.00 66.06           C  \n" +
        "ATOM     15  O   ASN A   1      23.253  39.786  12.770  1.00 65.20           O  \n" +
        "ATOM     16  CB  ASN A   1      20.538  38.292  11.953  1.00 68.42           C  \n" +
        "ATOM     17  CG  ASN A   1      19.174  37.955  12.513  1.00 68.20           C  \n" +
        "ATOM     18  OD1 ASN A   1      18.888  38.309  13.657  1.00 65.97           O  \n" +
        "ATOM     19  ND2 ASN A   1      18.332  37.281  11.729  1.00 69.51           N  \n",
    "MET":
        "ATOM      4  N   MET A   1      18.066  43.422  11.514  1.00 81.28           N  \n" +
        "ATOM      5  CA  MET A   1      19.062  42.715  10.718  1.00 79.52           C  \n" +
        "ATOM      6  C   MET A   1      19.993  41.928  11.629  1.00 77.07           C  \n" +
        "ATOM      7  O   MET A   1      20.630  42.494  12.520  1.00 77.20           O  \n" +
        "ATOM      8  CB  MET A   1      19.878  43.704   9.878  1.00 81.23           C  \n" +
        "ATOM      9  CG  MET A   1      19.036  44.547   8.944  1.00 83.15           C  \n" +
        "ATOM     10  SD  MET A   1      17.991  43.528   7.889  1.00 87.56           S  \n" +
        "ATOM     11  CE  MET A   1      18.644  43.941   6.250  1.00 86.99           C  \n",
    "HIS":
        "ATOM   1672  N   HIS A   1      32.140  21.767  -8.749  1.00 41.27           N  \n" +
        "ATOM   1673  CA  HIS A   1      33.378  21.735  -7.991  1.00 39.68           C  \n" +
        "ATOM   1674  C   HIS A   1      33.345  21.057  -6.634  1.00 41.68           C  \n" +
        "ATOM   1675  O   HIS A   1      34.191  21.302  -5.783  1.00 45.15           O  \n" +
        "ATOM   1676  CB  HIS A   1      33.912  23.156  -7.911  1.00 33.57           C  \n" +
        "ATOM   1677  CG  HIS A   1      34.257  23.706  -9.253  1.00 34.80           C  \n" +
        "ATOM   1678  ND1 HIS A   1      35.338  23.250  -9.980  1.00 35.10           N  \n" +
        "ATOM   1679  CD2 HIS A   1      33.595  24.564 -10.064  1.00 37.17           C  \n" +
        "ATOM   1680  CE1 HIS A   1      35.324  23.801 -11.182  1.00 33.64           C  \n" +
        "ATOM   1681  NE2 HIS A   1      34.277  24.601 -11.260  1.00 35.57           N  \n",
    "LEU":
        "ATOM    244  N   LEU A   1      33.818  41.937  17.442  1.00 59.83           N  \n" +
        "ATOM    245  CA  LEU A   1      33.288  40.623  17.059  1.00 60.42           C  \n" +
        "ATOM    246  C   LEU A   1      33.633  39.511  18.039  1.00 59.71           C  \n" +
        "ATOM    247  O   LEU A   1      32.811  38.630  18.295  1.00 59.84           O  \n" +
        "ATOM    248  CB  LEU A   1      33.796  40.229  15.665  1.00 60.38           C  \n" +
        "ATOM    249  CG  LEU A   1      33.131  40.902  14.463  1.00 60.26           C  \n" +
        "ATOM    250  CD1 LEU A   1      33.862  40.543  13.180  1.00 61.36           C  \n" +
        "ATOM    251  CD2 LEU A   1      31.683  40.459  14.392  1.00 59.88           C  \n",
    "ARG":
        "ATOM    155  N   ARG A   1      31.734  47.822  11.873  1.00 58.05           N  \n" +
        "ATOM    156  CA  ARG A   1      32.557  48.603  10.945  1.00 57.92           C  \n" +
        "ATOM    157  C   ARG A   1      32.913  47.670   9.791  1.00 56.45           C  \n" +
        "ATOM    158  O   ARG A   1      32.765  46.455   9.908  1.00 57.67           O  \n" +
        "ATOM    159  CB  ARG A   1      33.858  49.063  11.613  1.00 61.10           C  \n" +
        "ATOM    160  CG  ARG A   1      33.703  50.060  12.743  1.00 66.65           C  \n" +
        "ATOM    161  CD  ARG A   1      33.590  51.493  12.226  1.00 72.75           C  \n" +
        "ATOM    162  NE  ARG A   1      32.334  52.113  12.636  1.00 77.72           N  \n" +
        "ATOM    163  CZ  ARG A   1      31.923  52.204  13.899  1.00 80.10           C  \n" +
        "ATOM    164  NH1 ARG A   1      32.672  51.718  14.882  1.00 81.06           N  \n" +
        "ATOM    165  NH2 ARG A   1      30.750  52.759  14.177  1.00 79.34           N  \n",
    "TRP":
        "ATOM   1275  N   TRP A   1      44.484  22.125 -12.846  1.00 36.65           N  \n" +
        "ATOM   1276  CA  TRP A   1      44.593  23.574 -12.796  1.00 36.19           C  \n" +
        "ATOM   1277  C   TRP A   1      43.463  24.224 -13.572  1.00 35.52           C  \n" +
        "ATOM   1278  O   TRP A   1      43.002  25.320 -13.223  1.00 35.49           O  \n" +
        "ATOM   1279  CB  TRP A   1      45.945  24.045 -13.352  1.00 36.17           C  \n" +
        "ATOM   1280  CG  TRP A   1      47.044  23.826 -12.379  1.00 34.60           C  \n" +
        "ATOM   1281  CD1 TRP A   1      47.745  22.661 -12.157  1.00 34.09           C  \n" +
        "ATOM   1282  CD2 TRP A   1      47.472  24.745 -11.380  1.00 32.09           C  \n" +
        "ATOM   1283  NE1 TRP A   1      48.573  22.806 -11.068  1.00 32.05           N  \n" +
        "ATOM   1284  CE2 TRP A   1      48.424  24.077 -10.571  1.00 34.08           C  \n" +
        "ATOM   1285  CE3 TRP A   1      47.139  26.068 -11.081  1.00 30.41           C  \n" +
        "ATOM   1286  CZ2 TRP A   1      49.037  24.693  -9.484  1.00 31.21           C  \n" +
        "ATOM   1287  CZ3 TRP A   1      47.743  26.676 -10.008  1.00 31.77           C  \n" +
        "ATOM   1288  CH2 TRP A   1      48.683  25.988  -9.217  1.00 32.81           C  \n",
    "VAL":
        "ATOM     82  N   VAL A   1      29.198  41.431   7.834  1.00 44.18           N  \n" +
        "ATOM     83  CA  VAL A   1      29.645  41.156   9.186  1.00 44.82           C  \n" +
        "ATOM     84  C   VAL A   1      28.524  40.400   9.888  1.00 48.69           C  \n" +
        "ATOM     85  O   VAL A   1      27.376  40.847   9.909  1.00 47.87           O  \n" +
        "ATOM     86  CB  VAL A   1      29.936  42.463   9.957  1.00 42.21           C  \n" +
        "ATOM     87  CG1 VAL A   1      30.359  42.145  11.378  1.00 43.18           C  \n" +
        "ATOM     88  CG2 VAL A   1      31.024  43.247   9.263  1.00 40.58           C  \n",
    "GLU":
        "ATOM     31  N   GLU A   1      25.093  44.100   6.270  1.00 50.50           N  \n" +
        "ATOM     32  CA  GLU A   1      25.549  44.043   4.895  1.00 50.29           C  \n" +
        "ATOM     33  C   GLU A   1      26.172  45.385   4.548  1.00 48.71           C  \n" +
        "ATOM     34  O   GLU A   1      25.761  46.411   5.082  1.00 48.67           O  \n" +
        "ATOM     35  CB  GLU A   1      24.376  43.750   3.960  1.00 53.17           C  \n" +
        "ATOM     36  CG  GLU A   1      24.797  43.199   2.609  1.00 58.09           C  \n" +
        "ATOM     37  CD  GLU A   1      23.628  42.958   1.681  1.00 60.46           C  \n" +
        "ATOM     38  OE1 GLU A   1      22.560  42.512   2.163  1.00 62.62           O  \n" +
        "ATOM     39  OE2 GLU A   1      23.787  43.201   0.467  1.00 61.57           O  \n",
    "TYR":
        "ATOM     70  N   TYR A   1      29.851  41.379   4.724  1.00 41.27           N  \n" +
        "ATOM     71  CA  TYR A   1      28.726  40.934   5.521  1.00 42.13           C  \n" +
        "ATOM     72  C   TYR A   1      29.241  40.503   6.885  1.00 44.07           C  \n" +
        "ATOM     73  O   TYR A   1      29.684  39.365   7.071  1.00 45.51           O  \n" +
        "ATOM     74  CB  TYR A   1      27.979  39.765   4.845  1.00 42.42           C  \n" +
        "ATOM     75  CG  TYR A   1      26.680  39.387   5.561  1.00 41.02           C  \n" +
        "ATOM     76  CD1 TYR A   1      26.691  38.574   6.694  1.00 38.63           C  \n" +
        "ATOM     77  CD2 TYR A   1      25.453  39.917   5.150  1.00 37.76           C  \n" +
        "ATOM     78  CE1 TYR A   1      25.523  38.308   7.398  1.00 39.24           C  \n" +
        "ATOM     79  CE2 TYR A   1      24.279  39.655   5.850  1.00 36.34           C  \n" +
        "ATOM     80  CZ  TYR A   1      24.318  38.856   6.972  1.00 40.64           C  \n" +
        "ATOM     81  OH  TYR A   1      23.153  38.621   7.677  1.00 42.47           O  \n"
}

// Provi.Bio.Mutate.build_pdb_line = function( params ){
//     var p = $.extend({
//         atom_number: 1, fullname: '    ',
//         altloc: ' ', resname: '   ',
//         chain_id: ' ', resseq: 1, icode: ' ',
//         x: 0.0, y: 0.0, z: 0.0,
//         occupancy: 1.0, bfactor: 0.0, segid: ' ', 
//         element: '  ', charge: '  ', hetatom: false
//     }, params);
    
//     var record_type = p.hetatom ? "HETATM" : "ATOM  ";

//     args = [
//         p.record_type, p.atom_number, p.fullname, p.altloc, p.resname, p.chain_id, 
//         p.resseq, p.icode, p.x, p.y, p.z, p.occupancy, p.bfactor, p.segid, 
//         p.element, p.charge
//     ];
//     return _ATOM_FORMAT_STRING % args
// }

/**
 * A widget
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Bio.Mutate.MutateWidget = function(params){
    params = _.defaults(
        params,
        Provi.Bio.Mutate.MutateWidget.prototype.default_params
    );
    console.log('MUTATE', params);
    params.persist_on_applet_delete = false;
    params.heading = 'Mutate';
    //params.collapsed = false;
    Provi.Widget.Widget.call( this, params );
    this._init_eid_manager([
        'applet_selector', 'residue_expression', 'mutate', 'residues'
    ]);
    
    var template = '' +
        '<div class="control_row" id="${eids.applet_selector}"></div>' +
        '<div class="control_row">' +
            '<input size="10" id="${eids.residue_expression}" type="text" value="resno=323" class="ui-state-default"/>' +
            '<label for="${eids.residue_expression}" >residue</label> ' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="${eids.residues}">residues</label>' +
            '<select id="${eids.residues}" class="ui-state-default"><option></option></select>' +
            '<button id="${eids.mutate}">mutate</button>' +
        '</div>' +
    '';
    
    this.add_content( template, params );
    this.applet_selector = new Provi.Jmol.JmolAppletSelectorWidget({
        parent_id: this.eid('applet_selector')
    });
    this._init();
}
Provi.Bio.Mutate.MutateWidget.prototype = Utils.extend(Provi.Widget.Widget, /** @lends Provi.Bio.Mutate.MutateWidget.prototype */ {
    default_params: {
        
    },
    _init: function(){
        var self = this;
        
        this.elm('mutate').button().click(function() {
            self.mutate();
        });

        this._init_residues();
        
        Provi.Widget.Widget.prototype.init.call(this);
    },
    mutate: function(){
        var applet = this.applet_selector.get_value();
        if(applet){

            var res_sele = this.elm('residue_expression').val();
            var res = this.elm('residues').val()
            var muta_res = Provi.Bio.Mutate.res_db[ res ];
            
            applet.script(
                "var aa = '" + muta_res + "';" +
                "var sele = {" + res_sele + "};" +
                "var resno = {@sele}.resno;" +
                "var chain = {@sele}.chain[1];" +
                "var aa_split = aa.split('\n');" +
                "var n = aa_split.length;" +
                "var m = (''+resno).length;" +
                "for( var i=1; i<=n; ++i){" +
                    "if(chain){ aa_split[i][22] = chain; }" +
                    "for( var j=0; j<m; ++j ){" +
                        "aa_split[i][26-j] = resno[m-j];" +
                    "}" +
                "}" +
                "aa = aa_split.join('\n');" +
                "var n = {*}.atomIndex.max;" +
                "set appendNew OFF;" +
                "load append '@aa';" +
                "set appendNew ON;" +
                "var old = {atomIndex <= n and @sele};" +
                "var new = {atomIndex > n};" +
                "var t = {@old and *.CA}.XYZ - {@new and *.CA}.XYZ;" +
                "select @new;" +
                "translateSelected @t;" +
                "var v1 = {@old and *.CB}.XYZ - {@old and *.CA}.XYZ;" +
                "var ca = {@old and *.CA}.XYZ;" +
                "var v2 = {@new and *.CB}.XYZ - {@new and *.CA}.XYZ;" +
                "var cr = cross(v1, v2);" +
                "var p = cr + ca;" +
                "var an = -angle({@old and *.CB}, {@old and *.CA}, {@new and *.CB});" +
                "select @new;" +
                "rotateSelected @an @ca @p;" +
                "{@new and (*.N)}.XYZ = {@old and (*.N)}.XYZ;" +
                "{@new and (*.C)}.XYZ = {@old and (*.C)}.XYZ;" +
                "{@new and (*.O)}.XYZ = {@old and (*.O)}.XYZ;" +
                "connect (@new and *.N) (within(1.5, (@old and *.N)) and not @old and not @new);" +
                "connect (@new and *.C) (within(1.5, (@old and *.C)) and not @old and not @new);" +
                "delete {@old};"
            , true);

            // todo: delete old residue
        }
    },
    _init_residues: function(){
        var self = this;
        this.elm('residues').empty();
        _.each(Provi.Bio.Mutate.res_db, function(pdb, name){
            self.elm('residues').append(
                "<option value='" + name + "'>" + name + "</option>"
            );
        });
    }
});





})();