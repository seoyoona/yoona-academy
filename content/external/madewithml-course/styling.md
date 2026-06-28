# Styling and Formatting Code

 Style and formatting conventions to keep our code looking consistent.

 &middot;
 &middot;
 &middot;

 &times;

 Subscribe

## Intuition

>

Code is read more often than it is written. -- [Guido Van Rossum](https://en.wikipedia.org/wiki/Guido_van_Rossum) (author of Python)

When we write a piece of code, it's almost never the last time we see it or the last time it's edited. So we need to explain what's going on (via [documentation](https://madewithml.com/courses/mlops/documentation/)) and make it easy to read. One of the easiest ways to make code more readable is to follow consistent style and formatting conventions. There are many options when it comes to Python style conventions to adhere to, but most are based on [PEP8](https://www.python.org/dev/peps/pep-0008/) conventions. Different teams follow different conventions and that's perfectly alright. The most important aspects are:

- `consistency`: everyone follows the same standards.

- `automation`: formatting should be largely effortless after initial configuration.

## Tools

We will be using a very popular blend of style and formatting conventions that makes some very opinionated decisions on our behalf (with configurable options).

- [Black](https://black.readthedocs.io/en/stable/): an in-place reformatter that (mostly) [adheres](https://black.readthedocs.io/en/stable/the_black_code_style/current_style.html) to PEP8.

- [isort](https://pycqa.github.io/isort/): sorts and formats import statements inside Python scripts.

- [flake8](https://flake8.pycqa.org/en/latest/index.html): a code linter with stylistic conventions that adhere to PEP8.

## Configuration

Before we can properly use these tools, we'll have to configure them because they may have some discrepancies amongst them since they follow slightly different conventions that extend from PEP8.

### Black

To configure [Black](https://black.readthedocs.io/en/stable/), we could just pass in options using the [CLI method](https://black.readthedocs.io/en/stable/usage_and_configuration/the_basics.html#command-line-options), but it's much cleaner to do this through our `pyproject.toml` file.

```python
# Black formatting
[tool.black]
line-length = 150
include = '\.pyi?$'
exclude = '''
/(
 .eggs # exclude a few common directories in the
 | .git # root of the project
 | .hg
 | .mypy_cache
 | .tox
 | venv
 | _build
 | buck-out
 | build
 | dist
 )/
'''
```

Here we're telling Black what our maximum line length should and to include and exclude certain file extensions.

>

The [pyproject.toml](https://www.python.org/dev/peps/pep-0518/#file-format) was created to establish a more human-readable configuration file that is meant to replace a `setup.py` or `setup.cfg` file and is increasingly adopted by many open-source libraries.

### isort

Next, we're going to configure [isort](https://pycqa.github.io/isort/) in our `pyproject.toml` file (just below Black's configurations):

```python
# iSort
[tool.isort]
profile = "black"
line_length = 79
multi_line_output = 3
include_trailing_comma = true
virtual_env = "venv"
```

Though there is a [complete list](https://pycqa.github.io/isort/docs/configuration/options) of configuration options for isort, we've decided to set these explicitly so there are no conflicts with Black.

### flake8

Lastly, we'll set up [flake8](https://flake8.pycqa.org/en/latest/index.html) by also adding it's configuration details to out `pyproject.toml` file.

```python
[tool.flake8]
exclude = "venv"
ignore = ["E501", "W503", "E226"]
# E501: Line too long
# W503: Line break occurred before binary operator
# E226: Missing white space around arithmetic operator
```

Here we're including an `ignore` option to ignore certain [flake8 rules](https://www.flake8rules.com/) so everything works with our Black and isort configurations. And besides defining configuration options here, which are applied globally, we can also choose to specifically ignore certain conventions on a line-by-line basis. Here is an example of how we utilize this:

```python
# madewithml/config.py
import pretty_errors # NOQA: F401 (imported but unused)
```

By placing the `# NOQA: <error-code>` on a line, we're telling flake8 to do **NO** *Q*uality *A*ssurance for that particular error on this line.

## Usage

To use these tools that we've configured, we have to execute them from the project directory:

```
@article{madewithml,
 author = {Goku Mohandas},
 title = { Styling - Made With ML },
 howpublished = {\url{https://madewithml.com/}},
 year = {2023}
}
```
