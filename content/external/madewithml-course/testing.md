# Testing Machine Learning Systems: Code, Data and Models

 Learn how to test ML artifacts (code, data and models) to ensure a reliable ML system.

 &middot;
 &middot;
 &middot;

 [Notebook](https://github.com/GokuMohandas/testing-ml/blob/main/testing.ipynb)

 &times;

 Subscribe

## Intuition

In this lesson, we'll learn how to test code, data and machine learning models to construct a machine learning system that we can reliably iterate on. Tests are a way for us to ensure that something works as intended. We're incentivized to implement tests and discover sources of error as early in the development cycle as possible so that we can decrease [downstream costs](https://assets.deepsource.io/39ed384/images/blog/cost-of-fixing-bugs/chart.jpg) and wasted time. Once we've designed our tests, we can automatically execute them every time we change or add to our codebase.

> **Tip**

We highly recommend that you explore this lesson *after* completing the previous lessons since the topics (and code) are iteratively developed. We did, however, create the
 [testing-ml](https://github.com/GokuMohandas/testing-ml) repository for a quick overview with an interactive notebook.

### Types of tests

There are four majors types of tests which are utilized at different points in the development cycle:

- `Unit tests`: tests on individual components that each have a [single responsibility](https://en.wikipedia.org/wiki/Single-responsibility_principle) (ex. function that filters a list).

- `Integration tests`: tests on the combined functionality of individual components (ex. data processing).

- `System tests`: tests on the design of a system for expected outputs given inputs (ex. training, inference, etc.).

- `Acceptance tests`: tests to verify that requirements have been met, usually referred to as User Acceptance Testing (UAT).

- `Regression tests`: tests based on errors we've seen before to ensure new changes don't reintroduce them.

While ML systems are probabilistic in nature, they are composed of many deterministic components that can be tested in a similar manner as traditional software systems. The distinction between testing ML systems begins when we move from testing code to testing the [data](https://madewithml.com/courses/mlops/testing/#data) and [models](https://madewithml.com/courses/mlops/testing/#models).

 ![types of tests](https://madewithml.com/static/images/mlops/testing/tests.png)

>

There are many other types of functional and non-functional tests as well, such as smoke tests (quick health checks), performance tests (load, stress), security tests, etc. but we can generalize all of these under the system tests above.

### How should we test?

The framework to use when composing tests is the [Arrange Act Assert](http://wiki.c2.com/?ArrangeActAssert) methodology.

- `Arrange`: set up the different inputs to test on.

- `Act`: apply the inputs on the component we want to test.

- `Assert`: confirm that we received the expected output.

>

`Cleaning` is an unofficial fourth step to this methodology because it's important to not leave remnants of a previous test which may affect subsequent tests. We can use packages such as [pytest-randomly](https://github.com/pytest-dev/pytest-randomly) to test against state dependency by executing tests randomly.

In Python, there are many tools, such as [unittest](https://docs.python.org/3/library/unittest.html), [pytest](https://docs.pytest.org/en/stable/), etc. that allow us to easily implement our tests while adhering to the *Arrange Act Assert* framework. These tools come with powerful built-in functionality such as parametrization, filters, and more, to test many conditions at scale.

### What should we test?

When *arranging* our inputs and *asserting* our expected outputs, what are some aspects of our inputs and outputs that we should be testing for?

- **inputs**: data types, format, length, edge cases (min/max, small/large, etc.)

- **outputs**: data types, formats, exceptions, intermediary and final outputs

>

👉 We'll cover specific details pertaining to what to test for regarding our [data](https://madewithml.com/courses/mlops/testing/#data) and [models](https://madewithml.com/courses/mlops/testing/#models) below.

## Best practices

Regardless of the framework we use, it's important to strongly tie testing into the development process.

- `atomic`: when creating functions and classes, we need to ensure that they have a [single responsibility](https://en.wikipedia.org/wiki/Single-responsibility_principle) so that we can easily test them. If not, we'll need to split them into more granular components.

- `compose`: when we create new components, we want to compose tests to validate their functionality. It's a great way to ensure reliability and catch errors early on.

- `reuse`: we should maintain central repositories where core functionality is tested at the source and reused across many projects. This significantly reduces testing efforts for each new project's code base.

- `regression`: we want to account for new errors we come across with a regression test so we can ensure we don't reintroduce the same errors in the future.

- `coverage`: we want to ensure [100% coverage](https://madewithml.com/courses/mlops/testing/#coverage) for our codebase. This doesn't mean writing a test for every single line of code but rather accounting for every single line.

- `automate`: in the event we forget to run our tests before committing to a repository, we want to auto run tests when we make changes to our codebase. We'll learn how to do this locally using [pre-commit hooks](https://madewithml.com/courses/mlops/pre-commit/) and remotely via [GitHub actions](https://madewithml.com/courses/mlops/cicd/#github-actions) in subsequent lessons.

## Implementation

In our [codebase](https://github.com/GokuMohandas/Made-With-ML), we'll be testing the [code](https://madewithml.com/courses/mlops/testing/#%F0%9F%92%BBnbsp-code), [data](https://madewithml.com/courses/mlops/testing/#%F0%9F%94%A2nbsp-data) and [models](https://madewithml.com/courses/mlops/testing/#%F0%9F%A4%96nbsp-models).

```python
# Pytest
[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = "test_*.py"
```

### Assertions

Let's see what a sample test and it's results look like. Assume we have a simple function that decodes a list of indices into their respective classes using a dictionary mapping.

```python
# madewithml/predict.py
def decode(indices: Iterable[Any], index_to_class: Dict) -> List:
 return [index_to_class[index] for index in indices]
```

To test this function, we can use [assert statements](https://docs.pytest.org/en/stable/assert.html) to map inputs with expected outputs. The statement following the word `assert` must return `True`.

```python
# tests/code/test_predict.py
def test_decode():
decoded = predict.decode(
 indices=[0, 1, 1],
 index_to_class={0: "x", 1: "y"})
assert decoded == ["x", "y", "y"]
```

>

We can also have assertions about [exceptions](https://docs.pytest.org/en/stable/assert.html#assertions-about-expected-exceptions) like we do in lines 6-8 where all the operations under the with statement are expected to raise the specified exception.

### Execution

We can execute our tests above using several different levels of granularity:

```python
def test_fit_transform():
 preprocessor = data.CustomPreprocessor()
 ds = data.load_data(dataset_loc="...")
 preprocessor.fit_transform(ds)
 assert len(preprocessor.class_to_index) == 4
```

>

There are also more [xunit-style testing](https://docs.pytest.org/en/stable/xunit_setup.html) options available as well for more involved testing with classes.

### Parametrize

So far, in our tests, we've had to create individual assert statements to validate different combinations of inputs and expected outputs. However, there's a bit of redundancy here because the inputs always feed into our functions as arguments and the outputs are compared with our expected outputs. To remove this redundancy, pytest has the [@pytest.mark.parametrize](https://docs.pytest.org/en/stable/parametrize.html) decorator which allows us to represent our inputs and outputs as parameters.

```python
@pytest.mark.parametrize(
 "text, sw, clean_text",
 [
 ("hi", [], "hi"),
 ("hi you", ["you"], "hi"),
 ("hi yous", ["you"], "hi yous"),
 ],
)
def test_clean_text(text, sw, clean_text):
 assert data.clean_text(text=text, stopwords=sw) == clean_text
```

- `[Line 2]`: define the names of the parameters under the decorator, ex. "fruit, crisp" (note that this is one string).

- `[Lines 3-7]`: provide a list of combinations of values for the parameters from Step 1.

- `[Line 9]`: pass in parameter names to the test function.

- `[Line 10]`: include necessary assert statements which will be executed for each of the combinations in the list from Step 2.

Similarly, we could pass in an exception as the expected result as well:

```python
@pytest.mark.parametrize(
 "x, exception",
 [
 (1, ValueError),
 ],
)
def test_foo(x, exception):
 with pytest.raises(exception):
 foo(x=x)
```

### Fixtures

Parametrization allows us to reduce redundancy inside test functions but what about reducing redundancy across different test functions? For example, suppose that different test functions all have a common component (ex. preprocessor). Here, we can use pytest's builtin [fixture](https://docs.pytest.org/en/stable/fixture.html), which is a function that is executed before the test function. Let's rewrite our `test_fit_transform` function from above using a fixture:

```python
def test_fit_transform(dataset_loc, preprocessor):
 ds = data.load_data(dataset_loc=dataset_loc)
 preprocessor.fit_transform(ds)
 assert len(preprocessor.class_to_index) == 4
```

where `dataset_loc` and `preprocessor` are fixtures defined in our `tests/code/conftest.py` script:

```python
# tests/code/conftest.py
import pytest
from madewithml.data import CustomPreprocessor

@pytest.fixture
def dataset_loc():
 return "https://raw.githubusercontent.com/GokuMohandas/Made-With-ML/main/datasets/dataset.csv"

@pytest.fixture
def preprocessor():
 return CustomPreprocessor()
```

All of our test scripts know to look inside a `conftest.py` script in the same directory for any fixtures. Note that the name of the fixture and the input argument to our function have to be the same.

> **Fixture scopes**

Fixtures can have different scopes depending on how we want to use them. For example our `df` fixture has the module scope because we don't want to keep recreating it after every test but, instead, we want to create it just once for all the tests in our module (`tests/test_data.py`).

- `function`: fixture is destroyed after every test. `[default]`

- `class`: fixture is destroyed after the last test in the class.

- `module`: fixture is destroyed after the last test in the module (script).

- `package`: fixture is destroyed after the last test in the package.

- `session`: fixture is destroyed after the last test of the session.

### Markers

We've been able to execute our tests at various levels of granularity (all tests, script, function, etc.) but we can create custom granularity by using [markers](https://docs.pytest.org/en/stable/mark.html). We've already used one type of marker (parametrize) but there are several other [builtin markers](https://docs.pytest.org/en/stable/mark.html#mark) as well. For example, the [skipif](https://docs.pytest.org/en/stable/skipping.html#id1) marker allows us to skip execution of a test if a condition is met. For example, supposed we only wanted to test training our model if a GPU is available:

```python
@pytest.mark.skipif(
 not torch.cuda.is_available(),
 reason="Full training tests require a GPU."
)
def test_training():
 pass
```

We can also create our own custom markers with the exception of a few [reserved](https://docs.pytest.org/en/stable/reference.html#marks) marker names.

```python
@pytest.mark.training
def test_train_model(dataset_loc):
 pass
```

We can execute them by using the `-m` flag which requires a (case-sensitive) marker expression like below:

```python
@pytest.mark.training
def test_train_model():
 assert ...
```

```python
# Pytest
[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = "test_*.py"
addopts = "--strict-markers --disable-pytest-warnings"
markers = [
 "training: tests that involve training",
]
```

Once we do this, we can view all of our existing list of markers by executing `pytest --markers` and we'll receive an error when we're trying to use a new marker that's not defined here.

### Coverage

As we're developing tests for our application's components, it's important to know how well we're covering our code base and to know if we've missed anything. We can use the [Coverage](https://coverage.readthedocs.io/) library to track and visualize how much of our codebase our tests account for. With pytest, it's even easier to use this package thanks to the [pytest-cov](https://pytest-cov.readthedocs.io/) plugin.

```
if results_fp: # pragma: no cover, saving results
 utils.save_dict(d, results_fp)
```

-

Excluding files by specifying them in our `pyproject.toml` configuration:

```python
# Pytest cov
[tool.coverage.run]
omit=["madewithml/evaluate.py", "madewithml/serve.py"]
```

>

The main point is that we were able to add justification to these exclusions through comments so our team can follow our reasoning.

Now that we have a foundation for testing traditional software, let's dive into testing our data and models in the context of machine learning systems.

## 🔢 Data

So far, we've used unit and integration tests to test the functions that interact with our data but we haven't tested the validity of the data itself. We're going to use the [great expectations](https://github.com/great-expectations/great_expectations) library to test what our data is expected to look like. It's a library that allows us to create expectations as to what our data should look like in a standardized way. It also provides modules to seamlessly connect with backend data sources such as local file systems, S3, databases, etc. Let's explore the library by implementing the expectations we'll need for our application.

>

👉 Follow along interactive notebook in the
 [testing-ml](https://github.com/GokuMohandas/testing-ml) repository as we implement the concepts below.

First we'll load the data we'd like to apply our expectations on. We can load our data from a variety of [sources](https://docs.greatexpectations.io/docs/guides/connecting_to_your_data/connect_to_data_overview) (filesystem, database, cloud etc.) which we can then wrap around a [Dataset module](https://legacy.docs.greatexpectations.io/en/latest/autoapi/great_expectations/dataset/index.html) (Pandas / Spark DataFrame, SQLAlchemy). Since multiple data tests may want access to this data, we'll create a fixture for it.

```python
# tests/data/conftest.py
import great_expectations as ge
import pandas as pd
import pytest

@pytest.fixture(scope="module")
def df(request):
 dataset_loc = request.config.getoption("--dataset-loc")
 df = ge.dataset.PandasDataset(pd.read_csv(dataset_loc))
 return df
```

### Expectations

When it comes to creating expectations as to what our data should look like, we want to think about our entire dataset and all the features (columns) within it.

```json
{
 "exception_info": {
 "raised_exception": false,
 "exception_traceback": null,
 "exception_message": null
 },
 "success": true,
 "meta": {},
 "expectation_config": {
 "kwargs": {
 "column": "title",
 "type_": "str",
 "result_format": "BASIC"
 },
 "meta": {},
 "expectation_type": "_expect_column_values_to_be_of_type__map"
 },
 "result": {
 "element_count": 955,
 "missing_count": 0,
 "missing_percent": 0.0,
 "unexpected_count": 0,
 "unexpected_percent": 0.0,
 "unexpected_percent_nonmissing": 0.0,
 "partial_unexpected_list": []
 }
}
```

and if we have a failed expectation (ex. `df.expect_column_values_to_be_of_type(column="title", type_="int")`), we'd receive this output(notice the counts and examples for what caused the failure):

```json
{
 "success": false,
 "exception_info": {
 "raised_exception": false,
 "exception_traceback": null,
 "exception_message": null
 },
 "expectation_config": {
 "meta": {},
 "kwargs": {
 "column": "title",
 "type_": "int",
 "result_format": "BASIC"
 },
 "expectation_type": "_expect_column_values_to_be_of_type__map"
 },
 "result": {
 "element_count": 955,
 "missing_count": 0,
 "missing_percent": 0.0,
 "unexpected_count": 955,
 "unexpected_percent": 100.0,
 "unexpected_percent_nonmissing": 100.0,
 "partial_unexpected_list": [
 "How to Deal with Files in Google Colab: What You Need to Know",
 "Machine Learning Methods Explained (+ Examples)",
 "OpenMMLab Computer Vision",
 "...",
 ]
 },
 "meta": {}
}
```

There are just a few of the different expectations that we can create. Be sure to explore all the [expectations](https://greatexpectations.io/expectations/), including [custom expectations](https://docs.greatexpectations.io/docs/guides/expectations/creating_custom_expectations/overview/). Here are some other popular expectations that don't pertain to our specific dataset but are widely applicable:

- feature value relationships with other feature values → `expect_column_pair_values_a_to_be_greater_than_b`

- value statistics (mean, std, median, max, min, sum, etc.) → `expect_column_mean_to_be_between`

### Suite

Instead of running each of these individually, we can combine them all into an expectation suite.

```python
# tests/data/test_dataset.py
def test_dataset(df):
 """Test dataset quality and integrity."""
 column_list = ["id", "created_on", "title", "description", "tag"]
 df.expect_table_columns_to_match_ordered_list(column_list=column_list) # schema adherence
 tags = ["computer-vision", "natural-language-processing", "mlops", "other"]
 df.expect_column_values_to_be_in_set(column="tag", value_set=tags) # expected labels
 df.expect_compound_columns_to_be_unique(column_list=["title", "description"]) # data leaks
 df.expect_column_values_to_not_be_null(column="tag") # missing values
 df.expect_column_values_to_be_unique(column="id") # unique values
 df.expect_column_values_to_be_of_type(column="title", type_="str") # type adherence

 # Expectation suite
 expectation_suite = df.get_expectation_suite(discard_failed_expectations=False)
 results = df.validate(expectation_suite=expectation_suite, only_return_failures=True).to_json_dict()
 assert results["success"]
```

We can now execute these data tests just like a code test.

```python
# tests/data/conftest.py
def pytest_addoption(parser):
 parser.addoption("--dataset-loc", action="store", default=None, help="Dataset location.")
```

>

We're keeping things simple by using our expectations with pytest but Great expectations also has a lot more functionality around [connecting](https://docs.greatexpectations.io/docs/guides/connecting_to_your_data/connect_to_data_lp) to data sources, [Checkpoints](https://docs.greatexpectations.io/docs/terms/checkpoint/) to execute suites across various parts of the pipeline, [data docs](https://docs.greatexpectations.io/docs/terms/data_docs/) to generate reports, etc.

### Production

While we're validating our datasets inside our machine learning applications, in most production scenarios, the data validation happens much further upstream. Our dataset may not be used just for our specific application and may actually be feeding into many other downstream application (ML and otherwise). Therefore, it's a great idea to execute these data validation tests as up stream as possible so that downstream applications can reliably use the data.

 ![ELT pipelines in production](https://madewithml.com/static/images/mlops/testing/production.png)

>

Learn more about different data systems in our [data engineering lesson](https://madewithml.com/courses/mlops/data-engineering/) if you're not familiar with them.

## 🤖 Models

The final aspect of testing ML systems involves how to test machine learning models during training, evaluation, inference and deployment.

### Training

We want to write tests iteratively while we're developing our training pipelines so we can catch errors quickly. This is especially important because, unlike traditional software, ML systems can run to completion without throwing any exceptions / errors but can produce incorrect systems. We also want to catch errors quickly to save on time and compute.

- Check shapes and values of model output

```
assert model(inputs).shape == torch.Size([len(inputs), num_classes])
```

- Check for decreasing loss after one batch of training

```
assert epoch_loss < prev_epoch_loss
```

- Overfit on a batch

```python
accuracy = train(model, inputs=batches[0])
assert accuracy == pytest.approx(0.95, abs=0.05) # 0.95 ± 0.05
```

- Train to completion (tests early stopping, saving, etc.)

```
train(model)
assert learning_rate >= min_learning_rate
assert artifacts
```

- On different devices

```
assert train(model, device=torch.device("cpu"))
assert train(model, device=torch.device("cuda"))
```

> **Note**

You can mark the compute intensive tests with a pytest marker and only execute them when there is a change being made to system affecting the model.

```python
@pytest.mark.training
def test_train_model():
 ...
```

### Behavioral testing

Behavioral testing is the process of testing input data and expected outputs while treating the model as a black box (model agnostic evaluation). They don't necessarily have to be adversarial in nature but more along the types of perturbations we may expect to see in the real world once our model is deployed. A landmark paper on this topic is [Beyond Accuracy: Behavioral Testing of NLP Models with CheckList](https://arxiv.org/abs/2005.04118) which breaks down behavioral testing into three types of tests:

- `invariance`: Changes should not affect outputs.

```
# INVariance via verb injection (changes should not affect outputs)
get_label(text="Transformers applied to NLP have revolutionized machine learning.", predictor=predictor)
get_label(text="Transformers applied to NLP have disrupted machine learning.", predictor=predictor)
```

'natural-language-processing'
'natural-language-processing'

- `directional`: Change should affect outputs.

```
# DIRectional expectations (changes with known outputs)
get_label(text="ML applied to text classification.", predictor=predictor)
get_label(text="ML applied to image classification.", predictor=predictor)
get_label(text="CNNs for text classification.", predictor=predictor)
```

'natural-language-processing'
'computer-vision'
'natural-language-processing'

- `minimum functionality`: Simple combination of inputs and expected outputs.

```
# Minimum Functionality Tests (simple input/output pairs)
get_label(text="Natural language processing is the next big wave in machine learning.", predictor=predictor)
get_label(text="MLOps is the next big wave in machine learning.", predictor=predictor)
get_label(text="This is about graph neural networks.", predictor=predictor)
```

'natural-language-processing'
'mlops'
'other'

And we can convert these tests into proper parameterized tests by first defining from fixtures in our `tests/model/conftest.py` and our `tests/model/utils.py` scripts:

```python
# tests/model/conftest.py
import pytest
from ray.train.torch.torch_predictor import TorchPredictor
from madewithml import predict

def pytest_addoption(parser):
 parser.addoption("--run-id", action="store", default=None, help="Run ID of model to use.")

@pytest.fixture(scope="module")
def run_id(request):
 return request.config.getoption("--run-id")

@pytest.fixture(scope="module")
def predictor(run_id):
 best_checkpoint = predict.get_best_checkpoint(run_id=run_id)
 predictor = TorchPredictor.from_checkpoint(best_checkpoint)
 return predictor
```

```python
# tests/model/utils.py
import numpy as np
import pandas as pd
from madewithml import predict

def get_label(text, predictor):
 df = pd.DataFrame({"title": [text], "description": "", "tag": "other"})
 z = predictor.predict(data=df)["predictions"]
 preprocessor = predictor.get_preprocessor()
 label = predict.decode(np.stack(z).argmax(1), preprocessor.index_to_class)[0]
 return label
```

And now, we can use these components to create our behavioral tests:

```python
# tests/model/test_behavioral.py
@pytest.mark.parametrize(
 "input_a, input_b, label",
 [
 (
 "Transformers applied to NLP have revolutionized machine learning.",
 "Transformers applied to NLP have disrupted machine learning.",
 "natural-language-processing",
 ),
 ],
)
def test_invariance(input_a, input_b, label, predictor):
 """INVariance via verb injection (changes should not affect outputs)."""
 label_a = utils.get_label(text=input_a, predictor=predictor)
 label_b = utils.get_label(text=input_b, predictor=predictor)
 assert label_a == label_b == label
```

```python
# tests/model/test_behavioral.py
@pytest.mark.parametrize(
 "input, label",
 [
 (
 "ML applied to text classification.",
 "natural-language-processing",
 ),
 (
 "ML applied to image classification.",
 "computer-vision",
 ),
 (
 "CNNs for text classification.",
 "natural-language-processing",
 ),
 ],
)
def test_directional(input, label, predictor):
 """DIRectional expectations (changes with known outputs)."""
 prediction = utils.get_label(text=input, predictor=predictor)
 assert label == prediction
```

```python
# tests/model/test_behavioral.py
@pytest.mark.parametrize(
 "input, label",
 [
 (
 "Natural language processing is the next big wave in machine learning.",
 "natural-language-processing",
 ),
 (
 "MLOps is the next big wave in machine learning.",
 "mlops",
 ),
 (
 "This is about graph neural networks.",
 "other",
 ),
 ],
)
def test_mft(input, label, predictor):
 """Minimum Functionality Tests (simple input/output pairs)."""
 prediction = utils.get_label(text=input, predictor=predictor)
 assert label == prediction
```

And we can execute them just like any other test:

```
@article{madewithml,
 author = {Goku Mohandas},
 title = { Code - Made With ML },
 howpublished = {\url{https://madewithml.com/}},
 year = {2023}
}
```
