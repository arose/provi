#!/usr/bin/env python

from __future__ import with_statement

import sys, re, logging, os
import os.path
import re
import cookielib, urllib2
from paste import httpserver
from paste.deploy.converters import asbool
from webob import Request, Response
from webob import exc
import threading
from provi.framework import base
import simplejson as json
import beaker.middleware

from provi.utils import boolean
from provi.framework import expose
from provi.data import Dataset


logging.basicConfig( level=logging.DEBUG )
LOG = logging.getLogger('provi')
LOG.setLevel( logging.DEBUG )

JMOL_PATH = "/Users/alexrose/Documents/uni/charite/development/contrib/Jmol/"

import threading

class DataStorage(object):
    def __init__( self ):
        self.lock = threading.Lock()
        self.count = 2
        self.data_dict = {}
        
    def add( self, data ):
        self.lock.acquire()
        count = self.count
        self.count += 1
        self.lock.release()
        self.data_dict[ count ] = data
        LOG.debug('DATA ID %s' % count)
        return count
    
    def get( self, id ):
        return self.data_dict[id]


class DataProvider(object):
    def __init__( self, trans, datatype, data, name=None, extra_data={} ):
        self.dataset = Dataset( data, name=name, type=datatype, extra_data=extra_data )
        self.datatype = self.dataset.type
    def get_data( self, name=None ):
        if name:
            try:
                return self.dataset.extra_data[ name ]
            except Exception:
                return self.dataset.data
        else:
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
    def __init__( self, trans, datatype, filepath, filename, extra_files={} ):
        data = self._retrieve( filepath, filename )
        extra_data = {}
        for name, extra_filename in extra_files.iteritems():
            extra_data[ name ] = self._retrieve( filepath, extra_filename )
        DataProvider.__init__( self, trans, datatype, data, name=filename, extra_data=extra_data )
    def _retrieve( self, filepath, filename ):
        # read from local path
        fp = open( os.path.join( filepath, filename ) )
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
    def dataset_list( self, trans, directory_name=None ):
        if not directory_name:
            directory_name = trans.app.config.example_directories.iterkeys().next()
        dirpath = trans.app.config.example_directories[ directory_name ]
        l = len(dirpath)
        file_list = []
        for path, directories, files in os.walk( dirpath ):
            for file in files:
                if not file.startswith('.') and not (file.startswith('#') and file.endswith('#')):
                    file_list.append( os.path.join( path[l:], file ) )
        file_list.sort()
        return json.dumps( {'file_list': file_list, 'directory_name': directory_name} )
    @expose
    def dataset_list2( self, trans, directory_name=None, path='' ):
        if not directory_name:
            directory_name = trans.app.config.example_directories.iterkeys().next()
        dirpath = trans.app.config.example_directories[ directory_name ] + path
        l = len(dirpath)
        jstree = []
        for file in os.listdir( dirpath ):
            if not file.startswith('.') and not (file.startswith('#') and file.endswith('#')):
                if os.path.isfile(os.path.join(dirpath, file)):
                    jstree.append({
                        'data': {
                            'title': '<span>' + file + '</span>'
                        },
                        'metadata': {
                            'file': file,
                            'path': path + file,
                        }
                    })
                else:
                    jstree.append({
                        'data': {
                            'title': '<span>' + file + '</span>'
                        },
                        'metadata': {
                            'path': path + file + '/',
                            'dir': True
                        },
                        'attr': {
                            'id': path + file + '/'
                        },
                        'state': 'closed'
                    })
        #jstree.sort()
        return json.dumps( jstree )
    @expose
    def directory_list( self, trans ):
        dirs = trans.app.config.example_directories.keys()
        dirs.sort()
        return json.dumps( dirs )
    @expose
    def import_example( self, trans, directory_name, filename, datatype=None, extra_files={} ):
        data_controller = DataController( self.app )
        filepath = trans.app.config.example_directories[ directory_name ]
        if extra_files:
            try:
                extra_files = dict( [ f.split(':') for f in extra_files.split(',') ] )
            except Exception:
                extra_files = {}
        else:
            extra_files = {}
        return data_controller.add(
            trans, datatype, 'example', filepath=filepath, filename=filename,
            extra_files=extra_files
        )


