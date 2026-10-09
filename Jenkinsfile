
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
            post {
                always {
                    junit testResults: 'OneSpace_Phase1/server/report.xml',
                          allowEmptyResults: true
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
                    set -eu

                    docker rm -f onespace-ci-test 2>/dev/null || true

                    docker run -d \
                        --name onespace-ci-test \
                        -p 5002:5000 \
                        onespace:${BUILD_NUMBER}

                    sleep 5

                    curl --fail --silent --show-error \
                        http://127.0.0.1:5002/api/health

                    curl --fail --silent --show-error \
                        http://127.0.0.1:5002/index.html

                    docker rm -f onespace-ci-test
                '''
            }
        }

        stage('Deploy with Automatic Rollback') {
            steps {
                script {
                    // Remember the image currently deployed.
                    def previousImage = sh(
                        script: '''
                            docker inspect \
                                --format='{{.Config.Image}}' \
                                onespace-app 2>/dev/null || true
                        ''',
                        returnStdout: true
                    ).trim()

                    echo "Previous image: ${
                        previousImage ? previousImage : 'none'
                    }"

                    try {
                        sh '''
                            set -eu

                            docker rm -f onespace-app 2>/dev/null || true

                            docker run -d \
                                --name onespace-app \
                                --restart unless-stopped \
                                -p 5001:5000 \
                                onespace:${BUILD_NUMBER}

                            sleep 5

                            curl --fail --silent --show-error \
                                http://127.0.0.1:5001/api/health

                            curl --fail --silent --show-error \
                                http://127.0.0.1:5001/index.html
                        '''

                        echo "Deployment and health checks succeeded."
                    } catch (err) {
                        echo "Deployment failed. Starting rollback."

                        // Remove the failed deployment.
                        sh 'docker rm -f onespace-app 2>/dev/null || true'

                        if (previousImage) {
                            try {
                                sh """
                                    set -eu

                                    docker run -d \
                                        --name onespace-app \
                                        --restart unless-stopped \
                                        -p 5001:5000 \
                                        '${previousImage}'

                                    sleep 5

                                    curl --fail --silent --show-error \
                                        http://127.0.0.1:5001/api/health

                                    curl --fail --silent --show-error \
                                        http://127.0.0.1:5001/index.html
                                """

                                echo "Rollback succeeded: ${previousImage}"
                            } catch (rollbackError) {
                                echo "Rollback also failed. Check Docker logs."
                                sh 'docker logs onespace-app 2>&1 || true'
                                throw rollbackError
                            }
                        } else {
                            echo "No previous container image was available."
                        }

                        // Keep the Jenkins build failed even if rollback works.
                        throw err
                    }
                }
            }
        }
    }

    post {
        always {
            sh 'docker rm -f onespace-ci-test 2>/dev/null || true'
        }
    }
}
