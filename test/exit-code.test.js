'use strict'

var path = require('path')
var tap = require('tap')
var childProcess = require('child_process')

const indexPath = path.resolve(__dirname, '..', 'index.js')
const example1Path = path.resolve(__dirname, 'data', 'example1')

tap.test('exit code', t => {
  t.plan(5)

  childProcess.execFile('node', [indexPath, example1Path], (error, stdout, stderr) => {
    t.equal(error.code, 1)
    t.match(stdout, 'split')
    t.match(stdout, 'pump')
    t.match(stdout, 'express')
    t.match(stdout, 'quiqui')
  })
})
