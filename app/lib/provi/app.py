#!/usr/bin/env python

import sys, re, logging
import cookielib, urllib2
from paste import httpserver
from webob import Request, Response
from webob import exc
import threading
from provi.framework import base
import simplejson as json
import beaker.middleware

from provi.framework import expose
from provi.data import Dataset


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
    def __init__( self, trans, datatype, data, name=None ):
        self.dataset = Dataset( data, name=name, type=datatype )
        self.datatype = self.dataset.type
    def get_raw_data( self ):
        return self.dataset.data
    
    
class GalaxyDataProvider( DataProvider ):
    def __init__( self, trans, datatype, hda_id=None, name=None, filename='' ):
        data = self._retrieve( trans, hda_id, filename )
        DataProvider.__init__( self, trans, datatype, data, name=name )
    def _retrieve( self, trans, hda_id, filename ):
        # get from galaxy instance
        opener = urllib2.build_opener( urllib2.HTTPCookieProcessor( trans.cookiejar ), urllib2.ProxyHandler({}) )
        return opener.open( '%s/datasets/%s/display/%s/?preview=0' % (trans.app.config.galaxy_url, hda_id, filename) ).read()


class FileDataProvider( DataProvider ):
    def __init__( self, trans, datatype, data=None, name=None ):
        DataProvider.__init__( self, trans, datatype, data, name=name )


class UrlDataProvider( DataProvider ):
    def __init__( self, trans, datatype, url=None, name=None ):
        data = self._retrieve( trans, url )
        DataProvider.__init__( self, trans, datatype, data, name=name )
    def _retrieve( self, trans, url ):
        if( '127.0.0.1' in url or 'localhost' in url ):
            opener = urllib2.build_opener()
        else:
            opener = urllib2.build_opener( urllib2.ProxyHandler({'http': 'proxy.charite.de:888'}) )
        return opener.open( url ).read()


class LocalDataProvider( DataProvider ):
    def __init__( self, trans, datatype, file_path=None ):
        data = self._retrieve( hda_id )
        DataProvider.__init__( self, trans, datatype, data )
    def _retrieve( self, file_path ):
        # read from local path
        fp = open( file_path )
        data = fp.read()
        fp.close()
        return data


class ExampleDataProvider( DataProvider ):
    def __init__( self, trans, datatype, filename=None ):
        data = self._retrieve( filename )
        DataProvider.__init__( self, trans, datatype, data )
    def _retrieve( self, filename ):
        # read from local path
        fp = open( os.path.join( trans.environ['paste.config']['here'], 'data', filename ) )
        data = fp.read()
        fp.close()
        return data


class BaseController( object ):
    def __init__( self, app ):
        """Initialize an interface for the application 'app'"""
        self.app = app


class ExampleController( BaseController ):
    @expose
    def index( self, trans ):
        return 'foo'
    @expose
    def example_list( self, trans ):
        trans.response.set_content_type('text/xml')
        return self.get( trans, 'http://127.0.0.1:9090/history/list_as_xml/' )
    @expose
    def import_example( self, trans, id ):
        data_controller = DataController( self.app )
        return data_controller.add( trans, datatype, 'example', filename=filename )

class PluploadController( BaseController ):
    @expose
    def index( self, trans, datatype, provider, chunk=None, chunks=None, name="" ):
        name = re.sub('/[^\w\._]+/', '', name)
        env = trans.environ
        if 'HTTP_CONTENT_TYPE' in env:
            content_type = env['HTTP_CONTENT_TYPE']
        if 'CONTENT_TYPE' in env:
            content_type = env['CONTENT_TYPE']
        data = env['wsgi.input'].read()
        data_controller = DataController( self.app )
        return data_controller.add( trans, datatype, provider, name=name, data=data )

class GalaxyController( BaseController ):
    def get( self, trans, url ):
        opener = urllib2.build_opener( urllib2.HTTPCookieProcessor( trans.cookiejar ), urllib2.ProxyHandler({}) )
        return opener.open( url ).read()
    @expose
    def index( self, trans ):
        return 'foo'
    @expose
    def dataset_list( self, trans ):
        trans.response.set_content_type('text/xml')
        return self.get( trans, '%s/root/history/?as_xml=1' % (trans.app.config.galaxy_url) )
    @expose
    def history_list( self, trans ):
        trans.response.set_content_type('text/xml')
        return self.get( trans, '%s/history/list_as_xml/' % (trans.app.config.galaxy_url) )
    @expose
    def switch_history( self, trans, history_id ):
        return self.get( trans, '%s/history/list/?operation=switch&id=%s' % (trans.app.config.galaxy_url, history_id) )
    @expose
    def login( self, trans, email='alexander.rose@weirdbyte.de', password='foobar', galaxysession=None ):
        if galaxysession:
            print galaxysession
            from urlparse import urlparse
            url = urlparse( trans.app.config.galaxy_url )
            # the port must be a string!!!
            c = cookielib.Cookie(None, 'galaxysession', galaxysession, str(url.port), True, url.hostname, True, False, '/', True, None, None, True, None, None, None)
            trans.cookiejar.set_cookie( c )
            return
        else:
            return self.get( trans, '%s/user/login/?login_button=1&email=%s&password=%s' % (trans.app.config.galaxy_url, email, password) )
    @expose
    def import_dataset( self, trans, id, name, filename='', datatype=None ):
        data_controller = DataController( self.app )
        return data_controller.add( trans, datatype, 'galaxy', hda_id=id, name=name, filename=filename )

