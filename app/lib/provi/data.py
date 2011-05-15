import re
import simplejson as json
import os
import os.path
import logging
from tempfile import TemporaryFile, NamedTemporaryFile
from cStringIO import StringIO
import itertools
from collections import defaultdict
from utils.odict import odict

from MembraneProtein.AndreanTools import contact
from MembraneProtein.AndreanTools import membran_neu
from MembraneProtein.AndreanTools import membran_plane
from MembraneProtein import HBexplore

from Bio.PDB.PDBParser import PDBParser
from provi.framework import expose

from voronoia import VolParser, Voronoia

logging.basicConfig( level=logging.DEBUG )
LOG = logging.getLogger('provi')
LOG.setLevel( logging.DEBUG )

def named_tmp_file( data ):
    tmp_file = NamedTemporaryFile()
    tmp_file.write( data )
    tmp_file.flush()
    return tmp_file

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
    if extension == 'gz':
        extension = name.split('.')[-2].lower()
    elif extension == 'zip':
        extension = name.split('.')[-2].lower()
    LOG.debug( extension )
    if extension in extension_to_datatype_dict:
        return extension_to_datatype_dict[ extension ]
    else:
        return extension_to_datatype_dict[ 'dat' ]
    


class Dataset( object ):
    def __init__( self, data, type=None, name="", extra_data={} ):
        self.data = data
        self.extra_data = extra_data
        self.name = name
        LOG.debug( type )
        if not type or type == 'auto':
            type = sniff_datatype( data, name )
        else:
            type = extension_to_datatype_dict[ str(type).lower() ]
        LOG.debug( type )
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

class Dx( Data ):
    """Dx datatype"""
    file_ext = 'dx'
    pass

class Sdf( Data ):
    """Sdf datatype"""
    file_ext = 'sdf'
    pass

class Mol( Data ):
    """MOL datatype"""
    file_ext = 'mol'
    pass

class Pdb( Text ):
    """PDB"""
    file_ext = 'pdb'
    def get_structure( self, dataset ):
        tmp_file = named_tmp_file( dataset.data )
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
    

class Pqr( Text ):
    """PQR"""
    file_ext = 'pqr'
    @expose
    def get_pdb( self, dataset, **kwargs ):
        return dataset.data

class Ent( Pdb ):
    """PDB with another file extension"""
    file_ext = 'ent'

class ScoBase( Text ):
    file_ext = None
    data_class = None
    @expose
    def get_pdb( self, dataset, **kwargs ):
        tmp_file = named_tmp_file( dataset.data )
        return self.data_class(tmp_file.name).getPdb()
    @expose
    def get_helix_interface_names( self, dataset, **kwargs ):
        tmp_file = named_tmp_file( dataset.data )
        data = self.data_class(tmp_file.name)
        #return json.dumps( data.getInterfaceNames('helix') )
        return json.dumps( data.getInterfaceNames() )
    @expose
    def get_helix_interface_atoms( self, dataset, cutoff=1.5, interface_ids='', interface_names='', **kwargs ):
        cutoff = float( cutoff )
        if interface_ids:
            interface_ids = [int(x) for x in interface_ids.split(',')]
        else:
            interface_ids = []
        tmp_file = named_tmp_file( dataset.data )
        data = self.data_class(tmp_file.name)
        if interface_names:
            interface_names = [ x.strip() for x in interface_names.split(',') if len(x.strip()) < 10 ]
            # flatten
            interface_ids.extend( itertools.chain( * [ data.getInterfaceIdByName(name) for name in interface_names ] ) )
        atoms = data.getAtoms( cutoff=cutoff,interfaceIds=interface_ids )
        return json.dumps( atoms )
    @expose
    def get_structure_atoms( self, dataset, structure_name, **kwargs ):
        tmp_file = named_tmp_file( dataset.data )
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
        tmp_file = named_tmp_file( dataset.data )
        mp = membran_plane.Mplanes(tmp_file.name)
        def f(p):
            return map( list, (p.a, p.b, p.c) )
        return json.dumps( ( f(mp.plane1), f(mp.plane2), mp.distance() ) )

class Gromacs( Text ):
    file_ext = 'gro'
    
