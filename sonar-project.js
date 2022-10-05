const scanner = require('sonarqube-scanner');

scanner(
  {
    serverUrl : 'http://10.0.8.141:9000',
    token : "sqp_f25f4905a44896f066d59b482ce6a12be00dd222",
    options: {
      'sonar.projectName': 'assignment1'
    }
  },
  () => process.exit()
)
