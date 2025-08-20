pipeline {
    agent any

    environment {
        REGISTRY = "docker.io"
        DOCKERHUB_USER = "your-dockerhub-username"
        IMAGE_NAME = "strapi"
        KUBE_NAMESPACE = "dev"
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/your-org/your-strapi-repo.git'
            }
        }

        stage('Run Pre-Build Script') {
            steps {
                sh 'chmod +x ./my-strapi-app/script.sh'
                sh './my-strapi-app/script.sh'
            }
        }

        stage('Build & Push Docker Image') {
            steps {
                script {
                    docker.withRegistry("https://${REGISTRY}", "dockerhub-creds") {
                        def app = docker.build("${DOCKERHUB_USER}/${IMAGE_NAME}:${BUILD_NUMBER}")
                        app.push()
                        app.push("latest")
                    }
                }
            }
        }

        stage('Deploy to AKS') {
            steps {
                sh """
                  export KUBECONFIG=\$(pwd)/k8s.yaml
                  # Replace image tag in deployment.yaml before applying
                  sed -i 's#niuasunbird/strapi:5.20v4#${DOCKERHUB_USER}/${IMAGE_NAME}:${BUILD_NUMBER}#' k8s/deployment.yaml
                  #kubectl apply -f k8s/deployment.yaml
                  #kubectl -n ${KUBE_NAMESPACE} rollout status deployment/strapi
                """
            }
        }
    }
}

