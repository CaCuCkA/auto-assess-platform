import jenkins.model.*
import org.jenkinsci.plugins.workflow.job.WorkflowJob
import org.jenkinsci.plugins.workflow.cps.CpsScmFlowDefinition
import hudson.plugins.git.GitSCM
import hudson.plugins.git.UserRemoteConfig
import hudson.plugins.git.BranchSpec
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

def param1 = new StringParameterDefinition("GITHUB_URL", "https://github.com/example/repo", "GitHub repository URL")
def param2 = new StringParameterDefinition("GITHUB_SHA_COMMIT", "main", "GitHub branch or commit SHA")
def param3 = new StringParameterDefinition("CREDENTIALS", "credentials-id", "Jenkins credentials ID")
def parameters = new ParametersDefinitionProperty(param1, param2, param3)
pipelineJob.addProperty(parameters)

def userRemoteConfig = new UserRemoteConfig("\${GITHUB_URL}", "", "", "\${CREDENTIALS}")
def branchSpec = new BranchSpec("\${GITHUB_SHA_COMMIT}")
def scm = new GitSCM(
    [userRemoteConfig], // Repositories
    [branchSpec],       // Branches to build
    false,              // Do not use repository browser
    null,               // Submodule configuration
    null,               // Browser
    null,               // Git tool
    null                // Extensions
)

def scmDefinition = new CpsScmFlowDefinition(scm, "Jenkinsfile")
pipelineJob.setDefinition(scmDefinition)

pipelineJob.save()

println "Pipeline job '${jobName}' created/updated successfully with parameters and Git SCM configuration."