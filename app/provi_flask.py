import os
import urllib2
import json
import StringIO
import tempfile

from flask import Flask
from flask import send_from_directory
from flask import send_file
from flask import request, Request

from werkzeug import secure_filename


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
    string = string.lower()
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
    url = request.args.get('key', '')
    print url
    if '127.0.0.1' in url or 'localhost' in url:
        opener = urllib2.build_opener()
    else:
        opener = urllib2.build_opener( urllib2.ProxyHandler({'http': 'proxy.charite.de:888'}) )
    if url:
        return opener.open( url ).read()
    else:
        return ''



############################
# local data provider
############################

@app.route('/example/directory_list/')
def local_data_dirs():
    dirs = app.config['LOCAL_DATA_DIRS'].keys()
    dirs.sort()
    return json.dumps( dirs )

@app.route('/example/dataset_list2/')
def local_data_list():
    directory_name = request.args.get('directory_name', '')
    path = request.args.get('path', '')
    if not directory_name:
        directory_name = app.config['LOCAL_DATA_DIRS'].iterkeys().next()
    dirpath = os.path.join( app.config['LOCAL_DATA_DIRS'][ directory_name ], path )
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
    fname = request.args.get('path', '')
    fpath = os.path.join( app.config['LOCAL_DATA_DIRS'][ directory_name ], fname )
    print fpath
    return send_file( fpath, mimetype='text/plain', as_attachment=True )



############################
# save data
############################

@app.route('/save/jmol/', methods=['POST'])
def save_jmol():
    # receives the PNGJBIN send by Jmol
    directory_name = request.args.get('directory_name', '')
    name = secure_filename( request.args.get('name', '') )
    filepath = app.config['LOCAL_DATA_DIRS'][ directory_name ]
    with open( os.path.join( filepath, name ), 'w' ) as fp:
        fp.write( request.stream.read() )
    return 'OK'

@app.route('/save/local/', methods=['POST'])
def save_local():
    directory_name = request.form.get('directory_name', '')
    name = secure_filename( request.form.get('name', '') )
    append = request.form.get('append', '')
    encoding = request.form.get('encoding', '')
    data = request.form.get('data', '')
    data = decode( data, encoding )
    mode = 'a' if boolean(append) else 'w'
    filepath = app.config['LOCAL_DATA_DIRS'][ directory_name ]
    with open( os.path.join( filepath, name ), mode ) as fp:
        fp.write( data )
    return 'OK'

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







if __name__ == '__main__':
    app.run( debug=True, host='127.0.0.1' )












