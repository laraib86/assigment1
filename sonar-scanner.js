const scanner = require('sonarqube-scanner');

scanner(
  {
    serverUrl : 'http://10.0.8.141:9000',
    token : "sqp_671055cdbc0204436c58d37d9abf6a6cb99231fb",
    options: {
      'sonar.projectName': 'Assignment_1',
      'sonar.projectDescription': 'Assignment_1',
    
    }
  },
  () => process.exit()
)

