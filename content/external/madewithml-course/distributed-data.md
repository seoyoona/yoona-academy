# Distributed Data Processing

 Performing our data processing operations in a distributed manner.

 &middot;
 &middot;
 &middot;

 [Notebook](https://github.com/GokuMohandas/Made-With-ML/blob/main/notebooks/madewithml.ipynb)

 &times;

## Intuition

So far we've performed our data processing operations on a single machine. Our dataset was able to fit into a single Pandas DataFrame and we were able to perform our operations in a single Python process. But what if our dataset was too large to fit into a single machine? We would need to distribute our data processing operations across multiple machines. And with the increasing trend in ML for larger unstructured datasets and larger models (LLMs), we can quickly outgrow our single machine constraints and will need to go distributed.

> **Note**

Our dataset is intentionally small for this course so that we can quickly execute the code. But with our distributed set up in this lesson, we can easily switch to a mcuh larger dataset and the code will continue to execute perfectly. And if we add more compute resources, we can scale our data processing operations to be even faster with no changes to our code.

## Implementation

There are many frameworks for distributed computing, such as [Ray](https://docs.ray.io/en/latest/), [Dask](https://www.dask.org/), [Modin](https://github.com/modin-project/modin), [Spark](https://spark.apache.org/), etc. All of these are great options but for our application we want to choose a framework that is will allow us to scale our data processing operations with **minimal changes to our existing code** and **all in Python**. We also want to choose a framework that will integrate well when we want to distributed our downstream workloads (training, tuning, serving, etc.).

To address these needs, we'll be using Ray, a distributed computing framework that makes it easy to scale your Python applications. It's a general purpose framework that can be used for a variety of applications but we'll be using it for our [data processing](https://docs.ray.io/en/latest/data/data.html) operations first (and more later). And it also has great integrations with the previously mentioned distributed data processing frameworks ([Dask](https://docs.ray.io/en/latest/ray-more-libs/dask-on-ray.html), [Modin](https://docs.ray.io/en/latest/ray-more-libs/modin/index.html), [Spark](https://docs.ray.io/en/latest/ray-more-libs/raydp.html)).

 ![ray data](https://madewithml.com/static/images/mlops/ray/data.svg)

### Setup

The only setup we have to do is set Ray to preserve order when acting on our data. This is important for ensuring reproducible and deterministic results.

```bash
ray.data.DatasetContext.get_current().execution_options.preserve_order = True # deterministic
```

### Ingestion

We'll start by ingesting our dataset. Ray has a range of [input/output functions](https://docs.ray.io/en/latest/data/api/input_output.html) that supports all major data formats and sources.

```python
# Data ingestion
ds = ray.data.read_csv(DATASET_LOC)
ds = ds.random_shuffle(seed=1234)
ds.take(1)
```

[{'id': 2166,
 'created_on': datetime.datetime(2020, 8, 17, 5, 19, 41),
 'title': 'Pix2Pix',
 'description': 'Tensorflow 2.0 Implementation of the paper Image-to-Image Translation using Conditional GANs by Philip Isola, Jun-Yan Zhu, Tinghui Zhou and Alexei A. Efros.',
 'tag': 'computer-vision'}]

### Splitting

Next, we'll split our dataset into our training and validation splits. Ray has a built-in [train_test_split](https://docs.ray.io/en/latest/data/api/doc/ray.data.Dataset.train_test_split.html) function but we're using a [modified version](https://github.com/GokuMohandas/Made-With-ML/blob/main/madewithml/data.py) so that we can stratify our split based on the `tag` column.

```python
import sys
sys.path.append("..")
from madewithml.data import stratify_split
```

```python
# Split dataset
test_size = 0.2
train_ds, val_ds = stratify_split(ds, stratify="tag", test_size=test_size)
```

### Preprocessing

And finally, we're ready to preprocess our data splits. One of the advantages of using Ray is that we won't have to change anything to our original Pandas-based preprocessing function we implemented in the [previous lesson](https://madewithml.com/courses/mlops/preprocessing/#best-practices). Instead, we can use it directly with Ray's [map_batches](https://docs.ray.io/en/latest/data/api/doc/ray.data.Dataset.map_batches.html) utility to *map* our preprocessing function across *batches* in our data in a distributed manner.

```python
# Mapping
tags = train_ds.unique(column="tag")
class_to_index = {tag: i for i, tag in enumerate(tags)}
```

```python
# Distributed preprocessing
sample_ds = train_ds.map_batches(
 preprocess,
 fn_kwargs={"class_to_index": class_to_index},
 batch_format="pandas")
sample_ds.show(1)
```

{'ids': array([ 102, 5800, 14982, 1422, 4958, 14982, 437, 3294, 3577,
 12574, 2747, 1262, 7222, 103, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0]), 'masks': array([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0]), 'targets': 2}

> **Upcoming live cohorts**

Sign up for our upcoming live cohort, where we'll provide live lessons + QA**, **compute (GPUs)** and **community** to learn everything in one day.

 Learn more

To cite this content, please use:

```
@article{madewithml,
 author = {Goku Mohandas},
 title = { Distributed - Made With ML },
 howpublished = {\url{https://madewithml.com/}},
 year = {2023}
}
```
