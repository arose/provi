#! /usr/bin/env python
from __future__ import division

import argparse
import os
import os.path
import json
from collections import defaultdict


def memoize(f):
    cache = {}
    def memf(*x):
        if x not in cache:
            cache[x] = f(*x)
        return cache[x]
    return memf


_ATOM_FORMAT_STRING = "%s%5i %-4s%c%3s %c%4i%c   %8.3f%8.3f%8.3f%6.2f%6.2f      %4s%2s%2s\n" 



def build_pdb_line(atom_number, fullname, altloc, resname, chain_id, 
    resseq, icode, x, y, z, occupancy, bfactor, segid, 
    element, charge, hetatom=False):
    
    if hetatom: 
        record_type="HETATM" 
    else: 
        record_type="ATOM  "    
    args = (
        record_type, atom_number, fullname, altloc, resname, chain_id, 
        resseq, icode, x, y, z, occupancy, bfactor, segid, 
        element, charge
    )
    return _ATOM_FORMAT_STRING % args

def prep_contact(filename):

    """output the data in pdb format by directly translating
    mbn atom lines into pdb atom lines"""
    pdb_lines = []
    for key, atom, interfaces in self.__data:
        if key[0] in ['H', 'C', 'E', 'O', 'W']:
            resseq = int( atom[0] )
            chain_id = atom[1]
            resname = atom[2]
            fullname = str(atom[3])
            atom_number = int(atom[4])
            x, y, z = map( float, atom[5:8] )
            bfactor = float(atom[8])
            hetatom = key[0] in ['O', 'W']
            element = '  '
            icode = ' '
            segid = ' '
            occupancy = 1.0
            altloc = ' '
            charge = '  '
            pdb_lines.append(
                build_pdb_line(
                    atom_number, fullname, altloc, resname, chain_id, 
                    resseq, icode, x, y, z, occupancy, bfactor, segid, 
                    element, charge, hetatom
                )
            )
    pdb_lines.sort(key=lambda line: (line[21], int(line[22:26])))
    return "".join( pdb_lines )

@memoize
def get_pdb_coord_dict(pdb_file):
    pdb_fp = open(pdb_file)
    coord_dict = {}
    i = 1
    for l in pdb_fp:
        if l.startswith('ATOM') or l.startswith('HETATM'):
            key = ( l[30:38], l[38:46], l[46:54] )
            if key in coord_dict:
                print "ERROR: coords already in dict. %s" % key
            else:
                coord_dict[ key ] = i
                i += 1
    return coord_dict

def prep_contact(contact_file, pdb_file):
    contact_fp = open(contact_file)
    name, ext = os.path.splitext(contact_file)
    elms_out_fp = open( "%s.atmsele" % (contact_file), "w")
    contact_out_fp = open( "%s.atmprop" % (contact_file), "w")

    pdb_coord_dict = get_pdb_coord_dict(pdb_file)
    contact_index_dict = {}
    structure_elms = []
    contact_lines = [None] * len(pdb_coord_dict)

    i = 1
    for l in contact_fp:
        if l.startswith('OVERVW') or l.startswith('OVERV2'):
            structure_elms += l.split()[1:]
        elif l.startswith('END'):
            pass
        elif l.startswith('CUTOFF'):
            pass
        elif l[0] in ['H', 'C', 'E', 'O', 'W']:
            key = ( l[27:35], l[35:43], l[43:51] )
            if key in pdb_coord_dict:
                j = pdb_coord_dict[key]
                contact_lines[ j-1 ] = l
                contact_index_dict[ i ] = j
                i += 1
            else:
                print "ERROR: contact coords not in pdb coords dict. %s" % str(key)

    if len(pdb_coord_dict) != len(contact_index_dict):
        print "ERROR: number of atoms in contact and pdb coord dicts differs."

    structure_elms_index = {}
    for i, elm in enumerate(structure_elms):
        structure_elms_index[ i+1 ] = elm
    structure_elms_index[ 0 ] = "Water"
    structure_elms_index[ -1 ] = "Membrane"
    structure_elms_index[ -51 ] = "Membrane"
    # -50, 50, 67

    elms_list = ['Membrane', 'Water'] + structure_elms
    elms_list_dict = {}
    for i, e in enumerate(elms_list):
        elms_list_dict[e] = i

    structure_elms_dict = defaultdict(list)

    contact_out_fp.write('%s\n' % " ".join( elms_list ))
    for i, l in enumerate(contact_lines):
        elms_out_list = ['9'] * len(elms_list)
        contacts = l[73:].split()
        if len(contacts) % 2 != 0:
            print "ERROR: contacts list has uneven number of elements. %s" % l
        for elm_id, cutoff in zip(contacts[::2],contacts[1::2]):
            elm_id = int(elm_id)
            if elm_id in structure_elms_index:
                elm_name = structure_elms_index[ int(elm_id) ]
                elms_out_list[ elms_list_dict[ elm_name ] ] = cutoff
            else:
                print "WARNING: structure element not known. %s" % elm_id
        contact_out_fp.write('%s\n' % " ".join( elms_out_list ))
        structure_elms_dict[ l[0:5] ].append( i+1 )

    for name, atoms in structure_elms_dict.iteritems():
        struc = " ".join([ str(a) for a in atoms ])
        elms_out_fp.write( "%s %s\n" % (name, struc) )
        
            




