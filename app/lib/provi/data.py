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
import threading
import csv

import math
import numpy

# from MembraneProtein.AndreanTools import contact
# from MembraneProtein.AndreanTools import membran_neu
# # from MembraneProtein.AndreanTools import membran_plane
# from MembraneProtein import HBexplore

# from Bio.PDB.PDBParser import PDBParser
from provi.framework import expose

# try:
#     from voronoia import VolParser, Voronoia
# except:
#     from Voronoia import VolParser, Voronoia

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
        self.lock = threading.Lock()
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
    def update( self, extra_data ):
        self.lock.acquire()
        self.extra_data.update( extra_data )
        self.lock.release()


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

class Dcd( Binary ):
    """Dcd datatype"""
    file_ext = 'dcd'
    # todo: dataset.data a pointer - sort of
    def get_trj( self, dataset ):
        pass
    def set_psf( self, dataset ):
        pass
    def _init_universe( self, dataset ):
        pass

class Psf( Text ):
    """Psf datatype"""
    file_ext = 'psf'
    pass

class Sdf( Data ):
    """Sdf datatype"""
    file_ext = 'sdf'
    pass

class Mol( Data ):
    """MOL datatype"""
    file_ext = 'mol'
    pass

class Jmol( Binary ):
    """Jmol datatype"""
    file_ext = 'jmol'

class Png( Binary ):
    """Png with Jmol datatype"""
    file_ext = 'png'

class AtomProperty( Text ):
    """Atom property datatype"""
    file_ext = 'atmprop'

class AtomSelection( Text ):
    """Atom selection datatype"""
    file_ext = 'atmsele'

class Pdb( Text ):
    """PDB"""
    file_ext = 'pdb'
    # def get_structure( self, dataset ):
    #     tmp_file = named_tmp_file( dataset.data )
    #     parser = PDBParser()
    #     struc = parser.get_structure( 'structure', tmp_file.name )
    #     return struc
    
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

# class ScoBase( Text ):
#     file_ext = None
#     data_class = None
#     @expose
#     def get_pdb( self, dataset, **kwargs ):
#         tmp_file = named_tmp_file( dataset.data )
#         return self.data_class(tmp_file.name).get_pdb()
#         #return self.data_class(tmp_file.name).getPdb()
#     @expose
#     def get_helix_interface_names( self, dataset, **kwargs ):
#         tmp_file = named_tmp_file( dataset.data )
#         data = self.data_class(tmp_file.name)
#         #return json.dumps( data.getInterfaceNames('helix') )
#         return json.dumps( data.getInterfaceNames() )
#     @expose
#     def get_helix_interface_atoms( self, dataset, cutoff=1.5, interface_ids='', interface_names='', **kwargs ):
#         if interface_ids:
#             interface_ids = [int(x) for x in interface_ids.split(',')]
#         else:
#             interface_ids = []
#         tmp_file = named_tmp_file( dataset.data )
#         data = self.data_class(tmp_file.name)
#         if interface_names:
#             interface_names = [ x.strip() for x in interface_names.split(',') if len(x.strip()) < 30 ]
#             # flatten
#             interface_ids.extend( itertools.chain( * [ data.getInterfaceIdByName(name) for name in interface_names ] ) )
#         atoms = data.getAtoms( cutoff=cutoff,interfaceIds=interface_ids )
#         return json.dumps( atoms )
#     @expose
#     def get_structure_atoms( self, dataset, structure_name, **kwargs ):
#         tmp_file = named_tmp_file( dataset.data )
#         data = self.data_class(tmp_file.name)
#         return json.dumps( data.getStructureAtoms( structure_name ) )
#     @expose
#     def get_probe_radius( self, dataset, structure_name, **kwargs ):
#         tmp_file = named_tmp_file( dataset.data )
#         data = self.data_class(tmp_file.name)
#         return data.probeRadius

# class Sco ( ScoBase ):
#     file_ext = 'sco'
#     data_class = contact.sco

# class Mbn( ScoBase ):
#     file_ext = 'mbn'
#     data_class = membran_neu.mbn

