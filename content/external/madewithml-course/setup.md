# Setup

 Setting up our development environment for local and Anyscale development.

 &middot;
 &middot;
 &middot;

 [Notebook](https://github.com/GokuMohandas/Made-With-ML/blob/main/notebooks/madewithml.ipynb)

 &times;

 Subscribe

In this lesson, we'll setup the development environment that we'll be using in all of our lessons. We'll have instructions for both local laptop and remote scalable clusters ([Anyscale](https://anyscale.com/)). While everything will work locally on your laptop, you can sign up to join one of our upcoming live cohorts where we'll provide **live lessons + QA**, **compute (GPUs)** and **community** to learn everything in one day → [sign up here](https://4190urw86oh.typeform.com/madewithml).

## Cluster

We'll start with defining our cluster, which refers to a group of servers that come together to form one system. Our clusters will have a [head node](https://docs.ray.io/en/latest/cluster/key-concepts.html#head-node) that manages the cluster and it will be connected to a set of [worker nodes](https://docs.ray.io/en/latest/cluster/key-concepts.html#head-node) that will execute workloads for us. These clusters can be fixed in size or [autoscale](https://docs.ray.io/en/latest/cluster/key-concepts.html#cluster-autoscaler) based on our application's compute needs, which makes them highly scalable and performant. We'll create our cluster by defining a compute configuration and an environment.

### Environment

We'll start by defining our cluster environment which will specify the software dependencies that we'll need for our workloads.

> **💻 Local**

Your personal laptop will need to have Python installed and we highly recommend using Python `3.10`. You can use a tool like [pyenv](https://github.com/pyenv/pyenv) (mac) or [pyenv-win](https://github.com/pyenv-win/pyenv-win) (windows) to easily download and switch between Python versions.

```bash
base_image: anyscale/ray:2.6.0-py310-cu118
env_vars: {}
debian_packages:
 - curl

python:
 pip_packages: []
 conda_packages: []

post_build_cmds:
 - python3 -m pip install --upgrade pip setuptools wheel
 - python3 -m pip install -r https://raw.githubusercontent.com/GokuMohandas/Made-With-ML/main/requirements.txt
```

We could specify any python packages inside `pip_packages` or `conda_packages` but we're going to use a [requirements.txt](https://github.com/GokuMohandas/Made-With-ML/blob/main/requirements.txt) file to load our dependencies under `post_build_cmds`.

### Compute

Next, we'll define our compute configuration, which will specify our hardware dependencies (head and worker nodes) that we'll need for our workloads.

> **💻 Local**

Your personal laptop (single machine) will act as the cluster, where one CPU will be the head node and some of the remaining CPU will be the worker nodes (no GPUs required). All of the code in this course will work in any personal laptop though it will be slower than executing the same workloads on a larger cluster.

> **🚀 Anyscale**

Our cluster compute will be defined inside a [cluster_compute.yaml](https://github.com/GokuMohandas/Made-With-ML/blob/main/deploy/cluster_compute.yaml) file. Here we specify some details around where our compute resources will come from (cloud computing platform like AWS), types of nodes and their counts, etc.

```yaml
cloud: madewithml-us-east-2
region: us-east2
head_node_type:
 name: head_node_type
 instance_type: m5.2xlarge # 8 CPU, 0 GPU, 32 GB RAM
worker_node_types:
- name: gpu_worker
 instance_type: g4dn.xlarge # 4 CPU, 1 GPU, 16 GB RAM
 min_workers: 0
 max_workers: 1
...
```

Our worker nodes will be GPU-enabled so we can train our models faster and we set `min_workers` to 0 so that we can autoscale these workers only when they're needed (up to a maximum of `max_workers`). This will help us significantly reduce our compute costs without having to manage the infrastructure ourselves.

## Workspaces

With our compute and environment defined, we're ready to create our cluster workspace. This is where we'll be developing our ML application on top of our compute, environment and storage.

> **💻 Local**

Your personal laptop will need to have an interactive development environment (IDE) installed, such as [VS Code](https://code.visualstudio.com/). For bash commands in this course, you're welcome to use the terminal on VSCode or a separate one.

> **🚀 Anyscale**

We're going to launch an Anyscale [Workspace](https://docs.anyscale.com/develop/workspaces/get-started) to do all of our development in. Workspaces allow us to use development tools such as VSCode, Jupyter notebooks, web terminal, etc. on top of our cluster compute, environment and [storage](https://docs.anyscale.com/develop/workspaces/storage). This create an "infinite laptop" experience that feels like a local laptop experience but on a powerful, scalable cluster.

 ![Anyscale Workspaces](https://madewithml.com/static/images/mlops/setup/workspaces.png)

We have the option to create our Workspace using a [CLI](https://docs.anyscale.com/reference/anyscale-cli) but we're going to create it using the [web UI](https://console.anyscale.com/o/madewithml/workspaces/add/blank) (you will receive the required credentials during the cohort). On the UI, we can fill in the following information:

```python
import ray
```

```bash
# Initialize Ray
if ray.is_initialized():
 ray.shutdown()
ray.init()
```

We can also view our cluster resources to view the available compute resources:

```bash
ray.cluster_resources()
```

> **💻 Local**

If you are running this on a local laptop (no GPU), use the CPU count from `ray.cluster_resources()` to set your resources. For example if your machine has 10 CPUs:

{'CPU': 10.0,
 'object_store_memory': 2147483648.0,
 'node:127.0.0.1': 1.0}

```
@article{madewithml,
 author = {Goku Mohandas},
 title = { Setup - Made With ML },
 howpublished = {\url{https://madewithml.com/}},
 year = {2023}
}
```
