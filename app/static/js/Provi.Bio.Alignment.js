/**
 * @fileOverview This file contains the {@link Provi.Bio.Alignment} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


// Once the F matrix is computed, the entry  gives the maximum score among all
// possible alignments. To compute an alignment that actually gives this score,
// you start from the bottom right cell, and compare the value with the three
// possible sources (Match, Insert, and Delete above) to see which it came
// from. If Match, then  and  are aligned, if Delete, then  is aligned with a
// gap, and if Insert, then  is aligned with a gap. (In general, more than one
// choices may have the same value, leading to alternative optimal alignments.)

  


/**
 * @namespace
 * Alignment module
 */
Provi.Bio.Alignment = {};


(function() {

/** @exports Utils as Provi.Utils */
var Utils = Provi.Utils;

/** @exports Widget as Provi.Widget.Widget */
var Widget = Provi.Widget.Widget;

Provi.Bio.Alignment.substitution_matrices = {
    "blosum62x": [
        [4,0,-2,-1,-2,0,-2,-1,-1,-1,-1,-2,-1,-1,-1,1,0,0,-3,-2],        // A
        [0,9,-3,-4,-2,-3,-3,-1,-3,-1,-1,-3,-3,-3,-3,-1,-1,-1,-2,-2],    // C
        [-2,-3,6,2,-3,-1,-1,-3,-1,-4,-3,1,-1,0,-2,0,-1,-3,-4,-3],       // D
        [-1,-4,2,5,-3,-2,0,-3,1,-3,-2,0,-1,2,0,0,-1,-2,-3,-2],          // E
        [-2,-2,-3,-3,6,-3,-1,0,-3,0,0,-3,-4,-3,-3,-2,-2,-1,1,3],        // F
        [0,-3,-1,-2,-3,6,-2,-4,-2,-4,-3,0,-2,-2,-2,0,-2,-3,-2,-3],      // G
        [-2,-3,-1,0,-1,-2,8,-3,-1,-3,-2,1,-2,0,0,-1,-2,-3,-2,2],        // H
        [-1,-1,-3,-3,0,-4,-3,4,-3,2,1,-3,-3,-3,-3,-2,-1,3,-3,-1],       // I
        [-1,-3,-1,1,-3,-2,-1,-3,5,-2,-1,0,-1,1,2,0,-1,-2,-3,-2],        // K
        [-1,-1,-4,-3,0,-4,-3,2,-2,4,2,-3,-3,-2,-2,-2,-1,1,-2,-1],       // L
        [-1,-1,-3,-2,0,-3,-2,1,-1,2,5,-2,-2,0,-1,-1,-1,1,-1,-1],        // M
        [-2,-3,1,0,-3,0,1,-3,0,-3,-2,6,-2,0,0,1,0,-3,-4,-2],            // N
        [-1,-3,-1,-1,-4,-2,-2,-3,-1,-3,-2,-2,7,-1,-2,-1,-1,-2,-4,-3],   // P
        [-1,-3,0,2,-3,-2,0,-3,1,-2,0,0,-1,5,1,0,-1,-2,-2,-1],           // Q
        [-1,-3,-2,0,-3,-2,0,-3,2,-2,-1,0,-2,1,5,-1,-1,-3,-3,-2],        // R
        [1,-1,0,0,-2,0,-1,-2,0,-2,-1,1,-1,0,-1,4,1,-2,-3,-2],           // S
        [0,-1,-1,-1,-2,-2,-2,-1,-1,-1,-1,0,-1,-1,-1,1,5,0,-2,-2],       // T
        [0,-1,-3,-2,-1,-3,-3,3,-2,1,1,-3,-2,-2,-3,-2,0,4,-3,-1],        // V
        [-3,-2,-4,-3,1,-2,-2,-3,-3,-2,-1,-4,-4,-2,-3,-3,-2,-3,11,2],    // W
        [-2,-2,-3,-2,3,-3,2,-1,-2,-1,-1,-2,-3,-1,-2,-2,-2,-1,2,7]       // Y
    ],
    "blosum62": [
        //A  R  N  D  C  Q  E  G  H  I  L  K  M  F  P  S  T  W  Y  V  B  Z  X
        [ 4,-1,-2,-2, 0,-1,-1, 0,-2,-1,-1,-1,-1,-2,-1, 1, 0,-3,-2, 0,-2,-1, 0], // A
        [-1, 5, 0,-2,-3, 1, 0,-2, 0,-3,-2, 2,-1,-3,-2,-1,-1,-3,-2,-3,-1, 0,-1], // R
        [-2, 0, 6, 1,-3, 0, 0, 0, 1,-3,-3, 0,-2,-3,-2, 1, 0,-4,-2,-3, 3, 0,-1], // N
        [-2,-2, 1, 6,-3, 0, 2,-1,-1,-3,-4,-1,-3,-3,-1, 0,-1,-4,-3,-3, 4, 1,-1], // D
        [ 0,-3,-3,-3, 9,-3,-4,-3,-3,-1,-1,-3,-1,-2,-3,-1,-1,-2,-2,-1,-3,-3,-2], // C
        [-1, 1, 0, 0,-3, 5, 2,-2, 0,-3,-2, 1, 0,-3,-1, 0,-1,-2,-1,-2, 0, 3,-1], // Q
        [-1, 0, 0, 2,-4, 2, 5,-2, 0,-3,-3, 1,-2,-3,-1, 0,-1,-3,-2,-2, 1, 4,-1], // E
        [ 0,-2, 0,-1,-3,-2,-2, 6,-2,-4,-4,-2,-3,-3,-2, 0,-2,-2,-3,-3,-1,-2,-1], // G
        [-2, 0, 1,-1,-3, 0, 0,-2, 8,-3,-3,-1,-2,-1,-2,-1,-2,-2, 2,-3, 0, 0,-1], // H
        [-1,-3,-3,-3,-1,-3,-3,-4,-3, 4, 2,-3, 1, 0,-3,-2,-1,-3,-1, 3,-3,-3,-1], // I
        [-1,-2,-3,-4,-1,-2,-3,-4,-3, 2, 4,-2, 2, 0,-3,-2,-1,-2,-1, 1,-4,-3,-1], // L
        [-1, 2, 0,-1,-3, 1, 1,-2,-1,-3,-2, 5,-1,-3,-1, 0,-1,-3,-2,-2, 0, 1,-1], // K
        [-1,-1,-2,-3,-1, 0,-2,-3,-2, 1, 2,-1, 5, 0,-2,-1,-1,-1,-1, 1,-3,-1,-1], // M
        [-2,-3,-3,-3,-2,-3,-3,-3,-1, 0, 0,-3, 0, 6,-4,-2,-2, 1, 3,-1,-3,-3,-1], // F
        [-1,-2,-2,-1,-3,-1,-1,-2,-2,-3,-3,-1,-2,-4, 7,-1,-1,-4,-3,-2,-2,-1,-2], // P
        [ 1,-1, 1, 0,-1, 0, 0, 0,-1,-2,-2, 0,-1,-2,-1, 4, 1,-3,-2,-2, 0, 0, 0], // S
        [ 0,-1, 0,-1,-1,-1,-1,-2,-2,-1,-1,-1,-1,-2,-1, 1, 5,-2,-2, 0,-1,-1, 0], // T
        [-3,-3,-4,-4,-2,-2,-3,-2,-2,-3,-2,-3,-1, 1,-4,-3,-2,11, 2,-3,-4,-3,-2], // W
        [-2,-2,-2,-3,-2,-1,-2,-3, 2,-1,-1,-2,-1, 3,-3,-2,-2, 2, 7,-1,-3,-2,-1], // Y
        [ 0,-3,-3,-3,-1,-2,-2,-3,-3, 3, 1,-2, 1,-1,-2,-2, 0,-3,-1, 4,-3,-2,-1], // V
        [-2,-1, 3, 4,-3, 0, 1,-1, 0,-3,-4, 0,-3,-3,-2, 0,-1,-4,-3,-3, 4, 1,-1], // B
        [-1, 0, 0, 1,-3, 3, 4,-2, 0,-3,-3, 1,-1,-3,-1, 0,-1,-3,-2,-2, 1, 4,-1], // Z
        [ 0,-1,-1,-1,-2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-2, 0, 0,-2,-1,-1,-1,-1,-1]  // X
    ]
}





Provi.Bio.Alignment.nucleotides = 'ACTG';
Provi.Bio.Alignment.aminoacidsX = 'ACDEFGHIKLMNPQRSTVWY';
Provi.Bio.Alignment.aminoacids = 'ARNDCQEGHILKMFPSTWYVBZX';


_.each( Provi.Bio.Alignment.substitution_matrices, function(mat,name){
    var cell_names = Provi.Bio.Alignment.aminoacids
    if(mat[0].length == 4){
        cell_names = Provi.Bio.Alignment.nucleotides
    }
    var mat_dict = {};
    _.each(mat, function(row, i){
        var row_dict = {};
        _.each(row, function(value, j){
            row_dict[ cell_names[j] ] = value;
        });
        mat_dict[ cell_names[i] ] = row_dict;
    });
    Provi.Bio.Alignment.substitution_matrices[name] = mat_dict;
});
// console.log( Provi.Bio.Alignment.substitution_matrices );


Provi.Bio.Alignment.NeedlemanWunsch = function(params){
    params = _.defaults( params, this.default_params );
    if( params.subst_matrix ){
        this.subst_matrix = Provi.Bio.Alignment.substitution_matrices[ params.subst_matrix ];
    }else{
        this.subst_matrix = false;
    }
    var p = [ "gap_penalty", "gap_extension_penalty", "seq1", "seq2" ];
    _.extend( this, _.pick( params, p ) );

    this._init();
}
Provi.Bio.Alignment.NeedlemanWunsch.prototype = /** @lends Provi.Bio.Alignment.NeedlemanWunsch.prototype */ {
    default_params: {
        subst_matrix: "blosum62",
        gap_penalty: -10,
        gap_extension_penalty: -1,
        seq1: "HEAGAWGHEE",
        seq2: "PAWHEAE"
    },
    _init: function(){
        this.n = this.seq1.length;
        this.m = this.seq2.length;
        //console.log(this.n, this.m);

        this.ali_score = undefined;
        this.ali = '';

        this.S = [];
        this.V = [];
        this.H = [];
        for(var i = 0; i <= this.n; i++){
            this.S[i] = [];
            this.V[i] = [];
            this.H[i] = [];
            for(var j = 0; j <= this.m; j++){
                this.S[i][j] = 0;
                this.V[i][j] = 0;
                this.H[i][j] = 0;
            }
        }
        for(var i = 0; i <= this.n; ++i){
            this.S[i][0] = this.gap(0);
            this.H[i][0] = -Infinity;
        }
        for(var j = 0; j <= this.m; ++j){
            this.S[0][j] = this.gap(0);
            this.V[0][j] = -Infinity;
        }
        this.S[0][0] = 0;
        // console.log(this.S, this.V, this.H);
    },
    gap: function(len){
        return this.gap_penalty + len*this.gap_extension_penalty;
    },
    score: function(i, j){
        var c1 = this.seq1[i];
        var c2 = this.seq2[j];
        if( this.subst_matrix ){
            try{
                return this.subst_matrix[ c1 ][ c2 ];
            }catch(e){
                return -4;
            }
        }else{
            console.warn('WARN NW no value in matrix', c1, c2);
            return c1==c2 ? 5 : -3;
        }
    },
    calc: function(){
        
        for(var i = 1; i <= this.n; ++i){
            for(var j = 1; j <= this.m; ++j){
                this.V[i][j] = _.max([
                    this.S[i-1][j] + this.gap(0),
                    this.V[i-1][j] + this.gap_extension_penalty
                ]);
                this.H[i][j] = _.max([
                    this.S[i][j-1] + this.gap(0),
                    this.H[i][j-1] + this.gap_extension_penalty
                ]);
                this.S[i][j] = _.max([
                    this.S[i-1][j-1] + this.score(i-1, j-1), // match
                    this.V[i][j], //del
                    this.H[i][j] // ins
                ]);
            }
        }
        // console.log(this.S, this.V, this.H);
    },
    trace: function(){
        this.ali1 = '';
        this.ali2 = '';
        var i = this.n;
        var j = this.m;
        var mat = "S";
        if(this.S[i][j] >= this.V[i][j] && this.S[i][j] >= this.V[i][j]){
            mat = "S";
            this.ali_score = this.S[i][j];
        }else if(this.V[i][j] >= this.H[i][j]){
            mat = "V";
            this.ali_score = this.V[i][j];
        }else{
            mat = "H";
            this.ali_score = this.H[i][j];
        }

        console.log("SCORE", this.ali_score);
        console.log("SCORES S, V, H", this.S[i][j], this.V[i][j], this.H[i][j]);

        while(i > 0 && j > 0){
            if(mat=="S"){
                if(this.S[i][j]==this.S[i-1][j-1] + this.score(i-1, j-1)){
                    this.ali1 = this.seq1[i-1] + this.ali1;
                    this.ali2 = this.seq2[j-1] + this.ali2;
                    --i;
                    --j;
                    mat = "S";
                }else if(this.S[i][j]==this.V[i][j]){
                    mat = "V";
                }else if(this.S[i][j]==this.H[i][j]){
                    mat = "H";
                }else{
                    console.error('NW ERROR S');
                    --i;
                    --j;
                }
            }else if(mat=="V"){
                if(this.V[i][j]==this.V[i-1][j] + this.gap_extension_penalty){
                    this.ali1 = this.seq1[i-1] + this.ali1;
                    this.ali2 = '-' + this.ali2;
                    --i;
                    mat = "V";
                }else if(this.V[i][j]==this.S[i-1][j] + this.gap(0)){
                    this.ali1 = this.seq1[i-1] + this.ali1;
                    this.ali2 = '-' + this.ali2;
                    --i;
                    mat = "S";
                }else{
                    console.error('NW ERROR V');
                    --i;
                }
            }else if(mat=="H"){
                if(this.H[i][j]==this.H[i][j-1] + this.gap_extension_penalty){
                    this.ali1 = '-' + this.ali1;
                    this.ali2 = this.seq2[j-1] + this.ali2;
                    --j;
                    mat = "H";
                }else if(this.H[i][j]==this.S[i][j-1] + this.gap(0)){
                    this.ali1 = '-' + this.ali1;
                    this.ali2 = this.seq2[j-1] + this.ali2;
                    --j;
                    mat = "S";
                }else{
                    console.error('NW ERROR H');
                    --j;
                }
            }else{
                console.error('NW ERROR no matrix');
            }
        }
        while(i > 0){
            this.ali1 = this.seq1[i-1] + this.ali1;
            this.ali2 = '-' + this.ali2;
            --i;
        }
        while(j > 0){
            this.ali1 = '-' + this.ali1;
            this.ali2 = this.seq2[j-1] + this.ali2;
            --j;
        }
        console.log([this.ali1, this.ali2]);
    }
};

})();

// nw = new Provi.Bio.Alignment.NeedlemanWunsch({});
// nw.calc();
// nw.trace();


