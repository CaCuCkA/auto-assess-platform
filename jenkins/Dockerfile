FROM jenkins/jenkins:lts

USER root

# Install Python
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-venv && \
    apt-get clean

# Install Python requirements
COPY jenkins/requirements.txt /tmp/requirements.txt
RUN python3 -m venv /venv && \
. /venv/bin/activate && \
pip install --no-cache-dir -r /tmp/requirements.txt

# Потім явно використовуй Python з цього venv:
ENV PATH="/venv/bin:$PATH"

# Install Docker
RUN curl -SL https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose && \
    chmod +x /usr/local/bin/docker-compose && \
    ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

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
