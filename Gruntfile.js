module.exports = function (grunt) {

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
      src: ['lib/*/test.js']
    },
    jshint: {
      all: ['Gruntfile.js', 'lib/*/*.js', 'lib/*.js', '*.js']
    },
    jsbeautifier: {
      options: {
        js: {
          indentSize: 2,
          jslintHappy: true
        }
      },
      files: ['Gruntfile.js', 'lib/*.js', 'lib/*/*.js']
    }
  });

  grunt.registerTask('test', ['mochaTest']);
  grunt.registerTask('lint', ['jshint']);
  grunt.registerTask('clean', ['jsbeautifier']);

};
