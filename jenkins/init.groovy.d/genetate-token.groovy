import jenkins.model.*
import hudson.security.*
import jenkins.security.ApiTokenProperty
import java.net.HttpURLConnection
import java.net.URL

def env = System.getenv()
def username = env.JENKINS_USER ?: "admin"
def password = env.JENKINS_PASSWORD ?: "admin"
def backendUrl = "http://${env.BACKEND_HOST ?: 'localhost'}:${env.BACKEND_PORT ?: '5000'}/jenkins_token/add"

println backendUrl

def jenkins = Jenkins.get()

def hudsonRealm = new HudsonPrivateSecurityRealm(false)
jenkins.setSecurityRealm(hudsonRealm)

if (!hudson.model.User.get(username, false)) {
    println "--> Creating user '${username}'"
    hudsonRealm.createAccount(username, password)
}

def user = hudson.model.User.get(username)
def tokenProperty = user.getProperty(ApiTokenProperty)

def existingToken = tokenProperty?.tokenList?.find { it.name == "auto-generated-token" }

if (existingToken) {
    println "--> Token 'auto-generated-token' already exists for '${username}'"
    return
}

def newToken = tokenProperty.generateNewToken("auto-generated-token")
user.save()

def tokenValue = newToken.plainValue
println "--> Generated new API token for '${username}'"

def conn = (HttpURLConnection) new URL(backendUrl).openConnection()
conn.with {
    requestMethod = "POST"
    setRequestProperty("Content-Type", "application/json")
    doOutput = true
    outputStream.write("{\"token\": \"${tokenValue}\"}".bytes)
}

def responseCode = conn.responseCode
if (responseCode >= 400) {
    def error = conn.errorStream?.text ?: "No error message"
    throw new RuntimeException("Failed to send token to backend (HTTP ${responseCode}): ${error}")
}

println "--> Token sent to backend successfully (HTTP ${responseCode})"
