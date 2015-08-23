'use strict';
// Vendor
var chalk   = require('chalk');
var util    = require('util');
var yeoman  = require('yeoman-generator');
var yosay   = require('yosay');
var wp      = require('wp-cli');
var nodegit = require('nodegit');
var replace = require('replace');
var fs      = require('fs');

// Custom
var github  = require('./github_user');
var helpers = require('./helpers');

var Generator = module.exports = function(){
  yeoman.generators.Base.apply(this, arguments);
};

util.inherits(Generator, yeoman.generators.Base);

Generator.prototype.prompting = function(){
  var done = this.async();

  this.log(yosay(
    'Welcome to the ' + chalk.red('Microcebus') + ' WordPress generator!'
  ));

  var prompts = [{
    name: 'githubUser',
    message: 'What\'s your GitHub username (for theme author info)?',
    default: 'someuser'
  },{
    type: 'input',
    name: 'themeName',
    message: 'Theme Name',
    default: helpers.capitalize(this.appname)
  },
  {
    type: 'input',
    name: 'themeSlug',
    message: 'Theme Slug',
    default: this.appname
  },
  {
    type: 'input',
    name: 'themeDesc',
    message: 'Theme Description',
    default: 'A Custom WordPress theme created for ' + helpers.capitalize(this.appname)
  },
  {
    type: 'input',
    name: 'dbName',
    message: 'Database Name',
    default: 'wp_' + this.appname
  },
  {
    type: 'input',
    name: 'dbUser',
    message: 'Database User'
  },
  {
    type: 'password',
    name: 'dbPass',
    message: 'Database Password'
  }];

  this.prompt(prompts, function(props){
    this.props = props;
    done();
  }.bind(this));
};

Generator.prototype.configuring = function(){
  var done = this.async();

  github(
    this.props.githubUser,
    function(res){
      this.realname  = res.name;
      this.email     = res.email;
      this.githubUrl = res.html_url;
      done();
    }.bind(this),
    this.log
  );
};

Generator.prototype.writing = {
  templates: function(){
    var userinfo = {
      appName: this.props.themeName,
      appSlug: this.props.themeSlug,
      appDesc: this.props.themeDesc,
      authorName: this.realname,
      authorEmail: this.email,
      authorURL: this.githubUrl
    };

    this.fs.copyTpl(
      this.templatePath('_package.json'),
      this.destinationPath('package.json'),
      userinfo
    );
    this.fs.copyTpl(
      this.templatePath('_bower.json'),
      this.destinationPath('bower.json'),
      userinfo
    );
    this.fs.copyTpl(
      this.templatePath('_bowerrc'),
      this.destinationPath('.bowerrc'),
      userinfo
    );
    this.fs.copyTpl(
      this.templatePath('_gitignore'),
      this.destinationPath('.gitignore'),
      userinfo
    );
    this.fs.copyTpl(
      this.templatePath('_README.md'),
      this.destinationPath('README.md'),
      userinfo
    );
    this.fs.copyTpl(
      this.templatePath('_hologram_config.yml'),
      this.destinationPath('hologram_config.yml'),
      userinfo
    );
    this.fs.copyTpl(
      this.templatePath('_Gruntfile.js'),
      this.destinationPath('Gruntfile.js'),
      userinfo
    );
  },

  staticFiles: function () {
    this.fs.copy(
      this.templatePath('editorconfig'),
      this.destinationPath('.editorconfig')
    );
    this.fs.copy(
      this.templatePath('jshintrc'),
      this.destinationPath('.jshintrc')
    );
    this.fs.copy(
      this.templatePath('Gemfile'),
      this.destinationPath('Gemfile')
    );
    this.fs.copy(
      this.templatePath('plugins'),
      this.destinationPath('plugins')
    );
  }
};

Generator.prototype.install = function(){

  var themeURI = 'https://github.com/ikayzo/_s.git';
  var themeDir = './wp-content/themes/' + this.props.themeSlug + '/';

  var cloneOptions = {
    remoteCallbacks: {
      certificateCheck: function() {
        return 1;
      }
    }
  };

  var config = {
    dbname: this.props.dbName,
    dbuser: this.props.dbUser
  };

  if (this.props.dbPass && this.props.dbPass.length > 0) {
    config.dbpass = this.props.dbPass;
  }

  var downloadTheme = (function(){
    this.log('Cloning theme from ' + themeURI + ' ...');
    nodegit.Clone(themeURI, themeDir, cloneOptions)
    .then((function(){
      this.log('Customizing theme files...');

      // Rename _s.pot language file
      fs.rename(
        themeDir + '/languages/_s.pot',
        themeDir + '/languages/' + this.props.themeSlug + '.pot',
        function(err) {
        if ( err ) {
          console.log('ERROR: ' + err);
        }
      });

      // Find/replace pattern for theme slug (ie. '_s')
      // https://github.com/Automattic/_s#getting-started
      replace({
        regex: '\'_s\'',
        replacement: '\'' + this.props.themeSlug + '\'',
        paths: [themeDir],
        recursive: true,
        silent: true,
      });

      replace({
        regex: '_s_',
        replacement: this.props.themeSlug + '_',
        paths: [themeDir],
        recursive: true,
        silent: true,
      });

      replace({
        regex: 'Text Domain: _s',
        replacement: 'Text Domain: ' + this.props.themeSlug,
        paths: [themeDir],
        recursive: true,
        silent: true,
      });

      replace({
        regex: ' _s',
        replacement: ' ' + this.props.themeName,
        paths: [themeDir],
        recursive: true,
        silent: true,
      });

      replace({
        regex: '_s-',
        replacement: this.props.themeSlug + '-',
        paths: [themeDir],
        recursive: true,
        silent: true,
      });
    }).bind(this));
  }).bind(this);

  wp.discover((function(wp){
    wp.cli.info((function(err, info){
      if (err){
        this.log('WP CLI is not installed or configured properly!');
        this.log('Please install: http://wp-cli.org/#install');
      }
    }).bind(this));

    wp.core.download((function(err, result){
      this.log(result);

      downloadTheme();

      wp.core.config(
        config,
      (function(err, result){
        if (err){
          this.log(err);
        }
        this.log(result);
      }).bind(this));

    }).bind(this));

  }).bind(this));

  this.installDependencies();
};

Generator.prototype.end = {
  foundationSettings: function(){
    var assets    = 'wp-content/themes/' + this.props.themeSlug + '/assets';

    // Confirm directory exists
    try {
      var directory = fs.lstatSync(assets);

      if (directory.isDirectory()) {
        fs.createReadStream(assets + '/vendor/foundation/scss/foundation/_settings.scss')
          .pipe(fs.createWriteStream(assets + '/scss/_settings.scss'));
        this.log('Copy foundation override settings to `assets/scss...`');
      }
    }
    catch (e) {
        this.log(e);
    }
  },
  complete: function(){
    this.log('Done! Happy coding...');
  }
};