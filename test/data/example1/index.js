/* eslint-disable no-unused-vars */
'use strict'

var fs = require('fs')

var localModule = require('./localModule')

var benchmark = require('benchmark')
var split = require('split')
var pump = require('pump')
var express = require('express')

var v8 = require('v8')

require('foo')(require('bar'))
