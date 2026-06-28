# CI/CD for Machine Learning

 Using workflows to establish continuous integration and delivery pipelines to reliably iterate on our application.

 &middot;
 &middot;
 &middot;

 &times;

## Intuition

In the [previous lesson](https://madewithml.com/courses/mlops/jobs-and-services/), we learned how to manually execute our ML workloads with Jobs and Services. However, we want to be able to automatically execute these workloads when certain events occur (new data, performance regressions, elapsed time, etc.) to ensure that our models are always up to date and increasing in quality. In this lesson, we'll learn how to create continuous integration and delivery (CI/CD) pipelines to achieve an application that is capable of continual learning.

## GitHub Actions

We're going to use [GitHub Actions](https://docs.github.com/en/actions) to create our CI/CD pipelines. GitHub Actions allow us to define workflows that are triggered by events (pull request, push, etc.) and execute a series of actions.

 ![ci/cd workflows](https://madewithml.com/static/images/mlops/cicd/cicd.png)

Our GitHub Actions are defined under our repository's `.github/workflows` directory where we have workflows for documentation ([documentation.yaml](https://github.com/GokuMohandas/Made-With-ML/blob/main/.github/workflows/documentation.yaml)), workloads ([workloads.yaml](https://github.com/GokuMohandas/Made-With-ML/blob/main/.github/workflows/workloads.yaml)) to train/validate a model and a final workflow for serving our model ([serve.yaml](https://github.com/GokuMohandas/Made-With-ML/blob/main/.github/workflows/serve.yaml)). Let's start by understanding the structure of a workflow.

### Events

Workflows are triggered by an **event**, which can be something that occurs on an event (like a [push](https://docs.github.com/en/actions/reference/events-that-trigger-workflows#push) or [pull request](https://docs.github.com/en/actions/reference/events-that-trigger-workflows#pull_request)), schedule ([cron](https://pubs.opengroup.org/onlinepubs/9699919799/utilities/crontab.html)), [manually](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#workflow_dispatch) and [many more](https://docs.github.com/en/actions/reference/events-that-trigger-workflows). In our application, our `workloads` workflow is triggered on a pull request to the main branch and then our `serve` workflow and `documentation` workflows are triggered on a push to the main branch.

```
# .github/workflows/workloads.yaml
name: workloads
on:
 workflow_dispatch: # manual
 pull_request:
 branches:
 - main
...
```

This creates for the following ideal workflow:

- We make changes to our code and submit a pull request to the `main` branch.

- Our `workloads` workflow is triggered and executes our model development workloads.

- If the performance of the new model is better, we can merge the pull request and push the changes to the `main` branch.

- Our `serve` workflow is triggered and deploys our application to production (along with an update to our `documentation`).

### Jobs

Once the event is triggered, a set of `jobs` run on a [runner](https://github.com/actions/runner) (GitHub's infrastructure or self-hosted).

```
# .github/workflows/workloads.yaml
...
jobs:
 workloads:
 runs-on: ubuntu-22.04
 ...
```

> **Tip**

Each of our workflows only have one job but if we had multiple, the jobs would all run in parallel. If we wanted to create dependent jobs, where if a particular job fails all it's dependent jobs will be skipped, then we'd use the [needs](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions#jobsjob_idneeds) keyword.

### Steps

Each job contains a series of **steps** which are executed in order. Each step has a name, as well as actions to use from the GitHub Action marketplace and/or commands we want to run. For example, here's a look at one of the steps in our `workloads` job inside our `workloads.yaml` workflow:

```
# .github/workflows/testing.yml
jobs:
 workloads:
 runs-on: ubuntu-22.04
 steps:
 ...
 # Run workloads
 - name: Workloads
 run: |
 export ANYSCALE_HOST=$\{\{ secrets.ANYSCALE_HOST \}\}
 export ANYSCALE_CLI_TOKEN=$\{\{ secrets.ANYSCALE_CLI_TOKEN \}\}
 anyscale jobs submit deploy/jobs/workloads.yaml --wait
 ...
```

## Workflows

Now that we understand the basic components of a GitHub Actions workflow, let's take a closer look at each of our workflows. Most of our workflows will require access to our Anyscale credentials so we'll start by setting those up. We can set these secrets for our repository under the [Settings](https://docs.github.com/en/actions/security-guides/encrypted-secrets#creating-encrypted-secrets-for-a-repository) tab.

 ![github actions secrets](https://madewithml.com/static/images/mlops/cicd/secrets.png)

And our first workflow will be our `workloads` workflow which will be triggered on a pull request to the `main` branch. This means that we'll need to push our local code changes to Git and then submit a pull request to the `main` branch. But in order to push our code to GitHub, we'll need to first authenticate with our credentials before pushing to our repository:

```
# Configure AWS credentials
- name: Configure AWS credentials
uses: aws-actions/configure-aws-credentials@v2
with:
 role-to-assume: arn:aws:iam::593241322649:role/github-actions-madewithml
 role-session-name: s3access
 aws-region: us-west-2
```

- Next, we checkout our repository code and install our Python dependencies so that we can execute our Anyscale Job.

```
# Set up dependencies
- uses: actions/checkout@v3
- uses: actions/setup-python@v4
with:
 python-version: '3.10.11'
 cache: 'pip'
- run: python3 -m pip install anyscale==0.5.128 typer==0.9.0
```

- Next, we can run our Anyscale Job but note that since this will be running on a GitHub hosted runner, we need to export our Anyscale credentials first (which we already set up earlier on our repository).

```
# Run workloads
- name: Workloads
run: |
 export ANYSCALE_HOST=$\{\{ secrets.ANYSCALE_HOST \}\}
 export ANYSCALE_CLI_TOKEN=$\{\{ secrets.ANYSCALE_CLI_TOKEN \}\}
 anyscale jobs submit deploy/jobs/workloads.yaml --wait
```

- Recall that our Anyscale Job in the previous step saves our model registry and results to S3 buckets. So in this step, we'll read the artifacts from S3 (from our unique path using our GitHub username) and save them locally on our GitHub runner. We have a small utility script called `.github/workflows/json_to_md.py` to convert our JSON results to markdown tables that we can comment on our PR.

```
# Read results from S3
- name: Read results from S3
run: |
 mkdir results
 aws s3 cp s3://madewithml/$\{\{ github.actor \}\}/results/ results/ --recursive
 python .github/workflows/json_to_md.py results/training_results.json results/training_results.md
 python .github/workflows/json_to_md.py results/evaluation_results.json results/evaluation_results.md
```

- We use a GitHub Action from the marketplace to comment our results markdown tables on our PR.

```
# Comment results to PR
- name: Comment training results on PR
uses: thollander/actions-comment-pull-request@v2
with:
 filePath: results/training_results.md
- name: Comment evaluation results on PR
uses: thollander/actions-comment-pull-request@v2
with:
 filePath: results/evaluation_results.md
```

So when this `workloads` workflow completes, we'll have a comment on our PR ([example](https://github.com/GokuMohandas/Made-With-ML/pull/230)) with our training and evaluation results. We can now collaboratively analyze the details and decide if we want to merge the PR.

 ![comments on PR](https://madewithml.com/static/images/mlops/cicd/comments.png)

> **Tip**

We could easily extend this by retrieving evaluation results from our currently deployed model in production as well. Recall that we defined a `/evaluate/` endpoint for our service that expects a dataset location and returns the evaluation results. And we can submit this request as a step in our workflow and save the results to a markdown table that we can comment on our PR.

```
# .github/workflows/serve.yaml
name: serve
on:
 workflow_dispatch: # manual
 push:
 branches:
 - main
...
```

It contains a single job that serves our model with Anyscale Services. The steps in this job are as follows:

- We start by configuring our AWS credentials so that we can push/pull from our S3 buckets. Recall that we store our model registry and results in S3 buckets so we need to be able to access them.

```
# Configure AWS credentials
- name: Configure AWS credentials
uses: aws-actions/configure-aws-credentials@v2
with:
 role-to-assume: arn:aws:iam::593241322649:role/github-actions-madewithml
 role-session-name: s3access
 aws-region: us-west-2
```

- Next, we checkout our repository code and install our Python dependencies so that we can execute our Anyscale Job.

```
# Set up dependencies
- uses: actions/checkout@v3
- uses: actions/setup-python@v4
with:
 python-version: '3.10.11'
 cache: 'pip'
- run: python3 -m pip install anyscale==0.5.128 typer==0.9.0
```

- Next, we can run our Anyscale Service but note that since this will be running on a GitHub hosted runner, we need to export our Anyscale credentials first (which we already set up earlier on our repository).

```
# Run workloads
- name: Workloads
run: |
 export ANYSCALE_HOST=$\{\{ secrets.ANYSCALE_HOST \}\}
 export ANYSCALE_CLI_TOKEN=$\{\{ secrets.ANYSCALE_CLI_TOKEN \}\}
 anyscale service rollout --service-config-file deploy/services/serve_model.yaml
```

So when this `serve` workflow completes, our model will be deployed to production and we can start making inference requests with it.

> **Note**

The `anyscale service rollout` command will update our existing service (if there was already one running) without changing the `SECRET_TOKEN` or `SERVICE_ENDPOINT`. So this means that our downstream applications that were making inference requests to our service can continue to do so without any changes.

### Documentation

Our [documentation workflow](https://github.com/GokuMohandas/Made-With-ML/blob/main/.github/workflows/documentation.yaml) is also triggered on a push to the `main` branch. It contains a single job that builds our docs. The steps in this job are as follows:

- We checkout our repository code and install our Python dependencies so that we can build our documentation.

```
# Set up dependencies
- uses: actions/checkout@v3
- uses: actions/setup-python@v4
with:
 python-version: '3.10.11'
 cache: 'pip'
- run: python3 -m pip install mkdocs==1.4.2 mkdocstrings==0.21.2 "mkdocstrings[python]>=0.18"
```

- And finally, we [deploy](https://www.mkdocs.org/user-guide/deploying-your-docs/) our documentation.

```
# Deploy docs
- name: Deploy documentation
run: mkdocs gh-deploy --force
```

## Continual learning

And with that, we're able to automatically update our ML application when ever we make changes to the code and want to trigger a new deployment. We have fully control because we can decide not to trigger an event (ex. push to `main` branch) if we're not satisfied with the results of our model development workloads. We can easily extend this to include other events (ex. new data, performance regressions, etc.) to trigger our workflows, as well as, integrate with more functionality around orchestration (ex. [Prefect](https://www.prefect.io/), [Kubeflow](https://www.kubeflow.org/), etc.), [monitoring](https://madewithml.com/courses/mlops/monitoring/), etc.

 ![continual learning](https://madewithml.com/static/images/mlops/cicd/continual.png)

> **Upcoming live cohorts**

Sign up for our upcoming live cohort, where we'll provide live lessons + QA**, **compute (GPUs)** and **community** to learn everything in one day.

 Learn more

To cite this content, please use:

```
@article{madewithml,
 author = {Goku Mohandas},
 title = { CI/CD workflows - Made With ML },
 howpublished = {\url{https://madewithml.com/}},
 year = {2023}
}
```
