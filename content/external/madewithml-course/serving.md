# Model Serving

 Serve machine learning models in a scalable and fault-tolerant manner.

 &middot;
 &middot;
 &middot;

 [Notebook](https://github.com/GokuMohandas/Made-With-ML/blob/main/notebooks/madewithml.ipynb)

 &times;

## Intuition

In this lesson, we're going to serve the machine learning models that we have developed so that we can use them to make predictions on unseen data. And we want to be able to serve our models in a scalable and robust manner so it can deliver high throughput (handle many requests) and low latency (quickly respond to each request). In an effort to be comprehensive, we will implement both batch inference (offline) and online inference (real-time), though we will focus on the latter in the remaining lessons as it's more appropriate for our application.

## Frameworks

There are many frameworks to choose from when it comes to model serving, such as [Ray Serve](https://www.ray.io/ray-serve), [Nvidia Triton](https://developer.nvidia.com/triton-inference-server), [HuggingFace](https://ui.endpoints.huggingface.co/), [Bento ML](https://www.bentoml.com/), etc. When choosing between these frameworks, we want to choose the option that will allow us to:

- **Pythonic**: we don't want to learn a new framework to be able to serve our models.

- **framework agnostic**: we want to be able to serve models from all frameworks (PyTorch, TensorFlow, etc.)

- **scale**: (auto)scaling our service should be as easy as changing a configuration.

- **composition**: combine [multiple models](https://docs.ray.io/en/latest/serve/model_composition.html#serve-model-composition) and business logic into our service.

- **integrations**: integrate with popular API frameworks like [FastAPI](https://fastapi.tiangolo.com/).

To address all of these requirements (and more), we will be using [Ray Serve](https://www.ray.io/ray-serve) to create our service. While we'll be specifically using it's integration with [FastAPI](https://docs.ray.io/en/latest/serve/http-guide.html#fastapi-http-deployments), there are many other integrations you might want to explore based on your stack ([LangChain](https://python.langchain.com/docs/ecosystem/integrations/ray_serve), [Kubernetes](https://ray-project.github.io/kuberay/guidance/rayservice/), etc.).

## Batch inference

We will first implement batch inference (or offline inference), which is when we make predictions on a large batch of data. This is useful when we don't need to serve a model's prediction on input data as soon as the input data is received. For example, our service can be used to make predictions once at the end of every day on the batches of content collected throughout the day. This can be more efficient than making predictions on each content individually if we don't need that kind of low latency.

Let's take a look at our how we can easily implement batch inference with Ray Serve. We'll start with some setup and load the best checkpoint from our training run.

```python
import ray.data
from ray.train.torch import TorchPredictor
from ray.data import ActorPoolStrategy
```

```python
# Load predictor
run_id = sorted_runs.iloc[0].run_id
best_checkpoint = get_best_checkpoint(run_id=run_id)
```

Next, we'll define a `Predictor` class that will load the model from our checkpoint and then define the [__call__](https://docs.python.org/3/reference/datamodel.html#object.__call__) method that will be used to make predictions on our input data.

```python
class Predictor:
 def __init__(self, checkpoint):
 self.predictor = TorchPredictor.from_checkpoint(checkpoint)
 def __call__(self, batch):
 z = self.predictor.predict(batch)["predictions"]
 y_pred = np.stack(z).argmax(1)
 prediction = decode(y_pred, preprocessor.index_to_class)
 return {"prediction": prediction}
```

>

The `__call__` function in Python defines the logic that will be executed when our object is called like a function.

```python
predictor = Predictor()
prediction = predictor(batch)
```

To do batch inference, we'll be using the [map_batches](https://docs.ray.io/en/latest/data/api/doc/ray.data.Dataset.map_batches.html) functionality. We previously used `map_batches` to `map` (or apply) a preprocessing function across `batches` (chunks) of our data. We're now using the same concept to apply our predictor across batches of our inference data.

```python
# Batch predict
predictions = test_ds.map_batches(
 Predictor,
 batch_size=128,
 compute=ActorPoolStrategy(min_size=1, max_size=2), # scaling
 batch_format="pandas",
 fn_constructor_kwargs={"checkpoint": best_checkpoint})
```

>

Note that `best_checkpoint` as a keyword argument to our `Predictor` class so that we can load the model from that checkpoint. We can pass this in via the `fn_constructor_kwargs` argument in our [map_batches](https://docs.ray.io/en/latest/data/api/doc/ray.data.Dataset.map_batches.html) function.

```
# Sample predictions
predictions.take(3)
```

[{'prediction': 'computer-vision'},
 {'prediction': 'other'},
 {'prediction': 'other'}]

## Online inference

While we can achieve batch inference at scale, many models will need to be served in an real-time manner where we may need to deliver predictions for many incoming requests (high throughput) with low latency. We want to use online inference for our application over batch inference because we want to quickly categorize content as they are received/submitted to our platform so that the community can discover them quickly.

```python
from fastapi import FastAPI
from ray import serve
import requests
from starlette.requests import Request
```

We'll start by defining our FastAPI application which involves initializing a predictor (and preprocessor) from the best checkpoint for a particular run (specified by `run_id`). We'll also define a `predict` function that will be used to make predictions on our input data.

```python
# Define application
app = FastAPI(
 title="Made With ML",
 description="Classify machine learning projects.",
 version="0.1")
```

```python
class ModelDeployment:

 def __init__(self, run_id):
 """Initialize the model."""
 self.run_id = run_id
 mlflow.set_tracking_uri(MLFLOW_TRACKING_URI) # so workers have access to model registry
 best_checkpoint = get_best_checkpoint(run_id=run_id)
 self.predictor = TorchPredictor.from_checkpoint(best_checkpoint)
 self.preprocessor = self.predictor.get_preprocessor()

 @app.post("/predict/")
 async def _predict(self, request: Request):
 data = await request.json()
 df = pd.DataFrame([{"title": data.get("title", ""), "description": data.get("description", ""), "tag": ""}])
 results = predict_with_proba(df=df, predictor=self.predictor)
 return {"results": results}
```

>

`async def` refers to an asynchronous function (when we call the function we don't have to wait for the function to complete executing). The `await` keyword is used inside an asynchronous function to wait for the completion of the `request.json()` operation.

We can now combine our FastAPI application with Ray Serve by simply wrapping our application with the [serve.ingress](https://docs.ray.io/en/latest/serve/api/doc/ray.serve.ingress.html) decorator. We can further wrap all of this with the [serve.deployment](https://docs.ray.io/en/latest/serve/api/doc/ray.serve.Deployment.html) decorator to define our deployment configuration (ex. number of replicas, compute resources, etc.). These configurations allow us to easily [scale](https://docs.ray.io/en/latest/serve/scaling-and-resource-allocation.html) our service as needed.

```python
@serve.deployment(route_prefix="/", num_replicas="1", ray_actor_options={"num_cpus": 8, "num_gpus": 0})
@serve.ingress(app)
class ModelDeployment:
 pass
```

Now let's run our service and perform some real-time inference.

```python
# Run service
sorted_runs = mlflow.search_runs(experiment_names=[experiment_name], order_by=["metrics.val_loss ASC"])
run_id = sorted_runs.iloc[0].run_id
serve.run(ModelDeployment.bind(run_id=run_id))
```

Started detached Serve instance in namespace "serve".
Deployment 'default_ModelDeployment:IcuFap' is ready at `http://127.0.0.1:8000/`. component=serve deployment=default_ModelDeployment
RayServeSyncHandle(deployment='default_ModelDeployment')

```python
# Query
title = "Transfer learning with transformers"
description = "Using transformers for transfer learning on text classification tasks."
json_data = json.dumps({"title": title, "description": description})
requests.post("http://127.0.0.1:8000/predict/", data=json_data).json()
```

{'results': [{'prediction': 'natural-language-processing',
 'probabilities': {'computer-vision': 0.00038025027606636286,
 'mlops': 0.0003820903366431594,
 'natural-language-processing': 0.9987919926643372,
 'other': 0.00044562897528521717}}]}

The issue with neural networks (and especially LLMs) is that they are notoriously overconfident. For every input, they will always make some prediction. And to account for this, we have an `other` class but that class only has projects that are not in our accepted tags but are still machine learning related nonetheless. Here's what happens when we input complete noise as our input:

```python
# Query (noise)
title = " 65n7r5675" # random noise
json_data = json.dumps({"title": title, "description": ""})
requests.post("http://127.0.0.1:8000/predict/", data=json_data).json()
```

{'results': [{'prediction': 'natural-language-processing',
 'probabilities': {'computer-vision': 0.11885979026556015,
 'mlops': 0.09778415411710739,
 'natural-language-processing': 0.6735526323318481,
 'other': 0.1098034456372261}}]}

Let's shutdown our service before we fixed this issue.

```
# Shutdown
serve.shutdown()
```

### Custom logic

To make our service a bit more robust, let's add some custom logic to predict the `other` class if the probability of the predicted class is below a certain `threshold` probability.

```python
@serve.deployment(route_prefix="/", num_replicas="1", ray_actor_options={"num_cpus": 8, "num_gpus": 0})
@serve.ingress(app)
class ModelDeploymentRobust:

 def __init__(self, run_id, threshold=0.9):
 """Initialize the model."""
 self.run_id = run_id
 self.threshold = threshold
 mlflow.set_tracking_uri(MLFLOW_TRACKING_URI) # so workers have access to model registry
 best_checkpoint = get_best_checkpoint(run_id=run_id)
 self.predictor = TorchPredictor.from_checkpoint(best_checkpoint)
 self.preprocessor = self.predictor.get_preprocessor()

 @app.post("/predict/")
 async def _predict(self, request: Request):
 data = await request.json()
 df = pd.DataFrame([{"title": data.get("title", ""), "description": data.get("description", ""), "tag": ""}])
 results = predict_with_proba(df=df, predictor=self.predictor)

 # Apply custom logic
 for i, result in enumerate(results):
 pred = result["prediction"]
 prob = result["probabilities"]
 if prob[pred] < self.threshold:
 results[i]["prediction"] = "other"

 return {"results": results}
```

> **Tip**

It's easier to incorporate custom logic instead of altering the model itself. This way, we won't have to collect new data. change the model's architecture or retrain it. This also makes it really easy to change the custom logic as our product specifications may change (clean separation of product and machine learning).

```
# Run service
serve.run(ModelDeploymentRobust.bind(run_id=run_id, threshold=0.9))
```

Started detached Serve instance in namespace "serve".
Deployment 'default_ModelDeploymentRobust:RTbrNg' is ready at `http://127.0.0.1:8000/`. component=serve deployment=default_ModelDeploymentRobust
RayServeSyncHandle(deployment='default_ModelDeploymentRobust')

Now let's see how we perform on the same random noise with our custom logic incorporate into the service.

```python
# Query (noise)
title = " 65n7r5675" # random noise
json_data = json.dumps({"title": title, "description": ""})
requests.post("http://127.0.0.1:8000/predict/", data=json_data).json()
```

{'results': [{'prediction': 'other',
 'probabilities': {'computer-vision': 0.11885979026556015,
 'mlops': 0.09778415411710739,
 'natural-language-processing': 0.6735526323318481,
 'other': 0.1098034456372261}}]}

```
# Shutdown
serve.shutdown()
```

We'll learn how to deploy our service to production in our [Jobs and Services lesson](https://madewithml.com/courses/mlops/jobs-and-services/) a bit later.

> **Upcoming live cohorts**

Sign up for our upcoming live cohort, where we'll provide live lessons + QA**, **compute (GPUs)** and **community** to learn everything in one day.

 Learn more

To cite this content, please use:

```
@article{madewithml,
 author = {Goku Mohandas},
 title = { Serving - Made With ML },
 howpublished = {\url{https://madewithml.com/}},
 year = {2023}
}
```
