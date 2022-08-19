const scanner = require('sonarqube-scanner');

scanner(
  {
    serverUrl : 'http://10.0.8.56:9000',
    token : "f91d7dda123c3547cfca4f03619794416f1e832d",
    options: {
      'sonar.projectName': 'Node-Applcation'
    }
  },
  () => process.exit()
)