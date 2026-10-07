pipeline {
    agent any

    environment {
        PATH = "/opt/homebrew/bin:${env.PATH}"
    }

    stages {
        stage('Frontend Build') {
            steps {
                dir('OneSpace_Phase1') {
                    sh 'npm ci'
                    sh 'npm run build'
                }
            }
        }

        stage('Backend Build') {
            steps {
                dir('OneSpace_Phase1/server') {
                    sh 'npm ci'
                    sh 'npm test'
                }
            }
        }

        stage('Docker Build') {
            steps {
                sh 'docker build -t onespace:${BUILD_NUMBER} .'
            }
        }

        stage('Docker Health Test') {
            steps {
                sh '''
                    docker rm -f onespace-ci-test 2>/dev/null || true
                    docker run -d \
                        --name onespace-ci-test \
                        -p 5002:5000 \
                        onespace:${BUILD_NUMBER}

                    sleep 3

                    curl --fail http://127.0.0.1:5002/api/health
                    curl --fail http://127.0.0.1:5002/index.html

                    docker rm -f onespace-ci-test
                '''
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    docker rm -f onespace-app 2>/dev/null || true
                    docker run -d \
                        --name onespace-app \
                        -p 5001:5000 \
                        onespace:${BUILD_NUMBER}
                '''
            }
        }

        stage('Post-Deploy Verification') {
            steps {
                sh '''
                    sleep 3

                    curl --fail http://127.0.0.1:5001/api/health
                    curl --fail http://127.0.0.1:5001/index.html
                '''
            }
        }
    }

    post {
        always {
            sh 'docker rm -f onespace-ci-test 2>/dev/null || true'
        }
    }
}
