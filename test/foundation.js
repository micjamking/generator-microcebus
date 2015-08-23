'use strict';

var path    = require('path');
var assert  = require('yeoman-generator').assert;
var helpers = require('yeoman-generator').test;

describe('microcebus:foundation', function(){

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

  it('adds the Foundation dependency', function(){
    assert.fileContent('bower.json', 'foundation');
  });

  it('doesn\'t explicitly add the jQuery dependency', function(){
    assert.noFileContent('bower.json', 'jquery');
  });

  it('adds Foundation paths to Gruntfile.js', function(){
    assert.fileContent('Gruntfile.js', 'foundation');
  });
});
