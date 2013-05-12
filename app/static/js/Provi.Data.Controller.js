/**
 * @fileOverview This file contains the {@link Provi.Data.Controller} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * @namespace
 * Provi data controller module
 */
Provi.Data.Controller = {};


(function() {



var type_mixins = {
    "provi": {
        bio_object: Provi.Bio.Data.DotProvi,
        raw_type: "json"
    },
    "tmalign": {
        bio_object: Provi.Bio.Data.Tmalign,
        raw_type: "text"
    },
    "structure": {
        bio_object: Provi.Bio.Structure.Structure,
        params_object: Provi.Bio.Structure.StructureParamsWidget
    },
    "atmprop": {
        bio_object: Provi.Bio.AtomProperty.AtomProperty
    },
    "atmsele": {
        bio_object: Provi.Bio.AtomSelection.AtomSelection
    },
    "atmvec": {
        bio_object: Provi.Bio.Data.AtomVector,
        params_object: Provi.Bio.Data.AtomVectorLoadParamsWidget
    },
    "bonds": {
        bio_object: Provi.Bio.HydrogenBonds.BondSet
    },
    "mplane": {
        bio_object: Provi.Bio.MembranePlanes.Mplane,
        raw_type: "text"
    },
    "jmol": {
        bio_object: Provi.Bio.Data.JmolFile
    },
    "jspt": {
        bio_object: Provi.Bio.Data.JmolScript,
        raw_type: "text"
    },
    "story": {
        bio_object: Provi.Bio.Data.Story
    },
    "isosurface": {
        bio_object: Provi.Bio.Isosurface.Isosurface,
        params_object: Provi.Bio.Isosurface.LoadParamsWidget
    },
    "volume": {
        bio_object: Provi.Bio.Isosurface.Volume,
        params_object: Provi.Bio.Isosurface.VolumeLoadParamsWidget
    },
    "pse": {
        bio_object: Provi.Bio.Data.Pymol
    },
    "fasta": {
        bio_object: Provi.Bio.Data.Fasta
    },
    "features": {
        bio_object: Provi.Bio.Data.Features,
        raw_type: "text"
    },
    "dat": {
        bio_object: Provi.Bio.Data.Data
    }
}


var get_canonical_type = function( type ){
    var canonical_type = type;
    _.each( Provi.Data.types, function( type_list, ct ){
        if( _.include( type_list, type ) ) canonical_type = ct;
    });
    return canonical_type;
}


Provi.Data.Controller.extend_by_type = function( obj, type ){
    var canonical = get_canonical_type( type );
    var mixin = type_mixins[ canonical ];
    if( !mixin ){
        console.log('unkown file type', obj, type);
        mixin = type_mixins[ "dat" ];
    }
    _.extend( obj, mixin );
}



})();