class Mplane( Text ):
    file_ext = 'mplane'
    def distance(self, planes):
        p1 = map( numpy.array, planes[0] )
        p2 = map( numpy.array, planes[1] )
        # http://softsurfer.com/Archive/algorithm_0104/algorithm_0104.htm
        # http://mathworld.wolfram.com/Point-PlaneDistance.html
        n = numpy.cross( p1[1]-p1[0], p1[2]-p1[0] )
        p0 = p2[0]
        v0 = p1[0]
        dist = numpy.abs( numpy.dot( (p0-v0), n )/self.vec_mag(n) )
        if numpy.isnan(dist):
            return 0
        else:
            return dist
    def vec_mag( self, v ):
        return math.sqrt( v[0]**2 + v[1]**2 + v[2]**2 )
    @expose
    def get_planes( self, dataset, **kwargs ):
        line = dataset.data.splitlines()[0]
        planes = []
        for plane in line[ line.find(": {")+2: ].split(":::"):
            points = []
            for point in re.split( "}\s+{", plane.strip(" {}") ):
                points.append([ float( p.strip() ) for p in point.split(",") ])
            planes.append( points )
        return json.dumps( planes + [ self.distance(planes) ] )
    # def get_planes_OLD( self, dataset, **kwargs ):
    #     tmp_file = named_tmp_file( dataset.data )

    #     mp = membran_plane.Mplanes(tmp_file.name)
    #     def f(p):
    #         return map( list, (p.a, p.b, p.c) )
    #     return json.dumps( ( f(mp.plane1), f(mp.plane2), mp.distance() ) )

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
    file_ext = 'cube'

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
    def get_neighbours( self, dataset, **kwargs ):
        vol = self.parse_vol( dataset.data )
        return json.dumps(vol.cavities)
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
        return json.dumps( [] )
        # vol = self.parse_vol( dataset.data )
        # return json.dumps( [ atom[0:11]+[i] for i, atom in enumerate(vol.atoms) ] )
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


class Csv( Text ):
    file_ext = 'csv'
    @expose
    def get_json( self, dataset, **kwargs ):
        csvReader = csv.reader( dataset.data.split('\n'), delimiter=',' )
        d = [line for line in csvReader]
        print d
        return json.dumps( d )


class Json( Text ):
    file_ext = 'json'
    @expose
    def get_json( self, dataset, **kwargs ):
        return json.dumps( dataset.data )

    
class Prop( Json ):
    file_ext = 'prop'
        # csvReader = csv.DictReader( dataset.data.split('\n'), delimiter=',' )
        # prop_dict = {}
        # for line in csvReader:
        #     prop_dict[ line['AA'] ] = line
        # #print prop_dict
        # return json.dumps( prop_dict )


class Provi( Json ):
    file_ext = 'provi'


class Bonds( Text ):
    file_ext = 'bonds'

class Features( Text ):
    file_ext = 'features'

class Fasta( Text ):
    file_ext = 'fasta'

class Tmalign( Text ):
    file_ext = 'tmalign'


extension_to_datatype_dict = {
    'anal': Hbx(),
    'atmprop': AtomProperty(),
    'atmsele': AtomSelection(),
    'bin': Binary(),
    'bonds': Bonds(),
    'ccp4': Ccp4(),
    'cif': Cif(),
    'csv': Csv(),
    'cube': Cube(),
    'dat': Data(),
    'dx': Dx(),
    'ent': Ent(),
    'fa': Fasta(),
    'fasta': Fasta(),
    'features': Features(),
    'feat': Features(),
    'gro': Gromacs(),
    'jmol': Jmol(),
    'json': Json(),
    'jspt': JmolScript(),
    'jvxl': JmolVoxel(),
    'map': Map(),
    #'mbn': Mbn(),
    'mmcif': MmCif(),
    'mol': Mol(),
    'mol2': Mol(),
    'mplane': Mplane(),
    'mrc': MrcDensityMap(),
    'ndx': Ndx(),
    'obj': Obj(),
    'pdb': Pdb(),
    'png': Png(),
    'pqr': Pqr(),
    'prop': Prop(),
    'provi': Provi(),
    #'sco': Sco(),
    'sdf': Sdf(),
    'tmalign': Tmalign(),
    'tmhelix': Tmhelix(),
    'txt': Text(),
    'vert': Msms(),
    #'vol': VoronoiaVolume(),
    'xplor': Xplor(),
    'xyzr': Xyzr(),
    'xyzrn': Xyzrn()
}