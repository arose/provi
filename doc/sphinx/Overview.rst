==========
 Overview
==========


Architecture
============

.. digraph:: architecture

   "Viewer (browser-based)" -> "Controller (Python module)" -> "Datasource (Galaxy, Upload, ...)";
   "Controller (Python module)" -> "Viewer (browser-based)";


Clientside/JavaScript data model
================================

Applet
------

A Jmol applet to integrate and visualize one or multiple datasets. It is also used to extract additional information from datasets to create data elements therein. At the moment the applet also serve as a collection of multiple datasets to define some relation between them. However, in the future this should be done by a dedicated mechanism.


Dataset
-------

A wrapper class that makes data available to the rest of the application. It provides a data type agnostic interface that is implemented for specific data types. A dataset can contain multiple data elements which all belong to the same data source. 


Data element
------------

There are several classes to represent different types of data. They have kind of atomicity with respect to the application, they are usefull on their own but might serve as building blocks for more elaborate data elements. Data elements are not responsible for creating or retrieving other data elements. Neither are they depended on a dataset, nor can they create one. They can belong one or more datasets and should be immutable.


Data source
-----------

A loose expression to denote for example a file that is loaded into the application.



Serverside data model
=====================