def prep_volume(vol_file, pdb_file):
    vol_fp = open(vol_file)
    name, ext = os.path.splitext(vol_file)
    holes_out_fp = open( "%s.atmsele" % (vol_file), "w")
    prop_out_fp = open( "%s.atmprop" % (vol_file), "w")

    pdb_coord_dict = get_pdb_coord_dict(pdb_file)
    vol_index_dict = {}

    vol_lines = [None] * len(pdb_coord_dict)
    hole_lines = []
    
    i = 1
    for l in vol_fp:
        if l.startswith('ATOM') or l.startswith('HETATM'):
            key = ( l[30:38], l[38:46], l[46:54] )
            if key in pdb_coord_dict:
                j = pdb_coord_dict[key]
                vol_lines[ j-1 ] = l
                vol_index_dict[ i ] = j
                i += 1
            else:
                print "ERROR: vol coords not in pdb coords dict. %s" % str(key)
        elif l.startswith('HOLE NUMBER'):
            hole_lines.append( l )

    if len(pdb_coord_dict) != len(vol_index_dict):
        print "ERROR: number of atoms in vol and pdb coord dicts differs."

    for l in hole_lines:
        ls = l[12:].split()
        neighbours = []
        for nb in ls[1:]:
            nb = int(nb)
            if nb in vol_index_dict:
                neighbours.append( vol_index_dict[nb] )
            else:
                print "ERROR: hole neighbour index not found. %s" % nb
        neighbours = " ".join([ str(nb) for nb in neighbours ])
        holes_out_fp.write( "HOLE_NUMBER_%s %s\n" % (ls[0], neighbours) )

    prop_out_fp.write('volume_vdw volume_vdw_1_4 buried_flag packing_density\n')
    for l in vol_lines:
        ls = l.split()
        vdwvol = float(ls[-3])  #VOLUME INSIDE VAN-DER-WAALS SPHERE
        sevol = float(ls[-2])   #VOLUME IN 1.4 ANGSTROM LAYER OUTSIDE VDW-SPHERE
        if vdwvol==0.0:
            packdens = 0.0
        elif (vdwvol+sevol)==0.0:
            packdens = 999.99
            print 'ERROR: vdw volume and excluded volume zero. %s' % l
        else:
            packdens = (vdwvol/(vdwvol+sevol))
        prop_out_fp.write( '%s %.2f\n' % (l[67:82], packdens) )

    prop_out_fp.close()




def prep_pdb(filename):
    pdb_fp = open(filename)
    name, ext = os.path.splitext(filename)
    pdb_out_fp = open( "%s_short%s" % (name, ext), "w")
    
    for line in pdb_fp:
        if line.startswith('ATOM') or line.startswith('HETATM'):
            pdb_out_fp.write( line[:54]+'\n' )

    pdb_fp.close()
    pdb_out_fp.close()




def main():

    # create the parser
    parser = argparse.ArgumentParser(
        description = __doc__,
    )
    # add the arguments
    parser.add_argument('-o', default='.', help='output directory')
    parser.add_argument('-pdb', help='pdb file')
    parser.add_argument('-vol', help='volume file')
    parser.add_argument('-contact', help='contact (sco, mbn) file')

    # parse the command line
    args = parser.parse_args()


    if args.vol and args.pdb:
        prep_volume( args.vol, args.pdb )

    if args.contact and args.pdb:
        prep_contact( args.contact, args.pdb )





if __name__ == "__main__":
    main()