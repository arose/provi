#!/usr/bin/env python

import sys, re, logging
from paste import httpserver
from webob import Request, Response
from webob import exc
import threading
from provi.framework import base
import json
import beaker.middleware

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
    def __init__( self, datatype ):
        pass
    
class GalaxyDataProvider( DataProvider ):
    def __init__( self, datatype, hda_id=None ):
        pass
    def __retrieve( self ):
        # get from galaxy instance
        pass

class FileDataProvider( DataProvider ):
    def __init__( self, datatype, data=None ):
        pass

class LocalDataProvider( DataProvider ):
    def __init__( self, datatype, file_path=None ):
        pass
    def __retrieve( self ):
        # read from local path
        pass


class BaseController( object ):
    def __init__( self, app ):
        """Initialize an interface for the application 'app'"""
        self.app = app


from provi.framework import expose
class DataController( BaseController ):
    valid_providers = {
        'galaxy': GalaxyDataProvider,
        'file': FileDataProvider,
        'local': LocalDataProvider
    }
    
    @expose
    def index( self, trans, **kwargs ):
        print str( trans )
        LOG.debug( str(kwargs) )
        return 'data storage %s' % str( trans.storage.data_dict )
    
    @expose
    def get( self, trans, id ):
        data = trans.storage.get( int(id) )
        return 'get data with id %s: %s' % ( id, str(data) )
    
    @expose
    def add( self, trans, datatype, provider, **kwargs ):
        data_provider = self.valid_providers[provider]( datatype, **kwargs )
        id = trans.storage.add( data_provider )
        
        return 'added id: %s' % str(id)


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
    
    


