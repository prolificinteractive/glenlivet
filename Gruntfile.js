module.exports = function (grunt) {
  var sourceFiles = ['Gruntfile.js', 'lib/*.js', '*.js'];

  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-jsbeautifier');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    mochaTest: {
      options: {
        reporter: 'spec',
        require: ['should']
      },
      src: ['test/*.js']
    },
    jshint: {
      files: sourceFiles,
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        node: true
      }
    },
    jsbeautifier: {
      options: {
        js: {
          indentSize: 2,
          jslintHappy: true
        }
      },
      files: sourceFiles
    }
  });

  grunt.registerTask('test', ['mochaTest']);
  grunt.registerTask('lint', ['jshint']);
  grunt.registerTask('beautify', ['jsbeautifier']);
};
