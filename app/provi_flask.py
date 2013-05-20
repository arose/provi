import os
import urllib2
import json
import StringIO
import tempfile
import functools
import uuid
import multiprocessing
import signal
import logging
import Queue
import threading
import time

from flask import Flask
from flask import send_from_directory
from flask import send_file
from flask import request, Request
from flask import make_response, Response
from flask import jsonify

from werkzeug import secure_filename


logging.basicConfig( level=logging.DEBUG )
LOG = logging.getLogger('provi')
LOG.setLevel( logging.DEBUG )



app = Flask(__name__)
app.config.from_pyfile('app.cfg')




############################
# utils
############################

def boolean(string):
    """
    interprets a given string as a boolean:
        * False: '0', 'f', 'false', 'no', 'off'
        * True: '1', 't', 'true', 'yes', 'on'
    
    >>> boolean('true')
    True
    >>> boolean('false')
    False
    """
    string = str(string).lower()
    if string in ['0', 'f', 'false', 'no', 'off']:
        return False
    elif string in ['1', 't', 'true', 'yes', 'on']:
        return True
    else:
        raise ValueError()

def decode( data, encoding ):
    if encoding == 'base64':
        from base64 import b64decode, decodestring
        try:
            # data = b64decode( data )
            data = decodestring( data )
        except Exception, e:
            print str(e)
    return data



############################
# cache control
############################

@app.after_request
def add_no_cache(response):
    response.cache_control.no_cache = True
    return response

def nocache(f):
    def new_func(*args, **kwargs):
        resp = make_response(f(*args, **kwargs))
        resp.cache_control.no_cache = True
        return resp
    return functools.update_wrapper(new_func, f)



############################
# basic auth
############################

def check_auth(username, password):
    """This function is called to check if a username /
    password combination is valid.
    """
    return username == 'test' and password == 'test'

def authenticate():
    """Sends a 401 response that enables basic auth"""
    return Response(
    'Could not verify your access level for that URL.\n'
    'You have to login with proper credentials', 401,
    {'WWW-Authenticate': 'Basic realm="Login Required"'})

# use as after a route decorator
def requires_auth(f):
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        if app.config['REQUIRE_AUTH']:
            auth = request.authorization
            if not auth or not check_auth(auth.username, auth.password):
                return authenticate()
        return f(*args, **kwargs)
    return decorated



############################
# static routes
############################

@app.route('/')
def hello_world():
    return 'Hello World!!!'

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(
        app.config['STATIC_DIR'], 'favicon.ico', 
        mimetype='image/vnd.microsoft.icon'
    )

@app.route('/static/<path:filename>')
@requires_auth
def static(filename):
    return send_from_directory( app.config['STATIC_DIR'], filename )

@app.route('/jmol/current/<int:flag>/<path:filename>')
def jmol(filename, flag):
    return send_from_directory( 
        os.path.join( app.config['STATIC_DIR'], 'applet/jmol/current/' ), 
        filename
    )

@app.route('/jalview/current/<int:flag>/<path:filename>')
def jalview(filename, flag):
    return send_from_directory( 
        os.path.join( app.config['STATIC_DIR'], 'applet/jalview/current/' ), 
        filename
    )



############################
# url data provider
############################

@app.route('/urlload/')
def urlload():
    url = request.args.get('url', '')
    print url
    if '127.0.0.1' in url or 'localhost' in url or not app.config['PROXY']:
        opener = urllib2.build_opener()
    else:
        opener = urllib2.build_opener( urllib2.ProxyHandler({ 'http': app.config['PROXY'] }) )
    if url:
        d = opener.open( url ).read()
        return d
    else:
        return ''



############################
# local data provider
############################

def get_path( directory_name, path ):
    if directory_name=="__job__":
        if not path: return ''
        directory = app.config['JOB_DIR']
    else:
        directory = app.config['LOCAL_DATA_DIRS'].get( directory_name )
        if not directory: return ''
        pass
    return os.path.join( directory, path )

@app.route('/example/directory_list/')
def local_data_dirs():
    dirs = app.config['LOCAL_DATA_DIRS'].keys()
    dirs.sort()
    return json.dumps( dirs )

@app.route('/example/dataset_list2/')
def local_data_list():
    directory_name = request.args.get('directory_name', '')
    if not directory_name: return ''
    path = request.args.get('path', '')
    dirpath = get_path( directory_name, path )
    if not dirpath: return ''
    jstree = []
    for fname in sorted( os.listdir( dirpath ) ):
        if not fname.startswith('.') and not (fname.startswith('#') and fname.endswith('#')):
            if os.path.isfile( os.path.join(dirpath, fname) ):
                jstree.append({
                    'data': { 'title': '<span>' + fname + '</span>' },
                    'metadata': { 'file': fname, 'path': path + fname, }
                })
            else:
                jstree.append({
                    'data': { 'title': '<span>' + fname + '</span>' },
                    'metadata': { 'path': path + fname + '/', 'dir': True },
                    'attr': { 'id': path + fname + '/' },
                    'state': 'closed'
                })
    return json.dumps( jstree )

@app.route('/example/data/')
def local_data():
    directory_name = request.args.get('directory_name', '')
    path = request.args.get('path', '')
    dirpath = get_path( directory_name, path )
    if not dirpath: return ''
    return send_file( dirpath, mimetype='text/plain', as_attachment=True )



############################
# save data
############################