class SaveController( BaseController ):
    @expose
    def index( self, trans ):
        return 'foo'
    def decode( self, data, encoding ):
        if encoding == 'base64':
            from base64 import b64decode
            data = b64decode( data )
        return data
    @expose
    def download( self, trans, name, data, type='application/download', encoding=None ):
        data = self.decode( data, encoding )
        trans.response.set_content_type( type )
        trans.response.headers[ "Content-Disposition" ] = "attachment; filename=%s" % name
        return data
    @expose
    def galaxy_import( self, trans, id, **kwargs ):
        # not secure
        file = os.path.join( trans.app.config.galaxy_import_dir, id )
        fh = open( file )
        data = fh.read()
        fh.close()
        os.remove( file )
        return data
    @expose
    def galaxy( self, trans, name, data, type=None, encoding=None ):
        data = self.decode( data, encoding )
        
        import tempfile
        foo, filename = tempfile.mkstemp( prefix="galaxy_import_", dir=trans.app.config.galaxy_import_dir )
        fh = open( filename, 'w' )
        fh.write( data )
        fh.close()
        
        from poster.encode import multipart_encode
        from poster.streaminghttp import register_openers
        opener = register_openers()
        opener.add_handler( urllib2.HTTPCookieProcessor( trans.cookiejar ) )
        opener.add_handler( urllib2.ProxyHandler({}) )
        params = {
            'tool_id': 'provi_import',
            'URL': '%s/save/galaxy_import/?id=%s' % (trans.app.config.provi_url, os.path.basename(filename) ),
            'NAME': name,
            'URL_method': 'post'
        }
        print params
        # headers contains the necessary Content-Type and Content-Length
        # datagen is a generator object that yields the encoded parameters
        datagen, headers = multipart_encode( params )
        # Create the Request object
        request = urllib2.Request( '%s/tool_runner' % (trans.app.config.galaxy_url), datagen, headers)
        # Actually do the request, and get the response
        opener.open(request).read()
    @expose
    def local( self, trans, name, data, directory_name, type=None, encoding=None, append=False ):
        data = self.decode( data, encoding )
        filepath = trans.app.config.example_directories[ directory_name ]
        mode = 'a' if boolean(append) else 'w'
        LOG.debug( append + ' ' + mode )
        fh = open( os.path.join( filepath, name ), mode )
        fh.write( data )
        fh.close()


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
        try:
            return opener.open( url ).read()
        except:
            return ''
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
            #print galaxysession
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
    def get( self, trans, id, data_action=None, dataname=None, **kwargs ):
        data_provider = trans.storage.get( int(id) )
        if not data_action:
            return data_provider.get_data( dataname )
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
        #LOG.debug( trans.environ )
        LOG.debug( trans.environ['HTTP_COOKIE'] )
        if 'beaker.session' in trans.environ:
            LOG.debug( trans.environ['beaker.session'] )
            #LOG.debug( trans.environ['beaker.get_session']() )
        else:
            LOG.debug( 'NO BEAKER.SESSION' )
        id = trans.storage.add( data_provider )
        dataset = data_provider.dataset
        return json.dumps({
            'id': id,
            'type': dataset.type.file_ext,
            'status': 'Ok'
        })


class JmolController( BaseController ):
    def __init__( self, app, jmol_dir ):
        """Initialize an interface for the jmol applet serving 'app'"""
        self.app = app
        self.jmol_dir = jmol_dir
    @expose
    def index( self, trans, version='current', flag=None, filename='' ):
        file_path = os.path.join( self.jmol_dir, version, filename )
        return open( file_path ).read()


class AppController( BaseController ):
    def __init__( self, app, app_dir ):
        """Initialize an interface for the app serving 'app'"""
        self.app = app
        self.app_dir = app_dir
    @expose
    def index( self, trans, app='', **kwd ):
        file_path = os.path.join( self.app_dir, app )
        return open( file_path ).read()


class JmolCalculateController( BaseController ):
    def __init__( self, app, tmp_dir ):
        """"""
        self.app = app
        self.tmp_dir = tmp_dir
    def session_id( self, trans ):
        cookie_dict = {}
        for cookie in trans.environ['HTTP_COOKIE'].split('\n'):
            name, value = cookie.split('=')
            cookie_dict[name] = value
        LOG.debug( cookie_dict )
        return cookie_dict[ 'provisessionX' ]
    def prepare( self, data, session_id ):
        base_url = 'http://127.0.0.1:7272/data/get/?'
        data = data.replace( base_url, '%ssession_id=%s&' % (base_url, session_id) )
        data = data.replace( 'resolution 1.0', 'resolution 3.0' )
        return data
    def calculate( self, state, session_id ):
        session_dir = os.path.join( self.tmp_dir, session_id )
        if not os.path.isdir( session_dir ):
            os.mkdir( session_dir )
        state_file = os.path.join( session_dir, 'state.jspt' )
        with open( state_file, 'w' ) as state_fh:
            state_fh.write( state )
        image_file = os.path.join( session_dir, 'image.jpg' )
        self.jmol( state_file, image_file )
    def jmol( self, state_file, image_file ):
        template = '' + \
            'script "%(state_file)s";' + \
            'write image jpg "%(image_file)s";' + \
            ''
        tpl_fh = self._template_file( template, {
            "state_file": state_file,
            "image_file": image_file
        })
        cmd_string = [
            'java', '-jar', '-Xmx2048M',
            JMOL_PATH + 'JmolPre.jar', '-ionxLt',
            '-s', tpl_fh.name,
            '-g', '2048x2048'
        ]
        self._run( ' '.join(cmd_string) )
    def _template_file( self, template, values, suffix='' ):
        import tempfile
        fh = tempfile.NamedTemporaryFile(suffix=suffix)
        fh.write( template % values )
        fh.seek(0)
        return fh
    def _run( self, program, stdout=None ):
        from subprocess import Popen, PIPE
        command="(/usr/bin/time  %s) 2>&1" % program
        p = Popen( command, shell=True, stdin=PIPE, stdout=PIPE, close_fds=True )
        f_in, f_out = p.stdin, p.stdout
        line = f_out.readline()
        out = f_out.readlines()
        if stdout:
            with open( stdout, 'w' ) as f:
                f.write( '\n'.join(out) )
        words = out[-1].split()
        exec_time = float( words[0] )
        LOG.debug( exec_time )
        return exec_time, out
    @expose
    def index( self, trans, data ):
        session_id = self.session_id( trans )
        state = self.prepare( data, session_id )
        LOG.debug( 'JMOL PREPARED DATA: %s' % data )
        self.calculate( state, session_id )


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
        
        from pprint import pformat
        LOG.debug( pformat(environ['PATH_INFO'] + '?' + environ['QUERY_STRING']) )
        
        base.DefaultWebTransaction.__init__( self, environ )
        self.__init_storage()
        self.__init_cookiejar()
        
    def __init_storage(self):
        #if 'storage' in self.environ['beaker.session']:
        if 'storage' in self.session:
            pass
        else:
            self.session['storage'] = DataStorage()
        self.storage = self.session['storage']
    
    def __init_cookiejar(self):
        #if 'cookiejar' in self.environ['beaker.session']:
        if 'cookiejar' in self.session:
            pass
        else:
            self.session['cookiejar'] = cookielib.CookieJar()
        self.cookiejar = self.session['cookiejar']



