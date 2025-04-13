import jenkins.model.*
import hudson.security.*
import jenkins.security.ApiTokenProperty
import java.nio.file.*

def env = System.getenv()
def username = env.JENKINS_USER ?: "admin"
def password = env.JENKINS_PASSWORD ?: "admin"

def instance = Jenkins.get()

// Create security realm and user if needed
def hudsonRealm = new HudsonPrivateSecurityRealm(false)
instance.setSecurityRealm(hudsonRealm)

if (hudson.model.User.get(username, false) == null) {
    println "--> Creating user '${username}'"
    hudsonRealm.createAccount(username, password)
}

def user = hudson.model.User.get(username)
def tokenProperty = user.getProperty(ApiTokenProperty.class)

def existingToken = tokenProperty?.getTokenList()?.find { it.name == "auto-generated-token" }

if (existingToken == null) {
    def newToken = tokenProperty.generateNewToken("auto-generated-token")
    user.save()

    def tokenValue = newToken.plainValue
    def tokenInfo = """
    ============================================
    Jenkins API token created:
    User        : ${username}
    Token name  : auto-generated-token
    Token value : ${tokenValue}
    ============================================
    """.stripIndent()

    println tokenInfo

    def tokenFile = new File("/var/jenkins_home/sharepoint/token.txt")
    tokenFile.write(tokenValue + "\n")

    println "--> Token written to /var/jenkins_home/token.txt"
} else {
    println "--> Token 'auto-generated-token' already exists for '${username}'"
}

