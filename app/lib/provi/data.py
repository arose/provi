import re
import simplejson as json
import os
import os.path
from tempfile import TemporaryFile, NamedTemporaryFile
import itertools

from MembraneProtein.AndreanTools import contact
from MembraneProtein.AndreanTools import membran_neu
from MembraneProtein.AndreanTools import membran_plane
from MembraneProtein import HBexplore

from Bio.PDB.PDBParser import PDBParser
from provi.framework import expose



def get_headers( data, sep, count=60, is_multi_byte=False ):
    """
    Returns a list with the first 'count' lines split by 'sep'
    
    >>> fname = get_test_fname('complete.bed')
    >>> get_headers(fname,'\\t')
    [['chr7', '127475281', '127491632', 'NM_000230', '0', '+', '127486022', '127488767', '0', '3', '29,172,3225,', '0,10713,13126,'], ['chr7', '127486011', '127488900', 'D49487', '0', '+', '127486022', '127488767', '0', '2', '155,490,', '0,2399']]
    """
    headers = []
    for idx, line in enumerate( data.splitlines() ):
        line = line.rstrip('\n\r')
        if is_multi_byte:
            # TODO: fix this - sep is never found in line
            line = unicode( line, 'utf-8' )
            sep = sep.encode( 'utf-8' )
        headers.append( line.split(sep) )
        if idx == count:
            break
    return headers


def sniff_datatype( data, name ):
    extension = name.split('.')[-1].lower()
    if extension in extension_to_datatype_dict:
        return extension_to_datatype_dict[ extension ]
    else:
        return extension_to_datatype_dict[ 'dat' ]
    


class Dataset( object ):
    def __init__( self, data, type=None, name="" ):
        self.data = data
        self.name = name
        if not type or type == 'auto':
            type = sniff_datatype( data, name )
        else:
            type = extension_to_datatype_dict[ str(type).lower() ]
        self.type = type


class Data( object ):
    """Generic datatype"""
    file_ext = 'dat'
    def __init__( self, **kwargs ):
        pass
    def sniff( self, data, name=None ):
        raise "Not implemented"

class Binary( Data ):
    """Binary datatype"""
    file_ext = 'bin'
    pass
    
class Text( Data ):
    """Text datatype"""
    file_ext = 'txt'
    pass


class Pdb( Text ):
    """PDB"""
    file_ext = 'pdb'
    def get_structure( self, dataset ):
        tmp_file = NamedTemporaryFile()
        tmp_file.write( dataset.data )
        tmp_file.flush()
        parser = PDBParser()
        struc = parser.get_structure( 'structure', tmp_file.name )
        return struc
    
    @expose
    def get_tree( self, dataset, **kwargs ):
        return pdb_tree_view( self.get_structure( dataset ), **kwargs )
    
    @expose
    def get_pdb( self, dataset, **kwargs ):
        return dataset.data
    
    @classmethod
    def sniff( cls, dataset ):
        """
        Determines wether the file is in helix-contact json format
        
        Example:
        {
            "Protein" : "2qi9",
            "Helices" : [
        """
        headers = get_headers( dataset.data, None )
        try:
            proteinAttrFound = False
            for hdr in headers:
                if proteinAttrFound :
                    if len(hdr) >= 1 and hdr[0].startswith('"Helices"'):
                        return True
                elif len(hdr) >= 1 and hdr[0].startswith('"Protein"'):
                    proteinAttrFound = True

            return False
        except:
            return False
    

