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
def param1 = new StringParameterDefinition("GITHUB_URL", "https://github.com/example/repo", "GitHub repository URL")
def param2 = new StringParameterDefinition("GITHUB_SHA_COMMIT", "main", "GitHub branch or commit SHA")
def param3 = new StringParameterDefinition("CREDENTIALS", "credentials-id", "Jenkins credentials ID")
def parameters = new ParametersDefinitionProperty(param1, param2, param3)
pipelineJob.addProperty(parameters)

// Inline pipeline using params.*
def pipelineScript = """
pipeline {
    agent any
    
    stages {
        stage('Checkout') {
            steps {
                git url: params.GITHUB_URL, branch: 'main', credentialsId: params.CREDENTIALS
                sh "git checkout \${params.GITHUB_SHA_COMMIT}"
            }
        }

        stage('Docker Build') {
            steps {
                sh 'docker-compose up --build -d'
            }
        }

        stage('Run Tests') {
            steps {
                sh '''
                    bash -c "source /home/Mykola/venv/bin/activate &&  python -m unittest discover -s /home/Mykola/test"
                '''
            }
        }

        stage('Send Notification') {
            steps {
                mail bcc: '', body: 'Pipeline completed successfully!', subject: 'Done', to: 'nickolay.yakovkin@gmail.com'
            }
        }
    }

    post {
        always {
            sh 'docker-compose down'
        }
    }
}
"""

def flowDef = new CpsFlowDefinition(pipelineScript, true)
pipelineJob.setDefinition(flowDef)
pipelineJob.save()

println "Pipeline job '${jobName}' created/updated successfully with inline script using parameters."
