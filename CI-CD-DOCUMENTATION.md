# OneSpace CI/CD Pipeline Documentation

## 1. Project Overview

This project implements a Continuous Integration and Continuous Deployment (CI/CD) pipeline for the OneSpace full-stack application using Jenkins and Docker.

The pipeline automates frontend building, backend testing, Docker image creation, application health checks, and deployment.

## 2. Technology Stack

- **Frontend:** React and Vite
- **Backend:** Node.js and Express
- **Testing:** Node.js test runner and Supertest
- **CI/CD:** Jenkins
- **Containerization:** Docker
- **Version Control:** Git and GitHub

## 3. Pipeline Workflow

1. A developer pushes code to GitHub.
2. Jenkins polls the repository for changes.
3. Jenkins installs frontend dependencies and builds the frontend.
4. Jenkins installs backend dependencies and runs automated tests.
5. Jenkins publishes the JUnit test report.
6. Jenkins builds a versioned Docker image.
7. Jenkins runs the image temporarily and checks the backend health endpoint and frontend page.
8. Jenkins deploys the image on port 5001.
9. Jenkins verifies the deployed application.
10. If deployment verification fails, the pipeline attempts to restore the previously deployed Docker image.

## 4. Automated Testing and Reporting

The backend uses Node.js's built-in test runner and Supertest.

The current tests verify:
- `GET /api/health` returns HTTP 200 and the expected response.
- An unknown API route returns HTTP 404 and the expected response.

Jenkins publishes test results in JUnit format. The latest verified report contained two passing tests and zero failures.

The generated report is stored locally as `OneSpace_Phase1/server/report.xml` and excluded from Git tracking.

## 5. Docker Deployment

Docker images are tagged using the Jenkins build number, for example:

`onespace:17`

The pipeline uses:
- Port `5002` for temporary Docker health checks.
- Port `5001` for the deployed application.
- Container name `onespace-app` for the deployment.

The backend health endpoint is:

`http://127.0.0.1:5001/api/health`

The frontend is verified at:

`http://127.0.0.1:5001/index.html`

## 6. Rollback

The pipeline contains logic to capture the currently deployed image before deployment.

If deployment or its health checks fail, Jenkins attempts to remove the failed container, start the previously deployed image, and verify the restored application.

A separate Jenkins job, `ONE-SPACE-ROLLBACK-TEST`, was used to test the restoration procedure in an isolated container on port `5998`. The test successfully restored `onespace:17`, verified the backend and frontend, and removed the temporary container.

**Limitation:** The isolated test passed, but the automatic rollback branch in the production deployment pipeline has not yet been triggered by a real deployment failure.

## 7. Running the Pipeline

1. Start Docker Desktop.
2. Start Jenkins if it is stopped:

   `brew services start jenkins`

3. Open Jenkins at `http://localhost:8080`.
4. Push changes to the configured GitHub branch.
5. Open the `ONE-SPACE-CI` job and review the build stages and test report.

## 8. Current Verification Status

- Frontend build: verified.
- Backend tests: two tests passed.
- JUnit reporting: verified.
- Docker image build: verified.
- Docker health checks: verified.
- Deployment: verified.
- Manual rollback: verified.
- Isolated rollback procedure: verified.
- Production automatic rollback under a real failure: pending validation.

## 9. Conclusion

The OneSpace project demonstrates a Jenkins-based CI/CD workflow that integrates GitHub, automated testing, JUnit reporting, Docker image creation, health checks, and deployment. It also includes a rollback mechanism intended to restore the previously deployed image if deployment verification fails.