#!groovy

import jenkins.model.*
import hudson.security.*

def instance = Jenkins.getInstance()

def env = System.getenv()
def user = env.JENKINS_USER ?: "admin"
def password = env.JENKINS_PASSWORD ?: "admin"

def hudsonRealm = new HudsonPrivateSecurityRealm(false)
hudsonRealm.createAccount(user, password)
instance.setSecurityRealm(hudsonRealm)

def strategy = new FullControlOnceLoggedInAuthorizationStrategy()
strategy.setAllowAnonymousRead(false)
instance.setAuthorizationStrategy(strategy)

instance.save()