class UrlLoadController( BaseController ):
    @expose
    def index( self, trans, url, name='', datatype='' ):
        data_controller = DataController( self.app )
        return data_controller.add( trans, datatype, 'url', url=url, name=name )


class DataController( BaseController ):
    valid_providers = {
        'galaxy': GalaxyDataProvider,
        'file': FileDataProvider,
        'local': LocalDataProvider,
        'url': UrlDataProvider,
        'example': ExampleDataProvider
    }
    
    @expose
    def index( self, trans, **kwargs ):
        return 'data storage %s' % str( trans.storage.data_dict )
    
    @expose
    def get( self, trans, id, data_action=None, **kwargs ):
        data_provider = trans.storage.get( int(id) )
        if not data_action:
            return data_provider.get_raw_data()
        datatype = data_provider.datatype
        method = getattr( datatype, data_action, None )
        if method is None:
            raise httpexceptions.HTTPNotFound( "No action for " + path_info )
        # Is the method exposed
        if not getattr( method, 'exposed', False ): 
            raise httpexceptions.HTTPNotFound( "Action not exposed for " + path_info )
        # Is the method callable
        if not callable( method ):
            raise httpexceptions.HTTPNotFound( "Action not callable for " + path_info )
        return method( data_provider.dataset, **kwargs )
    
    @expose
    def add( self, trans, datatype, provider, **kwargs ):
        data_provider = self.valid_providers[provider]( trans, datatype, **kwargs )
        id = trans.storage.add( data_provider )
        dataset = data_provider.dataset
        return json.dumps({
            'id': id,
            'type': dataset.type.file_ext,
            'status': 'Ok'
        })


class ProteinViewerApplication( object ):
    def __init__( self, **kwargs ):
        self.config = Configuration( **kwargs )


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
        self.__init_cookiejar()
        
    def __init_storage(self):
        if 'storage' in self.environ['beaker.session']:
            pass
        else:
            self.session['storage'] = DataStorage()
        self.storage = self.session['storage']
    
    def __init_cookiejar(self):
        if 'cookiejar' in self.environ['beaker.session']:
            pass
        else:
            self.session['cookiejar'] = cookielib.CookieJar()
        self.cookiejar = self.session['cookiejar']



def app_factory( global_conf, **kwargs ):
    provi_app = ProteinViewerApplication( **kwargs )
    webapp = WebApplication( provi_app )
    
    webapp.add_controller( 'Data', DataController(webapp) )
    webapp.add_route('/data/:action/', controller='Data', action='index')
    
    webapp.add_controller( 'Example', ExampleController(webapp) )
    webapp.add_route('/example/:action/', controller='Example', action='index')
    
    webapp.add_controller( 'Plupload', PluploadController(webapp) )
    webapp.add_route('/plupload/:action/', controller='Plupload', action='index')
    
    webapp.add_controller( 'Galaxy', GalaxyController(webapp) )
    webapp.add_route('/galaxy/:action/', controller='Galaxy', action='index')
    
    webapp.add_controller( 'Url', UrlLoadController(webapp) )
    webapp.add_route('/urlload/:action/', controller='Url', action='index')
    
    webapp = wrap_in_middleware( webapp, global_conf, **kwargs )
    webapp = wrap_in_static( webapp, global_conf, **kwargs )
    
    from paste.deploy.config import ConfigMiddleware
    webapp = ConfigMiddleware( webapp, global_conf )
    
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
    print conf.get( "static_favicon_dir" )
    urlmap["/favicon.ico"] = Static( conf.get( "static_favicon_dir" ), cache_time )
    return urlmap
    
    
class Configuration( object ):
    def __init__( self, **kwargs ):
        self.config_dict = kwargs
        self.root = kwargs.get( 'root_dir', '.' )
        self.galaxy_url = kwargs.get( 'galaxy_url', 'http://localhost:9090' )
    def get( self, key, default ):
        return self.config_dict.get( key, default )

