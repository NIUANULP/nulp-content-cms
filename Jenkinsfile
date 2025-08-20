pipeline {
    agent any

  environment {
    IMAGE_TAG = "${env.BUILD_NUMBER}"
    PREV_BUILD = "${env.BUILD_NUMBER.toInteger() - 1}"
    REGISTRY = "docker.io"
  }

  stages {

    stage('Load Config from Credentials') {
      steps {
        withCredentials([
          string(credentialsId: 'docker-strapi-image', variable: 'IMAGE_NAME'),
          string(credentialsId: 'git-user', variable: 'GIT_USER')
        ]) {
          script {
            env.IMAGE_NAME   = IMAGE_NAME
            env.GIT_USER     = GIT_USER
          }
        }
      }
    }


    stage('Cleanup Previous strapi Image') {
      steps {
        sh '''
          echo "Attempting to remove previous image: ${IMAGE_NAME}:${PREV_BUILD} (if exists)..."
          docker rmi ${IMAGE_NAME}:${PREV_BUILD} || true
        '''
      }
    }



        stage('Run Pre-Build Script') {
            steps {
                sh 'chmod +x ./my-strapi-app/script.sh'
                sh './my-strapi-app/script.sh'
            }
        }



    stage('Build Docker Image') {
      steps {
          sh """
            docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
          """
        }
      }




    stage('Push to Docker Hub') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'docker-hub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
          sh """
            echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
            docker push ${IMAGE_NAME}:${IMAGE_TAG}
          """
        }
      }
    }


        stage('Deploy to AKS') {
            steps {
                sh """
                  export KUBECONFIG=/var/lib/jenkins/secrets/dev_k8s.yaml
                  # Replace image tag in deployment.yaml before applying
                  sed -i 's#niuasunbird/strapi:5.20v4#${IMAGE_NAME}:${IMAGE_TAG}#' k8s/deploy.yaml

                """
            }
        }
    }
}

