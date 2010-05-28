#!/usr/bin/env python

import sys, re, logging
from paste import httpserver
from webob import Request, Response
from webob import exc
import threading
from provi.framework import base
import json
import beaker.middleware

from provi.framework import expose
from provi.data import Pdb


logging.basicConfig( level=logging.DEBUG )
LOG = logging.getLogger('provi')
LOG.setLevel( logging.DEBUG )



class DataStorage(object):
    def __init__( self ):
        self.count = 0
        self.data_dict = {}
        
    def add( self, data ):
        self.data_dict[ self.count ] = data
        self.count += 1
        return self.count - 1
    
    def get( self, id ):
        return self.data_dict[id]


class DataProvider(object):
    valid_types = {
        'pdb': Pdb,
    }
    def __init__( self, datatype, data ):
        self.raw_data = data
        self.type = self.valid_types[datatype]( data )
    def get_raw_data( self ):
        return self.raw_data
    
    
class GalaxyDataProvider( DataProvider ):
    def __init__( self, datatype, hda_id=None ):
        data = self._retrieve( hda_id )
        DataProvider.__init__( self, datatype, data )
    def _retrieve( self, hda_id ):
        # get from galaxy instance
        data = None
        return data


class FileDataProvider( DataProvider ):
    def __init__( self, datatype, data=None ):
        DataProvider.__init__( self, datatype, data )


class LocalDataProvider( DataProvider ):
    def __init__( self, datatype, file_path=None ):
        data = self._retrieve( hda_id )
        DataProvider.__init__( self, datatype, data )
    def _retrieve( self, file_path ):
        # read from local path
        fp = open( file_path )
        data = fp.read()
        fp.close()
        return data


class BaseController( object ):
    def __init__( self, app ):
        """Initialize an interface for the application 'app'"""
        self.app = app


class DataController( BaseController ):
    valid_providers = {
        'galaxy': GalaxyDataProvider,
        'file': FileDataProvider,
        'local': LocalDataProvider
    }
    
    @expose
    def index( self, trans, **kwargs ):
        return 'data storage %s' % str( trans.storage.data_dict )
    
    @expose
    def get( self, trans, id, data_action=None, **kwargs ):
        data_provider = trans.storage.get( int(id) )
        if not data_action:
            return data_provider.get_raw_data()
        datatype = data_provider.type
        method = getattr( datatype, data_action, None )
        if method is None:
            raise httpexceptions.HTTPNotFound( "No action for " + path_info )
        # Is the method exposed
        if not getattr( method, 'exposed', False ): 
            raise httpexceptions.HTTPNotFound( "Action not exposed for " + path_info )
        # Is the method callable
        if not callable( method ):
            raise httpexceptions.HTTPNotFound( "Action not callable for " + path_info )
        return method( **kwargs )
    
    @expose
    def add( self, trans, datatype, provider, **kwargs ):
        data_provider = self.valid_providers[provider]( datatype, **kwargs )
        id = trans.storage.add( data_provider )
        return str(id)


class ProteinViewerApplication( object ):
    # add config object
    pass


class WebApplication( base.WebApplication ):
    def __init__( self, provi_app  ):
        base.WebApplication.__init__( self )
        self.set_transaction_factory( lambda e: ProteinViewerWebTransaction( e, provi_app, self ) )


class ProteinViewerWebTransaction( base.DefaultWebTransaction ):
    """
    Encapsulates web transaction specific state for the Protein-viewer application
    """
    def __init__( self, environ, app, webapp ):
        self.app = app
        self.webapp = webapp
        self.environ = environ
        base.DefaultWebTransaction.__init__( self, environ )
        self.__init_storage()
        
    def __init_storage(self):
        if 'storage' in self.environ['beaker.session']:
            pass
        else:
            self.session['storage'] = DataStorage()
        self.storage = self.session['storage']


def app_factory( global_conf, **kwargs ):
    provi_app = ProteinViewerApplication()
    webapp = WebApplication( provi_app )
    
    webapp.add_controller( 'Data', DataController(webapp) )
    webapp.add_route('/data/:action/', controller='Data', action='index')
    
    webapp = wrap_in_middleware( webapp, global_conf, **kwargs )
    webapp = wrap_in_static( webapp, global_conf, **kwargs )
    
    return webapp


def wrap_in_middleware( app, global_conf, **local_conf  ):
    conf = global_conf.copy()
    conf.update(local_conf)
    
    app = beaker.middleware.SessionMiddleware( app, conf )
        
    #from paste.translogger import TransLogger
    #app = TransLogger( app, conf )
    
    from paste import httpexceptions
    app = httpexceptions.make_middleware( app, conf )
    
    from paste.debug import prints
    app = prints.PrintDebugMiddleware( app, conf )
    
    from weberror import evalexception
    app = evalexception.EvalException( app, conf )
    
    return app


def wrap_in_static( app, global_conf, **local_conf ):
    from paste.urlmap import URLMap
    from provi.middleware.static import CacheableStaticURLParser as Static
    urlmap = URLMap()
    # Merge the global and local configurations
    conf = global_conf.copy()
    conf.update(local_conf)
    # Get cache time in seconds
    cache_time = conf.get( "static_cache_time", None )
    if cache_time is not None:
        cache_time = int( cache_time )
    # Send to dynamic app by default
    urlmap["/"] = app
    # Define static mappings from config
    urlmap["/static"] = Static( conf.get( "static_dir" ), cache_time )
    urlmap["/favicon.ico"] = Static( conf.get( "static_favicon_dir" ), cache_time )
    return urlmap
    
    


