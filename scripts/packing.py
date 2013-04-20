#!/usr/bin/env python

from collections import defaultdict
import json
import pprint
import re


def read_residue_defs( dat_path = '../data/packing/NucProt.resi-defs.dat' ):
    res_defs = {}
    with open( dat_path ) as fh:
        group = None
        for line in fh:
            if not line.strip():
                continue
            if line.startswith(" "):
                if not group:
                    raise Exception("no value for group")
                aname, atype = line.split()[0:2]
                if atype.startswith("="):
                    atype = res_defs[ group ][ atype[1:] ]
                if group not in ['DUM', 'HEM']:
                    res_defs[ group ][ aname ] = atype
            else:
                group = line.split()[0]
                if group not in ['DUM', 'HEM']:
                    res_defs[ group ] = {}
    return res_defs


def read_atom_defs( dat_path = '../data/packing/NucProt.atom-defs.dat' ):
    atom_defs = {}
    with open( dat_path ) as fh:
        for line in fh:
            atom_data = line.split()
            atom_defs[ atom_data[0] ] = atom_data[1:3]
    return atom_defs


def main():
    res_defs = read_residue_defs()
    with open( '../data/packing/NucProt.resi-defs.dat.json', "w" ) as fh:
        json_str = json.dumps( res_defs, separators=(',', ':') )
        fh.write( json_str )

    atom_defs = read_atom_defs()
    with open( '../data/packing/NucProt.atom-defs.dat.json', "w" ) as fh:
        json_str = json.dumps( atom_defs, separators=(',', ':') )
        json_str = re.sub('"(-?(?:[0-9]+|[0-9]*\.[0-9]+))"', "\\1", json_str )
        fh.write( json_str )

    with open( '../data/packing/resi-defs.dat_by_type.json', "w" ) as fh:
        type_dict = defaultdict(list)
        for group, res in res_defs.iteritems():
            for aname, atype in res.iteritems():
                type_dict[ atype ].append( "%s.%s" % (group, aname) )
        json_str = json.dumps( type_dict, separators=(',', ':') )
        fh.write( json_str )


    


if __name__ == '__main__':
    main()