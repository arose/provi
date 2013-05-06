

def expose( func ):
    """
    Decorator: mark a function as 'exposed' and thus web accessible
    """
    func.exposed = True
    return func