# Hyperparameter Tuning

 Tuning a set of hyperparameters to optimize our model's performance.

 &middot;
 &middot;
 &middot;

 [Notebook](https://github.com/GokuMohandas/Made-With-ML/blob/main/notebooks/madewithml.ipynb)

 &times;

## Intuition

Hyperparameter tuning is the process of discovering a set of performant parameter values for our model. It can be a computationally involved process depending on the number of parameters, search space and model architectures. Hyperparameters don't just include the model's parameters but could also include parameters related to preprocessing, splitting, etc. When we look at all the different parameters that can be tuned, it quickly becomes a very large search space. However, just because something is a hyperparameter doesn't mean we need to tune it.

- It's absolutely acceptable to fix some hyperparameters (ex. using lower cased text [`lower=True`] during preprocessing).

- You can initially just tune a small, yet influential, subset of hyperparameters that you believe will yield great results.

We want to optimize our hyperparameters so that we can understand how each of them affects our objective. By running many trials across a reasonable search space, we can determine near ideal values for our different parameters.

## Frameworks

There are many options for hyperparameter tuning ([Ray tune](https://docs.ray.io/en/latest/tune/index.html), [Optuna](https://github.com/optuna/optuna), [Hyperopt](https://github.com/hyperopt/hyperopt), etc.). We'll be using Ray Tune with it's [HyperOpt integration](https://docs.ray.io/en/latest/tune/api/suggestion.html#hyperopt-tune-search-hyperopt-hyperoptsearch) for it's simplicity and general popularity. Ray Tune also has a wide variety of support for many [other tune search algorithms](https://docs.ray.io/en/latest/tune/api/suggestion.html) (Optuna, Bayesian, etc.).

## Set up

There are many factors to consider when performing hyperparameter tuning. We'll be conducting a small study where we'll tune just a few key hyperparameters across a few trials. Feel free to include additional parameters and to increase the number trials in the tuning experiment.

```python
# Number of trials (small sample)
num_runs = 2
```

We'll start with some the set up, data and model prep as we've done in previous lessons.

```python
from ray import tune
from ray.tune import Tuner
from ray.tune.schedulers import AsyncHyperBandScheduler
from ray.tune.search import ConcurrencyLimiter
from ray.tune.search.hyperopt import HyperOptSearch
```

```
# Set up
set_seeds()
```

```python
# Dataset
ds = load_data()
train_ds, val_ds = stratify_split(ds, stratify="tag", test_size=test_size)
```

```python
# Preprocess
preprocessor = CustomPreprocessor()
train_ds = preprocessor.fit_transform(train_ds)
val_ds = preprocessor.transform(val_ds)
train_ds = train_ds.materialize()
val_ds = val_ds.materialize()
```

```python
# Trainer
trainer = TorchTrainer(
 train_loop_per_worker=train_loop_per_worker,
 train_loop_config=train_loop_config,
 scaling_config=scaling_config,
 datasets={"train": train_ds, "val": val_ds},
 dataset_config=dataset_config,
 preprocessor=preprocessor,
)
```

```python
# MLflow callback
mlflow_callback = MLflowLoggerCallback(
 tracking_uri=MLFLOW_TRACKING_URI,
 experiment_name=experiment_name,
 save_artifact=True)
```

## Tune configuration

We can think of tuning as training across different combinations of parameters. For this, we'll need to define several configurations around when to stop tuning (stopping criteria), how to define the next set of parameters to train with (search algorithm) and even the different values that the parameters can take (search space).

We'll start by defining our [CheckpointConfig](https://docs.ray.io/en/latest/ray-air/api/doc/ray.air.CheckpointConfig.html) and [RunConfig](https://docs.ray.io/en/latest/ray-air/api/doc/ray.air.RunConfig.html) as we did for [training](https://madewithml.com/courses/mlops/training/):

```python
# Run configuration
checkpoint_config = CheckpointConfig(num_to_keep=1, checkpoint_score_attribute="val_loss", checkpoint_score_order="min")
run_config = RunConfig(
 callbacks=[mlflow_callback],
 checkpoint_config=checkpoint_config
)
```

>

Notice that we use the same `mlflow_callback` from our [experiment tracking lesson](https://madewithml.com/courses/mlops/experiment-tracking/) so all of our runs will be tracked to MLflow automatically.

### Search algorithm

Next, we're going to set the initial parameter values and the search algorithm ([HyperOptSearch](https://docs.ray.io/en/latest/tune/api/doc/ray.tune.search.hyperopt.HyperOptSearch.html)) for our tuning experiment. We're also going to set the maximum number of trials that can be run concurrently ([ConcurrencyLimiter](https://docs.ray.io/en/latest/tune/api/doc/ray.tune.search.ConcurrencyLimiter.html)) based on the compute resources we have.

```python
# Hyperparameters to start with
initial_params = [{"train_loop_config": {"dropout_p": 0.5, "lr": 1e-4, "lr_factor": 0.8, "lr_patience": 3}}]
search_alg = HyperOptSearch(points_to_evaluate=initial_params)
search_alg = ConcurrencyLimiter(search_alg, max_concurrent=2)
```

> **Tip**

It's a good idea to start with some initial parameter values that you think might be reasonable. This can help speed up the tuning process and also guarantee at least one experiment that will perform decently well.

### Search space

Next, we're going to define the parameter search space by choosing the parameters, their distribution and range of values. Depending on the parameter type, we have many different [distributions](https://docs.ray.io/en/latest/tune/api/search_space.html#random-distributions-api) to choose from.

```python
# Parameter space
param_space = {
 "train_loop_config": {
 "dropout_p": tune.uniform(0.3, 0.9),
 "lr": tune.loguniform(1e-5, 5e-4),
 "lr_factor": tune.uniform(0.1, 0.9),
 "lr_patience": tune.uniform(1, 10),
 }
}
```

### Scheduler

Next, we're going to define a scheduler to prune unpromising trials. We'll be using [AsyncHyperBandScheduler](https://docs.ray.io/en/latest/tune/api/doc/ray.tune.schedulers.AsyncHyperBandScheduler.html) ([ASHA](https://arxiv.org/abs/1810.05934)), which is a very popular and aggressive early-stopping algorithm. Due to our aggressive scheduler, we'll set a `grace_period` to allow the trials to run for at least a few epochs before pruning and a maximum of `max_t` epochs.

```python
# Scheduler
scheduler = AsyncHyperBandScheduler(
 max_t=train_loop_config["num_epochs"], # max epoch (<time_attr>) per trial
 grace_period=5, # min epoch (<time_attr>) per trial
)
```

## Tuner

Finally, we're going to define a [TuneConfig](https://docs.ray.io/en/latest/tune/api/doc/ray.tune.TuneConfig.html) that will combine the `search_alg` and `scheduler` we've defined above.

```python
# Tune config
tune_config = tune.TuneConfig(
 metric="val_loss",
 mode="min",
 search_alg=search_alg,
 scheduler=scheduler,
 num_samples=num_runs,
)
```

And now, we'll pass in our `trainer` object with our configurations to create a [Tuner](https://docs.ray.io/en/latest/tune/api/doc/ray.tune.Tuner.html) object that we can run.

```python
# Tuner
tuner = Tuner(
 trainable=trainer,
 run_config=run_config,
 param_space=param_space,
 tune_config=tune_config,
)
```

```python
# Tune
results = tuner.fit()
```

|
 Trial name |
 status |
 loc |
 iter |
 total time (s) |
 epoch |
 lr |
 train_loss |
 |

|
 TorchTrainer_8e6e0_00000 |
 TERMINATED |
 10.0.48.210:93017 |
 10 |
 76.2436 |
 9 |
 0.0001 |
 0.0333853 |
 |

```
# All trials in experiment
results.get_dataframe()
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
 ... |
 pid |
 hostname |
 node_ip |
 time_since_restore |
 iterations_since_restore |
 config/train_loop_config/dropout_p |
 config/train_loop_config/lr |
 config/train_loop_config/lr_factor |
 config/train_loop_config/lr_patience |
 logdir |
 |

|
 0 |
 9 |
 0.000100 |
 0.04096 |
 0.217990 |
 1689460552 |
 6.890944 |
 True |
 True |
 10 |
 094e2a7e |
 ... |
 94006 |
 ip-10-0-48-210 |
 10.0.48.210 |
 76.588228 |
 10 |
 0.500000 |
 0.000100 |
 0.800000 |
 3.000000 |
 /home/ray/ray_results/TorchTrainer_2023-07-15_... |
 |

|
 1 |
 0 |
 0.000027 |
 0.63066 |
 0.516547 |
 1689460571 |
 14.614296 |
 True |
 True |
 1 |
 4f419368 |
 ... |
 94862 |
 ip-10-0-48-210 |
 10.0.48.210 |
 14.614296 |
 1 |
 0.724894 |
 0.000027 |
 0.780224 |
 5.243006 |
 /home/ray/ray_results/TorchTrainer_2023-07-15_... |
 |

And on our MLflow dashboard, we can create useful plots like a parallel coordinates plot to visualize the different hyperparameters and their values across the different trials.

 ![parallel coordinates plot](https://madewithml.com/static/images/mlops/tuning/parallel_coordinates.png)

## Best trial

And from these results, we can extract the best trial and its hyperparameters:

```python
# Best trial's epochs
best_trial = results.get_best_result(metric="val_loss", mode="min")
best_trial.metrics_dataframe
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
 0.582092 |
 0.495889 |
 1689460489 |
 14.537316 |
 True |
 False |
 1 |
 094e2a7e |
 2023-07-15_15-34-53 |
 14.537316 |
 94006 |
 ip-10-0-48-210 |
 10.0.48.210 |
 14.537316 |
 1 |
 |

|
 1 |
 1 |
 0.0001 |
 0.492427 |
 0.430734 |
 1689460497 |
 7.144841 |
 True |
 False |
 2 |
 094e2a7e |
 2023-07-15_15-35-00 |
 21.682157 |
 94006 |
 ip-10-0-48-210 |
 10.0.48.210 |
 21.682157 |
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
 0.040960 |
 0.217990 |
 1689460552 |
 6.890944 |
 True |
 True |
 10 |
 094e2a7e |
 2023-07-15_15-35-55 |
 76.588228 |
 94006 |
 ip-10-0-48-210 |
 10.0.48.210 |
 76.588228 |
 10 |
 |

```
# Best trial's hyperparameters
best_trial.config["train_loop_config"]
```

{'dropout_p': 0.5, 'lr': 0.0001, 'lr_factor': 0.8, 'lr_patience': 3.0}

And now we'll load the best run from our experiment, which includes all the runs we've done so far (before and including the tuning runs).

```python
# Sorted runs
sorted_runs = mlflow.search_runs(experiment_names=[experiment_name], order_by=["metrics.val_loss ASC"])
sorted_runs
```

|
 |
 run_id |
 experiment_id |
 status |
 artifact_uri |
 start_time |
 end_time |
 metrics.lr |
 metrics.epoch |
 metrics.train_loss |
 metrics.val_loss |
 ... |
 metrics.config/train_loop_config/num_classes |
 params.train_loop_config/dropout_p |
 params.train_loop_config/lr_patience |
 params.train_loop_config/lr_factor |
 params.train_loop_config/lr |
 params.train_loop_config/num_classes |
 params.train_loop_config/num_epochs |
 params.train_loop_config/batch_size |
 tags.mlflow.runName |
 tags.trial_name |
 |

|
 0 |
 b140fdbc40804c4f94f9aef33e5279eb |
 999409133275979199 |
 FINISHED |
 file:///tmp/mlflow/999409133275979199/b140fdbc... |
 2023-07-15 22:34:39.108000+00:00 |
 2023-07-15 22:35:56.260000+00:00 |
 0.000100 |
 9.0 |
 0.040960 |
 0.217990 |
 ... |
 NaN |
 0.5 |
 3.0 |
 0.8 |
 0.0001 |
 None |
 None |
 None |
 TorchTrainer_094e2a7e |
 TorchTrainer_094e2a7e |
 |

|
 1 |
 9ff8133613604564b0316abadc23b3b8 |
 999409133275979199 |
 FINISHED |
 file:///tmp/mlflow/999409133275979199/9ff81336... |
 2023-07-15 22:33:05.206000+00:00 |
 2023-07-15 22:34:24.322000+00:00 |
 0.000100 |
 9.0 |
 0.033385 |
 0.218394 |
 ... |
 4.0 |
 0.5 |
 3 |
 0.8 |
 0.0001 |
 4 |
 10 |
 256 |
 TorchTrainer_8e6e0_00000 |
 TorchTrainer_8e6e0_00000 |
 |

|
 2 |
 e4f2d6be9eaa4302b3f697a36ed07d8c |
 999409133275979199 |
 FINISHED |
 file:///tmp/mlflow/999409133275979199/e4f2d6be... |
 2023-07-15 22:36:00.339000+00:00 |
 2023-07-15 22:36:15.459000+00:00 |
 0.000027 |
 0.0 |
 0.630660 |
 0.516547 |
 ... |
 NaN |
 0.7248940325059469 |
 5.243006476496198 |
 0.7802237354477737 |
 2.7345833037950673e-05 |
 None |
 None |
 None |
 TorchTrainer_4f419368 |
 TorchTrainer_4f419368 |
 |

From this we can load the best checkpoint from the best run and evaluate it on the test split.

```python
# Evaluate on test split
run_id = sorted_runs.iloc[0].run_id
best_checkpoint = get_best_checkpoint(run_id=run_id)
predictor = TorchPredictor.from_checkpoint(best_checkpoint)
performance = evaluate(ds=test_ds, predictor=predictor)
print (json.dumps(performance, indent=2))
```

{
 "precision": 0.9487609194455242,
 "recall": 0.9476439790575916,
 "f1": 0.9471734167970421
}

And, just as we did in previous lessons, use our model for inference.

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
 'probabilities': {'computer-vision': 0.0003628606,
 'mlops': 0.0002862369,
 'natural-language-processing': 0.99908364,
 'other': 0.0002672623}}]

Now that we're tuned our model, in the [next lesson](https://madewithml.com/courses/mlops/evaluation/), we're going to perform a much more intensive evaluation on our model compared to just viewing it's overall metrics on a test set.

> **Upcoming live cohorts**

Sign up for our upcoming live cohort, where we'll provide live lessons + QA**, **compute (GPUs)** and **community** to learn everything in one day.

 Learn more

To cite this content, please use:

```
@article{madewithml,
 author = {Goku Mohandas},
 title = { Tuning - Made With ML },
 howpublished = {\url{https://madewithml.com/}},
 year = {2023}
}
```