class ScoBase( Text ):
    file_ext = None
    data_class = None
    def get_tmp_file( self, dataset ):
        tmp_file = NamedTemporaryFile()
        tmp_file.write( dataset.data )
        tmp_file.flush()
        return tmp_file
    @expose
    def get_pdb( self, dataset, **kwargs ):
        tmp_file = self.get_tmp_file( dataset )
        return self.data_class(tmp_file.name).getPdb()
    @expose
    def get_helix_interface_names( self, dataset, **kwargs ):
        tmp_file = self.get_tmp_file( dataset )
        data = self.data_class(tmp_file.name)
        return json.dumps( data.getInterfaceNames('helix') )
    @expose
    def get_helix_interface_atoms( self, dataset, cutoff=1.5, interface_ids='', interface_names='', **kwargs ):
        cutoff = float( cutoff )
        if interface_ids:
            interface_ids = [int(x) for x in interface_ids.split(',')]
        else:
            interface_ids = []
        tmp_file = self.get_tmp_file( dataset )
        data = self.data_class(tmp_file.name)
        if interface_names:
            interface_names = [ x.strip() for x in interface_names.split(',') if len(x.strip()) < 10 ]
            # flatten
            interface_ids.extend( itertools.chain( * [ data.getInterfaceIdByName(name) for name in interface_names ] ) )
        atoms = data.getAtoms( cutoff=cutoff,interfaceIds=interface_ids )
        return json.dumps( atoms )
    @expose
    def get_structure_atoms( self, dataset, structure_name, **kwargs ):
        tmp_file = self.get_tmp_file( dataset )
        data = self.data_class(tmp_file.name)
        return json.dumps( data.getStructureAtoms( structure_name ) )

class Sco ( ScoBase ):
    file_ext = 'sco'
    data_class = contact.sco

class Mbn( ScoBase ):
    file_ext = 'mbn'
    data_class = membran_neu.mbn

class Mplane( Text ):
    file_ext = 'mplane'
    @expose
    def get_planes( self, dataset, **kwargs ):
        tmp_file = NamedTemporaryFile()
        tmp_file.write( dataset.data )
        tmp_file.flush()
        mp = membran_plane.Mplanes(tmp_file.name)
        def f(p):
            return map( list, (p.a, p.b, p.c) )
        return json.dumps( ( f(mp.plane1), f(mp.plane2), mp.distance() ) )

class Gromacs( Text ):
    file_ext = 'gro'

class JmolScript( Text ):
    file_ext = 'jspt'

class Ccp4( Binary ):
    file_ext = 'ccp4'

class JmolVoxel( Text ):
    file_ext = 'jvxl'

class MrcDensityMap( Text ):
    file_ext = 'mrc'

class Cif( Text ):
    file_ext = 'cif'

class MmCif( Text ):
    file_ext = 'mmcif'

class Cube( Text ):
    file_ext = 'cub'

class Tmhelix( Text ):
    file_ext = 'tmhelix'
    @expose
    def get_tm_helices( self, dataset, **kwargs ):
        tmp_file = NamedTemporaryFile()
        tmp_file.write( dataset.data )
        tmp_file.flush()
        from MembraneProtein.AndreanTools.parse_tm import get_tm_helices
        return json.dumps( get_tm_helices( tmp_file.name ) )
        
class Hbx( Text ):
    file_ext = 'anal'
    @expose
    def get_hbonds( self, dataset, **kwargs ):
        tmp_file = NamedTemporaryFile()
        tmp_file.write( dataset.data )
        tmp_file.flush()
        from MembraneProtein.HBexplore import parse_hbx_anal_output, get_hbonds_list
        return json.dumps( get_hbonds_list( parse_hbx_anal_output( tmp_file.name ) ) )

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


extension_to_datatype_dict = {
    'anal': Hbx(),
    'bin': Binary(),
    'ccp4': Ccp4(),
    'cif': Cif(),
    'cub': Cube(),
    'dat': Data(),
    'gro': Gromacs(),
    'jspt': JmolScript(),
    'jvxl': JmolVoxel(),
    'mbn': Mbn(),
    'mmcif': MmCif(),
    'mplane': Mplane(),
    'mrc': MrcDensityMap(),
    'pdb': Pdb(),
    'sco': Sco(),
    'tmhelix': Tmhelix(),
    'txt': Text(),
}