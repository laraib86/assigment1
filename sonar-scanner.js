const scanner = require('sonarqube-scanner');

scanner(
  {
    serverUrl : 'http://10.0.8.141:9000',
    token : "sqp_df01829197715abedcd5c571c6296bf13b28d8ce",
    options: {
      'sonar.projectName': 'test2',
      'sonar.projectDescription': 'Assignment_1',
    
    }
  },
  () => process.exit()
)