def write_data( name, directory_name, data, append=False ):
    directory = app.config['LOCAL_DATA_DIRS'].get( directory_name )
    if not directory:
        return 'ERROR: directory not available.'
    path = os.path.join( directory, name )
    path = os.path.abspath( path )
    directory = os.path.abspath( directory )
    if directory == os.path.commonprefix([ path, directory ]):
        parent = os.path.split( path )[0]
        if os.path.isdir( parent ):
            mode = 'a' if boolean(append) else 'w'
            with open( path, mode ) as fp:
                fp.write( data )
            return 'OK'
        else:
            return 'ERROR: directory not available.'
    else:
        return 'ERROR: access restriction.'

@app.route('/save/jmol/', methods=['POST'])
def save_jmol():
    # receives the PNGJBIN send by Jmol
    directory_name = request.args.get('directory_name', '')
    name = request.args.get('name', '')
    return write_data( name, directory_name, request.stream.read() )
    
@app.route('/save/local/', methods=['POST'])
def save_local():
    directory_name = request.form.get('directory_name', '')
    name = request.form.get('name', '')
    append = request.form.get('append', '')
    encoding = request.form.get('encoding', '')
    data = request.form.get('data', '')
    data = decode( data, encoding )
    return write_data( name, directory_name, data, append=append )

@app.route('/save/download/', methods=['POST'])
def save_download():
    mimetype = request.form.get('type', 'application/download')
    encoding = request.form.get('encoding', '')
    name = request.form.get('name', 'file.dat')
    data = request.form.get('data', '')
    data = decode( data, encoding )
    ftmp = tempfile.NamedTemporaryFile()
    ftmp.write( data )
    ftmp.seek(0)
    # not working... but should
    # strio = StringIO.StringIO()
    # strio.write( data )
    # strio.seek(0)
    return send_file(
        ftmp,
        mimetype=mimetype, as_attachment=True,
        attachment_filename=name
    )


############################
# job handling
############################

RUNNING_JOBS = {}

def job_done( tool ):
    jobname = os.path.split( tool.output_dir )[-1]
    LOG.info( "JOB DONE: %s" % jobname )
    RUNNING_JOBS[ jobname ] = False

def job_start( tool ):
    jobname = os.path.split( tool.output_dir )[-1]
    LOG.info( "JOB STARTED: %s" % jobname )
    RUNNING_JOBS[ jobname ] = True
    JOB_POOL.apply_async( tool, callback=job_done )

# !important - allows one to abort via CTRL-C
signal.signal(signal.SIGINT, signal.SIG_DFL)
multiprocessing.log_to_stderr( logging.ERROR )
nworkers = app.config.get( 'JOB_WORKERS', multiprocessing.cpu_count() )
JOB_POOL = multiprocessing.Pool( nworkers )

def job_dir( jobname, create=False ):
    output_dir = os.path.join( app.config['JOB_DIR'], jobname )
    output_dir = os.path.abspath( output_dir )
    if not os.path.exists( output_dir ):
        os.makedirs( output_dir )
    return output_dir

@app.route('/job/status/<string:jobname>')
def job_status( jobname ):
    jobname = secure_filename( jobname )
    jobtype, jobid = jobname.split("_")
    Tool = app.config['TOOLS'].get( jobtype, None )
    if Tool:
        output_dir = job_dir( jobname )
        tool = Tool( output_dir=output_dir, fileargs=True, run=False )
        return jsonify({
            "running": RUNNING_JOBS.get( jobname, False ),
            "check": tool.check( full=False ) 
        })
    return ""

@app.route('/job/tools')
def job_tools():
    tools = {}
    for name, Tool in app.config['TOOLS'].iteritems():
        tools[ name ] = Tool.args
    return jsonify( tools )

def input_path( name, params, output_dir ):
    ext = params.get("ext", "dat")
    return os.path.join( output_dir, "input_%s.%s" % ( name, ext ) )

@app.route('/job/submit/', methods=['POST', 'GET'])
def job_submit():
    is_form = request.args.get("POST")!="_PNGJBIN_"
    print "is_form: " + str(is_form)
    def get( name, params ):
        default = params.get( "default_value", "" )
        attr = "form" if is_form else "args"
        return getattr( request, attr ).get( name, default )
    jobtype = get( 'type', {} )
    Tool = app.config['TOOLS'].get( jobtype )
    if Tool:
        jobname = jobtype + "_" + str( uuid.uuid4() )
        output_dir = job_dir( jobname, create=True )
        args = []
        kwargs = {}
        for name, params in Tool.args.iteritems():
            if params["type"]=="file":
                fpath = input_path( name, params, output_dir )
                if is_form:
                    for file_storage in request.files.getlist( name ):
                        if file_storage: 
                            file_storage.save( fpath )
                            break   # only save the first file
                else:
                    if params["ext"]=="jmol":
                        with open( fpath, "w" ) as fp:
                            fp.write( request.stream.read() )
                d = fpath
            elif params["type"]=="slider":
                d = float( get( name, params ) )
            elif params["type"]=="checkbox":
                d = boolean( get( name, { "default_value": False } ) )
            else:
                d = get( name, params )
            if "default_value" in params:
                kwargs[ name ] = d
            else:
                args.append( d )
        args = tuple(args)
        kwargs.update({ "output_dir": output_dir, "run": False })
        job_start( Tool( *args, **kwargs ) )
        return jsonify({ "jobname": jobname })
    return ""






############################
# main
############################

if __name__ == '__main__':
    app.run( debug=True, host='127.0.0.1', threaded=True, processes=1, extra_files=['app.cfg'] )


