# Use official Jenkins LTS image
FROM jenkins/jenkins:lts

# Switch to root to install additional tools if needed
USER root

# Install common dependencies
RUN apt-get update && \
    apt-get install -y \
    git \
    curl \
    unzip && \
    apt-get clean

# Switch back to Jenkins user
USER jenkins

# Expose Jenkins port
EXPOSE 3127

# Jenkins home directory
ENV JENKINS_HOME=/var/jenkins_home