class Ndx( Text ):
    """Gromacs atom index files"""
    file_ext = 'ndx'
    def parse_ndx( self, ndx ):
        ndx_dict = odict()
        index_group = ''
        for line in ndx.split('\n'):
            if line.startswith('['):
                index_group = line.strip(' []\n\r')
                ndx_dict[ index_group ] = []
            elif line.strip():
                ndx_dict[ index_group ] += line.split()
        return ndx_dict
    @expose
    def get_json_ndx( self, dataset, **kwargs ):
        ndx_dict = self.parse_ndx( dataset.data )
        return json.dumps( zip( ndx_dict.keys(), ndx_dict.values() ) )

class JmolScript( Text ):
    file_ext = 'jspt'

class Ccp4( Binary ):
    file_ext = 'ccp4'

class JmolVoxel( Text ):
    file_ext = 'jvxl'

class Map( Binary ):
    file_ext = 'map'

class MrcDensityMap( Text ):
    file_ext = 'mrc'

class Obj( Text ):
    """Wavefront 3D objects"""
    file_ext = 'obj'

class Cif( Text ):
    file_ext = 'cif'

class MmCif( Text ):
    file_ext = 'mmcif'

class Cube( Text ):
    file_ext = 'cub'

class Msms( Text ):
    file_ext = 'vert'

class Tmhelix( Text ):
    file_ext = 'tmhelix'
    @expose
    def get_tm_helices( self, dataset, **kwargs ):
        tmp_file = named_tmp_file( dataset.data )
        from MembraneProtein.AndreanTools.parse_tm import get_tm_helices
        return json.dumps( get_tm_helices( tmp_file.name ) )
        
class Hbx( Text ):
    file_ext = 'anal'
    @expose
    def get_hbonds( self, dataset, **kwargs ):
        tmp_file = named_tmp_file( dataset.data )
        from MembraneProtein.HBexplore import parse_hbx_anal_output, get_hbonds_list
        return json.dumps( get_hbonds_list( parse_hbx_anal_output( tmp_file.name ) ) )

class VoronoiaVolume( Text ):
    file_ext = 'vol'
    def parse_vol( self, data ):
        tmp_file = named_tmp_file( data )
        vol = VolParser.VolParser( tmp_file.name )
        self.options = Voronoia.get_options()
        self.options['discard_surface'] = False
        self.options['bfactor'] = 'packdens'
        #self.options['bfactor'] = 'zscore'
        self.options['atomtyping'] = 'native'
        self.options['reference_file'] = Voronoia.INSTALL_DIR +'data'+os.sep+"avg_scop_native.avg"
        vol.parse_vol_file( self.options )
        return vol
    @expose
    def get_cavities( self, dataset, **kwargs ):
        vol = self.parse_vol( dataset.data )
        return vol.get_cavities()
    @expose
    def get_atoms( self, dataset, **kwargs ):
        """
        ["A", -3, "GLN", "N", 0.21612130885873901, 13.539999999999999, 49.109999999999999, 62.649999999999999, 1, 0, []]
        chain_id, residue_number, residue_type, atom_type, packing_density, vdw_volume, solv_ex_volume, total_volume, surface, cavity_nb, cavities
        """
        vol = self.parse_vol( dataset.data )
        return json.dumps( [ atom[0:11] for atom in vol.atoms ] )
    @expose
    def get_pdb( self, dataset, **kwargs ):
        vol = self.parse_vol( dataset.data )
        tmp_file = NamedTemporaryFile()
        vol.write_pdb_file( tmp_file.name, self.options )
        tmp_file.flush()
        return tmp_file.read()

class Xplor( Text ):
    file_ext = 'xplor'


class Xyzr( Text ):
    file_ext = 'xyzr'


class Xyzrn( Text ):
    file_ext = 'xyzrn'


extension_to_datatype_dict = {
    'anal': Hbx(),
    'bin': Binary(),
    'ccp4': Ccp4(),
    'cif': Cif(),
    'cub': Cube(),
    'dat': Data(),
    'dx': Dx(),
    'ent': Ent(),
    'gro': Gromacs(),
    'jspt': JmolScript(),
    'jvxl': JmolVoxel(),
    'map': Map(),
    'mbn': Mbn(),
    'mmcif': MmCif(),
    'mol': Mol(),
    'mplane': Mplane(),
    'mrc': MrcDensityMap(),
    'ndx': Ndx(),
    'obj': Obj(),
    'pdb': Pdb(),
    'pqr': Pqr(),
    'sco': Sco(),
    'sdf': Sdf(),
    'tmhelix': Tmhelix(),
    'txt': Text(),
    'vert': Msms(),
    'vol': VoronoiaVolume(),
    'xplor': Xplor(),
    'xyzr': Xyzr(),
    'xyzrn': Xyzrn()
}