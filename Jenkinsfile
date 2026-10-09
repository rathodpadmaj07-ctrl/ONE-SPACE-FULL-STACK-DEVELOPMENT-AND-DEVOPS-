
pipeline {
    agent any

    parameters {
        booleanParam(
            name: 'SIMULATE_DEPLOY_FAILURE',
            defaultValue: false,
            description: 'Test automatic rollback by forcing deployment verification to fail'
        )
    }

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
                '''
            }
            post {
                always {
                    sh 'docker rm -f onespace-ci-test 2>/dev/null || true'
                }
            }
        }

        stage('Deploy with Automatic Rollback') {
            steps {
                script {
                    // Record the currently deployed image.
                    def previousImage = sh(
                        script: '''
                            docker inspect \
                                --format='{{.Config.Image}}' \
                                onespace-app 2>/dev/null || true
                        ''',
                        returnStdout: true
                    ).trim()

                    echo "Previous image: ${previousImage ?: 'none'}"

                    try {
                        // Verify the candidate before changing production.
                        sh '''
                            set -eu

                            docker rm -f onespace-next 2>/dev/null || true

                            docker run -d \
                                --name onespace-next \
                                -p 5003:5000 \
                                onespace:${BUILD_NUMBER}

                            sleep 5

                            curl --fail --silent --show-error \
                                http://127.0.0.1:5003/api/health

                            curl --fail --silent --show-error \
                                http://127.0.0.1:5003/index.html
                        '''

                        // Replace the production container.
                        sh '''
                            set -eu

                            docker rm -f onespace-app 2>/dev/null || true

                            docker run -d \
                                --name onespace-app \
                                --restart unless-stopped \
                                -p 5001:5000 \
                                onespace:${BUILD_NUMBER}

                            sleep 5

                            # TEST ONLY: deliberately fail after replacement.
                            if [ "${SIMULATE_DEPLOY_FAILURE:-false}" = "true" ]; then
                                echo "Simulating deployment failure for rollback test."
                                exit 1
                            fi

                            curl --fail --silent --show-error \
                                http://127.0.0.1:5001/api/health

                            curl --fail --silent --show-error \
                                http://127.0.0.1:5001/index.html
                        '''

                        echo "Deployment and production health checks succeeded."

                    } catch (err) {
                        echo "Deployment failed. Attempting automatic rollback."

                        // Remove failed production and candidate containers.
                        sh '''
                            docker rm -f onespace-next onespace-app \
                                2>/dev/null || true
                        '''

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
                                echo "Rollback failed. Check Docker logs."
                                sh 'docker logs onespace-app 2>&1 || true'
                                throw rollbackError
                            }
                        } else {
                            error(
                                'No previous image was recorded; automatic rollback is unavailable.'
                            )
                        }

                        // The build remains failed even if rollback succeeds.
                        throw err

                    } finally {
                        sh 'docker rm -f onespace-next 2>/dev/null || true'
                    }
                }
            }
        }
    }

    post {
        always {
            sh '''
                docker rm -f onespace-ci-test 2>/dev/null || true
                docker rm -f onespace-next 2>/dev/null || true
            '''
        }
    }
}
