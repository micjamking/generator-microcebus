'use strict';

var path    = require('path');
var assert  = require('yeoman-generator').assert;
var helpers = require('yeoman-generator').test;

describe('microcebus:sass', function(){

  before(function(done){
    helpers.run(path.join(__dirname, '../app'))
      .inDir(path.join(__dirname, '.tmp'))
      .withOptions({'skip-install': true})
      .withPrompts({
        dbUser: 'root',
        dbPass: '1234'
      })
      .on('end', done);
  });

  it('adds the Grunt plugin', function(){
    assert.fileContent('package.json', 'sass');
  });

  it('adds the Grunt task', function(){
    assert.fileContent('Gruntfile.js', 'sass');
  });
});
