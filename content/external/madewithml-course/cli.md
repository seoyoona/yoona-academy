# Command-Line Interface (CLI)

 Using a command-line interface (CLI) to organize our application's workloads.

 &middot;
 &middot;
 &middot;

 &times;

 Subscribe

## Intuition

In the [previous lesson](https://madewithml.com/courses/mlops/scripting/), we organized our code from our notebook into individual Python scripts. We moved our [functions and classes](https://madewithml.com/courses/mlops/scripting/#functions-and-classes) into their respective scripts and also created new [workload functions](https://madewithml.com/courses/mlops/scripting/#workloads) to execute the main ML workloads (ex. `train_model` function from `madewithml/train.py` script). We now want to enable users to execute these workloads from the terminal without having to know anything about our code itself.

## Methods

One way to execute these workloads is to import the functions in the Python script and execute them one at a time:

```python
from madewithml import train
train.train_model(experiment_name="llm", ...)
```

>

**Caution**: Don't forget to run `export PYTHONPATH=$PYTHONPATH:$PWD` in your terminal to ensure that Python can find the modules in our project.

While this may seem simple, it still requires us to import packages, identify the input arguments, etc. Therefore, another alternative is to place the main function call under a `if __name__ == "__main__"` conditional so that it's only executed when we run the script directly. Here we can pass in the input arguments directly into the function in the code.

```
# madewithml/train.py
if __name__ == "__main__":
 train_model(experiment_name="llm", ...)
```

Which we can call from the terminal like so:

```
# madewithml/serve.py
if __name__ == "__main__":
 parser = argparse.ArgumentParser()
 parser.add_argument("--run_id", help="run ID to use for serving.")
 parser.add_argument("--threshold", type=float, default=0.9, help="threshold for `other` class.")
 args = parser.parse_args()
 ray.init()
 serve.run(ModelDeployment.bind(run_id=args.run_id, threshold=args.threshold))
```

Which we can call from the terminal like so (note that `--threshold` is optional since it has a default value):

```python
import typer
from typing_extensions import Annotated
app = typer.Typer()

@app.command()
def train_model(
 experiment_name: Annotated[str, typer.Option(help="name of the experiment.")] = None,
 ...):
 pass

if __name__ == "__main__":
 app()
```

### Inputs

You may notice that our function inputs have a lot of information besides just the input name. We'll cover typing (`str`, `List`, etc.) in our [documentation lesson](https://madewithml.com/courses/mlops/documentation/#typing) but for now, just know that `Annotated` allows us to specify metadata about the input argument's type and details about the (required) option ([typer.Option](https://typer.tiangolo.com/tutorial/options/required/)).

>

We make all of our input arguments optional so that we can explicitly define them in our CLI commands (ex. `--experiment-name`).

We can also add some helpful information about the input parameter (with `typer.Option(help="...")`) and a default value (ex. `None`).

### Usage

With our CLI commands defined and our input arguments enriched, we can execute our workloads. Let's start by executing our `train_model` function by assuming that we don't know what the required input parameters are. Instead of having to look in the code, we can just do the following:

```
@article{madewithml,
 author = {Goku Mohandas},
 title = { CLI - Made With ML },
 howpublished = {\url{https://madewithml.com/}},
 year = {2023}
}
```
