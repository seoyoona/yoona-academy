# Documenting Code

 Documenting our code to automatically generate documentation.

 &middot;
 &middot;
 &middot;

 [Documentation](https://gokumohandas.github.io/Made-With-ML)

 &times;

 Subscribe

## Intuition

>

Code tells you *how*, comments tell you *why*. -- [Jeff Atwood](https://en.wikipedia.org/wiki/Jeff_Atwood)

We can really improve the quality of our codebase by documenting it to make it easier for others (and our future selves) to easily navigate and extend it. We know our code base best the moment we finish writing it but fortunately documenting it will allow us to quickly get back to that familiar state of mind. Documentation can mean many different things to developers, so let's define the most common components:

- `comments`: short descriptions as to why a piece of code exists.

- `typing`: specification of a function's inputs and outputs' data types, providing information pertaining to what a function consumes and produces.

- `docstrings`: meaningful descriptions for functions and classes that describe overall utility, arguments, returns, etc.

- `docs`: rendered webpage that summarizes all the functions, classes, workflows, examples, etc.

## Typing

It's important to be as explicit as possible with our code. We've already discussed choosing explicit names for variables, functions but another way we can be explicit is by defining the types for our function's inputs and outputs by using the [typing library](https://docs.python.org/3/library/typing.html).

So far, our functions have looked like this:

```python
def some_function(a, b):
 return c
```

But we can incorporate so much more information using typing:

```python
from typing import List
def some_function(a: List, b: int = 0) -> np.ndarray:
 return c
```

Here we've defined:

- input parameter `a` is a list

- input parameter `b` is an integer with default value 0

- output parameter `c` is a NumPy array

There are many other data types that we can work with, including `List`, `Set`, `Dict`, `Tuple`, `Sequence` and [more](https://docs.python.org/3/library/typing.html), as well as included types such as `int`, `float`, etc. You can also use types from packages we install (ex. `np.ndarray`) and even from our own defined classes (ex. `LabelEncoder`).

>

Starting from Python 3.9+, common types are [built in](https://docs.python.org/3/whatsnew/3.9.html#type-hinting-generics-in-standard-collections) so we don't need to import them with `from typing import List, Set, Dict, Tuple, Sequence` anymore.

## Docstrings

We can make our code even more explicit by adding docstrings to describe overall utility, arguments, returns, exceptions and more. Let's take a look at an example:

```python
from typing import List
def some_function(a: List, b: int = 0) -> np.ndarray:
 """Function description.

 ```python
 c = some_function(a=[], b=0)
 print (c)
 ```

 [[1 2]
 [3 4]]
 </pre>

 Args:
 a (List): description of `a`.
 b (int, optional): description of `b`. Defaults to 0.

 Raises:
 ValueError: Input list is not one-dimensional.

 Returns:
 np.ndarray: Description of `c`.

 """
 return c
```

Let's unpack the different parts of this function's docstring:

- `[Line 3]`: Summary of the overall utility of the function.

- `[Lines 5-12]`: Example of how to use our function.

- `[Lines 14-16]`: Description of the function's input arguments.

- `[Lines 18-19]`: Any exceptions that may be raised in the function.

- `[Lines 21-22]`: Description of the function's output(s).

We'll render these docstrings in the [docs](https://madewithml.com/courses/mlops/documentation/#docs) section below to produce this:

 ![docstrings](https://madewithml.com/static/images/mlops/documentation/docstrings.png)

Take a look at the docstrings of different functions and classes in our repository.

```python
# madewithml/data.py
from typing import List

def clean_text(text: str, stopwords: List = STOPWORDS) -> str:
 """Clean raw text string.

 Args:
 text (str): Raw text to clean.
 stopwords (List, optional): list of words to filter out. Defaults to STOPWORDS.

 Returns:
 str: cleaned text.
 """
 pass
```

> **Tip**

If using [Visual Studio Code](https://code.visualstudio.com/), be sure to use the [Python Docstrings Generator](https://marketplace.visualstudio.com/items?itemName=njpwerner.autodocstring) extension so you can type `"""` under a function and then hit the Shift key to generate a template docstring. It will autofill parts of the docstring using the typing information and even exception in your code!

![vscode docstring generation](https://github.com/NilsJPWerner/autoDocstring/blob/13875f7e5d3a2ad2a2a7e42bad6a10d09fed7472/images/demo.gif?raw=true)

## Docs

So we're going through all this effort of including typing and docstrings to our functions but it's all tucked away inside our scripts. What if we can collect all this effort and **automatically** surface it as documentation? Well that's exactly what we'll do with the following open-source packages → final result [here](https://gokumohandas.github.io/Made-With-ML).

-

Initialize mkdocs

```
## Documentation
- [madewithml](madewithml/config.md): documentation for functions and classes.

## Course
Learn how to combine machine learning with software engineering to design, develop, deploy and iterate on production ML applications.

- Lessons: [https://madewithml.com/](https://madewithml.com/#course)
- Code: [GokuMohandas/Made-With-ML](https://github.com/GokuMohandas/Made-With-ML)
```

-

Next we'll create documentation files for each script in our `madewithml` directory:

```
@article{madewithml,
 author = {Goku Mohandas},
 title = { Documentation - Made With ML },
 howpublished = {\url{https://madewithml.com/}},
 year = {2023}
}
```
