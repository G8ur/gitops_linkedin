Local GitOps Platform
This repository contains the declarative infrastructure and deployment manifests for a fully automated, local GitOps pipeline. Built to simulate a production-grade platform engineering environment, it utilizes K3d (Kubernetes) for local infrastructure, GitHub as the single source of truth, and ArgoCD as the continuous delivery controller. Any changes merged into this repository are automatically detected and synchronized to the cluster, eliminating configuration drift and manual kubectl interventions.

🏗️ Architecture & Tech Stack
Docker & K3d: K3d runs a lightweight Kubernetes cluster inside Docker containers to simulate a real infrastructure environment directly on a local machine without incurring cloud costs.

GitHub: Acts as the immutable, version-controlled source of truth (the "Git" in GitOps).

ArgoCD: Installed inside Kubernetes, it acts as a "pull" mechanism. It continuously monitors the GitHub repository and automatically synchronizes the cluster to match Git.

Nginx: A simple, lightweight web server used as the containerized test application.

📋 Prerequisites
To run this project locally, ensure you have the following installed:

Docker (to build containers and run the local cluster)

K3d (lightweight Kubernetes wrapper)

Kubectl (Kubernetes command-line tool)

Git


Free accounts on Docker Hub and GitHub


🚀 Step-by-Step Project Setup
1. Application Containerization
Create a directory named my-web-app locally and add the following two files:

index.html


HTML
<!DOCTYPE html>
<html>
<body>
  <h1>Welcome to my GitOps Platform Engineering Project!</h1>
  <p>Version 1.0</p>
</body>
</html>
Dockerfile


Dockerfile
FROM nginx:alpine
COPY index.html /usr/share/nginx/html/index.html
EXPOSE 80
Build and push the image to Docker Hub, replacing YOUR_DOCKER_USER with your actual username:

Bash
docker login
docker build -t YOUR_DOCKER_USER/gitops-app:v1 .
docker push YOUR_DOCKER_USER/gitops-app:v1
2. Infrastructure Initialization
Create the local Kubernetes cluster using K3d. This command automatically maps port 8080 on your local machine to the cluster load balancer's port 80:

Bash
k3d cluster create gitops-cluster -p "8080:80@loadbalancer"
3. The Source of Truth (GitHub Configuration)
Create a new public repository on GitHub named gitops-manifests (this repository). Add the following declarative Kubernetes configurations to define the infrastructure:

deployment.yaml


YAML
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gitops-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: gitops-app
  template:
    metadata:
      labels:
        app: gitops-app
    spec:
      containers:
      - name: web
        image: YOUR_DOCKER_USER/gitops-app:v1
        ports:
        - containerPort: 80
service.yaml


YAML
apiVersion: v1
kind: Service
metadata:
  name: gitops-service
spec:
  type: LoadBalancer
  selector:
    app: gitops-app
  ports:
  - port: 80
    targetPort: 80
Commit and push these files to the main branch.

4. Installing ArgoCD
Install ArgoCD directly into the local K3d cluster:

Bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl wait --for=condition=Ready pods --all -n argocd --timeout=300s
(Optional) To access the ArgoCD UI visually:

Bash
# Get the auto-generated admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d; echo

# Port-forward to access at https://localhost:8443
kubectl port-forward svc/argocd-server -n argocd 8443:443
5. Connecting the Automated Pipeline
To bridge the cluster to GitHub, create the following "Application" resource. Note: Save this file locally on your machine, not in the GitHub repository. Replace YOUR_GITHUB_USER with your handle.

argocd-app.yaml


YAML
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: gitops-pipeline
  namespace: argocd
spec:
  project: default
  source:
    repoURL: 'https://github.com/YOUR_GITHUB_USER/gitops-manifests.git'
    targetRevision: HEAD
    path: .
  destination:
    server: 'https://kubernetes.default.svc'
    namespace: default
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
Apply the pipeline configuration locally:

Bash
kubectl apply -f argocd-app.yaml
ArgoCD instantly pulls the manifests from GitHub and deploys the application. You can view the live app by navigating to http://localhost:8080 in your web browser.

🧪 Testing the GitOps Workflow
This project establishes a zero-touch pipeline where you never need to run kubectl apply manually. You can verify the automation in two ways:

Automated Scaling: Open deployment.yaml in this GitHub repository and change replicas: 2 to replicas: 5. Commit the change. Within minutes, ArgoCD automatically detects the configuration drift and scales the local cluster to match.

Self-Healing: If someone manually deletes a pod in the cluster, ArgoCD instantly notices the live state no longer matches Git. It will automatically spin up a replacement pod to restore the correct replica count without any human intervention.