def app_factory( global_conf, **kwargs ):
    conf = global_conf.copy()
    conf.update(kwargs)
    
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
    
    webapp.add_controller( 'Save', SaveController(webapp) )
    webapp.add_route('/save/:action/', controller='Save', action='index')
    
    webapp.add_controller( 'Jmol', JmolController(webapp, conf.get('jmol_dir') ) )
    webapp.add_route('/jmol/:version/:flag/:filename', controller='Jmol', action='index', version='current', flag=None, filename='')
    
    webapp.add_controller( 'JmolCalculate', JmolCalculateController(webapp, conf.get('web_tmp_dir')) )
    webapp.add_route('/calculate/jmol/', controller='JmolCalculate', action='index')
    
    webapp = wrap_in_middleware( webapp, global_conf, **kwargs )
    webapp = wrap_in_static( webapp, global_conf, **kwargs )
    
    from paste.deploy.config import ConfigMiddleware
    webapp = ConfigMiddleware( webapp, global_conf )
    
    return webapp

class GetSessionMiddleware( object ):
    def __init__( self, app, conf ):
        self.app = app
        self.conf = conf
    def __call__( self, environ, start_response ):
        query_dict = {}
        if environ['QUERY_STRING']:
            for param in environ['QUERY_STRING'].split('&'):
                LOG.debug( param )
                if param:
                    name, value = param.split('=')
                    query_dict[name] = value
        LOG.debug( environ['QUERY_STRING'] )
        LOG.debug( query_dict )
        if 'session_id' in query_dict:
            environ['HTTP_COOKIE'] = 'provisessionX=%s' % query_dict['session_id']
        return self.app(environ, start_response)

def wrap_in_middleware( app, global_conf, **local_conf  ):
    conf = global_conf.copy()
    conf.update(local_conf)
    
    debug = asbool( conf.get( 'debug', False ) )
    
    app = beaker.middleware.SessionMiddleware( app, conf )
    
    app = GetSessionMiddleware( app, conf )
    
    #from paste.translogger import TransLogger
    #app = TransLogger( app, conf )
    
    from paste import httpexceptions
    app = httpexceptions.make_middleware( app, conf )
    
    if debug:
        from paste.debug import prints
        app = prints.PrintDebugMiddleware( app, conf )
    
    if debug and asbool( conf.get( 'use_interactive', False ) ):
        # Interactive exception debugging, scary dangerous if publicly
        # accessible, if not enabled we'll use the regular error printing
        # middleware.
        from weberror import evalexception
        app = evalexception.EvalException( app, conf )
        LOG.debug( "Enabling 'eval exceptions' middleware" )
    else:
        # Not in interactive debug mode, just use the regular error middleware
        from paste.exceptions import errormiddleware
        app = errormiddleware.ErrorMiddleware( app, conf )
        LOG.debug( "Enabling 'error' middleware" )
    
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
    # Hack to serve some static html files via dynamic app to get a session
    html_app = WebApplication( ProteinViewerApplication( **local_conf ) )
    html_app.add_controller( 'App', AppController(html_app, conf.get('app_dir')) )
    html_app.add_route('/:app', controller='App', action='index', app='provi.html')
    html_app = beaker.middleware.SessionMiddleware( html_app, conf )
    urlmap["/static/html"] = html_app
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
        self.provi_url = kwargs.get( 'provi_url', 'http://localhost:7070' )
        self.galaxy_import_dir = kwargs.get( 'galaxy_import_dir' )
        self.example_directories = {}
        for name_path in kwargs.get( 'example_directories', '' ).replace('\n','').split(','):
            name, path = name_path.split(':')
            if not path.endswith('/'): path += '/'
            self.example_directories[name] = path
    def get( self, key, default ):
        return self.config_dict.get( key, default )

