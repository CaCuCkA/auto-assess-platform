import jenkins.model.*
import org.jenkinsci.plugins.workflow.job.WorkflowJob
import org.jenkinsci.plugins.workflow.cps.CpsFlowDefinition
import hudson.model.ParametersDefinitionProperty
import hudson.model.StringParameterDefinition

def jenkinsInstance = Jenkins.instance
def jobName = "{{ job_name }}" 

def pipelineJob = jenkinsInstance.getItem(jobName)
if (pipelineJob == null) {
    pipelineJob = jenkinsInstance.createProject(WorkflowJob, jobName)
} else {
    println "Job '${jobName}' already exists. Updating its configuration."
}

def params = [
    new StringParameterDefinition("GITHUB_URL", "https://github.com/example/repo", "GitHub repository URL"),
    new StringParameterDefinition("GITHUB_SHA_COMMIT", "main", "GitHub branch or commit SHA"),
    new StringParameterDefinition("CREDENTIALS", "credentials-id", "Jenkins credentials ID"),
    new StringParameterDefinition("TEST_PATH", "test_path", "Job path to tests"),
    new StringParameterDefinition("SUCCESS_ENDPOINT", "success-url", "URL to notify in case of successful pipeline execution."),
    new StringParameterDefinition("FAILED_ENDPOINT", "failed-url", "URL to notify in case of pipeline failure.")
]

if (!pipelineJob.getProperty(ParametersDefinitionProperty)) {
    def parameters = new ParametersDefinitionProperty(params)
    pipelineJob.addProperty(parameters)
} else {
    pipelineJob.removeProperty(ParametersDefinitionProperty)
    def parameters = new ParametersDefinitionProperty(params)
    pipelineJob.addProperty(parameters)
    println "Updated the parameters for '${jobName}'."
}

def pipelineScript = """
pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                script {
                    try {
                        git url: "\$GITHUB_URL", branch: 'main', credentialsId: "\$CREDENTIALS"
                        sh "git checkout \$GITHUB_SHA_COMMIT"
                    } catch (Exception e) {
                        def message = "Git checkout failed: \${e.getMessage()}"

                        httpRequest(
                            httpMode: 'POST',
                            contentType: 'APPLICATION_JSON',
                            url: "\${FAILED_ENDPOINT}",
                            requestBody: groovy.json.JsonOutput.toJson([
                                status: "failure",
                                message: message
                            ])
                        )
                        error message
                    }
                }
            }
        }

        stage('Docker Build') {
            steps {
                script {
                    def buildResult = sh(script: 'docker-compose up --build -d', returnStatus: true)
                    if (buildResult != 0) {
                        def message = "Docker build failed with status: \${buildResult}"

                        httpRequest(
                            httpMode: 'POST',
                            contentType: 'APPLICATION_JSON',
                            url: "\${FAILED_ENDPOINT}",
                            requestBody: groovy.json.JsonOutput.toJson([
                                status: "failure",
                                message: message
                            ])
                        )
                        
                        error "Docker build failed"
                    }
                }
            }
        }

        stage('Run Tests') {
            steps {
                script {
                    def testResults = sh(script: 'bash -c "python3 -m unittest discover -s \$TEST_PATH 2>&1 || true"', returnStdout: true).trim()

                    if (testResults.contains('FAIL') || 
                        testResults.contains('ERROR') || 
                        testResults.contains('ImportError') || 
                        testResults.contains('No module named') || 
                        testResults.contains('No such file')) {
                        
                        def message = "Tests failed or error occurred: \${testResults}"
                        
                        httpRequest(
                            httpMode: 'POST',
                            contentType: 'APPLICATION_JSON',
                            url: "\${FAILED_ENDPOINT}",
                            requestBody: groovy.json.JsonOutput.toJson([
                                status: "failure",
                                message: message
                            ])
                        )
                        
                        error(message)
                    }
                }
            }
        }
    }

    post {
        always {
            sh '''
                docker-compose down --volumes --remove-orphans
                docker image prune -af
            '''
        }

        success {
            sh "curl -X POST '\$SUCCESS_ENDPOINT'"
        }
    }

}

"""

def flowDef = new CpsFlowDefinition(pipelineScript, true)
pipelineJob.setDefinition(flowDef)
pipelineJob.save()

println "Pipeline job '${jobName}' created/updated successfully with inline script using parameters."
