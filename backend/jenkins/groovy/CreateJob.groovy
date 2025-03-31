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

// Define build parameters
def params = [
    new StringParameterDefinition("GITHUB_URL", "https://github.com/example/repo", "GitHub repository URL"),
    new StringParameterDefinition("GITHUB_SHA_COMMIT", "main", "GitHub branch or commit SHA"),
    new StringParameterDefinition("CREDENTIALS", "credentials-id", "Jenkins credentials ID"),
    new StringParameterDefinition("SUCCESS_ENDPOINT", "success-url", "URL to notify in case of successful pipeline execution."),
    new StringParameterDefinition("FAILED_ENDPOINT", "failed-url", "URL to notify in case of pipeline failure.")
]
def parameters = new ParametersDefinitionProperty(params)
pipelineJob.addProperty(parameters)

def pipelineScript = """
pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                script {
                    try {
                        git url: "\${params.GITHUB_URL}", branch: 'main', credentialsId: "\${params.CREDENTIALS}"
                        sh "git checkout \${params.GITHUB_SHA_COMMIT}"
                    } catch (Exception e) {
                        error "Git checkout failed: \${e.getMessage()}"
                    }
                }
            }
        }

        stage('Docker Build') {
            steps {
                script {
                    def buildResult = sh(script: 'docker-compose up --build -d', returnStatus: true)
                    if (buildResult != 0) {
                        error "Docker build failed"
                    }
                }
            }
        }

        stage('Run Tests') {
            steps {
                script {
                    def testResults = sh(script: 'bash -c "source /home/Mykola/venv/bin/activate && python -m unittest discover -s /home/Mykola/test"', returnStdout: true).trim()
                    if (testResults.contains('FAILED')) {
                        error "Tests failed: \${testResults}"
                    }
                }
            }
        }
    }

    post {
        always {
            sh 'docker-compose down'
        }
        failure {
            script {
                // Correctly format the error message
                def errorMessage = "\${env.BUILD_URL}console"
                // Use Groovy's single-quoted string to avoid parsing issues with JSON's double quotes
                def jsonBody = '{"status": "failure", "message": "Build or test failed. Details at: ' + errorMessage + '"}'
                
                sh "curl -X POST '\${FAILED_ENDPOINT}' -H 'Content-Type: application/json' -d '\${jsonBody}'"
            }
        }
    }
}
"""


def flowDef = new CpsFlowDefinition(pipelineScript, true)
pipelineJob.setDefinition(flowDef)
pipelineJob.save()

println "Pipeline job '${jobName}' created/updated successfully with inline script using parameters."
