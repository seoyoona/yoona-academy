# Machine Learning Product Design

 [View all lessons](https://madewithml.com/courses/ml_canvas)

 An overview of the machine learning product design process.

 &middot;
 &middot;
 &middot;

 &times;

## Overview

Before we start developing any machine learning models, we need to first motivate and design our application. While this is a technical course, this initial product design process is extremely crucial for creating great products. We'll focus on the product design aspects of our application in this lesson and the systems design aspects in the [next lesson](https://madewithml.com/courses/mlops/systems-design/).

## Template

The template below is designed to guide machine learning product development. It involves both the product and systems design ([next lesson](https://madewithml.com/courses/mlops/systems-design/)) aspects of our application:

[Product design](https://madewithml.com/courses/mlops/product-design/) (*What* & *Why*) → [Systems design](https://madewithml.com/courses/mlops/systems-design/) (*How*)

>

👉 Download a PDF of the ML canvas to use for your own products → [ml-canvas.pdf](https://madewithml.com/static/templates/ml-canvas.pdf) (right click the link and hit "Save Link As...")

## Product design

Motivate the need for the product and outline the objectives and impact.

> **Note**

Each section below has a part called "Our task", which will discuss how the specific topic relates to the application that we will be building.

### Background

Set the scene for what we're trying to do through a user-centric approach:

- `users`: profile/persona of our users

- `goals`: our users' main goals

- `pains`: obstacles preventing our users from achieving their goals

> **Our task**

- `users`: machine learning developers and researchers.

- `goals`: stay up-to-date on ML content for work, knowledge, etc.

- `pains`: too much unlabeled content scattered around the internet.

### Value proposition

Propose the value we can create through a product-centric approach:

- `product`: what needs to be built to help our users reach their goals?

- `alleviates`: how will the product reduce pains?

- `advantages`: how will the product create gains?

> **Our task**

We will build a platform that helps machine learning developers and researchers stay up-to-date on ML content. We'll do this by discovering and categorizing content from popular sources (Reddit, Twitter, etc.) and displaying it on our platform. For simplicity, assume that we already have a pipeline that delivers ML content from popular sources to our platform. We will just focus on developing the ML service that can correctly categorize the content.

- `product`: a service that discovers and categorizes ML content from popular sources.

- `alleviates`: display categorized content for users to discover.

- `advantages`: when users visit our platform to stay up-to-date on ML content, they don't waste time searching for that content themselves in the noisy internet.

 ![product mockup](https://madewithml.com/static/images/mlops/design/product.png)

### Objectives

Breakdown the product into key objectives that we want to focus on.

> **Our task**

- Discover ML content from trusted sources to bring into our platform.

- Classify incoming content for our users to easily discover. **[OUR FOCUS]**

- Display categorized content on our platform (recent, popular, recommended, etc.)

### Solution

Describe the solution required to meet our objectives, including its:

- `core features`: key features that will be developed.

- `integration`: how the product will integrate with other services.

- `alternatives`: alternative solutions that we should considered.

- `constraints`: limitations that we need to be aware of.

- `out-of-scope.`: features that we will not be developing for now.

> **Our task**

Develop a model that can classify the content so that it can be organized by category (tag) on our platform.

`Core features`:

- predict the correct tag for a given content. **[OUR FOCUS]**

- user feedback process for incorrectly classified content.

- workflows to categorize ML content that our model is incorrect / unsure about.

`Integrations`:

- ML content from reliable sources will be sent to our service for classification.

`Alternatives`:

- allow users to add content manually and classify them (noisy, cold start, etc.)

`Constraints`:

- maintain low latency (>100ms) when classifying incoming content. **[Latency]**

- only recommend tags from our list of approved tags. **[Security]**

- avoid duplicate content from being added to the platform. **[UI/UX]**

`Out-of-scope`:

- identify relevant tags beyond our approved list of tags (`natural-language-processing`, `computer-vision`, `mlops` and `other`).

- using full-text HTML from content links to aid in classification.

### Feasibility

How feasible is our solution and do we have the required resources to deliver it (data, $, team, etc.)?

> **Our task**

We have a [dataset](https://raw.githubusercontent.com/GokuMohandas/Made-With-ML/main/datasets/dataset.csv) with ML content that has been labeled. We'll need to assess if it has the necessary signals to meet our [objectives](https://madewithml.com/courses/mlops/product-design/#objectives).

```json
{
 "id": 443,
 "created_on": "2020-04-10 17:51:39",
 "title": "AllenNLP Interpret",
 "description": "A Framework for Explaining Predictions of NLP Models",
 "tag": "natural-language-processing"
}
```

Now that we've set up the product design requirements for our ML service, let's move on to the systems design requirements in the [next lesson](https://madewithml.com/courses/mlops/systems-design/).

> **Upcoming live cohorts**

Sign up for our upcoming live cohort, where we'll provide live lessons + QA**, **compute (GPUs)** and **community** to learn everything in one day.

 Learn more

To cite this content, please use:

```
@article{madewithml,
 author = {Goku Mohandas},
 title = { Product - Made With ML },
 howpublished = {\url{https://madewithml.com/}},
 year = {2023}
}
```
