import jenkins.model.*
import hudson.security.*
import jenkins.security.ApiTokenProperty
import java.nio.file.*

def env = System.getenv()
def username = env.JENKINS_USER ?: "admin"
def password = env.JENKINS_PASSWORD ?: "admin"

if (!env.JENKINS_SHAREPOINT_PATH) {
    throw new IllegalStateException("Environment variable 'JENKINS_SHAREPOINT_PATH' is not set.")
}

def sharepointPath = env.JENKINS_SHAREPOINT_PATH
def tokenFilePath = Paths.get(sharepointPath, "token.txt")

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

def tokenValue

if (existingToken) {
    println "--> Token 'auto-generated-token' already exists for '${username}'"

    // Читаємо з файлу, якщо був збережений раніше
    if (Files.exists(tokenFilePath)) {
        tokenValue = new String(Files.readAllBytes(tokenFilePath), "UTF-8").trim()
        println "--> Loaded token from file"
    } else {
        println "--> Warning: Token exists but value not available (not stored)"
        tokenValue = "<unavailable>"
    }

} else {
    def newToken = tokenProperty.generateNewToken("auto-generated-token")
    user.save()
    tokenValue = newToken.plainValue
    println "--> Generated new API token for '${username}'"

    if (!Files.exists(tokenFilePath)) {
        println "--> Writing token to ${tokenFilePath}"
        Files.createDirectories(tokenFilePath.getParent())
        Files.write(tokenFilePath, tokenValue.getBytes("UTF-8"), StandardOpenOption.CREATE_NEW)
    } else {
        println "--> Token file already exists at ${tokenFilePath}, skipping write"
    }
}
