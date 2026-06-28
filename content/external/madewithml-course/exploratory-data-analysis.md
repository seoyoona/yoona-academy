# Exploratory Data Analysis (EDA)

 Exploring our dataset for insights, with intention.

 &middot;
 &middot;
 &middot;

 [Notebook](https://github.com/GokuMohandas/Made-With-ML/blob/main/notebooks/madewithml.ipynb)

 &times;

## Intuition

Exploratory data analysis (EDA) to understand the signals and nuances of our dataset. It's a cyclical process that can be done at various points of our development process (before/after labeling, preprocessing, etc. depending on how well the problem is defined. For example, if we're unsure how to label or preprocess our data, we can use EDA to figure it out.

We're going to start our project with EDA, a vital (and fun) process that's often misconstrued. Here's how to think about EDA:

- not just to visualize a prescribed set of plots (correlation matrix, etc.).

- goal is to *convince* yourself that the data you have is sufficient for the task.

- use EDA to answer important questions and to make it easier to extract insight

- not a one time process; as your data grows, you want to revisit EDA to catch distribution shifts, anomalies, etc.

Let's answer a few key questions using EDA.

```python
from collections import Counter
import matplotlib.pyplot as plt
import seaborn as sns; sns.set_theme()
import warnings; warnings.filterwarnings("ignore")
from wordcloud import WordCloud, STOPWORDS
```

## Tag distribution

How many data points do we have per tag? We'll use the [Counter](https://docs.python.org/3/library/collections.html#collections.Counter) class to get counts for all the different tags.

```python
# Most common tags
all_tags = Counter(df.tag)
all_tags.most_common()
```

[('natural-language-processing', 310),
 ('computer-vision', 285),
 ('other', 106),
 ('mlops', 63)]

We can then separate the tags and from their respective counts and plot them using [Plotly](https://plotly.com/python/basic-charts/).

```python
# Plot tag frequencies
tags, tag_counts = zip(*all_tags.most_common())
plt.figure(figsize=(10, 3))
ax = sns.barplot(x=list(tags), y=list(tag_counts))
ax.set_xticklabels(tags, rotation=0, fontsize=8)
plt.title("Tag distribution", fontsize=14)
plt.ylabel("# of projects", fontsize=12)
plt.show()
```

 ![tag distribution](https://madewithml.com/static/images/mlops/eda/tag_distribution.png)

>

We do have some data imbalance but it's not too bad. If we did want to account for this, there are many strategies, including [over-sampling](https://imbalanced-learn.org/stable/over_sampling.html) less frequent classes and [under-sampling](https://imbalanced-learn.org/stable/under_sampling.html) popular classes, [class weights in the loss function](https://madewithml.com/courses/mlops/training/#class-imbalance), etc.

## Wordcloud

Is there enough signal in the title and description that's unique to each tag? This is important to know because we want to verify our initial hypothesis that the project's title and description are high quality features for predicting the tag. And to visualize this, we're going to use a [wordcloud](https://amueller.github.io/word_cloud/generated/wordcloud.WordCloud.html). We also use a [jupyter widget](https://ipywidgets.readthedocs.io/en/latest/examples/Using%20Interact.html), which you can view in the [notebook](https://github.com/GokuMohandas/Made-With-ML/blob/main/notebooks/madewithml.ipynb), to interactively select a tag and see the wordcloud for that tag.

```python
# Most frequent tokens for each tag
tag="natural-language-processing"
plt.figure(figsize=(10, 3))
subset = df[df.tag==tag]
text = subset.title.values
cloud = WordCloud(
 stopwords=STOPWORDS, background_color="black", collocations=False,
 width=500, height=300).generate(" ".join(text))
plt.axis("off")
plt.imshow(cloud)
```

 ![word cloud](https://madewithml.com/static/images/mlops/eda/word_cloud.png)

Looks like the `title` text feature has some good signal for the respective classes and matches our intuition. We can repeat this for the `description` text feature as well and see similar quality signals. This information will become useful when we decide how to use our features for modeling.

There's a lot more exploratory data analysis that we can do but for now we've answered our questions around our class distributions and the quality of our text features. In the [next lesson](https://madewithml.com/courses/mlops/preprocessing/) we'll preprocess our dataset in preparation for model training.

> **Upcoming live cohorts**

Sign up for our upcoming live cohort, where we'll provide live lessons + QA**, **compute (GPUs)** and **community** to learn everything in one day.

 Learn more

To cite this content, please use:

```
@article{madewithml,
 author = {Goku Mohandas},
 title = { Exploration - Made With ML },
 howpublished = {\url{https://madewithml.com/}},
 year = {2023}
}
```
