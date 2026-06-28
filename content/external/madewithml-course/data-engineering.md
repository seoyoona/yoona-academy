# Data Engineering for Machine Learning

 Learn data engineering fundamentals by constructing a modern data stack for analytics and machine learning applications.

 &middot;
 &middot;
 &middot;

 [Notebook](https://github.com/GokuMohandas/data-engineering/blob/main/extract_from_dwh.ipynb)

 &times;

 Subscribe

## Intuition

So far we've had the convenience of using local CSV files as data source but in reality, our data can come from many disparate sources. Additionally, our processes around transforming and testing our data should ideally be moved upstream so that many different downstream processes can benefit from them. Our ML use case being just one among the many potential downstream applications. To address these shortcomings, we're going to learn about the fundamentals of data engineering and construct a modern data stack that can scale and provide high quality data for our applications.

>

View the
 [data-engineering](https://github.com/GokuMohandas/data-engineering) repository for all the code.

> **Viewing options**

You can watch the entire video at once or follow along each section (each header has a link to the corresponding timestamp in the video).

 -->

At a high level, we're going to:

- [Extract and Load](https://madewithml.com/courses/mlops/data-engineering/#extract-and-load) data from [sources](https://madewithml.com/courses/mlops/data-engineering/#sources) to [destinations](https://madewithml.com/courses/mlops/data-engineering/#destinations).

- [Transform](https://madewithml.com/courses/mlops/data-engineering/#transform) data for downstream applications.

This process is more commonly known as ELT, but there are variants such as ETL and reverse ETL, etc. They are all essentially the same underlying workflows but have slight differences in the order of data flow and where data is processed and stored.

 ![data stack](https://madewithml.com/static/images/mlops/data_stack/data.png)

> **Utility and simplicity**

It can be enticing to set up a modern data stack in your organization, especially with all the hype. But it's very important to motivate utility and adding additional complexity:

- Start with a use case that we already have data sources for and has direct impact on the business' bottom line (ex. user churn).

- Start with the simplest infrastructure (source → database → report) and add complexity (in infrastructure, performance and team) as needed.

## Data systems

Before we start working with our data, it's important to understand the different types of systems that our data can live in. So far in this course we've worked with files, but there are several types of data systems that are widely adopted in industry for different purposes.

 ![data systems](https://madewithml.com/static/images/mlops/data_stack/systems.png)

### Data lake

A data lake is a flat data management system that stores raw objects. It's a great option for inexpensive storage and has the capability to hold all types of data (unstructured, semi-structured and structured). Object stores are becoming the standard for data lakes with default options across the popular cloud providers. Unfortunately, because data is stored as objects in a data lake, it's not designed for operating on structured data.

>

Popular data lake options include [Amazon S3](https://aws.amazon.com/s3/), [Azure Blob Storage](https://azure.microsoft.com/en-us/services/storage/blobs/), [Google Cloud Storage](https://cloud.google.com/storage), etc.

### Database

Another popular storage option is a database (DB), which is an organized collection of structured data that adheres to either:

- relational schema (tables with rows and columns) often referred to as a Relational Database Management System (RDBMS) or SQL database.

- non-relational (key/value, graph, etc.), often referred to as a non-relational database or NoSQL database.

A database is an [online transaction processing (OLTP)](https://en.wikipedia.org/wiki/Online_transaction_processing) system because it's typically used for day-to-day CRUD (create, read, update, delete) operations where typically information is accessed by rows. However, they're generally used to store data from one application and is not designed to hold data from across many sources for the purpose of analytics.

>

Popular database options include [PostgreSQL](https://www.postgresql.org/), [MySQL](https://www.mysql.com/), [MongoDB](https://www.mongodb.com/), [Cassandra](https://cassandra.apache.org/), etc.

### Data warehouse

A data warehouse (DWH) is a type of database that's designed for storing structured data from many different sources for downstream analytics and data science. It's an [online analytical processing (OLAP)](https://en.wikipedia.org/wiki/Online_analytical_processing) system that's optimized for performing operations across aggregating column values rather than accessing specific rows.

>

Popular data warehouse options include [SnowFlake](https://www.snowflake.com/), [Google BigQuery](https://cloud.google.com/bigquery), [Amazon RedShift](https://aws.amazon.com/redshift/), [Hive](https://hive.apache.org/), etc.

## Extract and load

The first step in our data pipeline is to extract data from a source and load it into the appropriate destination. While we could construct custom scripts to do this manually or on a schedule, an ecosystem of data ingestion tools have already standardized the entire process. They all come equipped with connectors that allow for extraction, normalization, cleaning and loading between sources and destinations. And these pipelines can be scaled, monitored, etc. all with very little to no code.

 ![ingestion pipelines](https://madewithml.com/static/images/mlops/data_stack/pipelines.png)

>

Popular data ingestion tools include [Fivetran](https://www.fivetran.com/), [Airbyte](https://airbyte.com/), [Stitch](https://www.stitchdata.com/), etc.

We're going to use the open-source tool [Airbyte](https://airbyte.com/) to create connections between our data sources and destinations. Let's set up Airbyte and define our data sources. As we progress in this lesson, we'll set up our destinations and create connections to extract and load data.

- Ensure that we have [Docker](https://madewithml.com/courses/mlops/docker/) installed, but if not, download it [here](https://www.docker.com/products/docker-desktop/). For Windows users, be sure to have these [configurations](https://docs.airbyte.com/deploying-airbyte/local-deployment/#deploy-on-windows) enabled.

- In a parent directory, outside our project directory for the MLOps course, execute the following commands to load the Airbyte repository locally and launch the service.

```
SELECT *
FROM `made-with-ml-XXXXXX.mlops_course.projects`
LIMIT 1000
```

|
 |
 id |
 created_on |
 title |
 description |
 |

|
 0 |
 6 |
 2020-02-20 06:43:18 |
 Comparison between YOLO and RCNN on real world... |
 Bringing theory to experiment is cool. We can ... |
 |

|
 1 |
 7 |
 2020-02-20 06:47:21 |
 Show, Infer & Tell: Contextual Inference for C... |
 The beauty of the work lies in the way it arch... |
 |

|
 2 |
 9 |
 2020-02-24 16:24:45 |
 Awesome Graph Classification |
 A collection of important graph embedding, cla... |
 |

|
 3 |
 15 |
 2020-02-28 23:55:26 |
 Awesome Monte Carlo Tree Search |
 A curated list of Monte Carlo tree search papers... |
 |

|
 4 |
 19 |
 2020-03-03 13:54:31 |
 Diffusion to Vector |
 Reference implementation of Diffusion2Vec (Com... |
 |

### Best practices

With the advent of cheap storage and cloud SaaS options to manage them, it's become a best practice to store raw data into data lakes. This allows for storage of raw, potentially unstructured, data without having to justify storage with downstream applications. When we do need to transform and process the data, we can move it to a data warehouse so can perform those operations efficiently.

 ![best practice](https://madewithml.com/static/images/mlops/data_stack/best_practice.png)

## Transform

Once we've extracted and loaded our data, we need to transform the data so that it's ready for downstream applications. These transformations are different from the [preprocessing](https://madewithml.com/courses/mlops/preprocessing/#transformations) we've seen before but are instead reflective of business logic that's agnostic to downstream applications. Common transformations include defining schemas, filtering, cleaning and joining data across tables, etc. While we could do all of these things with SQL in our data warehouse (save queries as tables or views), dbt delivers production functionality around version control, testing, documentation, packaging, etc. out of the box. This becomes crucial for maintaining observability and high quality data workflows.

 ![data transform](https://madewithml.com/static/images/mlops/data_stack/transform.png)

>

Popular transformation tools include [dbt](https://www.getdbt.com/), [Matillion](https://www.matillion.com/), custom jinja templated SQL, etc.

> **Note**

In addition to data transformations, we can also process the data using large-scale analytics engines like [Spark](https://spark.apache.org/), [Flink](https://flink.apache.org/), etc.

### dbt Cloud

Now we're ready to transform our data in our data warehouse using [dbt](https://www.getdbt.com/). We'll be using a developer account on dbt Cloud (free), which provides us with an IDE, unlimited runs, etc.

>

We'll learn how to use the [dbt-core](https://github.com/dbt-labs/dbt-core) in our [orchestration lesson](https://madewithml.com/courses/mlops/orchestration/). Unlike dbt Cloud, dbt core is completely open-source and we can programmatically connect to our data warehouse and perform transformations.

- Create a [free account](https://www.getdbt.com/signup/) and verify it.

- Go to [https://cloud.getdbt.com/](https://cloud.getdbt.com/) to get set up.

- Click `continue` and choose `BigQuery` as the database.

- Click `Upload a Service Account JSON file` and upload our file to autopopulate everything.

- Click the `Test` > `Continue`.

- Click `Managed` repository and name it `dbt-transforms` (or anything else you want).

- Click `Create` > `Continue` > `Skip and complete`.

- This will open the project page and click `>_ Start Developing` button.

- This will open the IDE where we can click `🗂 initialize your project`.

Now we're ready to start developing our models:

- Click the `···` next to the `models` directory on the left menu.

- Click `New folder` called `models/labeled_projects`.

- Create a `New file` under `models/labeled_projects` called `labeled_projects.sql`.

- Repeat for another file under `models/labeled_projects` called `schema.yml`.

```
-- models/labeled_projects/labeled_projects.sql
SELECT p.id, created_on, title, description, tag
FROM `made-with-ml-XXXXXX.mlops_course.projects` p -- REPLACE
LEFT JOIN `made-with-ml-XXXXXX.mlops_course.tags` t -- REPLACE
ON p.id = t.id
```

We can view the queried results by clicking the `Preview` button and view the data lineage as well.

### Schemas

Inside our `models/labeled_projects/schema.yml` file we'll define the schemas for each of the features in our transformed data. We also define several tests that each feature should pass. View the full list of [dbt tests](https://docs.getdbt.com/docs/building-a-dbt-project/tests) but note that we'll use [Great Expectations](https://madewithml.com/courses/mlops/testing/#expectations) for more comprehensive tests when we orchestrate all these data workflows in our [orchestration lesson](https://madewithml.com/courses/mlops/orchestration/).

```
# models/labeled_projects/schema.yml

version: 2

models:
 - name: labeled_projects
 description: "Tags for all projects"
 columns:
 - name: id
 description: "Unique ID of the project."
 tests:
 - unique
 - not_null
 - name: title
 description: "Title of the project."
 tests:
 - not_null
 - name: description
 description: "Description of the project."
 tests:
 - not_null
 - name: tag
 description: "Labeled tag for the project."
 tests:
 - not_null
```

### Runs

At the bottom of the IDE, we can execute runs based on the transformations we've defined. We'll run each of the following commands and once they finish, we can see the transformed data inside our data warehouse.

```
@article{madewithml,
 author = {Goku Mohandas},
 title = { Data engineering - Made With ML },
 howpublished = {\url{https://madewithml.com/}},
 year = {2023}
}
```
