# Jobs and Services

 Using Jobs to execute our ML workloads and Services to deploy our models in production.

 &middot;
 &middot;
 &middot;

 [Notebook](https://github.com/GokuMohandas/Made-With-ML/blob/main/notebooks/madewithml.ipynb)

 &times;

## Intuition

Our ML workloads have been responsible for everything from data ingestion to model validation:

 ![ML workloads](https://madewithml.com/static/images/mlops/systems-design/workloads.png)

We can execute these workloads as standalone [CLI commands](https://madewithml.com/courses/mlops/cli/):

```bash
# ML workloads (simplified)
pytest --dataset-loc=$DATASET_LOC tests/data ... # test data
python -m pytest tests/code --verbose --disable-warnings # test code
python madewithml/train.py --experiment-name "llm" ... # train model
python madewithml/evaluate.py --run-id $RUN_ID ... # evaluate model
pytest --run-id=$RUN_ID tests/model ... # test model
python madewithml/serve.py --run_id $RUN_ID # serve model
```

With all of our ML workloads implemented (and tested), we're ready to go to production. In this lesson, we'll learn how to convert our ML workloads from CLI commands into a scalable, fault-tolerant and reproducible workflow.

- We'll combine our ML workloads up to (and including) model validation into a workflow.

- This workflow will then produce model artifacts, which will be saved to our model registry.

- And finally, we can serve that model behind an API endpoint to use in production.

 ![manual deployment](https://madewithml.com/static/images/mlops/jobs_and_services/manual.png)

## Jobs

### Script

Since we have our CLI commands for our ML workloads, we could just execute them one-by-one on our local machine or Workspace. But for efficiency, we're going to combine them all into one script. We'll organize this under a [workloads.sh](https://github.com/GokuMohandas/Made-With-ML/blob/main/deploy/jobs/workloads.sh) bash script inside our [deploy/jobs](https://github.com/GokuMohandas/Made-With-ML/tree/main/deploy/jobs) directory. Here the workloads are very similar to our CLI commands but we have some additional steps to print and save the logs from each of our workloads. For example, our data validation workload looks like this:

```
# deploy/jobs/workloads.yaml
name: workloads
project_id: prj_v9izs5t1d6b512ism8c5rkq4wm
cluster_env: madewithml-cluster-env
compute_config: madewithml-cluster-compute
runtime_env:
 working_dir: .
 upload_path: s3://madewithml/GokuMohandas/jobs # <--- CHANGE USERNAME (case-sensitive)
 env_vars:
 GITHUB_USERNAME: GokuMohandas # <--- CHANGE USERNAME (case-sensitive)
entrypoint: bash deploy/jobs/workloads.sh
max_retries: 0
```

- `Line 2`: name of our Anyscale Job

- `Line 3`: name of our Anyscale Project (we're organizing it all under the same `madewithml` project we used for our [Workspace setup](https://madewithml.com/courses/mlops/setup/#workspaces))

- `Line 4`: name of our cluster environment

- `Line 5`: name of our compute configuration

- `Line 6-10`: runtime environment for our Anyscale Job. The `runtime_env` here specifies that we should upload our current `working_dir` to an S3 bucket so that all of our workers when we execute an Anyscale Job have access to the code to use. We also set some environment variables that our workloads will have access to.

- `Line 11`: entrypoint for our Anyscale Job. This is the command that will be executed when we submit our Anyscale Job.

- `Line 12`: maximum number of retries for our Anyscale Job. If our Anyscale Job fails, it will automatically retry up to this number of times.

> **Warning**

Be sure to update the `$GITHUB_USERNAME` slots inside our `deploy/jobs/workloads.yaml` configuration to your own GitHub username. This is used to save your model registry and results to a unique path on our shared S3 bucket (`s3://madewithml`).

Because we're using the exact same cluster environment and compute configuration, what worked during development will work in production. This is a huge benefit of using Anyscale Jobs because we don't have to worry about any environment discrepanices when we deploy our workloads to production. This makes going to production much easier and faster!

### Execution

And now we can execute our Anyscale Job in one line:

```python
# deploy/services/serve_model.py

import os
import subprocess
from madewithml.config import MODEL_REGISTRY # NOQA: E402
from madewithml.serve import ModelDeployment # NOQA: E402

# Copy from S3
github_username = os.environ.get("GITHUB_USERNAME")
subprocess.check_output(["aws", "s3", "cp", f"s3://madewithml/{github_username}/mlflow/", str(MODEL_REGISTRY), "--recursive"])
subprocess.check_output(["aws", "s3", "cp", f"s3://madewithml/{github_username}/results/", "./", "--recursive"])

# Entrypoint
run_id = [line.strip() for line in open("run_id.txt")][0]
entrypoint = ModelDeployment.bind(run_id=run_id, threshold=0.9)

# Inference
data = {"query": "What is the default batch size for map_batches?"}
response = requests.post("http://127.0.0.1:8000/query", json=data)
print(response.json())

# Inference
data = {"query": "What is the default batch size for map_batches?"}
response = requests.post("http://127.0.0.1:8000/query", json=data)
print(response.json())
```

In this script, we first pull our previously saved artifacts from our S3 bucket to our local storage and then define the entrypoint for our model.

> **Tip**

Recall that we have the option to [scale](https://docs.ray.io/en/latest/serve/scaling-and-resource-allocation.html) when we define our service inside out `madewithml/serve.py` script. And we can [scale](https://madewithml.com/courses/mlops/jobs-and-services/#scaling) our compute configuration to meet those demands.

```python
# madewithml/serve.py
@serve.deployment(route_prefix="/", num_replicas="1", ray_actor_options={"num_cpus": 8, "num_gpus": 0})
@serve.ingress(app)
class ModelDeployment:
 pass
```

### Configuration

We can now use this `entrypoint` that we defined to serve our application:

```
# deploy/services/serve_model.yaml
name: madewithml
project_id: prj_v9izs5t1d6b512ism8c5rkq4wm
cluster_env: madewithml-cluster-env
compute_config: madewithml-cluster-compute
ray_serve_config:
 import_path: deploy.services.serve_model:entrypoint
 runtime_env:
 working_dir: .
 upload_path: s3://madewithml/GokuMohandas/services # <--- CHANGE USERNAME (case-sensitive)
 env_vars:
 GITHUB_USERNAME: GokuMohandas # <--- CHANGE USERNAME (case-sensitive)
rollout_strategy: ROLLOUT # ROLLOUT or IN_PLACE
```

- `Line 2`: name of our Anyscale Service

- `Line 3`: name of our Anyscale Project (we're organizing it all under the same `madewithml` project we used for our [Workspace setup](https://madewithml.com/courses/mlops/setup/#workspaces))

- `Line 4`: name of our cluster environment

- `Line 5`: name of our compute configuration

- `Line 6-12`: serving configuration that specifies our entry point and details about the working directory, environment variables, etc.

- `Line 13`: rollout strategy for our Anyscale Service. We can either rollout a new version of our service or replace the existing version with the new one.

> **Warning**

Be sure to update the `$GITHUB_USERNAME` slots inside our `deploy/services/serve_model.yaml` configuration to your own GitHub username. This is used to pull model artifacts and results from our shared S3 bucket (`s3://madewithml`).

### Execution

And now we can execute our Anyscale Service in one line:

```
name: madewithml
project_id: prj_v9izs5t1d6b512ism8c5rkq4wm
cluster_env: madewithml-cluster-env
compute_config:
 cloud: anyscale-v2-cloud-fast-startup
 max_workers: 20
 head_node_type:
 name: head_node_type
 instance_type: m5.4xlarge
 worker_node_types:
 - name: gpu_worker
 instance_type: g4dn.4xlarge
 min_workers: 1
 max_workers: 8
 aws:
 BlockDeviceMappings:
 - DeviceName: "/dev/sda1"
 Ebs:
 VolumeSize: 500
 DeleteOnTermination: true
...
```

And with that, we're able to completely productionize our ML workloads! We have a working service that we can use to make predictions using our trained model. However, what happens when we receive new data or our model's performance regresses over time? With our current approach here, we have to manually execute our Jobs and Services again to udpate our application. In the next lesson, we'll learn how to automate this process with [CI/CD workflows](https://madewithml.com/courses/mlops/cicd/) that execute our Jobs and Services based on an event (e.g. new data).

> **Upcoming live cohorts**

Sign up for our upcoming live cohort, where we'll provide live lessons + QA**, **compute (GPUs)** and **community** to learn everything in one day.

 Learn more

To cite this content, please use:

```
@article{madewithml,
 author = {Goku Mohandas},
 title = { Jobs & Services - Made With ML },
 howpublished = {\url{https://madewithml.com/}},
 year = {2023}
}
```
