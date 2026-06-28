# Data Preparation

 Preparing our dataset by ingesting and splitting it.

 &middot;
 &middot;
 &middot;

 [Notebook](https://github.com/GokuMohandas/Made-With-ML/blob/main/notebooks/madewithml.ipynb)

 &times;

## Intuition

We'll start by first preparing our data by ingesting it from source and splitting it into training, validation and test data splits.

### Ingestion

Our data could reside in many different places (databases, files, etc.) and exist in different formats (CSV, JSON, Parquet, etc.). For our application, we'll load the data from a CSV file to a [Pandas DataFrame](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.html) using the [read_csv](https://pandas.pydata.org/docs/reference/api/pandas.read_csv.html) function.

>

Here is a quick refresher on the [Pandas](https://madewithml.com/courses/foundations/pandas/) library.

```python
import pandas as pd
```

```python
# Data ingestion
DATASET_LOC = "https://raw.githubusercontent.com/GokuMohandas/Made-With-ML/main/datasets/dataset.csv"
df = pd.read_csv(DATASET_LOC)
df.head()
```

|
 |
 id |
 created_on |
 title |
 description |
 tag |
 |

|
 0 |
 6 |
 2020-02-20 06:43:18 |
 Comparison between YOLO and RCNN on real world... |
 Bringing theory to experiment is cool. We can ... |
 computer-vision |
 |

|
 1 |
 7 |
 2020-02-20 06:47:21 |
 Show, Infer & Tell: Contextual Inference for C... |
 The beauty of the work lies in the way it arch... |
 computer-vision |
 |

|
 2 |
 9 |
 2020-02-24 16:24:45 |
 Awesome Graph Classification |
 A collection of important graph embedding, cla... |
 other |
 |

|
 3 |
 15 |
 2020-02-28 23:55:26 |
 Awesome Monte Carlo Tree Search |
 A curated list of Monte Carlo tree search pape... |
 other |
 |

|
 4 |
 25 |
 2020-03-07 23:04:31 |
 AttentionWalk |
 A PyTorch Implementation of "Watch Your Step: ... |
 other |
 |

>

In our [data engineering lesson](https://madewithml.com/courses/mlops/data-engineering/) we'll look at how to continually ingest data from more complex sources (ex. data warehouses)

### Splitting

Next, we need to split our training dataset into `train` and `val` data splits.

- Use the `train` split to train the model.
>

Here the model will have access to both inputs (features) and outputs (labels) to optimize its internal weights.

- After each iteration (epoch) through the training split, we will use the `val` split to determine the model's performance.
>

Here the model will not use the labels to optimize its weights but instead, we will use the validation performance to optimize training hyperparameters such as the learning rate, etc.

- Finally, we will use a separate holdout [test dataset](https://github.com/GokuMohandas/Made-With-ML/blob/main/datasets/holdout.csv) to determine the model's performance after training.
>

This is our best measure of how the model may behave on new, unseen data that is from a similar distribution to our training dataset.

> **Tip**

For our application, we will have a [training dataset](https://raw.githubusercontent.com/GokuMohandas/Made-With-ML/main/datasets/dataset.csv) to split into `train` and `val` splits and a **separate** [testing dataset](https://github.com/GokuMohandas/Made-With-ML/blob/main/datasets/holdout.csv) for the `test` set. While we could have one large dataset and split that into the three splits, it's a good idea to have a separate test dataset. Over time, our training data may grow and our test splits will look different every time. This will make it difficult to compare models against other models and against each other.

We can view the class counts in our dataset by using the [pandas.DataFrame.value_counts](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.value_counts.html) function:

```python
from sklearn.model_selection import train_test_split
```

```
# Value counts
df.tag.value_counts()
```

tag
natural-language-processing 310
computer-vision 285
other 106
mlops 63
Name: count, dtype: int64

For our multi-class task (where each project has exactly one tag), we want to ensure that the data splits have similar class distributions. We can achieve this by specifying how to stratify the split by using the [stratify](https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.train_test_split.html) keyword argument with sklearn's [train_test_split()](https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.train_test_split.html) function.

> **Creating proper data splits**

What are the criteria we should focus on to ensure proper data splits?

Show answer

- the dataset (and each data split) should be representative of data we will encounter

- equal distributions of output values across all splits

- shuffle your data if it's organized in a way that prevents input variance

- avoid random shuffles if your task can suffer from data leaks (ex. `time-series`)

```python
# Split dataset
test_size = 0.2
train_df, val_df = train_test_split(df, stratify=df.tag, test_size=test_size, random_state=1234)
```

How can we validate that our data splits have similar class distributions? We can view the frequency of each class in each split:

```
# Train value counts
train_df.tag.value_counts()
```

tag
natural-language-processing 248
computer-vision 228
other 85
mlops 50
Name: count, dtype: int64

Before we view our validation split's class counts, recall that our validation split is only `test_size` of the entire dataset. So we need to adjust the value counts so that we can compare it to the training split's class counts.

\[ \alpha * N_{test} = N_{train} \]

\[ N_{train} = 1 - N_{test} \]

\[ \alpha = \frac{N_{train}}{N_{test}} = \frac{1 - N_{test}}{N_{test}} \]

```
# Validation (adjusted) value counts
val_df.tag.value_counts() * int((1-test_size) / test_size)
```

tag
natural-language-processing 248
computer-vision 228
other 84
mlops 52
Name: count, dtype: int64

These adjusted counts looks very similar to our train split's counts. Now we're ready to [explore](https://madewithml.com/courses/mlops/exploratory-data-analysis/) our dataset!

> **Upcoming live cohorts**

Sign up for our upcoming live cohort, where we'll provide live lessons + QA**, **compute (GPUs)** and **community** to learn everything in one day.

 Learn more

To cite this content, please use:

```
@article{madewithml,
 author = {Goku Mohandas},
 title = { Preparation - Made With ML },
 howpublished = {\url{https://madewithml.com/}},
 year = {2023}
}
```
