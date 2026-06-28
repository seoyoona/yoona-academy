# Versioning Code, Data and Models

 Versioning code, data and models to ensure reproducible behavior in ML systems.

 &middot;
 &middot;
 &middot;

 &times;

## Intuition

In this lesson, we're going to learn how to version our code, data and models to ensure reproducible behavior in our ML systems. It's imperative that we can reproduce our results and track changes to our system so we can debug and improve our application. Without it, it would be difficult to share our work, recreate our models in the event of system failures and fallback to previous versions in the event of regressions.

## Code

To version our code, we'll be using [git](https://git-scm.com/), which is a widely adopted version control system. In fact, when we cloned our repository in the [setup lesson](https://madewithml.com/courses/mlops/setup/), we pulled code from a git repository that we had prepared for you.

```bash
# Config MLflow
MODEL_REGISTRY = Path("/tmp/mlflow")
Path(MODEL_REGISTRY).mkdir(parents=True, exist_ok=True)
MLFLOW_TRACKING_URI = "file://" + str(MODEL_REGISTRY.absolute())
mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
print (mlflow.get_tracking_uri())
```

In a production setting, these would be remote such as S3 for the artifact store and a database service (ex. [PostgreSQL RDS](https://aws.amazon.com/rds/postgresql/)) as our backend store. This way, our models can be versioned and others, with the appropriate access credentials, can pull the model artifacts and deploy them.

> **Upcoming live cohorts**

Sign up for our upcoming live cohort, where we'll provide live lessons + QA**, **compute (GPUs)** and **community** to learn everything in one day.

 Learn more

To cite this content, please use:

```
@article{madewithml,
 author = {Goku Mohandas},
 title = { Versioning - Made With ML },
 howpublished = {\url{https://madewithml.com/}},
 year = {2023}
}
```
