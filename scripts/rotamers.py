#!/usr/bin/env python

from collections import defaultdict
import json
import pprint

# Atoms for each side-chain angle for each residue
CHIS = {}
CHIS["ARG"] = [ ["N","CA","CB","CG" ],
                ["CA","CB","CG","CD" ],
                ["CB","CG","CD","NE" ],
                ["CG","CD","NE","CZ" ]
              ]
 
CHIS["ASN"] = [ ["N","CA","CB","CG" ],
                ["CA","CB","CG","OD2" ]
              ]
 
CHIS["ASP"] = [ ["N","CA","CB","CG" ],
                ["CA","CB","CG","OD1" ]
              ]
CHIS["CYS"] = [ ["N","CA","CB","SG" ]
              ]
 
CHIS["GLN"] = [ ["N","CA","CB","CG" ],
                ["CA","CB","CG","CD" ],
                ["CB","CG","CD","OE1"]
              ]
 
CHIS["GLU"] = [ ["N","CA","CB","CG" ],
                ["CA","CB","CG","CD" ],
                ["CB","CG","CD","OE1"]
              ]
 
CHIS["HIS"] = [ ["N","CA","CB","CG" ],
                ["CA","CB","CG","ND1"]
              ]
 
CHIS["ILE"] = [ ["N","CA","CB","CG1" ],
                ["CA","CB","CG1","CD1" ]
              ]
 
CHIS["LEU"] = [ ["N","CA","CB","CG" ],
                ["CA","CB","CG","CD1" ]
              ]
 
CHIS["LYS"] = [ ["N","CA","CB","CG" ],
                ["CA","CB","CG","CD" ],
                ["CB","CG","CD","CE"],
                ["CG","CD","CE","NZ"]
              ]
 
CHIS["MET"] = [ ["N","CA","CB","CG" ],
                ["CA","CB","CG","SD" ],
                ["CB","CG","SD","CE"]
              ]
 
CHIS["PHE"] = [ ["N","CA","CB","CG" ],
                ["CA","CB","CG","CD1" ]
              ]
 
CHIS["PRO"] = [ ["N","CA","CB","CG" ],
                ["CA","CB","CG","CD" ]
              ]
 
CHIS["SER"] = [ ["N","CA","CB","OG" ]
              ]
 
CHIS["THR"] = [ ["N","CA","CB","OG1" ]
              ]
 
CHIS["TRP"] = [ ["N","CA","CB","CG" ],
                ["CA","CB","CG","CD1"]
              ]
 
CHIS["TYR"] = [ ["N","CA","CB","CG" ],
                ["CA","CB","CG","CD1" ]
              ]
 
CHIS["VAL"] = [ ["N","CA","CB","CG1" ]
              ]


def read_rotamer_lib( lib_path = '../data/rotamers/bbind02.May.lib' ):
    
    rotamer_dict = defaultdict(list)
    
    fh = open( lib_path )
    
    # Column indexes in the rotamer library.
    RES  = 0
    PROB = 7
    CHI1 = 11
    CHI2 = 13
    CHI3 = 15
    CHI4 = 17
    cols = [ PROB, CHI1, CHI2, CHI3, CHI4 ]
    
    for line in fh:
        # split by whitespace
        dat = line.split()
        if not dat or (dat[ RES ] not in CHIS): continue
        
        key = dat[ RES ]
        value = []
        for i in cols:
            try:
                # no float to save space in the json file
                value.append( dat[i] )
                #value.append( float(dat[i]) )
            except IndexError:
                #value.append( False )
                pass
        rotamer_dict[ key ].append( value )
    
    fh.close()
    
    # sort by probability, descending
    for key, value in rotamer_dict.iteritems():
        value.sort( key=lambda x: float(x[0]), reverse=True )
    
    return rotamer_dict

json_str = json.dumps( read_rotamer_lib(), separators=(',', ':') )

import re
# remove double quotes around float values
json_str = re.sub('"(-?(?:[0-9]+|[0-9]*\.[0-9]+))"', "\\1", json_str)

json_str += '\n\n' + json.dumps( CHIS, separators=(',', ':') )

fh = open( '../data/rotamers/bbind02.May.lib.json', "w" )
fh.write( json_str )
fh.close()
