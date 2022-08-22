const scanner = require('sonarqube-scanner');

scanner(
  {
    serverUrl : 'http://10.0.8.141:9000',
    token : "sqp_5e01db758a26dabf73b3eec8d356142d243c5d15",
    options: {
      'sonar.projectName': 'assignment1'
    }
  },
  () => process.exit()
)