import re
import simplejson as json
import os
import os.path

from MembraneProtein.AndreanTools import contact
from MembraneProtein.AndreanTools import membran_neu
from MembraneProtein import HBexplore

from Bio.PDB.PDBParser import PDBParser



class Data( object ):
    pass



class Pdb( Data ):
    """PDB"""
    
    def __init__( self, file_name ):
        self.file_name = file_name
    
    def get_structure( self ):
        parser = PDBParser()
        struc = parser.get_structure( os.path.basename(self.file_name), self.file_name )
        return struc
    
    def get_tree( self, **kwargs ):
        return pdb_tree_view( self.get_structure(), **kwargs)
    
    def get_pdb( self ):
        return open( self.file_name ).read()
    




def pdb_tree_view(struc, **kwargs):
    
    if kwargs['root'] == 'source':
        modelNodes = []
        for model in struc.get_list():
            
            chainNodes = []
            for chain in model.get_list():
                
                chainNodes.append(
                    {'title': 'Chain: %s' % chain.get_id(),
                     'expand': False,
                     'isFolder': True,
                     'addClass': 'chain',
                     'key': '%s-%s' % (model.get_id(), chain.get_id()),
                     'isLazy': True})
                
            modelNodes.append(
                {'title': 'Model: %s' % model.get_id(),
                 'expand': False,
                 'isFolder': True,
                 'addClass': 'model',
                 'key': str(model.get_id()),
                 'children': chainNodes})
            
        return json.dumps(modelNodes, separators=(',', ':') )
        
    else:
        
        args = kwargs['root'].split('-')
        
        if len(args) == 3:
            arg_model, arg_chain, arg_residue = args
            
            try:
                model=struc[arg_model]
            except KeyError:
                model=struc[int(arg_model)]
            chain=model[arg_chain]
            residue=chain[int(arg_residue)]
            
            atomNodes = []
            for atom in residue.get_list():
                atomInfo = [
                    {'title': 'name: %s' % atom.get_name(), 'unselectable': True, 'hideCheckbox': True},
                    {'title': 'id: %s' % atom.get_id(), 'unselectable': True, 'hideCheckbox': True},
                    {'title': 'coords:',
                     'unselectable': True,
                     'hideCheckbox': True,
                     'children': [
                        {'title': 'x: %s' % atom.get_coord()[0], 'unselectable': True, 'hideCheckbox': True},
                        {'title': 'y: %s' % atom.get_coord()[1], 'unselectable': True, 'hideCheckbox': True},
                        {'title': 'z: %s' % atom.get_coord()[2], 'unselectable': True, 'hideCheckbox': True}
                        ]},
                    {'title': 'B factor: %s' % atom.get_bfactor(), 'unselectable': True, 'hideCheckbox': True},
                    {'title': 'occupancy: %s' % atom.get_occupancy(), 'unselectable': True, 'hideCheckbox': True},
                    {'title': 'alt. loc.: %s' % atom.get_altloc(), 'unselectable': True, 'hideCheckbox': True},
                    {'title': 'sigatm: %s' % atom.get_sigatm(), 'unselectable': True, 'hideCheckbox': True},
                    {'title': 'sigsou: %s' % atom.get_siguij(), 'unselectable': True, 'hideCheckbox': True},
                    {'title': 'anisou: %s' % atom.get_anisou(), 'unselectable': True, 'hideCheckbox': True},
                    {'title': 'full name: "<pre style=\'display: inline;\'>%s</pre>"' % atom.get_fullname(), 'unselectable': True, 'hideCheckbox': True}
                    ]
                
                atomNodes.append(
                    {'title': 'Atom: %s' % atom.get_id(),
                     'expand': False,
                     'isFolder': True,
                     'addClass': 'atom',
                     'key': '%s-%s-%s-%s' % (model.get_id(), chain.get_id(), residue.get_id()[1], str(atom.get_id()).strip()),
                     'children': atomInfo})
                            
            return json.dumps(atomNodes, separators=(',', ':') )
            
        elif len(args) == 2:
            arg_model, arg_chain = args
            
            try:
                model=struc[arg_model]
            except KeyError:
                model=struc[int(arg_model)]
            chain=model[arg_chain]
            
            residueNodes = []
            for residue in chain.get_list():
                
                residueNodes.append(
                    {'title': '%s %s' % (residue.get_id()[1], residue.get_resname()),
                     'expand': False,
                     'isFolder': True,
                     'addClass': 'residue',
                     'key': '%s-%s-%s' % (model.get_id(), chain.get_id(), residue.get_id()[1]),
                     'isLazy': True})
                            
            return json.dumps(residueNodes, separators=(',', ':') )

