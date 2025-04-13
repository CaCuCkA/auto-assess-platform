FROM jenkins/jenkins:lts

USER root

# Install Python
RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    apt-get clean

# Install Jenkins plugins
RUN jenkins-plugin-cli --version
COPY jenkins/plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN jenkins-plugin-cli --plugin-file /usr/share/jenkins/ref/plugins.txt

# Create and fix permissions on shared volume folder
RUN mkdir -p /var/jenkins_home/sharepoint && \
    chown -R jenkins:jenkins /var/jenkins_home/sharepoint

# Switch to Jenkins user
USER jenkins

# Add init Groovy scripts (token generation, user setup)
COPY jenkins/init.groovy.d/ /usr/share/jenkins/ref/init.groovy.d/
