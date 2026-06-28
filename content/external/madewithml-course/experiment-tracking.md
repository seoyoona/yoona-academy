# Experiment Tracking

 Managing and tracking machine learning experiments.

 &middot;
 &middot;
 &middot;

 [Notebook](https://github.com/GokuMohandas/Made-With-ML/blob/main/notebooks/madewithml.ipynb)

 &times;

## Intuition

So far, we've been training and evaluating our different baselines but haven't really been tracking these experiments. We'll fix this but defining a proper process for experiment tracking which we'll use for all future experiments (including hyperparameter optimization). Experiment tracking is the process of managing all the different experiments and their components, such as parameters, metrics, models and other artifacts and it enables us to:

- **Organize** all the necessary components of a specific experiment. It's important to have everything in one place and know where it is so you can use them later.

- **Reproduce** past results (easily) using saved experiments.

- **Log** iterative improvements across time, data, ideas, teams, etc.

## Tools

There are many options for experiment tracking but we're going to use [MLFlow](https://mlflow.org/) (100% free and [open-source](https://github.com/mlflow/mlflow)) because it has all the functionality we'll need. We can run MLFlow on our own servers and databases so there are no storage cost / limitations, making it one of the most popular options and is used by Microsoft, Facebook, Databricks and others. There are also several popular options such as a [Comet ML](https://www.comet.ml/site/) (used by Google AI, HuggingFace, etc.), [Neptune](https://neptune.ai/) (used by Roche, NewYorker, etc.), [Weights and Biases](https://www.wandb.com/) (used by Open AI, Toyota Research, etc.). These are fully managed solutions that provide features like dashboards, reports, etc.

## Setup

We'll start by setting up our model registry where all of our experiments and their artifacts will be stores.

```python
import mlflow
from pathlib import Path
from ray.air.integrations.mlflow import MLflowLoggerCallback
import time
```

```bash
# Config MLflow
MODEL_REGISTRY = Path("/tmp/mlflow")
Path(MODEL_REGISTRY).mkdir(parents=True, exist_ok=True)
MLFLOW_TRACKING_URI = "file://" + str(MODEL_REGISTRY.absolute())
mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
print (mlflow.get_tracking_uri())
```

file:///tmp/mlflow

>

On Windows, the tracking URI should have three forwards slashes:

```python
MLFLOW_TRACKING_URI = "file:///" + str(MODEL_REGISTRY.absolute())
```

> **Note**

In this course, our MLflow artifact and backend store will both be on our local machine. In a production setting, these would be remote such as S3 for the artifact store and a database service (ex. PostgreSQL RDS) as our backend store.

## Integration

While we could use MLflow directly to log metrics, artifacts and parameters:

```bash
# Example mlflow calls
mlflow.log_metrics({"train_loss": train_loss, "val_loss": val_loss}, step=epoch)
mlflow.log_artifacts(dir)
mlflow.log_params(config)
```

We'll instead use Ray to integrate with MLflow. Specifically we'll use the [MLflowLoggerCallback](https://docs.ray.io/en/latest/tune/api/integration.html#mlflow-air-integrations-mlflow) which will automatically log all the necessary components of our experiments to the location specified in our `MLFLOW_TRACKING_URI`. We of course can still use MLflow directly if we want to log something that's not automatically logged by the callback. And if we're using other experiment trackers, Ray has [integrations](https://docs.ray.io/en/latest/tune/api/integration.html) for those as well.

```python
# MLflow callback
experiment_name = f"llm-{int(time.time())}"
mlflow_callback = MLflowLoggerCallback(
 tracking_uri=MLFLOW_TRACKING_URI,
 experiment_name=experiment_name,
 save_artifact=True)
```

Once we have the callback defined, all we have to do is update our [RunConfig](https://docs.ray.io/en/latest/ray-air/api/doc/ray.air.RunConfig.html) to include it.

```python
# Run configuration with MLflow callback
run_config = RunConfig(
 callbacks=[mlflow_callback],
 checkpoint_config=checkpoint_config,
)
```

## Training

With our updated [RunConfig](https://docs.ray.io/en/latest/ray-air/api/doc/ray.air.RunConfig.html), with the MLflow callback, we can now train our model and all the necessary components will be logged to MLflow. This is the exact same training workflow we've been using so far from the [training lesson](https://madewithml.com/courses/mlops/training/).

```python
# Dataset
ds = load_data()
train_ds, val_ds = stratify_split(ds, stratify="tag", test_size=test_size)

# Preprocess
preprocessor = CustomPreprocessor()
train_ds = preprocessor.fit_transform(train_ds)
val_ds = preprocessor.transform(val_ds)
train_ds = train_ds.materialize()
val_ds = val_ds.materialize()

# Trainer
trainer = TorchTrainer(
 train_loop_per_worker=train_loop_per_worker,
 train_loop_config=train_loop_config,
 scaling_config=scaling_config,
 run_config=run_config, # uses RunConfig with MLflow callback
 datasets={"train": train_ds, "val": val_ds},
 dataset_config=dataset_config,
 preprocessor=preprocessor,
)

# Train
results = trainer.fit()
```

| Trial name | status | loc | iter | total time (s) | epoch | lr | train_loss | |

| TorchTrainer_8c960_00000 | TERMINATED | 10.0.18.44:68577 | 10 | 76.3089 | 9 | 0.0001 | 0.000549661 | |

```
results.metrics_dataframe
```

|
 |
 epoch |
 lr |
 train_loss |
 val_loss |
 timestamp |
 time_this_iter_s |
 should_checkpoint |
 done |
 training_iteration |
 trial_id |
 date |
 time_total_s |
 pid |
 hostname |
 node_ip |
 time_since_restore |
 iterations_since_restore |
 |

|
 0 |
 0 |
 0.0001 |
 0.005196 |
 0.004071 |
 1689030896 |
 14.162520 |
 True |
 False |
 1 |
 8c960_00000 |
 2023-07-10_16-14-59 |
 14.162520 |
 68577 |
 ip-10-0-18-44 |
 10.0.18.44 |
 14.162520 |
 1 |
 |

|
 1 |
 1 |
 0.0001 |
 0.004033 |
 0.003898 |
 1689030905 |
 8.704429 |
 True |
 False |
 2 |
 8c960_00000 |
 2023-07-10_16-15-08 |
 22.866948 |
 68577 |
 ip-10-0-18-44 |
 10.0.18.44 |
 22.866948 |
 2 |
 |

|
 ... |
 ... |
 ... |
 ... |
 ... |
 ... |
 ... |
 ... |
 ... |
 ... |
 ... |
 ... |
 ... |
 ... |
 ... |
 ... |
 ... |
 ... |
 |

|
 9 |
 9 |
 0.0001 |
 0.000550 |
 0.001182 |
 1689030958 |
 6.604867 |
 True |
 False |
 10 |
 8c960_00000 |
 2023-07-10_16-16-01 |
 76.308887 |
 68577 |
 ip-10-0-18-44 |
 10.0.18.44 |
 76.308887 |
 10 |
 |

We're going to use the [search_runs](https://mlflow.org/docs/latest/python_api/mlflow.html#mlflow.search_runs) function from the [MLflow python API](https://mlflow.org/docs/latest/python_api/mlflow.html) to identify the best run in our experiment so far (we' only done one run so far so it will be the run from above).

```python
# Sorted runs
sorted_runs = mlflow.search_runs(experiment_names=[experiment_name], order_by=["metrics.val_loss ASC"])
sorted_runs
```

run_id 8e473b640d264808a89914e8068587fb
experiment_id 853333311265913081
status FINISHED
...
tags.mlflow.runName TorchTrainer_077f9_00000
Name: 0, dtype: object

## Dashboard

Once we're done training, we can use the MLflow dashboard to visualize our results. To do so, we'll use the `mlflow server` command to launch the MLflow dashboard and navigate to the experiment we just created.

```python
from ray.air import Result
from urllib.parse import urlparse
```

We're going to create a small utility function that uses an MLflow run's artifact path to load a Ray [Result](https://docs.ray.io/en/latest/tune/api/doc/ray.air.Result.html) object. We'll then use the `Result` object to load the best checkpoint.

```python
def get_best_checkpoint(run_id):
 artifact_dir = urlparse(mlflow.get_run(run_id).info.artifact_uri).path # get path from mlflow
 results = Result.from_path(artifact_dir)
 return results.best_checkpoints[0][0]
```

With a particular run's best checkpoint, we can load the model from it and use it.

```python
# Evaluate on test split
best_checkpoint = get_best_checkpoint(run_id=best_run.run_id)
predictor = TorchPredictor.from_checkpoint(best_checkpoint)
performance = evaluate(ds=test_ds, predictor=predictor)
print (json.dumps(performance, indent=2))
```

{
 "precision": 0.9281010510531216,
 "recall": 0.9267015706806283,
 "f1": 0.9269438615952555
}

Before we can use our model for inference, we need to load the preprocessor from our predictor and apply it to our input data.

```python
# Preprocessor
preprocessor = predictor.get_preprocessor()
```

```python
# Predict on sample
title = "Transfer learning with transformers"
description = "Using transformers for transfer learning on text classification tasks."
sample_df = pd.DataFrame([{"title": title, "description": description, "tag": "other"}])
predict_with_proba(df=sample_df, predictor=predictor)
```

[{'prediction': 'natural-language-processing',
 'probabilities': {'computer-vision': 0.00038025028,
 'mlops': 0.00038209034,
 'natural-language-processing': 0.998792,
 'other': 0.00044562898}}]

In the [next lesson](https://madewithml.com/courses/mlops/tuning/) we'll learn how to tune our models and use our MLflow dashboard to compare the results.

> **Upcoming live cohorts**

Sign up for our upcoming live cohort, where we'll provide live lessons + QA**, **compute (GPUs)** and **community** to learn everything in one day.

 Learn more

To cite this content, please use:

```
@article{madewithml,
 author = {Goku Mohandas},
 title = { Tracking - Made With ML },
 howpublished = {\url{https://madewithml.com/}},
 year = {2023}
}
```
